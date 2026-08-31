"""
HesabYar (CluDari + Taraz) - Strong local accounting
Personal + Business + Clinic with double-entry ledger
"""

import os
import sqlite3
import re
import jdatetime
from datetime import datetime, date
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import sys
import threading

BASE_DIR = Path(__file__).parent
# Cloud/local storage paths. Railway uses /data (persistent Volume); local runs keep project-relative defaults.
STORAGE_DIR = Path(os.environ.get('STORAGE_DIR', str(BASE_DIR)))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.environ.get('DB_PATH', str(STORAGE_DIR / "cludari.db")))
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="HesabYar", docs_url="/docs")

# Allow LAN phone/tablet browsers to call API when needed
try:
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
except Exception:
    pass


# ---------------------------------------------------------------------------
# Taraz double-entry ledger integration (HesabYar)
# ---------------------------------------------------------------------------
try:
    from taraz_bridge import HesabYarLedger
    TARAZ_AVAILABLE = True
except Exception as _taraz_err:
    print("Taraz bridge not available:", _taraz_err)
    TARAZ_AVAILABLE = False
    HesabYarLedger = None  # type: ignore

# Per-user in-memory ledgers (key = username or "default")
_LEDGERS: dict = {}


def _ledger_key() -> str:
    try:
        u = CURRENT_USER.get("username") if isinstance(CURRENT_USER, dict) or hasattr(CURRENT_USER, "get") else None
        return str(u) if u else "default"
    except Exception:
        return "default"


_MIGRATED_USERS: set = set()


def get_user_ledger(auto_migrate: bool = True) -> "HesabYarLedger":
    """Return (and create if needed) the Taraz ledger for the current user.
    On first access, migrates existing purchases/sales from the user SQLite DB.
    """
    if not TARAZ_AVAILABLE:
        raise RuntimeError("Taraz engine is not available")
    key = _ledger_key()
    if key not in _LEDGERS:
        led = HesabYarLedger(base_currency="IRR")
        led.ensure_default_coa()
        _LEDGERS[key] = led
        if auto_migrate and key not in _MIGRATED_USERS:
            try:
                _run_migration_for_current_user(led)
                _MIGRATED_USERS.add(key)
            except Exception as e:
                print(f"[ledger] auto-migrate failed for {key}:", e)
    return _LEDGERS[key]


def _run_migration_for_current_user(led: "HesabYarLedger") -> dict:
    """Load purchases & sales from the active user DB into the given ledger."""
    from pathlib import Path as _P
    import sqlite3 as _sql
    from datetime import datetime as _dt

    path = None
    try:
        path = CURRENT_USER.get("db_path") if hasattr(CURRENT_USER, "get") else None
    except Exception:
        path = None
    if not path:
        path = str(DB_PATH)

    path = _P(path)
    key = _ledger_key()

    # If anonymous/default, prefer the real user database Parham.db
    if key in ("default", "", "root") or path.name == "cludari.db":
        parham = _P(DATA_DIR) / "Parham.db"
        if parham.exists():
            path = parham
            print(f"[ledger] default user -> using {path}")

    if not path.exists():
        return {"ok": False, "error": f"no db at {path}"}

    stats = {"purchases": 0, "sales": 0, "db": path.name, "errors": []}
    conn = _sql.connect(str(path))
    conn.row_factory = _sql.Row

    def _parse_date(s):
        if not s:
            return _dt.now()
        s = str(s).strip()
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
            try:
                return _dt.strptime(s[:19], fmt)
            except ValueError:
                continue
        return _dt.now()

    # Purchases -> expense (personal/business mixed data is rarely pure inventory)
    try:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)")}
        sql = "SELECT * FROM purchases"
        if "deleted_at" in cols:
            sql += " WHERE deleted_at IS NULL OR deleted_at = ''"
        sql += " ORDER BY id"
        for row in conn.execute(sql):
            d = dict(row)
            total = float(d.get("total") or 0)
            if total <= 0:
                continue
            pid = d.get("id")
            if any(e.entry_id == f"MIG-PUR-{pid}" for e in led.engine.journal):
                continue
            desc = (d.get("description") or d.get("seller") or f"خرید #{pid}").strip()
            try:
                led.post_purchase(
                    entry_id=f"MIG-PUR-{pid}",
                    amount=total,
                    expense_or_asset="5201",  # هزینه‌های عملیاتی
                    cash_or_ap="1101",
                    description=desc,
                    date=_parse_date(d.get("date") or ""),
                    tags=["migrated", "purchase"],
                )
                stats["purchases"] += 1
            except Exception as e:
                stats["errors"].append(f"PUR-{pid}: {e}")
    except Exception as e:
        stats["errors"].append(f"purchases: {e}")

    # Sales
    try:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(sales)")}
        sql = "SELECT * FROM sales"
        if "deleted_at" in cols:
            sql += " WHERE deleted_at IS NULL OR deleted_at = ''"
        sql += " ORDER BY id"
        for row in conn.execute(sql):
            d = dict(row)
            total = float(d.get("total") or 0)
            if total <= 0:
                continue
            sid = d.get("id")
            if any(e.entry_id == f"MIG-SAL-{sid}" for e in led.engine.journal):
                continue
            desc = (d.get("description") or d.get("customer") or f"فروش #{sid}").strip()
            try:
                led.post_sale(
                    entry_id=f"MIG-SAL-{sid}",
                    amount=total,
                    cash_or_ar="1101",
                    revenue="4101",
                    description=desc,
                    date=_parse_date(d.get("date") or ""),
                    tags=["migrated", "sale"],
                )
                stats["sales"] += 1
            except Exception as e:
                stats["errors"].append(f"SAL-{sid}: {e}")
    except Exception as e:
        stats["errors"].append(f"sales: {e}")

    conn.close()
    print(f"[ledger] migrated {path.name}: purchases={stats['purchases']} sales={stats['sales']}")
    return stats



def _safe_post_purchase_to_ledger(purchase_id, total: float, description: str, currency: str = "IRT"):
    """Best-effort double-entry post for a purchase. Never breaks the main save."""
    if not TARAZ_AVAILABLE or total <= 0:
        return
    try:
        led = get_user_ledger()
        entry_id = f"PUR-{purchase_id}"
        # Inventory / expense  Dr   |   Cash / AP  Cr
        led.post_purchase(
            entry_id=entry_id,
            amount=total,
            expense_or_asset="5201",   # هزینه عملیاتی
            cash_or_ap="1101",
            description=description or f"خرید #{purchase_id}",
            tags=["purchase", currency],
        )
    except Exception as e:
        print(f"[ledger] purchase post failed: {e}")


def _safe_post_sale_to_ledger(sale_id, total: float, description: str, currency: str = "IRT"):
    """Best-effort double-entry post for a sale. Never breaks the main save."""
    if not TARAZ_AVAILABLE or total <= 0:
        return
    try:
        led = get_user_ledger()
        entry_id = f"SAL-{sale_id}"
        led.post_sale(
            entry_id=entry_id,
            amount=total,
            cash_or_ar="1101",
            revenue="4101",
            description=description or f"فروش #{sale_id}",
            tags=["sale", currency],
        )
    except Exception as e:
        print(f"[ledger] sale post failed: {e}")


def restore_user_from_token(token: str):
    """Set CURRENT_USER from session token so get_db hits the right file."""
    if not token:
        return
    username = SESSIONS.get(token)
    if not username:
        try:
            conn = sqlite3.connect(AUTH_DB)
            row = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
            conn.close()
            if row:
                username = row[0]
                SESSIONS[token] = username
        except Exception:
            return
    if not username:
        return
    try:
        conn = sqlite3.connect(AUTH_DB)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        conn.close()
        if not row:
            return
        db_file = row["db_file"] if "db_file" in row.keys() else "cludari.db"
        path = str(DB_PATH) if db_file == "cludari.db" else os.path.join(DATA_DIR, db_file)
        CURRENT_USER["username"] = username
        CURRENT_USER["db_path"] = path
        parent = os.path.dirname(path)
        if parent:
            try:
                os.makedirs(parent, exist_ok=True)
            except Exception:
                pass
        if not os.path.exists(path):
            try:
                init_db()
            except Exception as e:
                print("restore init_db:", e)
    except Exception as e:
        print("restore_user:", e)


from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
async def index():
    html_path = STATIC_DIR / "index.html"
    return HTMLResponse(content=html_path.read_text(encoding="utf-8"), media_type="text/html; charset=utf-8")


@app.get("/health")
async def health():
    """Lightweight Railway/container health endpoint."""
    return {"ok": True, "service": "HesabYar"}



def next_id(conn, table):
    try:
        return conn.execute(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {table}").fetchone()[0]
    except Exception:
        return 1



# ── Multi-user auth ──
import hashlib
import secrets
from typing import Optional

AUTH_DB = os.environ.get('AUTH_DB', str(STORAGE_DIR / "auth.db"))
DATA_DIR = os.environ.get('DATA_DIR', str(STORAGE_DIR / "data"))
os.makedirs(DATA_DIR, exist_ok=True)

# session_token -> username
SESSIONS: dict = {}

# Per-request user context (safe for multi-user concurrent access)
_user_ctx = threading.local()

def _ctx_user():
    """Return current request's user dict (thread-local)."""
    u = getattr(_user_ctx, 'user', None)
    if not u:
        u = {"username": None, "db_path": str(DB_PATH)}
        _user_ctx.user = u
    return u

# Backward-compatible view used by older code paths
class _CurrentUserProxy(dict):
    def get(self, key, default=None):
        return _ctx_user().get(key, default)
    def __getitem__(self, key):
        return _ctx_user()[key]
    def __setitem__(self, key, value):
        _ctx_user()[key] = value
    def __contains__(self, key):
        return key in _ctx_user()

CURRENT_USER = _CurrentUserProxy()

class AuthUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Isolate each request — never leak previous user's DB
        _user_ctx.user = {"username": None, "db_path": str(DB_PATH)}
        auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
        token = ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
        if not token:
            token = request.query_params.get("token") or ""
        if token:
            try:
                restore_user_from_token(token)
            except Exception as e:
                print("auth middleware:", e)
        return await call_next(request)

app.add_middleware(AuthUserMiddleware)




def _hash_pw(password: str) -> str:
    return hashlib.sha256(("cludari:" + password).encode("utf-8")).hexdigest()


def init_auth_db():
    conn = sqlite3.connect(AUTH_DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            db_file TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Always ensure root/root exists (fix password if corrupted)
    conn.execute(
        "INSERT OR REPLACE INTO users (username, password_hash, db_file) VALUES (?,?,?)",
        ("root", _hash_pw("root"), "cludari.db"),
    )
    # restore sessions into memory
    for row in conn.execute("SELECT token, username FROM sessions"):
        SESSIONS[row[0]] = row[1]
    conn.commit()
    conn.close()

try:
    init_auth_db()
except Exception as _e:
    print("auth bootstrap:", _e)


def set_active_user(username: str, db_file: str):
    path = DB_PATH if db_file == "cludari.db" else os.path.join(DATA_DIR, db_file)
    # ensure file exists / initialized
    CURRENT_USER["username"] = username
    CURRENT_USER["db_path"] = path
    # re-init schema on that db
    global DB_PATH_ACTIVE
    # monkey-patch get_db to use active path via CURRENT_USER


def get_active_db_path() -> str:
    return CURRENT_USER.get("db_path") or DB_PATH



def to_jalali(date_str):
    """Convert YYYY-MM-DD to Jalali string; return as-is on failure."""
    if not date_str:
        return ""
    try:
        import jdatetime
        from datetime import datetime as _dt
        s = str(date_str).strip()[:10]
        if not s or s[4] != '-':
            return str(date_str)
        y, m, d = map(int, s.split('-')[:3])
        j = jdatetime.date.fromgregorian(date=_dt(y, m, d).date())
        return f"{j.year:04d}/{j.month:02d}/{j.day:02d}"
    except Exception:
        return str(date_str)


def get_db():
    path = _ctx_user().get("db_path") or DB_PATH
    path = str(path)
    parent = os.path.dirname(path)
    if parent:
        try:
            os.makedirs(parent, exist_ok=True)
        except Exception:
            pass
    need_init = not os.path.exists(path)
    if not need_init:
        try:
            _c = sqlite3.connect(path, timeout=10)
            tables = {r[0] for r in _c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
            _c.close()
            required = {"purchases", "sales", "products", "customers", "bills", "accounts", "categories",
                        "contacts", "documents", "licenses", "reminders", "subscriptions", "settings", "checks"}
            if not required.issubset(tables):
                need_init = True
        except Exception:
            need_init = True
    if need_init:
        try:
            init_db()
        except Exception as e:
            print("get_db init_db:", e)
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=DELETE")
    except Exception:
        pass
    try:
        conn.execute("PRAGMA foreign_keys=ON")
    except Exception:
        pass
    return conn



def _table_columns(conn, table):
    try:
        return {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    except Exception:
        return set()


def init_db():
    path = CURRENT_USER.get("db_path") or DB_PATH
    path = str(path)
    parent = os.path.dirname(path)
    if parent:
        try:
            os.makedirs(parent, exist_ok=True)
        except Exception:
            pass
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=DELETE")
    except Exception:
        pass
    _schema_sql = """
    CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        seller TEXT DEFAULT '',
        location TEXT DEFAULT '',
        description TEXT DEFAULT '',
        total REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );

    
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        customer TEXT DEFAULT '',
        location TEXT DEFAULT '',
        description TEXT DEFAULT '',
        total REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'paid',
        paid_amount REAL DEFAULT 0,
        due_date TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        currency TEXT DEFAULT 'IRT',
        invoice_no TEXT DEFAULT '',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        brand TEXT DEFAULT '',
        model TEXT DEFAULT '',
        category TEXT DEFAULT '',
        unit TEXT DEFAULT 'pcs',
        buy_price REAL DEFAULT 0,
        sell_price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT,
        type TEXT DEFAULT 'buy',
        party_id INTEGER,
        party_name TEXT DEFAULT '',
        date TEXT NOT NULL,
        total REAL DEFAULT 0,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT DEFAULT '',
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER DEFAULT 0,
        icon TEXT DEFAULT 'folder'
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        address TEXT DEFAULT '',
        company TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT DEFAULT '',
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_type TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        license_key TEXT DEFAULT '',
        username TEXT DEFAULT '',
        password TEXT DEFAULT '',
        expiry_date TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT '',
        remind_date TEXT DEFAULT '',
        remind_time TEXT DEFAULT '',
        repeat_type TEXT DEFAULT 'none',
        status TEXT DEFAULT 'pending',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        plan TEXT DEFAULT '',
        monthly_price REAL DEFAULT 0,
        yearly_price REAL DEFAULT 0,
        start_date TEXT DEFAULT '',
        renewal_date TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        auto_renew INTEGER DEFAULT 1,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        amount REAL DEFAULT 0,
        due_date TEXT DEFAULT '',
        paid_date TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        bill_number TEXT DEFAULT '',
        meter_number TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'bank',
        bank TEXT DEFAULT '',
        card_number TEXT DEFAULT '',
        iban TEXT DEFAULT '',
        currency TEXT DEFAULT 'IRR',
        initial_balance REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        color TEXT DEFAULT '#4F46E5',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_number TEXT NOT NULL,
        check_type TEXT DEFAULT 'received',
        party TEXT DEFAULT '',
        bank TEXT DEFAULT '',
        amount REAL DEFAULT 0,
        check_date TEXT DEFAULT '',
        due_date TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        account TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(due_date);
    CREATE INDEX IF NOT EXISTS idx_checks_number ON checks(check_number);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
    CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller);
    """
    for _st in [x.strip() for x in _schema_sql.split(";") if x.strip()]:
        try:
            conn.execute(_st)
        except Exception:
            pass
    conn.commit()
    # was executescript end
    conn.commit()

    # Migrate products table: add missing brand/model columns
    prod_cols = _table_columns(conn, "products")
    if "brand" not in prod_cols:
        try:
            conn.execute("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT ''")
        except Exception:
            pass
    if "model" not in prod_cols:
        try:
            conn.execute("ALTER TABLE products ADD COLUMN model TEXT DEFAULT ''")
        except Exception:
            pass
    conn.commit()

    # Migrate legacy invoices → purchases (one-time)
    try:
        inv_count = conn.execute("SELECT COUNT(*) FROM invoices").fetchone()[0]
        pur_count = conn.execute("SELECT COUNT(*) FROM purchases").fetchone()[0]
        if inv_count > 0 and pur_count == 0:
            invoices = conn.execute("SELECT * FROM invoices ORDER BY id").fetchall()
            for inv in invoices:
                seller = inv["party_name"] if "party_name" in inv.keys() else ""
                location = inv["description"] if "description" in inv.keys() else ""
                desc = inv["description"] if "description" in inv.keys() else ""
                conn.execute(
                    "INSERT INTO purchases (id, date, time, seller, location, description, total, created_at) VALUES (?,?,?,?,?,?,?,?)",
                    (
                        inv["id"],
                        inv["date"],
                        "",
                        seller or "",
                        location or "",
                        desc or "",
                        inv["total"] or 0,
                        inv["created_at"] if "created_at" in inv.keys() else None,
                    ),
                )
                items = conn.execute(
                    "SELECT * FROM invoice_items WHERE invoice_id=?", (inv["id"],)
                ).fetchall()
                for it in items:
                    name = ""
                    if "product_name" in it.keys() and it["product_name"]:
                        name = it["product_name"]
                    elif "name" in it.keys() and it["name"]:
                        name = it["name"]
                    qty = it["quantity"] if "quantity" in it.keys() else 1
                    price = it["unit_price"] if "unit_price" in it.keys() else 0
                    total = it["total"] if "total" in it.keys() else (qty or 1) * (price or 0)
                    conn.execute(
                        "INSERT INTO purchase_items (purchase_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
                        (inv["id"], name or "Item", qty or 1, price or 0, total or 0),
                    )
            conn.commit()
    except Exception as e:
        print(f"Migration warning: {e}")

    # Repair null IDs in legacy tables
    for tbl in ("documents", "licenses", "reminders", "subscriptions", "bills", "contacts", "customers", "categories", "accounts"):
        try:
            cols = _table_columns(conn, tbl)
            if "id" not in cols:
                continue
            nulls = conn.execute(f"SELECT rowid FROM {tbl} WHERE id IS NULL").fetchall()
            if nulls:
                max_id = conn.execute(f"SELECT COALESCE(MAX(id), 0) FROM {tbl}").fetchone()[0] or 0
                for (rid,) in nulls:
                    max_id += 1
                    conn.execute(f"UPDATE {tbl} SET id=? WHERE rowid=?", (max_id, rid))
                conn.commit()
        except Exception as e:
            print(f"repair {tbl}: {e}")

    conn.close()


class SaleCreate(BaseModel):
    date: str = ""
    customer: str = ""
    location: str = ""
    description: str = ""
    discount: float = 0
    payment_status: str = "paid"
    paid_amount: float = 0
    due_date: str = ""
    tags: str = ""
    currency: str = "IRT"
    invoice_no: str = ""
    items: list = []


class PurchaseCreate(BaseModel):
    date: str
    seller: str = ""
    location: str = ""
    description: str = ""
    items: List[dict] = []
    discount: float = 0
    payment_status: str = "paid"  # paid | partial | unpaid
    paid_amount: float = 0
    due_date: str = ""
    tags: str = ""
    currency: str = "IRT"


class ProductCreate(BaseModel):
    code: str
    name: str
    brand: str = ""
    model: str = ""
    category: str = ""
    buy_price: float = 0




class LoginBody(BaseModel):
    username: str = ""
    password: str = ""

class RegisterBody(BaseModel):
    username: str = ""
    password: str = ""


@app.get("/favicon.ico")
async def favicon():
    from fastapi.responses import Response, FileResponse
    for p in [
        Path(__file__).parent / "icon.ico",
        Path(__file__).parent / "static" / "icon.png",
        Path(__file__).parent / "icon.png",
    ]:
        try:
            if p.exists():
                data = p.read_bytes()
                mt = "image/x-icon" if p.suffix.lower() == ".ico" else "image/png"
                return Response(content=data, media_type=mt, headers={"Cache-Control": "public, max-age=86400"})
        except Exception as e:
            print("favicon:", e)
    return Response(status_code=204)


@app.on_event("startup")
async def startup():
    try:
        init_auth_db()
    except Exception as e:
        print("auth init error:", e)
    try:
        init_db()
    except Exception as e:
        print("db init error:", e)


# ─── Dashboard ─────────────────────────────────────────


@app.get("/api/system/info")
async def system_info():
    import platform, sys, re as _re
    os_name = platform.system()
    os_release = platform.release()
    os_ver = platform.version() or ""
    pretty = os_name
    edition = ""
    display_ver = ""
    build_full = ""
    if os_name == "Windows":
        # Extract build from platform.version() e.g. 10.0.22631
        build_num = 0
        m = _re.search(r"(\d+)\.(\d+)\.(\d+)", os_ver)
        if m:
            build_num = int(m.group(3))
            build_full = m.group(0)
        if not build_num:
            try:
                build_num = int(str(os_release).split(".")[0])
            except Exception:
                build_num = 0
        # Windows 11 starts at build 22000
        win_major = 11 if build_num >= 22000 else 10
        # Edition from registry
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Windows NT\CurrentVersion",
            )
            try:
                edition = winreg.QueryValueEx(key, "EditionID")[0] or ""
            except Exception:
                edition = ""
            try:
                product_name = winreg.QueryValueEx(key, "ProductName")[0] or ""
            except Exception:
                product_name = ""
            try:
                display_ver = winreg.QueryValueEx(key, "DisplayVersion")[0] or ""
            except Exception:
                display_ver = ""
            try:
                build_lab = winreg.QueryValueEx(key, "CurrentBuild")[0] or str(build_num)
                build_num = int(build_lab) if str(build_lab).isdigit() else build_num
            except Exception:
                pass
            winreg.CloseKey(key)
            # ProductName may still say Windows 10 Pro on Win11 — trust build
            if build_num >= 22000:
                win_major = 11
            # Map EditionID to friendly
            ed_map = {
                "Professional": "Pro",
                "ProfessionalWorkstation": "Pro for Workstations",
                "Enterprise": "Enterprise",
                "Education": "Education",
                "Core": "Home",
                "CoreSingleLanguage": "Home",
                "Home": "Home",
            }
            ed_pretty = ed_map.get(edition, edition.replace("Professional", "Pro") if edition else "")
            pretty = f"Windows {win_major}" + (f" {ed_pretty}" if ed_pretty else "")
            if display_ver:
                pretty += f" ({display_ver})"
        except Exception:
            pretty = f"Windows {11 if build_num >= 22000 else 10}"
            if build_num:
                pretty += f" build {build_num}"
        os_ver = build_full or os_ver
    elif os_name == "Darwin":
        pretty = f"macOS {platform.mac_ver()[0] or os_release}"
    elif os_name == "Linux":
        pretty = f"Linux {os_release}"
    app_ver = "1.0"
    try:
        vp = Path(__file__).parent / "VERSION"
        if vp.exists():
            app_ver = vp.read_text(encoding="utf-8").strip() or app_ver
    except Exception:
        pass
    return {
        "os_name": pretty,
        "os_release": os_release,
        "os_version": os_ver[:80] if os_ver else "",
        "os_edition": edition,
        "display_version": display_ver,
        "python": platform.python_version(),
        "machine": platform.machine(),
        "app_version": app_ver,
    }


async def system_info():
    import platform, sys
    os_name = platform.system()
    os_release = platform.release()
    os_ver = platform.version()
    # Friendly Windows version
    pretty = os_name
    if os_name == "Windows":
        try:
            # platform.version() like 10.0.22631
            build = os_release
            pretty = f"Windows {build}"
            # map common builds
            major = platform.win32_ver()[0]  # e.g. 10
            pretty = f"Windows {major} ({os_release})"
        except Exception:
            pretty = f"Windows {os_release}"
    elif os_name == "Darwin":
        pretty = f"macOS {platform.mac_ver()[0] or os_release}"
    elif os_name == "Linux":
        pretty = f"Linux {os_release}"
    app_ver = "1.0"
    try:
        vp = Path(__file__).parent / "VERSION"
        if vp.exists():
            app_ver = vp.read_text(encoding="utf-8").strip() or app_ver
    except Exception:
        pass
    return {
        "os_name": pretty,
        "os_release": os_release,
        "os_version": os_ver[:80] if os_ver else "",
        "python": platform.python_version(),
        "machine": platform.machine(),
        "app_version": app_ver,
    }




@app.get("/api/notifications")
async def get_notifications():
    """Due bills, reminders, unpaid purchases — never fails with 500."""
    notes = []
    try:
        conn = get_db()
        try:
            ensure_purchase_columns(conn)
        except Exception:
            pass
        today_s = datetime.now().strftime("%Y-%m-%d")
        try:
            for r in conn.execute(
                """SELECT id, seller, total, due_date, payment_status FROM purchases
                   WHERE (deleted_at IS NULL OR deleted_at='')
                   AND payment_status IN ('unpaid','partial')
                   ORDER BY id DESC LIMIT 25"""
            ):
                notes.append({
                    "type": "debt",
                    "title": f"پرداخت معوق: {r[1] or ('#' + str(r[0]))}",
                    "detail": f"مبلغ {r[2]} — {r[4]}" + (f" — سررسید {r[3]}" if r[3] else ""),
                    "level": "warn",
                    "id": r[0],
                })
        except Exception:
            pass
        for table in ("reminders", "bills", "subscriptions", "licenses"):
            try:
                cols = {c[1] for c in conn.execute(f"PRAGMA table_info({table})")}
                if not cols:
                    continue
                date_col = next((c for c in ("due_date", "date", "renew_date", "expiry_date", "end_date") if c in cols), None)
                title_col = "title" if "title" in cols else ("name" if "name" in cols else "id")
                if date_col:
                    rows = conn.execute(
                        f"SELECT id, {title_col}, {date_col} FROM {table} WHERE {date_col} IS NOT NULL AND {date_col} != '' ORDER BY {date_col} LIMIT 15"
                    ).fetchall()
                    for r in rows:
                        notes.append({
                            "type": table,
                            "title": str(r[1]),
                            "detail": str(r[2]),
                            "level": "info",
                            "id": r[0],
                        })
            except Exception:
                pass
        try:
            conn.close()
        except Exception:
            pass
    except Exception as e:
        print("notifications error:", e)
    return {"items": notes[:40], "count": len(notes)}



@app.get("/api/dashboard")
async def dashboard():
    """Stats for the CURRENT logged-in user's database only."""
    conn = get_db()
    ensure_purchase_columns(conn)
    now = date.today()
    month_start = f"{now.year}-{now.month:02d}-01"
    month_end = f"{now.year}-{now.month:02d}-{now.day:02d}"
    cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)").fetchall()}
    not_del = "(deleted_at IS NULL OR deleted_at = '')" if "deleted_at" in cols else "1=1"
    try:
        count = conn.execute(f"SELECT COUNT(*) FROM purchases WHERE {not_del}").fetchone()[0]
        total = conn.execute(f"SELECT COALESCE(SUM(total), 0) FROM purchases WHERE {not_del}").fetchone()[0]
        month = conn.execute(
            f"SELECT COUNT(*) FROM purchases WHERE {not_del} AND date >= ? AND date <= ?",
            (month_start, month_end),
        ).fetchone()[0]
        sellers = conn.execute(
            f"SELECT COUNT(DISTINCT seller) FROM purchases WHERE {not_del} AND seller IS NOT NULL AND seller != ''"
        ).fetchone()[0]
        recent = conn.execute(
            f"SELECT * FROM purchases WHERE {not_del} ORDER BY id DESC LIMIT 10"
        ).fetchall()
    except Exception as e:
        print("dashboard error:", e)
        count = total = month = sellers = 0
        recent = []
    stats = {
        "count": count or 0,
        "total": total or 0,
        "month": month or 0,
        "sellers": sellers or 0,
        "username": _ctx_user().get("username"),
        "db_path": str(_ctx_user().get("db_path") or ""),
        "recent": [dict(r) for r in recent],
    }
    conn.close()
    return stats


# ─── Purchases ─────────────────────────────────────────

def log_audit(conn, action, entity="purchase", entity_id=None, detail=""):
    try:
        user = globals().get("CURRENT_USER") or "system"
        if isinstance(user, dict):
            user = user.get("username") or "system"
        conn.execute(
            "INSERT INTO audit_log (username, action, entity, entity_id, detail) VALUES (?,?,?,?,?)",
            (str(user), action, entity, entity_id, detail[:500] if detail else ""),
        )
    except Exception:
        pass

def ensure_purchase_columns(conn):
    try:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)").fetchall()}
    except Exception:
        cols = set()
    for c, typ in [
        ("payment_status", "TEXT DEFAULT 'paid'"),
        ("paid_amount", "REAL DEFAULT 0"),
        ("due_date", "TEXT DEFAULT ''"),
        ("tags", "TEXT DEFAULT ''"),
        ("deleted_at", "TEXT"),
        ("discount", "REAL DEFAULT 0"),
        ("invoice_no", "TEXT DEFAULT ''"),
        ("currency", "TEXT DEFAULT 'IRT'"),
    ]:
        if c not in cols:
            try:
                conn.execute(f"ALTER TABLE purchases ADD COLUMN {c} {typ}")
            except Exception:
                pass
    try:
        conn.execute("""CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT DEFAULT '',
            action TEXT NOT NULL,
            entity TEXT DEFAULT 'purchase',
            entity_id INTEGER,
            detail TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS purchase_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            quantity REAL DEFAULT 1,
            unit_price REAL DEFAULT 0,
            total REAL DEFAULT 0
        )""")
        conn.commit()
    except Exception:
        try:
            conn.commit()
        except Exception:
            pass


@app.get("/api/purchases")
async def list_purchases(
    search: str = "",
    date_from: str = "",
    date_to: str = "",
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    seller: str = "",
    payment_status: str = "",
    tag: str = "",
    trash: int = 0,
):
    conn = get_db()
    ensure_purchase_columns(conn)
    where = ["1=1"]
    params = []
    cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)").fetchall()}
    if "deleted_at" in cols:
        if trash:
            where.append("(deleted_at IS NOT NULL AND deleted_at != '')")
        else:
            where.append("(deleted_at IS NULL OR deleted_at = '')")
    if search:
        parts = ["seller LIKE ?", "location LIKE ?", "description LIKE ?"]
        params_s = [f"%{search}%"] * 3
        if "tags" in cols:
            parts.append("tags LIKE ?"); params_s.append(f"%{search}%")
        if "invoice_no" in cols:
            parts.append("invoice_no LIKE ?"); params_s.append(f"%{search}%")
        where.append("(" + " OR ".join(parts) + ")")
        params += params_s
    if date_from:
        where.append("date >= ?")
        params.append(date_from)
    if date_to:
        where.append("date <= ?")
        params.append(date_to)
    if amount_min is not None:
        where.append("total >= ?")
        params.append(amount_min)
    if amount_max is not None:
        where.append("total <= ?")
        params.append(amount_max)
    if seller:
        where.append("seller LIKE ?")
        params.append(f"%{seller}%")
    if payment_status and "payment_status" in cols:
        where.append("payment_status = ?")
        params.append(payment_status)
    if tag and "tags" in cols:
        where.append("tags LIKE ?")
        params.append(f"%{tag}%")
    sql = f"SELECT * FROM purchases WHERE {' AND '.join(where)} ORDER BY id DESC"
    try:
        rows = conn.execute(sql, params).fetchall()
    except Exception as e:
        print("list_purchases SQL error:", e)
        rows = conn.execute("SELECT * FROM purchases ORDER BY id DESC").fetchall()
    if (not rows) and (not trash):
        try:
            rows = conn.execute("SELECT * FROM purchases ORDER BY id DESC").fetchall()
        except Exception:
            rows = []
    result = []
    for r in rows:
        d = dict(r)
        d["date_jalali"] = to_jalali(d.get("date", ""))
        items = conn.execute("SELECT * FROM purchase_items WHERE purchase_id=?", (d["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        d["item_count"] = len(d["items"])
        result.append(d)
    conn.close()
    return result


@app.get("/api/purchases/{id}")
async def get_purchase(id: int):
    conn = get_db()
    ensure_purchase_columns(conn)
    row = conn.execute("SELECT * FROM purchases WHERE id=?", (id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Purchase not found")
    d = dict(row)
    d["date_jalali"] = to_jalali(d.get("date", ""))
    items = conn.execute("SELECT * FROM purchase_items WHERE purchase_id=?", (id,)).fetchall()
    d["items"] = [dict(i) for i in items]
    d["item_count"] = len(d["items"])
    conn.close()
    return d


@app.post("/api/purchases")
async def create_purchase(data: PurchaseCreate):
    conn = get_db()
    try:
        # ensure base tables for brand-new user DB
        conn.execute("""CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT DEFAULT '',
            seller TEXT DEFAULT '',
            location TEXT DEFAULT '',
            description TEXT DEFAULT '',
            total REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS purchase_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            quantity REAL DEFAULT 1,
            unit_price REAL DEFAULT 0,
            total REAL DEFAULT 0
        )""")
        conn.commit()
        ensure_purchase_columns(conn)
        now = datetime.now()
        items = data.items or []
        subtotal = 0.0
        for item in items:
            try:
                subtotal += float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0)
            except Exception:
                pass
        discount = float(data.discount or 0)
        total = max(0.0, subtotal - discount)
        try:
            row = conn.execute("SELECT COUNT(*) FROM purchases").fetchone()
            n = int(row[0]) if row else 0
        except Exception:
            n = 0
        inv_no = f"INV-{now.strftime('%Y%m%d')}-{n+1:04d}"
        paid = float(data.paid_amount or 0)
        status = (data.payment_status or "paid").strip() or "paid"
        if status == "paid":
            paid = total
        cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)").fetchall()}
        # build dynamic insert
        fields = ["date", "time", "seller", "location", "description", "total"]
        values = [
            data.date or now.strftime("%Y-%m-%d"),
            now.strftime("%H:%M:%S"),
            data.seller or "",
            data.location or "",
            data.description or "",
            total,
        ]
        extra = [
            ("discount", discount),
            ("payment_status", status),
            ("paid_amount", paid),
            ("due_date", data.due_date or ""),
            ("tags", data.tags or ""),
            ("invoice_no", inv_no),
            ("currency", getattr(data, "currency", None) or "IRT"),
        ]
        for name, val in extra:
            if name in cols:
                fields.append(name)
                values.append(val)
        placeholders = ",".join("?" * len(fields))
        conn.execute(
            f"INSERT INTO purchases ({','.join(fields)}) VALUES ({placeholders})",
            tuple(values),
        )
        purchase_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        for item in items:
            name = (item.get("name") or "").strip()
            if not name:
                continue
            qty = float(item.get("quantity", 1) or 1)
            price = float(item.get("unit_price", 0) or 0)
            conn.execute(
                "INSERT INTO purchase_items (purchase_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
                (purchase_id, name, qty, price, qty * price),
            )
            try:
                ensure_phase1_tables(conn)
                pid = item.get("product_id")
                code = item.get("code") or ""
                if not pid and name:
                    pr = conn.execute("SELECT id, code FROM products WHERE name=? LIMIT 1", (name,)).fetchone()
                    if pr:
                        pid = pr["id"]; code = pr["code"] or code
                _apply_stock(conn, pid, name, code, qty, price, "purchase", "purchase", purchase_id, inv_no)
            except Exception:
                pass
        try:
            log_audit(conn, "create", "purchase", purchase_id, f"{inv_no} total={total}")
        except Exception:
            pass
        conn.commit()
        # Double-entry ledger post (best-effort)
        try:
            _safe_post_purchase_to_ledger(
                purchase_id,
                total,
                description=(data.description or data.seller or inv_no),
                currency=getattr(data, "currency", None) or "IRT",
            )
        except Exception as _le:
            print("[ledger] hook error:", _le)
        return {"id": purchase_id, "invoice_no": inv_no, "message": "Purchase saved", "ledger": TARAZ_AVAILABLE}
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Save failed: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.put("/api/purchases/{id}")
async def update_purchase(id: int, data: PurchaseCreate):
    conn = get_db()
    ensure_purchase_columns(conn)
    subtotal = sum(
        float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0)
        for item in data.items
    )
    discount = float(data.discount or 0)
    total = max(0.0, subtotal - discount)
    paid = float(data.paid_amount or 0)
    status = data.payment_status or "paid"
    if status == "paid":
        paid = total
    conn.execute(
        """UPDATE purchases SET date=?, seller=?, location=?, description=?, total=?, discount=?,
           payment_status=?, paid_amount=?, due_date=?, tags=?, currency=? WHERE id=?""",
        (data.date, data.seller, data.location, data.description, total, discount,
         status, paid, data.due_date or "", data.tags or "", getattr(data, 'currency', None) or 'IRT', id),
    )
    conn.execute("DELETE FROM purchase_items WHERE purchase_id=?", (id,))
    for item in data.items:
        qty = float(item.get("quantity", 1) or 1)
        price = float(item.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO purchase_items (purchase_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
            (id, item.get("name", ""), qty, price, qty * price),
        )
    log_audit(conn, "update", "purchase", id, f"total={total} status={status}")
    conn.commit()
    conn.close()
    return {"message": "Purchase updated"}


@app.delete("/api/purchases/{id}")
async def delete_purchase(id: int, hard: int = 0):
    conn = get_db()
    ensure_purchase_columns(conn)
    if hard:
        conn.execute("DELETE FROM purchase_items WHERE purchase_id=?", (id,))
        conn.execute("DELETE FROM purchases WHERE id=?", (id,))
        log_audit(conn, "hard_delete", "purchase", id, "")
    else:
        conn.execute(
            "UPDATE purchases SET deleted_at=datetime('now','localtime') WHERE id=?",
            (id,),
        )
        log_audit(conn, "soft_delete", "purchase", id, "")
    conn.commit()
    conn.close()
    return {"message": "deleted"}


@app.post("/api/purchases/{id}/restore")
async def restore_purchase(id: int):
    conn = get_db()
    ensure_purchase_columns(conn)
    conn.execute("UPDATE purchases SET deleted_at=NULL WHERE id=?", (id,))
    log_audit(conn, "restore", "purchase", id, "")
    conn.commit()
    conn.close()
    return {"message": "restored"}



# ─── Sales (فاکتور فروش) ───────────────────────────────────────

def ensure_sales_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        customer TEXT DEFAULT '',
        location TEXT DEFAULT '',
        description TEXT DEFAULT '',
        total REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'paid',
        paid_amount REAL DEFAULT 0,
        due_date TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        currency TEXT DEFAULT 'IRT',
        invoice_no TEXT DEFAULT '',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0
    )""")
    conn.commit()


@app.get("/api/sales")
async def list_sales(search: str = "", trash: int = 0):
    conn = get_db()
    ensure_sales_tables(conn)
    q = "SELECT * FROM sales WHERE "
    q += "deleted_at IS NOT NULL" if trash else "(deleted_at IS NULL OR deleted_at='')"
    params = []
    if search:
        q += " AND (customer LIKE ? OR location LIKE ? OR description LIKE ? OR invoice_no LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
    q += " ORDER BY date DESC, id DESC LIMIT 500"
    rows = conn.execute(q, params).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        items = conn.execute("SELECT * FROM sale_items WHERE sale_id=?", (d["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        out.append(d)
    conn.close()
    return out


@app.get("/api/sales/{id}")
async def get_sale(id: int):
    conn = get_db()
    ensure_sales_tables(conn)
    r = conn.execute("SELECT * FROM sales WHERE id=?", (id,)).fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="not found")
    d = dict(r)
    d["items"] = [dict(i) for i in conn.execute("SELECT * FROM sale_items WHERE sale_id=?", (id,)).fetchall()]
    conn.close()
    return d


@app.post("/api/sales")
async def create_sale(data: SaleCreate):
    conn = get_db()
    ensure_sales_tables(conn)
    subtotal = sum(float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0) for item in (data.items or []))
    discount = float(data.discount or 0)
    total = max(0.0, subtotal - discount)
    paid = float(data.paid_amount or 0)
    status = data.payment_status or "paid"
    if status == "paid":
        paid = total
    date = data.date or __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    inv = data.invoice_no or ""
    cur = conn.execute(
        """INSERT INTO sales (date, customer, location, description, total, discount, payment_status, paid_amount, due_date, tags, currency, invoice_no)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (date, data.customer or "", data.location or "", data.description or "", total, discount,
         status, paid, data.due_date or "", data.tags or "", data.currency or "IRT", inv),
    )
    sid = cur.lastrowid
    if not inv:
        inv = f"SALE-{sid}"
        conn.execute("UPDATE sales SET invoice_no=? WHERE id=?", (inv, sid))
    for item in (data.items or []):
        qty = float(item.get("quantity", 1) or 1)
        price = float(item.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO sale_items (sale_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
            (sid, item.get("name", ""), qty, price, qty * price),
        )
        try:
            ensure_phase1_tables(conn)
            name = item.get("name", "")
            pid = item.get("product_id")
            code = item.get("code") or ""
            if not pid and name:
                pr = conn.execute("SELECT id, code FROM products WHERE name=? LIMIT 1", (name,)).fetchone()
                if pr:
                    pid = pr["id"]; code = pr["code"] or code
            _apply_stock(conn, pid, name, code, -qty, price, "sale", "sale", sid, inv)
        except Exception:
            pass
    try:
        log_audit(conn, "create", "sale", sid, f"total={total}")
    except Exception:
        pass
    conn.commit()
    conn.close()
    # Double-entry ledger post (best-effort)
    try:
        _safe_post_sale_to_ledger(
            sid,
            total,
            description=(data.description or data.customer or inv),
            currency=getattr(data, "currency", None) or "IRT",
        )
    except Exception as _le:
        print("[ledger] sale hook error:", _le)
    return {"id": sid, "invoice_no": inv, "total": total, "ledger": TARAZ_AVAILABLE}



@app.put("/api/sales/{id}")
async def update_sale(id: int, data: SaleCreate):
    conn = get_db()
    ensure_sales_tables(conn)
    row = conn.execute("SELECT id FROM sales WHERE id=?", (id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Sale not found")
    subtotal = sum(float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0) for item in (data.items or []))
    discount = float(data.discount or 0)
    total = max(0.0, subtotal - discount)
    paid = float(data.paid_amount or 0)
    status = data.payment_status or "paid"
    if status == "paid":
        paid = total
    date = data.date or __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    conn.execute(
        """UPDATE sales SET date=?, customer=?, location=?, description=?, total=?, discount=?,
           payment_status=?, paid_amount=?, due_date=?, tags=?, currency=? WHERE id=?""",
        (date, data.customer or "", data.location or "", data.description or "", total, discount,
         status, paid, data.due_date or "", data.tags or "", data.currency or "IRT", id),
    )
    conn.execute("DELETE FROM sale_items WHERE sale_id=?", (id,))
    for item in (data.items or []):
        qty = float(item.get("quantity", 1) or 1)
        price = float(item.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO sale_items (sale_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
            (id, item.get("name", ""), qty, price, qty * price),
        )
    try:
        log_audit(conn, "update", "sale", id, f"total={total}")
    except Exception:
        pass
    conn.commit()
    conn.close()
    return {"id": id, "total": total}

@app.delete("/api/sales/{id}")
async def delete_sale(id: int, hard: int = 0):
    conn = get_db()
    ensure_sales_tables(conn)
    if hard:
        conn.execute("DELETE FROM sale_items WHERE sale_id=?", (id,))
        conn.execute("DELETE FROM sales WHERE id=?", (id,))
    else:
        conn.execute("UPDATE sales SET deleted_at=datetime('now','localtime') WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}


@app.get("/api/audit")
async def list_audit(limit: int = 50):
    conn = get_db()
    ensure_purchase_columns(conn)
    try:
        rows = conn.execute(
            "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []
    finally:
        conn.close()



@app.get("/api/currencies")
async def list_currencies():
    conn = get_db()
    try:
        conn.execute("""CREATE TABLE IF NOT EXISTS exchange_rates (
          code TEXT PRIMARY KEY, name_en TEXT, name_fa TEXT, symbol TEXT,
          rate_to_toman REAL DEFAULT 1, country TEXT DEFAULT '')""")
        if conn.execute("SELECT COUNT(*) FROM exchange_rates").fetchone()[0] == 0:
            for row in [
                ("IRT","Iranian Toman","تومان","تومان",1,"Iran"),
                ("IRR","Iranian Rial","ریال","ریال",0.1,"Iran"),
                ("USD","US Dollar","دلار آمریکا","$",90000,"USA"),
                ("EUR","Euro","یورو (ایتالیا/اروپا)","€",98000,"Italy"),
                ("CNY","Chinese Yuan","یوان چین","¥",12500,"China"),
                ("TRY","Turkish Lira","لیر ترکیه","₺",2600,"Turkey"),
                ("AED","UAE Dirham","درهم امارات","د.إ",24500,"UAE"),
            ]:
                conn.execute(
                    "INSERT OR IGNORE INTO exchange_rates (code,name_en,name_fa,symbol,rate_to_toman,country) VALUES (?,?,?,?,?,?)",
                    row,
                )
            conn.commit()
        rows = conn.execute("SELECT * FROM exchange_rates ORDER BY code").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.put("/api/currencies/{code}")
async def update_rate(code: str, payload: dict):
    conn = get_db()
    rate = float(payload.get("rate_to_toman") or 0)
    conn.execute("UPDATE exchange_rates SET rate_to_toman=? WHERE code=?", (rate, code.upper()))
    conn.commit()
    conn.close()
    return {"ok": True}



@app.get("/api/export/purchases")
async def export_purchases():
    from fastapi.responses import Response
    import io, csv
    from datetime import datetime as _dt
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT p.id, p.date, p.seller, p.location, p.total, p.description, "
            "(SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id=p.id) as item_count "
            "FROM purchases p ORDER BY p.id DESC"
        ).fetchall()
    finally:
        conn.close()
    buf = io.StringIO()
    buf.write("\ufeff")
    w = csv.writer(buf)
    w.writerow(["ID", "Date", "Seller", "Location", "Item count", "Amount", "Description"])
    for r in rows:
        w.writerow([r["id"], r["date"], r["seller"], r["location"], r["item_count"], r["total"], r["description"] or ""])
    data = buf.getvalue().encode("utf-8-sig")
    out_dir = Path(BASE_DIR) / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"purchases_{_dt.now().strftime('%Y%m%d_%H%M%S')}.csv"
    fpath = out_dir / fname
    fpath.write_bytes(data)
    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
            "X-Saved-Path": str(fpath),
        },
    )


@app.get("/api/export/products")
async def export_products():
    from fastapi.responses import Response
    import io, csv
    from datetime import datetime as _dt
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT code, name, brand, model, category, buy_price FROM products ORDER BY id DESC"
        ).fetchall()
    finally:
        conn.close()
    buf = io.StringIO()
    buf.write("\ufeff")
    w = csv.writer(buf)
    w.writerow(["Code", "Name", "Brand", "Model", "Category", "Buy price"])
    for r in rows:
        w.writerow([r["code"], r["name"], r["brand"] or "", r["model"] or "", r["category"] or "", r["buy_price"] or 0])
    data = buf.getvalue().encode("utf-8-sig")
    out_dir = Path(BASE_DIR) / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"products_{_dt.now().strftime('%Y%m%d_%H%M%S')}.csv"
    fpath = out_dir / fname
    fpath.write_bytes(data)
    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
            "X-Saved-Path": str(fpath),
        },
    )


@app.get("/api/export/sellers")
async def export_sellers():
    from fastapi.responses import Response
    import io, csv
    from datetime import datetime as _dt
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT seller, COUNT(*) as cnt, SUM(total) as total_sum FROM purchases WHERE seller IS NOT NULL AND seller != '' GROUP BY seller ORDER BY total_sum DESC"
        ).fetchall()
    finally:
        conn.close()
    buf = io.StringIO()
    buf.write("\ufeff")
    w = csv.writer(buf)
    w.writerow(["Seller", "Count", "Total"])
    for r in rows:
        w.writerow([r["seller"], r["cnt"], r["total_sum"]])
    data = buf.getvalue().encode("utf-8-sig")
    out_dir = Path(BASE_DIR) / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"sellers_{_dt.now().strftime('%Y%m%d_%H%M%S')}.csv"
    fpath = out_dir / fname
    fpath.write_bytes(data)
    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
            "X-Saved-Path": str(fpath),
        },
    )


@app.get("/api/version")
async def app_version():
    ver = "2.1.0"
    try:
        p = os.path.join(BASE_DIR, "VERSION")
        if os.path.exists(p):
            ver = open(p, encoding="utf-8").read().strip() or ver
    except Exception:
        pass
    return {"version": ver, "name": "CluDari"}


@app.get("/api/products")
async def list_products(search: str = "", category: str = ""):
    conn = get_db()
    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR code LIKE ? OR IFNULL(brand,'') LIKE ? OR IFNULL(model,'') LIKE ?)"
        params.extend([f"%{search}%"] * 4)
    if category:
        query += " AND category=?"
        params.append(category)

    query += " ORDER BY category, name LIMIT 500"
    rows = conn.execute(query, params).fetchall()

    cats = [
        r[0]
        for r in conn.execute(
            "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category"
        ).fetchall()
    ]

    items = []
    for r in rows:
        d = dict(r)
        d.setdefault("brand", "")
        d.setdefault("model", "")
        items.append(d)

    conn.close()
    return {"items": items, "categories": cats, "count": len(items)}


@app.post("/api/products")
async def create_product(data: ProductCreate):
    conn = get_db()
    try:
        # ensure table exists (new user DB)
        conn.execute("""CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            brand TEXT DEFAULT '',
            model TEXT DEFAULT '',
            category TEXT DEFAULT '',
            unit TEXT DEFAULT 'pcs',
            buy_price REAL DEFAULT 0,
            sell_price REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            description TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )""")
        code = (data.code or "").strip()
        name = (data.name or "").strip()
        if not name:
            conn.close()
            raise HTTPException(status_code=400, detail="Product name required")
        if not code:
            code = "P" + str(int(__import__("time").time()) % 100000000)
        try:
            cur = conn.execute(
                "INSERT INTO products (code, name, brand, model, category, buy_price) VALUES (?,?,?,?,?,?)",
                (code, name, data.brand or "", data.model or "", data.category or "", float(data.buy_price or 0)),
            )
            conn.commit()
            pid = cur.lastrowid
            conn.close()
            return {"id": pid, "code": code, "message": "Product saved"}
        except sqlite3.IntegrityError:
            # retry with unique code
            code2 = code + "-" + str(int(__import__("time").time()) % 10000)
            cur = conn.execute(
                "INSERT INTO products (code, name, brand, model, category, buy_price) VALUES (?,?,?,?,?,?)",
                (code2, name, data.brand or "", data.model or "", data.category or "", float(data.buy_price or 0)),
            )
            conn.commit()
            pid = cur.lastrowid
            conn.close()
            return {"id": pid, "code": code2, "message": "Product saved"}
    except HTTPException:
        raise
    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Product save error: {e}")



@app.put("/api/products/{id}")
async def update_product(id: int, data: ProductCreate):
    conn = get_db()
    try:
        conn.execute(
            "UPDATE products SET code=?, name=?, brand=?, model=?, category=?, buy_price=? WHERE id=?",
            (data.code, data.name, data.brand, data.model, data.category, data.buy_price, id),
        )
        conn.commit()
        conn.close()
        return {"message": "Product updated"}
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Product code already exists")


@app.delete("/api/products/{id}")
async def delete_product(id: int):
    conn = get_db()
    conn.execute("DELETE FROM products WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted"}


# ─── Sellers ───────────────────────────────────────────
@app.get("/api/sellers")
async def list_sellers(tab: str = "sellers"):
    """
    sellers tab = contacts only (manual address book)
    locations tab = distinct locations from purchases (report)
    purchase_parties tab = optional aggregate from purchases (not default)
    """
    conn = get_db()
    result = []
    try:
        if tab == "locations":
            rows = conn.execute(
                "SELECT location as name, COUNT(*) as count, "
                "COALESCE(SUM(total),0) as total_sum, MAX(date) as last_date "
                "FROM purchases WHERE location IS NOT NULL AND location != '' "
                "GROUP BY location ORDER BY total_sum DESC"
            ).fetchall()
            for r in rows:
                d = dict(r)
                d["last_date_jalali"] = to_jalali(d.get("last_date", ""))
                d["source"] = "purchase"
                result.append(d)
        elif tab == "from_purchases":
            # explicit report only if requested
            rows = conn.execute(
                "SELECT seller as name, COUNT(*) as count, "
                "COALESCE(SUM(total),0) as total_sum, MAX(date) as last_date "
                "FROM purchases WHERE seller IS NOT NULL AND seller != '' "
                "GROUP BY seller ORDER BY total_sum DESC"
            ).fetchall()
            for r in rows:
                d = dict(r)
                d["last_date_jalali"] = to_jalali(d.get("last_date", ""))
                d["source"] = "purchase"
                result.append(d)
        else:
            # Default: only manually added contacts
            try:
                conn.execute("""CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT DEFAULT '',
                    email TEXT DEFAULT '',
                    company TEXT DEFAULT '',
                    role TEXT DEFAULT '',
                    notes TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now','localtime'))
                )""")
                conn.commit()
            except Exception:
                pass
            rows = conn.execute(
                "SELECT id, name, phone, email, company, notes FROM contacts ORDER BY name COLLATE NOCASE"
            ).fetchall()
            for r in rows:
                d = dict(r)
                # attach purchase stats if same name appears in purchases
                try:
                    st = conn.execute(
                        "SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total_sum, MAX(date) as last_date "
                        "FROM purchases WHERE seller = ?",
                        (d.get("name") or "",),
                    ).fetchone()
                    d["count"] = st["count"] if st else 0
                    d["total_sum"] = st["total_sum"] if st else 0
                    d["last_date"] = st["last_date"] if st else ""
                    d["last_date_jalali"] = to_jalali(d.get("last_date", ""))
                except Exception:
                    d["count"] = 0
                    d["total_sum"] = 0
                    d["last_date_jalali"] = ""
                d["source"] = "contact"
                result.append(d)
    except Exception as e:
        print("list_sellers error:", e)
    conn.close()
    return result


# ─── Settings ──────────────────────────────────────────
@app.get("/api/settings")
async def get_settings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}


@app.post("/api/settings")
async def save_settings(request: Request):
    data = await request.json()
    conn = get_db()
    for key, value in data.items():
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, str(value)),
        )
    conn.commit()
    conn.close()
    return {"message": "Settings saved"}


# ─── Backup ────────────────────────────────────────────
@app.post("/api/backup")
async def create_backup():
    import zipfile
    import shutil

    backup_dir = BASE_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    path = Path(CURRENT_USER.get("db_path") or DB_PATH)
    user = CURRENT_USER.get("username") or "user"
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"backup_{user}_{now}.zip"
    with zipfile.ZipFile(backup_file, "w", zipfile.ZIP_DEFLATED) as zf:
        if path.exists():
            zf.write(path, path.name)
    return {"message": "Backup saved", "file": backup_file.name, "size": backup_file.stat().st_size}


# ─── Advanced Database Management ───
SAFE_TABLES = {
    "purchases", "purchase_items", "products", "settings", "categories",
    "contacts", "customers", "documents", "licenses", "reminders",
    "subscriptions", "bills", "accounts", "invoices", "invoice_items",
}


@app.get("/api/db/info")
def db_info():
    path = Path(CURRENT_USER.get("db_path") or DB_PATH)
    size = path.stat().st_size if path.exists() else 0
    conn = get_db()
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    table_stats = []
    total_rows = 0
    for t in tables:
        name = t[0] if not isinstance(t, sqlite3.Row) else t["name"]
        try:
            cnt = conn.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
        except Exception:
            cnt = 0
        total_rows += cnt
        table_stats.append({"name": name, "rows": cnt})
    # integrity
    try:
        integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    except Exception:
        integrity = "unknown"
    try:
        page_count = conn.execute("PRAGMA page_count").fetchone()[0]
        page_size = conn.execute("PRAGMA page_size").fetchone()[0]
        freelist = conn.execute("PRAGMA freelist_count").fetchone()[0]
    except Exception:
        page_count = page_size = freelist = 0
    conn.close()
    return {
        "path": str(path),
        "filename": path.name,
        "username": CURRENT_USER.get("username"),
        "size_bytes": size,
        "size_kb": round(size / 1024, 1),
        "size_mb": round(size / (1024 * 1024), 2),
        "tables": table_stats,
        "table_count": len(table_stats),
        "total_rows": total_rows,
        "integrity": integrity,
        "page_count": page_count,
        "page_size": page_size,
        "freelist_count": freelist,
    }


@app.get("/api/db/table/{table_name}")
def db_table_browse(table_name: str, limit: int = 50, offset: int = 0):
    if table_name not in SAFE_TABLES:
        raise HTTPException(400, "Table not allowed")
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    conn = get_db()
    try:
        total = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]
        cols = [r[1] for r in conn.execute(f'PRAGMA table_info("{table_name}")').fetchall()]
        rows = conn.execute(
            f'SELECT * FROM "{table_name}" LIMIT ? OFFSET ?', (limit, offset)
        ).fetchall()
        data = [dict(r) for r in rows]
    except Exception as e:
        conn.close()
        raise HTTPException(400, str(e))
    conn.close()
    return {"table": table_name, "columns": cols, "rows": data, "total": total, "limit": limit, "offset": offset}


@app.post("/api/db/vacuum")
def db_vacuum():
    path = Path(CURRENT_USER.get("db_path") or DB_PATH)
    before = path.stat().st_size if path.exists() else 0
    conn = get_db()
    conn.execute("VACUUM")
    conn.close()
    after = path.stat().st_size if path.exists() else 0
    return {
        "message": "Database optimized",
        "before_bytes": before,
        "after_bytes": after,
        "saved_bytes": max(0, before - after),
    }


@app.post("/api/db/integrity")
def db_integrity():
    conn = get_db()
    result = conn.execute("PRAGMA integrity_check").fetchone()[0]
    conn.close()
    return {"ok": result == "ok", "result": result}


@app.get("/api/db/backups")
def db_list_backups():
    backup_dir = BASE_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    files = []
    for p in sorted(backup_dir.glob("*.zip"), key=lambda x: x.stat().st_mtime, reverse=True):
        files.append({
            "name": p.name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "mtime": datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
        })
    return files


@app.post("/api/db/restore")
def db_restore(body: dict):
    import zipfile
    import shutil
    name = (body or {}).get("file") or ""
    if not name or "/" in name or "\\" in name or ".." in name:
        raise HTTPException(400, "Invalid backup file")
    backup_dir = BASE_DIR / "backups"
    src = backup_dir / name
    if not src.exists():
        raise HTTPException(404, "Backup not found")
    path = Path(CURRENT_USER.get("db_path") or DB_PATH)
    # safety copy current
    safety = backup_dir / f"pre_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    with zipfile.ZipFile(safety, "w", zipfile.ZIP_DEFLATED) as zf:
        if path.exists():
            zf.write(path, path.name)
    # extract db from zip
    with zipfile.ZipFile(src, "r") as zf:
        names = zf.namelist()
        db_names = [n for n in names if n.endswith(".db")]
        if not db_names:
            raise HTTPException(400, "No database inside backup")
        extract_name = db_names[0]
        tmp = BASE_DIR / "_restore_tmp.db"
        with zf.open(extract_name) as src_f, open(tmp, "wb") as out:
            shutil.copyfileobj(src_f, out)
    # replace active db
    try:
        if path.exists():
            path.unlink()
        shutil.move(str(tmp), str(path))
    except Exception as e:
        raise HTTPException(500, f"Restore failed: {e}")
    init_db()
    return {"message": "Database restored", "from": name, "safety_backup": safety.name}


@app.post("/api/db/clear-table")
def db_clear_table(body: dict):
    table = (body or {}).get("table") or ""
    if table not in SAFE_TABLES:
        raise HTTPException(400, "Table not allowed")
    if table == "settings":
        raise HTTPException(400, "Cannot clear settings table this way")
    conn = get_db()
    before = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
    conn.execute(f'DELETE FROM "{table}"')
    conn.commit()
    conn.close()
    return {"message": f"Cleared {table}", "deleted": before}


@app.post("/api/db/reset")
def db_reset(body: dict = None):
    """Wipe all business data for current user (keeps account)."""
    confirm = (body or {}).get("confirm") if body else None
    if confirm != "RESET":
        raise HTTPException(400, 'Send {"confirm":"RESET"} to confirm')
    path = Path(CURRENT_USER.get("db_path") or DB_PATH)
    # backup first
    import zipfile
    backup_dir = BASE_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    safety = backup_dir / f"pre_reset_{CURRENT_USER.get('username')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    with zipfile.ZipFile(safety, "w", zipfile.ZIP_DEFLATED) as zf:
        if path.exists():
            zf.write(path, path.name)
    conn = get_db()
    for table in SAFE_TABLES:
        if table == "settings":
            continue
        try:
            conn.execute(f'DELETE FROM "{table}"')
        except Exception:
            pass
    conn.commit()
    try:
        conn.execute("VACUUM")
    except Exception:
        pass
    conn.close()
    return {"message": "Database reset", "safety_backup": safety.name}



# ─── Categories ──────────────────────────────────────
@app.get("/api/categories")
async def list_categories(parent_id: int = 0):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM categories WHERE parent_id=? ORDER BY name", (parent_id,)
    ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        children = conn.execute(
            "SELECT COUNT(*) as cnt FROM categories WHERE parent_id=?", (d["id"],)
        ).fetchone()
        d["children_count"] = children["cnt"] if children else 0
        result.append(d)
    conn.close()
    return result


@app.post("/api/categories")
async def create_category(data: dict):
    conn = get_db()
    nid = next_id(conn, "categories")
    conn.execute(
        "INSERT INTO categories (id, name, parent_id, icon) VALUES (?, ?, ?, ?)",
        (nid, data.get("name"), data.get("parent_id", 0), data.get("icon", "folder")),
    )
    conn.commit()
    conn.close()
    return {"id": nid, "message": "Category saved"}



@app.put("/api/categories/{id}")
async def update_category(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE categories SET name=?, parent_id=?, icon=? WHERE id=?",
        (data.get("name"), data.get("parent_id", 0), data.get("icon", "folder"), id),
    )
    conn.commit()
    conn.close()
    return {"message": "Category updated"}


@app.delete("/api/categories/{id}")
async def delete_category(id: int):
    conn = get_db()
    conn.execute("DELETE FROM categories WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Category deleted"}


# ─── Contacts ─────────────────────────────────────────
@app.get("/api/contacts")
async def list_contacts(category: str = ""):
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT * FROM contacts WHERE category=? ORDER BY name", (category,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM contacts ORDER BY category, name").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/contacts")
async def create_contact(data: dict):
    conn = get_db()
    nid = next_id(conn, "contacts")
    conn.execute(
        "INSERT INTO contacts (id, name, category, phone, email, address, company, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            nid,
            data.get("name"),
            data.get("category"),
            data.get("phone", ""),
            data.get("email", ""),
            data.get("address", ""),
            data.get("company", ""),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"id": nid, "message": "Contact saved"}


@app.put("/api/contacts/{id}")
async def update_contact(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE contacts SET name=?, category=?, phone=?, email=?, address=?, company=?, description=? WHERE id=?",
        (
            data.get("name"),
            data.get("category"),
            data.get("phone", ""),
            data.get("email", ""),
            data.get("address", ""),
            data.get("company", ""),
            data.get("description", ""),
            id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Contact updated"}


@app.delete("/api/contacts/{id}")
async def delete_contact(id: int):
    conn = get_db()
    conn.execute("DELETE FROM contacts WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Contact deleted"}


# ─── Customers ────────────────────────────────────────
@app.get("/api/customers")
async def list_customers(search: str = ""):
    conn = get_db()
    if search:
        rows = conn.execute(
            "SELECT * FROM customers WHERE name LIKE ? OR code LIKE ? ORDER BY code",
            (f"%{search}%", f"%{search}%"),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM customers ORDER BY code").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/customers")
async def create_customer(data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO customers (code, name, phone, address, description) VALUES (?, ?, ?, ?, ?)",
        (
            data.get("code"),
            data.get("name"),
            data.get("phone", ""),
            data.get("address", ""),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Customer saved"}



@app.put("/api/customers/{id}")
async def update_customer(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE customers SET code=?, name=?, phone=?, address=?, description=? WHERE id=?",
        (data.get("code"), data.get("name"), data.get("phone", ""),
         data.get("address", ""), data.get("description", ""), id),
    )
    conn.commit()
    conn.close()
    return {"message": "Customer updated"}


@app.delete("/api/customers/{id}")
async def delete_customer(id: int):
    conn = get_db()
    conn.execute("DELETE FROM customers WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Customer deleted"}


# ─── Documents ────────────────────────────────────────
@app.get("/api/documents")
async def list_documents(category: str = ""):
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT * FROM documents WHERE category=? ORDER BY id DESC", (category,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM documents ORDER BY id DESC").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/documents")
async def create_document(data: dict):
    conn = get_db()
    next_id = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM documents").fetchone()[0]
    conn.execute(
        "INSERT INTO documents (id, title, category, file_path, file_type, description) VALUES (?, ?, ?, ?, ?, ?)",
        (
            next_id,
            data.get("title"),
            data.get("category"),
            data.get("file_path", ""),
            data.get("file_type", ""),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"id": next_id, "message": "Document saved"}



@app.put("/api/documents/{id}")
async def update_document(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE documents SET title=?, category=?, file_path=?, file_type=?, description=? WHERE id=?",
        (data.get("title"), data.get("category"), data.get("file_path", ""),
         data.get("file_type", ""), data.get("description", ""), id),
    )
    conn.commit()
    conn.close()
    return {"message": "Document updated"}


@app.delete("/api/documents/{id}")
async def delete_document(id: int):
    conn = get_db()
    conn.execute("DELETE FROM documents WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Document deleted"}


# ─── Licenses ─────────────────────────────────────────
@app.get("/api/licenses")
async def list_licenses(category: str = ""):
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT * FROM licenses WHERE category=? ORDER BY name", (category,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM licenses ORDER BY category, name").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/licenses")
async def create_license(data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO licenses (name, category, license_key, username, password, expiry_date, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("name"),
            data.get("category"),
            data.get("license_key", ""),
            data.get("username", ""),
            data.get("password", ""),
            data.get("expiry_date", ""),
            data.get("status", "active"),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "License saved"}



@app.put("/api/licenses/{id}")
async def update_license(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE licenses SET name=?, category=?, license_key=?, username=?, password=?, expiry_date=?, status=?, description=? WHERE id=?",
        (data.get("name"), data.get("category"), data.get("license_key", ""),
         data.get("username", ""), data.get("password", ""), data.get("expiry_date", ""),
         data.get("status", "active"), data.get("description", ""), id),
    )
    conn.commit()
    conn.close()
    return {"message": "License updated"}


@app.delete("/api/licenses/{id}")
async def delete_license(id: int):
    conn = get_db()
    conn.execute("DELETE FROM licenses WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "License deleted"}


# ─── Reminders ────────────────────────────────────────
@app.get("/api/reminders")
async def list_reminders(status: str = ""):
    conn = get_db()
    if status:
        rows = conn.execute(
            "SELECT * FROM reminders WHERE status=? ORDER BY remind_date", (status,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM reminders ORDER BY remind_date").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/reminders")
async def create_reminder(data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO reminders (title, category, remind_date, remind_time, repeat_type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("title"),
            data.get("category"),
            data.get("remind_date", ""),
            data.get("remind_time", ""),
            data.get("repeat_type", "none"),
            data.get("status", "pending"),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Reminder saved"}


@app.put("/api/reminders/{id}")
async def update_reminder(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE reminders SET title=?, category=?, remind_date=?, remind_time=?, repeat_type=?, status=?, description=? WHERE id=?",
        (
            data.get("title"),
            data.get("category"),
            data.get("remind_date", ""),
            data.get("remind_time", ""),
            data.get("repeat_type", "none"),
            data.get("status", "pending"),
            data.get("description", ""),
            id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Reminder updated"}


@app.delete("/api/reminders/{id}")
async def delete_reminder(id: int):
    conn = get_db()
    conn.execute("DELETE FROM reminders WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Reminder deleted"}


# ─── Subscriptions ────────────────────────────────────
@app.get("/api/subscriptions")
async def list_subscriptions(status: str = ""):
    conn = get_db()
    if status:
        rows = conn.execute(
            "SELECT * FROM subscriptions WHERE status=? ORDER BY name", (status,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM subscriptions ORDER BY name").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/subscriptions")
async def create_subscription(data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO subscriptions (name, category, plan, monthly_price, yearly_price, start_date, renewal_date, status, auto_renew, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("name"),
            data.get("category"),
            data.get("plan", ""),
            data.get("monthly_price", 0),
            data.get("yearly_price", 0),
            data.get("start_date", ""),
            data.get("renewal_date", ""),
            data.get("status", "active"),
            data.get("auto_renew", 1),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Subscription saved"}



@app.put("/api/subscriptions/{id}")
async def update_subscription(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE subscriptions SET name=?, category=?, plan=?, monthly_price=?, yearly_price=?, start_date=?, renewal_date=?, status=?, auto_renew=?, description=? WHERE id=?",
        (data.get("name"), data.get("category"), data.get("plan", ""),
         data.get("monthly_price", 0), data.get("yearly_price", 0),
         data.get("start_date", ""), data.get("renewal_date", ""),
         data.get("status", "active"), data.get("auto_renew", 1),
         data.get("description", ""), id),
    )
    conn.commit()
    conn.close()
    return {"message": "Subscription updated"}


@app.delete("/api/subscriptions/{id}")
async def delete_subscription(id: int):
    conn = get_db()
    conn.execute("DELETE FROM subscriptions WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Subscription deleted"}


# ─── Bills ────────────────────────────────────────────
@app.get("/api/bills")
async def list_bills(status: str = ""):
    conn = get_db()
    if status:
        rows = conn.execute(
            "SELECT * FROM bills WHERE status=? ORDER BY due_date", (status,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM bills ORDER BY due_date").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/bills")
async def create_bill(data: dict):
    conn = get_db()
    nid = next_id(conn, "bills")
    conn.execute(
        "INSERT INTO bills (id, name, category, amount, due_date, paid_date, status, bill_number, meter_number, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            nid,
            data.get("name"),
            data.get("category"),
            data.get("amount", 0),
            data.get("due_date", ""),
            data.get("paid_date", ""),
            data.get("status", "pending"),
            data.get("bill_number", ""),
            data.get("meter_number", ""),
            data.get("description", ""),
        ),
    )
    conn.commit()
    conn.close()
    return {"id": nid, "message": "Bill saved"}


@app.put("/api/bills/{id}")
async def update_bill(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE bills SET name=?, category=?, amount=?, due_date=?, paid_date=?, status=?, bill_number=?, meter_number=?, description=? WHERE id=?",
        (
            data.get("name"),
            data.get("category"),
            data.get("amount", 0),
            data.get("due_date", ""),
            data.get("paid_date", ""),
            data.get("status", "pending"),
            data.get("bill_number", ""),
            data.get("meter_number", ""),
            data.get("description", ""),
            id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Bill updated"}


@app.delete("/api/bills/{id}")
async def delete_bill(id: int):
    conn = get_db()
    conn.execute("DELETE FROM bills WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Bill deleted"}


# ─── Checks / Cheques (مدیریت چک) ─────────────────────────────
def ensure_checks_table(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_number TEXT NOT NULL,
        check_type TEXT DEFAULT 'received',
        party TEXT DEFAULT '',
        bank TEXT DEFAULT '',
        amount REAL DEFAULT 0,
        check_date TEXT DEFAULT '',
        due_date TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        account TEXT DEFAULT '',
        description TEXT DEFAULT '',
        sayad_id TEXT DEFAULT '',
        serial TEXT DEFAULT '',
        series TEXT DEFAULT '',
        branch TEXT DEFAULT '',
        owner TEXT DEFAULT '',
        owner_national_id TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    # migrate older DBs
    cols = {r[1] for r in conn.execute("PRAGMA table_info(checks)").fetchall()}
    for col, decl in [
        ("sayad_id", "TEXT DEFAULT ''"),
        ("serial", "TEXT DEFAULT ''"),
        ("series", "TEXT DEFAULT ''"),
        ("branch", "TEXT DEFAULT ''"),
        ("owner", "TEXT DEFAULT ''"),
        ("owner_national_id", "TEXT DEFAULT ''"),
        ("reason", "TEXT DEFAULT ''"),
    ]:
        if col not in cols:
            try:
                conn.execute(f"ALTER TABLE checks ADD COLUMN {col} {decl}")
            except Exception:
                pass
    conn.commit()

@app.get("/api/checks")
async def list_checks(status: str = "", check_type: str = ""):
    conn = get_db()
    ensure_checks_table(conn)
    where, params = ["1=1"], []
    if status:
        where.append("status=?"); params.append(status)
    if check_type:
        where.append("check_type=?"); params.append(check_type)
    rows = conn.execute(
        f"SELECT * FROM checks WHERE {' AND '.join(where)} ORDER BY CASE WHEN due_date='' THEN 1 ELSE 0 END, due_date, id DESC",
        tuple(params)
    ).fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result

@app.get("/api/checks/{id}")
async def get_check(id: int):
    conn = get_db(); ensure_checks_table(conn)
    row = conn.execute("SELECT * FROM checks WHERE id=?", (id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Check not found")
    return dict(row)

@app.post("/api/checks")
async def create_check(data: dict):
    conn = get_db(); ensure_checks_table(conn)
    number = str(data.get("check_number") or "").strip()
    if not number:
        conn.close(); raise HTTPException(status_code=400, detail="check_number is required")
    nid = next_id(conn, "checks")
    conn.execute("""INSERT INTO checks
        (id, check_number, check_type, party, bank, amount, check_date, due_date, status, account, description,
         sayad_id, serial, series, branch, owner, owner_national_id, reason)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
        nid, number, data.get("check_type", "received"), data.get("party", ""), data.get("bank", ""),
        float(data.get("amount", 0) or 0), data.get("check_date", ""), data.get("due_date", ""),
        data.get("status", "pending"), data.get("account", ""), data.get("description", ""),
        data.get("sayad_id", ""), data.get("serial", ""), data.get("series", ""), data.get("branch", ""),
        data.get("owner", ""), data.get("owner_national_id", ""), data.get("reason", "")
    ))
    conn.commit(); conn.close()
    return {"id": nid, "message": "Check saved"}

@app.put("/api/checks/{id}")
async def update_check(id: int, data: dict):
    conn = get_db(); ensure_checks_table(conn)
    number = str(data.get("check_number") or "").strip()
    if not number:
        conn.close(); raise HTTPException(status_code=400, detail="check_number is required")
    cur = conn.execute("""UPDATE checks SET check_number=?, check_type=?, party=?, bank=?, amount=?,
        check_date=?, due_date=?, status=?, account=?, description=?,
        sayad_id=?, serial=?, series=?, branch=?, owner=?, owner_national_id=?, reason=?
        WHERE id=?""", (
        number, data.get("check_type", "received"), data.get("party", ""), data.get("bank", ""),
        float(data.get("amount", 0) or 0), data.get("check_date", ""), data.get("due_date", ""),
        data.get("status", "pending"), data.get("account", ""), data.get("description", ""),
        data.get("sayad_id", ""), data.get("serial", ""), data.get("series", ""), data.get("branch", ""),
        data.get("owner", ""), data.get("owner_national_id", ""), data.get("reason", ""), id
    ))
    if cur.rowcount == 0:
        conn.close(); raise HTTPException(status_code=404, detail="Check not found")
    conn.commit(); conn.close()
    return {"message": "Check updated"}

@app.delete("/api/checks/{id}")
async def delete_check(id: int):
    conn = get_db(); ensure_checks_table(conn)
    cur = conn.execute("DELETE FROM checks WHERE id=?", (id,))
    if cur.rowcount == 0:
        conn.close(); raise HTTPException(status_code=404, detail="Check not found")
    conn.commit(); conn.close()
    return {"message": "Check deleted"}


# ─── Accounts ─────────────────────────────────────────
@app.get("/api/accounts")
async def list_accounts():
    conn = get_db()
    rows = conn.execute("SELECT * FROM accounts ORDER BY name").fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result


@app.post("/api/accounts")
async def create_account(data: dict):
    conn = get_db()
    conn.execute(
        "INSERT INTO accounts (name, type, bank, card_number, iban, currency, initial_balance, current_balance, color, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            data.get("name"),
            data.get("type", "bank"),
            data.get("bank", ""),
            data.get("card_number", ""),
            data.get("iban", ""),
            data.get("currency", "IRR"),
            data.get("initial_balance", 0),
            data.get("current_balance", 0),
            data.get("color", "#4F46E5"),
            data.get("status", "active"),
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Account saved"}


@app.put("/api/accounts/{id}")
async def update_account(id: int, data: dict):
    conn = get_db()
    conn.execute(
        "UPDATE accounts SET name=?, type=?, bank=?, card_number=?, iban=?, currency=?, initial_balance=?, current_balance=?, color=?, status=? WHERE id=?",
        (
            data.get("name"),
            data.get("type", "bank"),
            data.get("bank", ""),
            data.get("card_number", ""),
            data.get("iban", ""),
            data.get("currency", "IRR"),
            data.get("initial_balance", 0),
            data.get("current_balance", 0),
            data.get("color", "#4F46E5"),
            data.get("status", "active"),
            id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Account updated"}


@app.delete("/api/accounts/{id}")
async def delete_account(id: int):
    conn = get_db()
    conn.execute("DELETE FROM accounts WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Account deleted"}





# ─── Admissions (پذیرش) ───
class AdmissionCreate(BaseModel):
    date: str = ""
    location: str = ""
    patient_name: str = ""
    nurse_name: str = ""
    doctor_name: str = ""
    stated_amount: float = 0
    paid_amount: float = 0
    description: str = ""
    items: list = []


def ensure_admissions_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS admissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT DEFAULT '',
        location TEXT DEFAULT '',
        patient_name TEXT DEFAULT '',
        nurse_name TEXT DEFAULT '',
        doctor_name TEXT DEFAULT '',
        stated_amount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        description TEXT DEFAULT '',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS admission_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_id INTEGER NOT NULL,
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0
    )""")
    conn.commit()


@app.get("/api/admissions")
async def list_admissions(search: str = ""):
    conn = get_db()
    ensure_admissions_tables(conn)
    q = "SELECT * FROM admissions WHERE (deleted_at IS NULL OR deleted_at='')"
    params = []
    if search:
        q += " AND (patient_name LIKE ? OR nurse_name LIKE ? OR doctor_name LIKE ? OR location LIKE ? OR description LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])
    q += " ORDER BY date DESC, id DESC LIMIT 500"
    rows = conn.execute(q, params).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        items = conn.execute("SELECT * FROM admission_items WHERE admission_id=?", (d["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        out.append(d)
    conn.close()
    return out


@app.get("/api/admissions/{id}")
async def get_admission(id: int):
    conn = get_db()
    ensure_admissions_tables(conn)
    r = conn.execute("SELECT * FROM admissions WHERE id=?", (id,)).fetchone()
    if not r:
        conn.close()
        raise HTTPException(404, "Not found")
    d = dict(r)
    items = conn.execute("SELECT * FROM admission_items WHERE admission_id=?", (id,)).fetchall()
    d["items"] = [dict(i) for i in items]
    conn.close()
    return d


@app.post("/api/admissions")
async def create_admission(data: AdmissionCreate):
    conn = get_db()
    ensure_admissions_tables(conn)
    items_total = sum(float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0) for item in (data.items or []))
    stated = float(data.stated_amount or 0)
    total = items_total if items_total > 0 else stated
    paid = float(data.paid_amount or 0)
    date = data.date or __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    cur = conn.execute(
        """INSERT INTO admissions (date, location, patient_name, nurse_name, doctor_name,
           stated_amount, paid_amount, total, description)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (date, data.location or "", data.patient_name or "", data.nurse_name or "",
         data.doctor_name or "", stated, paid, total, data.description or ""),
    )
    aid = cur.lastrowid
    for item in (data.items or []):
        qty = float(item.get("quantity", 1) or 1)
        price = float(item.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO admission_items (admission_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
            (aid, item.get("name", ""), qty, price, qty * price),
        )
    conn.commit()
    conn.close()
    return {"id": aid, "total": total}


@app.put("/api/admissions/{id}")
async def update_admission(id: int, data: AdmissionCreate):
    conn = get_db()
    ensure_admissions_tables(conn)
    if not conn.execute("SELECT id FROM admissions WHERE id=?", (id,)).fetchone():
        conn.close()
        raise HTTPException(404, "Not found")
    items_total = sum(float(item.get("quantity", 1) or 1) * float(item.get("unit_price", 0) or 0) for item in (data.items or []))
    stated = float(data.stated_amount or 0)
    total = items_total if items_total > 0 else stated
    paid = float(data.paid_amount or 0)
    date = data.date or __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    conn.execute(
        """UPDATE admissions SET date=?, location=?, patient_name=?, nurse_name=?, doctor_name=?,
           stated_amount=?, paid_amount=?, total=?, description=? WHERE id=?""",
        (date, data.location or "", data.patient_name or "", data.nurse_name or "",
         data.doctor_name or "", stated, paid, total, data.description or "", id),
    )
    conn.execute("DELETE FROM admission_items WHERE admission_id=?", (id,))
    for item in (data.items or []):
        qty = float(item.get("quantity", 1) or 1)
        price = float(item.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO admission_items (admission_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
            (id, item.get("name", ""), qty, price, qty * price),
        )
    conn.commit()
    conn.close()
    return {"id": id, "total": total}


@app.delete("/api/admissions/{id}")
async def delete_admission(id: int):
    conn = get_db()
    ensure_admissions_tables(conn)
    conn.execute("UPDATE admissions SET deleted_at=datetime('now','localtime') WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}






# ─── Nurses (پرستار) ───
class NurseCreate(BaseModel):
    name: str = ""
    phone: str = ""
    description: str = ""


def ensure_nurses_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS nurses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        description TEXT DEFAULT '',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.commit()


@app.get("/api/nurses")
async def list_nurses(search: str = ""):
    conn = get_db()
    ensure_nurses_tables(conn)
    q = "SELECT * FROM nurses WHERE (deleted_at IS NULL OR deleted_at='')"
    params = []
    if search:
        q += " AND (name LIKE ? OR phone LIKE ? OR description LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    q += " ORDER BY name COLLATE NOCASE ASC LIMIT 500"
    rows = [dict(r) for r in conn.execute(q, params).fetchall()]
    conn.close()
    return rows


@app.post("/api/nurses")
async def create_nurse(data: NurseCreate):
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    conn = get_db()
    ensure_nurses_tables(conn)
    cur = conn.execute("INSERT INTO nurses (name, phone, description) VALUES (?,?,?)",
                       (name, data.phone or "", data.description or ""))
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.put("/api/nurses/{id}")
async def update_nurse(id: int, data: NurseCreate):
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    conn = get_db()
    ensure_nurses_tables(conn)
    conn.execute("UPDATE nurses SET name=?, phone=?, description=? WHERE id=?",
                 (name, data.phone or "", data.description or "", id))
    conn.commit()
    conn.close()
    return {"id": id}


@app.delete("/api/nurses/{id}")
async def delete_nurse(id: int):
    conn = get_db()
    ensure_nurses_tables(conn)
    conn.execute("UPDATE nurses SET deleted_at=datetime('now','localtime') WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}


# ─── Doctors (پزشک) — standalone module ───
class DoctorCreate(BaseModel):
    name: str = ""
    specialty: str = ""
    phone: str = ""
    address: str = ""
    description: str = ""
    status: str = "active"


def ensure_doctors_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        specialty TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.commit()


@app.get("/api/doctors")
async def list_doctors(search: str = ""):
    conn = get_db()
    ensure_doctors_tables(conn)
    q = "SELECT * FROM doctors WHERE (deleted_at IS NULL OR deleted_at='')"
    params = []
    if search:
        q += " AND (name LIKE ? OR specialty LIKE ? OR phone LIKE ? OR description LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])
    q += " ORDER BY name COLLATE NOCASE ASC LIMIT 500"
    rows = [dict(r) for r in conn.execute(q, params).fetchall()]
    conn.close()
    return rows


@app.get("/api/doctors/{id}")
async def get_doctor(id: int):
    conn = get_db()
    ensure_doctors_tables(conn)
    r = conn.execute("SELECT * FROM doctors WHERE id=?", (id,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, "Not found")
    return dict(r)


@app.post("/api/doctors")
async def create_doctor(data: DoctorCreate):
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    conn = get_db()
    ensure_doctors_tables(conn)
    cur = conn.execute(
        "INSERT INTO doctors (name, specialty, phone, address, description, status) VALUES (?,?,?,?,?,?)",
        (name, data.specialty or "", data.phone or "", data.address or "", data.description or "", data.status or "active"),
    )
    conn.commit()
    did = cur.lastrowid
    conn.close()
    return {"id": did}


@app.put("/api/doctors/{id}")
async def update_doctor(id: int, data: DoctorCreate):
    name = (data.name or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    conn = get_db()
    ensure_doctors_tables(conn)
    if not conn.execute("SELECT id FROM doctors WHERE id=?", (id,)).fetchone():
        conn.close()
        raise HTTPException(404, "Not found")
    conn.execute(
        "UPDATE doctors SET name=?, specialty=?, phone=?, address=?, description=?, status=? WHERE id=?",
        (name, data.specialty or "", data.phone or "", data.address or "", data.description or "", data.status or "active", id),
    )
    conn.commit()
    conn.close()
    return {"id": id}


@app.delete("/api/doctors/{id}")
async def delete_doctor(id: int):
    conn = get_db()
    ensure_doctors_tables(conn)
    conn.execute("UPDATE doctors SET deleted_at=datetime('now','localtime') WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}


# ─── Rename seller/location across purchases ───
@app.put("/api/sellers/rename")
async def rename_seller(request: Request):
    data = await request.json()
    old_name = (data.get("old_name") or "").strip()
    new_name = (data.get("new_name") or "").strip()
    field = data.get("field", "seller")  # seller | location
    if field not in ("seller", "location"):
        raise HTTPException(status_code=400, detail="Invalid field")
    if not old_name or not new_name:
        raise HTTPException(status_code=400, detail="Old and new names are required")
    conn = get_db()
    conn.execute(f"UPDATE purchases SET {field}=? WHERE {field}=?", (new_name, old_name))
    conn.commit()
    conn.close()
    return {"message": "Updated"}


# ─── Export CSV ───



@app.post("/api/auth/login")
def auth_login(body: LoginBody):
    try:
        init_auth_db()
    except Exception:
        pass
    username = (body.username or "").strip()
    password = body.password or ""
    if not username or not password:
        raise HTTPException(400, "Username and password required")
    try:
        conn = sqlite3.connect(AUTH_DB)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Auth DB error: {e}")
    if not row or row["password_hash"] != _hash_pw(password):
        raise HTTPException(401, "Invalid username or password")
    token = secrets.token_hex(24)
    SESSIONS[token] = username
    try:
        ac = sqlite3.connect(AUTH_DB)
        ac.execute("INSERT OR REPLACE INTO sessions (token, username) VALUES (?,?)", (token, username))
        ac.commit(); ac.close()
    except Exception:
        pass
    db_file = row["db_file"] if "db_file" in row.keys() else "cludari.db"
    path = str(DB_PATH) if db_file == "cludari.db" else os.path.join(DATA_DIR, db_file)
    CURRENT_USER["username"] = username
    CURRENT_USER["db_path"] = path
    # Do NOT full init_db here — it can take long and freeze login UI.
    # get_db() will create schema lazily if needed.
    try:
        parent = os.path.dirname(path)
        if parent:
            os.makedirs(parent, exist_ok=True)
    except Exception:
        pass
    return {"ok": True, "token": token, "username": username, "is_root": username == "root"}


@app.post("/api/auth/register")
def auth_register(body: RegisterBody):
    username = (body.username or "").strip()
    password = body.password or ""
    if not username or not password:
        raise HTTPException(400, "Username and password required")
    if username.lower() == "root":
        raise HTTPException(400, "Cannot register reserved username")
    if not re.match(r'^[A-Za-z0-9_\-\.]{3,32}$', username):
        raise HTTPException(400, "Username: 3-32 letters, numbers, _ - .")
    if len(password) < 3:
        raise HTTPException(400, "Password too short")
    db_file = f"{username}.db"
    conn = sqlite3.connect(AUTH_DB)
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, db_file) VALUES (?,?,?)",
            (username, _hash_pw(password), db_file),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(400, "Username already exists")
    conn.close()
    # create empty db
    path = os.path.join(DATA_DIR, db_file)
    CURRENT_USER["username"] = username
    CURRENT_USER["db_path"] = path
    try:
        init_db()
    except Exception as e:
        print("init_db register:", e)
    try:
        c2 = get_db()
        ensure_purchase_columns(c2)
        c2.close()
    except Exception as e:
        print("ensure after register:", e)
    token = secrets.token_hex(24)
    SESSIONS[token] = username
    try:
        ac = sqlite3.connect(AUTH_DB)
        ac.execute("INSERT OR REPLACE INTO sessions (token, username) VALUES (?,?)", (token, username))
        ac.commit(); ac.close()
    except Exception:
        pass
    return {"ok": True, "token": token, "username": username, "is_root": False}


@app.get("/api/auth/me")
def auth_me(authorization: Optional[str] = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    username = SESSIONS.get(token) if token else None
    if not username and token:
        # try disk
        try:
            ac = sqlite3.connect(AUTH_DB)
            row = ac.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
            ac.close()
            if row:
                username = row[0]
                SESSIONS[token] = username
        except Exception:
            pass
    if not username:
        raise HTTPException(401, "Not logged in")
    # activate db
    conn = sqlite3.connect(AUTH_DB)
    u = conn.execute("SELECT db_file FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    if u:
        db_file = u[0]
        path = DB_PATH if db_file == "cludari.db" else os.path.join(DATA_DIR, db_file)
        CURRENT_USER["username"] = username
        CURRENT_USER["db_path"] = path
        init_db()
    return {"username": username, "is_root": username == "root"}


@app.post("/api/auth/logout")
def auth_logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        SESSIONS.pop(authorization[7:], None)
    CURRENT_USER["username"] = None
    CURRENT_USER["db_path"] = DB_PATH
    return {"ok": True}


# ─── UI sounds (pygame) ───────────────────────────────────────────
_sfx_ready = False
_sfx_sounds = {}



def _init_sfx():
    global _sfx_ready, _sfx_sounds
    if _sfx_ready:
        return True
    try:
        import pygame
        pygame.mixer.pre_init(frequency=44100, size=-16, channels=2, buffer=1024)
        pygame.mixer.init()
        _sfx_sounds = {}
        import array, math

        def _tone(freqs, ms, vol=0.045, wave="sine"):
            """Soft low-volume sine tones with long attack/release (less sharp)."""
            sample_rate = 44100
            n = max(1, int(sample_rate * ms / 1000.0))
            buf = array.array("h")
            if isinstance(freqs, (int, float)):
                notes = [(float(freqs), 0.0, float(ms))]
            else:
                notes = [(float(f), float(st), float(dur)) for f, st, dur in freqs]
            attack = 25.0   # ms — soft fade-in
            release = 55.0  # ms — soft fade-out
            for i in range(n):
                t_ms = (i / sample_rate) * 1000.0
                val = 0.0
                for f, start, dur in notes:
                    if t_ms < start or t_ms > start + dur:
                        continue
                    local = t_ms - start
                    env = 1.0
                    if local < attack:
                        env = local / attack
                    if local > dur - release:
                        env = max(0.0, (dur - local) / release)
                    # pure sine only (no harmonics = less harsh)
                    phase = 2 * math.pi * f * (local / 1000.0)
                    val += math.sin(phase) * env
                val = max(-1.0, min(1.0, val * vol))
                sample = int(val * 22000)  # headroom, avoid clipping
                buf.append(sample)
                buf.append(sample)
            return pygame.mixer.Sound(buffer=buf)

        # Lower pitch, quieter, slightly longer — soft UI set
        _sfx_sounds["click"] = _tone(480, 55, 0.035, "sine")
        _sfx_sounds["open"]  = _tone([(392, 0, 70), (494, 45, 80)], 140, 0.04, "sine")
        _sfx_sounds["close"] = _tone([(494, 0, 55), (392, 40, 70)], 130, 0.035, "sine")
        _sfx_sounds["ok"]    = _tone([(349, 0, 60), (440, 50, 70)], 140, 0.04, "sine")
        _sfx_ready = True
        return True
    except Exception as e:
        print("[sfx] pygame init failed:", e)
        _sfx_ready = False
        return False



def _play_sfx(kind: str = "click"):
    import threading
    def _run():
        try:
            if not _init_sfx():
                # fallback winsound
                try:
                    import winsound
                    freqs = {"click": (520, 35), "open": (440, 55), "close": (390, 50), "ok": (490, 60)}
                    f, d = freqs.get(kind, (800, 70))
                    winsound.Beep(int(f), int(d))
                except Exception:
                    pass
                return
            snd = _sfx_sounds.get(kind) or _sfx_sounds.get("click")
            if snd is not None:
                snd.play()
        except Exception as e:
            print("[sfx] play error:", e)
    threading.Thread(target=_run, daemon=True).start()

@app.post("/api/ui/beep")
async def ui_beep(kind: str = "click"):
    """Sound disabled."""
    return {"ok": True}






# ═══ Personal: Budget / Goals / FX Deposit env ═══

class BudgetBody(BaseModel):
    category: str = ""
    limit_amount: float = 0
    month: str = ""  # YYYY-MM
    note: str = ""

class GoalBody(BaseModel):
    title: str = ""
    target_amount: float = 0
    current_amount: float = 0
    deadline: str = ""
    note: str = ""

class FxTxBody(BaseModel):
    date: str = ""
    kind: str = "buy"  # buy | sell | deposit | withdraw
    currency: str = "USD"
    amount_fx: float = 0
    rate: float = 0
    amount_rial: float = 0
    title: str = ""
    note: str = ""

class FxHoldingBody(BaseModel):
    currency: str = "USD"
    balance: float = 0
    avg_rate: float = 0
    note: str = ""


def ensure_personal_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT DEFAULT '',
        limit_amount REAL DEFAULT 0,
        month TEXT DEFAULT '',
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT DEFAULT '',
        target_amount REAL DEFAULT 0,
        current_amount REAL DEFAULT 0,
        deadline TEXT DEFAULT '',
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS fx_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT DEFAULT '',
        kind TEXT DEFAULT 'buy',
        currency TEXT DEFAULT 'USD',
        amount_fx REAL DEFAULT 0,
        rate REAL DEFAULT 0,
        amount_rial REAL DEFAULT 0,
        title TEXT DEFAULT '',
        note TEXT DEFAULT '',
        deleted_at TEXT,
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS fx_holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency TEXT DEFAULT 'USD',
        balance REAL DEFAULT 0,
        avg_rate REAL DEFAULT 0,
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.commit()


@app.get("/api/personal/summary")
async def personal_summary():
    """This month spend, last month spend, nearest goal, budget usage."""
    conn = get_db()
    ensure_personal_tables(conn)
    ensure_purchase_columns(conn)
    now = date.today()
    this_m = f"{now.year}-{now.month:02d}"
    if now.month == 1:
        last_m = f"{now.year-1}-12"
    else:
        last_m = f"{now.year}-{now.month-1:02d}"
    cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)").fetchall()}
    not_del = "(deleted_at IS NULL OR deleted_at = '')" if "deleted_at" in cols else "1=1"
    this_total = conn.execute(
        f"SELECT COALESCE(SUM(total),0) FROM purchases WHERE {not_del} AND date LIKE ?",
        (this_m + "%",),
    ).fetchone()[0] or 0
    last_total = conn.execute(
        f"SELECT COALESCE(SUM(total),0) FROM purchases WHERE {not_del} AND date LIKE ?",
        (last_m + "%",),
    ).fetchone()[0] or 0
    budgets = [dict(r) for r in conn.execute(
        "SELECT * FROM budgets WHERE month=? OR month='' OR month IS NULL ORDER BY id DESC LIMIT 20",
        (this_m,),
    ).fetchall()]
    goals = [dict(r) for r in conn.execute(
        "SELECT * FROM goals ORDER BY id DESC LIMIT 20"
    ).fetchall()]
    nearest = None
    for g in goals:
        t = float(g.get("target_amount") or 0)
        c = float(g.get("current_amount") or 0)
        g["remain"] = max(0, t - c)
        g["pct"] = round((c / t * 100) if t else 0, 1)
        if nearest is None or g["remain"] < nearest.get("remain", 1e99):
            nearest = g
    fx_rows = [dict(r) for r in conn.execute(
        "SELECT currency, SUM(CASE WHEN kind IN ('buy','deposit') THEN amount_fx WHEN kind IN ('sell','withdraw') THEN -amount_fx ELSE 0 END) AS bal FROM fx_transactions WHERE deleted_at IS NULL OR deleted_at='' GROUP BY currency"
    ).fetchall()]
    conn.close()
    change_pct = 0
    if last_total:
        change_pct = round((float(this_total) - float(last_total)) / float(last_total) * 100, 1)
    return {
        "this_month": float(this_total),
        "last_month": float(last_total),
        "change_pct": change_pct,
        "month_key": this_m,
        "budgets": budgets,
        "goals": goals,
        "nearest_goal": nearest,
        "fx_balances": fx_rows,
    }


@app.get("/api/budgets")
async def list_budgets(month: str = ""):
    conn = get_db()
    ensure_personal_tables(conn)
    if not month:
        now = date.today()
        month = f"{now.year}-{now.month:02d}"
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM budgets WHERE month=? OR month='' ORDER BY id DESC", (month,)
    ).fetchall()]
    # attach spent from purchases by category name match in seller/description if possible — simple: spent field 0 client-side
    conn.close()
    return rows


@app.post("/api/budgets")
async def create_budget(data: BudgetBody):
    conn = get_db()
    ensure_personal_tables(conn)
    month = (data.month or "").strip()
    if not month:
        now = date.today()
        month = f"{now.year}-{now.month:02d}"
    cur = conn.execute(
        "INSERT INTO budgets (category, limit_amount, month, note) VALUES (?,?,?,?)",
        ((data.category or "").strip(), float(data.limit_amount or 0), month, data.note or ""),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.delete("/api/budgets/{id}")
async def delete_budget(id: int):
    conn = get_db()
    ensure_personal_tables(conn)
    conn.execute("DELETE FROM budgets WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/goals")
async def list_goals():
    conn = get_db()
    ensure_personal_tables(conn)
    rows = [dict(r) for r in conn.execute("SELECT * FROM goals ORDER BY id DESC").fetchall()]
    conn.close()
    for g in rows:
        t = float(g.get("target_amount") or 0)
        c = float(g.get("current_amount") or 0)
        g["remain"] = max(0, t - c)
        g["pct"] = round((c / t * 100) if t else 0, 1)
    return rows


@app.post("/api/goals")
async def create_goal(data: GoalBody):
    conn = get_db()
    ensure_personal_tables(conn)
    cur = conn.execute(
        "INSERT INTO goals (title, target_amount, current_amount, deadline, note) VALUES (?,?,?,?,?)",
        ((data.title or "").strip(), float(data.target_amount or 0), float(data.current_amount or 0),
         data.deadline or "", data.note or ""),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.put("/api/goals/{id}")
async def update_goal(id: int, data: GoalBody):
    conn = get_db()
    ensure_personal_tables(conn)
    conn.execute(
        "UPDATE goals SET title=?, target_amount=?, current_amount=?, deadline=?, note=? WHERE id=?",
        ((data.title or "").strip(), float(data.target_amount or 0), float(data.current_amount or 0),
         data.deadline or "", data.note or "", id),
    )
    conn.commit()
    conn.close()
    return {"id": id}


@app.delete("/api/goals/{id}")
async def delete_goal(id: int):
    conn = get_db()
    ensure_personal_tables(conn)
    conn.execute("DELETE FROM goals WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/fx/transactions")
async def list_fx_tx(search: str = ""):
    conn = get_db()
    ensure_personal_tables(conn)
    q = "SELECT * FROM fx_transactions WHERE (deleted_at IS NULL OR deleted_at='')"
    params = []
    if search:
        q += " AND (title LIKE ? OR currency LIKE ? OR note LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    q += " ORDER BY date DESC, id DESC LIMIT 500"
    rows = [dict(r) for r in conn.execute(q, params).fetchall()]
    conn.close()
    return rows


@app.post("/api/fx/transactions")
async def create_fx_tx(data: FxTxBody):
    conn = get_db()
    ensure_personal_tables(conn)
    amount_rial = float(data.amount_rial or 0)
    if not amount_rial and data.amount_fx and data.rate:
        amount_rial = float(data.amount_fx) * float(data.rate)
    cur = conn.execute(
        """INSERT INTO fx_transactions (date, kind, currency, amount_fx, rate, amount_rial, title, note)
           VALUES (?,?,?,?,?,?,?,?)""",
        (data.date or str(date.today()), data.kind or "buy", (data.currency or "USD").upper(),
         float(data.amount_fx or 0), float(data.rate or 0), amount_rial,
         (data.title or "").strip(), data.note or ""),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.put("/api/fx/transactions/{id}")
async def update_fx_tx(id: int, data: FxTxBody):
    conn = get_db()
    ensure_personal_tables(conn)
    amount_rial = float(data.amount_rial or 0)
    if not amount_rial and data.amount_fx and data.rate:
        amount_rial = float(data.amount_fx) * float(data.rate)
    conn.execute(
        """UPDATE fx_transactions SET date=?, kind=?, currency=?, amount_fx=?, rate=?, amount_rial=?, title=?, note=?
           WHERE id=? AND (deleted_at IS NULL OR deleted_at='')""",
        (data.date or str(date.today()), data.kind or "buy", (data.currency or "USD").upper(),
         float(data.amount_fx or 0), float(data.rate or 0), amount_rial,
         (data.title or "").strip(), data.note or "", id),
    )
    conn.commit()
    conn.close()
    return {"id": id}


@app.delete("/api/fx/transactions/{id}")
async def delete_fx_tx(id: int):
    conn = get_db()
    ensure_personal_tables(conn)
    conn.execute("UPDATE fx_transactions SET deleted_at=datetime('now','localtime') WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"ok": True}




class FxCurrencyBody(BaseModel):
    code: str = ""
    name: str = ""
    note: str = ""


def ensure_fx_currencies(conn):
    ensure_personal_tables(conn)
    conn.execute("""CREATE TABLE IF NOT EXISTS fx_currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT DEFAULT '',
        name TEXT DEFAULT '',
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.commit()


@app.get("/api/fx/currencies")
async def list_fx_currencies():
    conn = get_db()
    ensure_fx_currencies(conn)
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM fx_currencies ORDER BY code COLLATE NOCASE ASC"
    ).fetchall()]
    conn.close()
    return rows


@app.post("/api/fx/currencies")
async def create_fx_currency(data: FxCurrencyBody):
    code = (data.code or "").strip().upper()
    if not code:
        raise HTTPException(400, "Code required")
    conn = get_db()
    ensure_fx_currencies(conn)
    exists = conn.execute("SELECT id FROM fx_currencies WHERE code=?", (code,)).fetchone()
    if exists:
        conn.execute("UPDATE fx_currencies SET name=?, note=? WHERE code=?",
                     (data.name or "", data.note or "", code))
        conn.commit()
        conn.close()
        return {"id": exists[0], "updated": True}
    cur = conn.execute(
        "INSERT INTO fx_currencies (code, name, note) VALUES (?,?,?)",
        (code, data.name or "", data.note or ""),
    )
    conn.commit()
    nid = cur.lastrowid
    conn.close()
    return {"id": nid}


@app.put("/api/fx/currencies/{id}")
async def update_fx_currency(id: int, data: FxCurrencyBody):
    code = (data.code or "").strip().upper()
    if not code:
        raise HTTPException(400, "Code required")
    conn = get_db()
    ensure_fx_currencies(conn)
    conn.execute(
        "UPDATE fx_currencies SET code=?, name=?, note=? WHERE id=?",
        (code, data.name or "", data.note or "", id),
    )
    conn.commit()
    conn.close()
    return {"id": id}


@app.delete("/api/fx/currencies/{id}")
async def delete_fx_currency(id: int):
    conn = get_db()
    ensure_fx_currencies(conn)
    conn.execute("DELETE FROM fx_currencies WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/fx/holdings")
async def list_fx_holdings():
    conn = get_db()
    ensure_personal_tables(conn)
    # prefer computed from transactions; fallback holdings table
    rows = [dict(r) for r in conn.execute(
        """SELECT currency,
                  SUM(CASE WHEN kind IN ('buy','deposit') THEN amount_fx
                           WHEN kind IN ('sell','withdraw') THEN -amount_fx ELSE 0 END) AS balance,
                  AVG(NULLIF(rate,0)) AS avg_rate
           FROM fx_transactions
           WHERE (deleted_at IS NULL OR deleted_at='')
           GROUP BY currency
           HAVING ABS(balance) > 0.0001
           ORDER BY currency"""
    ).fetchall()]
    conn.close()
    return rows




# ---------------------------------------------------------------------------
# HesabYar Ledger API (Taraz double-entry reports)
# ---------------------------------------------------------------------------


@app.post("/api/ledger/migrate")
async def ledger_migrate(force: int = 0):
    """Migrate existing purchases/sales from SQLite into Taraz ledger."""
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    key = _ledger_key()
    if force:
        _MIGRATED_USERS.discard(key)
        if key in _LEDGERS:
            del _LEDGERS[key]
    led = get_user_ledger(auto_migrate=True)
    # force re-run if requested
    if force:
        stats = _run_migration_for_current_user(led)
    else:
        stats = {"note": "auto-migrate runs on first access", "entries": len(led.engine.journal)}
    return {
        "ok": True,
        "user": key,
        "entries": len(led.engine.journal),
        "verify": led.verify_ledger(),
        "stats": stats if force else None,
        "cash": float(led.account_balance("1101")),
        "inventory": float(led.account_balance("1200")),
        "revenue": float(led.account_balance("4101")),
    }


@app.get("/api/ledger/status")
async def ledger_status():
    return {
        "available": TARAZ_AVAILABLE,
        "user": _ledger_key(),
        "version": "3.0.0-HesabYar",
    }


@app.get("/api/ledger/trial-balance")
async def ledger_trial_balance():
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    tb = led.trial_balance()
    # Convert Decimal to float for JSON
    return {k: float(v) for k, v in tb.items()}


@app.get("/api/ledger/balance-sheet")
async def ledger_balance_sheet():
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    bs = led.balance_sheet()
    def _conv(obj):
        if isinstance(obj, dict):
            return {k: _conv(v) for k, v in obj.items()}
        try:
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
        except Exception:
            pass
        return obj
    return _conv(bs)


@app.get("/api/ledger/income-statement")
async def ledger_income_statement():
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    if hasattr(led.engine, "generate_income_statement"):
        inc = led.engine.generate_income_statement()
        def _conv(obj):
            if isinstance(obj, dict):
                return {k: _conv(v) for k, v in obj.items()}
            try:
                from decimal import Decimal
                if isinstance(obj, Decimal):
                    return float(obj)
            except Exception:
                pass
            return obj
        return _conv(inc)
    return {"note": "income statement helper not available"}


@app.get("/api/ledger/verify")
async def ledger_verify():
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    ok = led.verify_ledger()
    return {"ok": bool(ok), "entries": len(led.engine.journal)}


@app.get("/api/ledger/coa")
async def ledger_coa():
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    tree = led.coa_tree()
    return {"tree": tree, "accounts": [
        {"code": c, "name": a.name, "type": a.type.value}
        for c, a in led.engine.accounts.items()
    ]}


@app.get("/api/ledger/entries")
async def ledger_entries(limit: int = 50):
    if not TARAZ_AVAILABLE:
        raise HTTPException(503, "Taraz ledger not available")
    led = get_user_ledger()
    entries = []
    for e in led.engine.journal[-limit:]:
        entries.append({
            "id": e.entry_id,
            "description": e.description,
            "date": e.date.isoformat() if hasattr(e.date, "isoformat") else str(e.date),
            "tags": e.tags,
            "hash": e.hash[:16] + "..." if e.hash else "",
            "postings": [
                {
                    "account": p.account_code,
                    "debit": float(p.debit),
                    "credit": float(p.credit),
                }
                for p in e.postings
            ],
        })
    return {"count": len(led.engine.journal), "entries": list(reversed(entries))}


@app.get("/manifest.webmanifest")
async def pwa_manifest():
    from fastapi.responses import Response
    p = Path(__file__).parent / "static" / "manifest.webmanifest"
    try:
        if p.exists():
            return Response(p.read_text(encoding="utf-8"), media_type="application/manifest+json")
    except Exception as e:
        print("manifest:", e)
    body = '{"name":"CluDari","short_name":"CluDari","start_url":"/","display":"standalone","background_color":"#0f172a","theme_color":"#0d9488"}'
    return Response(body, media_type="application/manifest+json")

@app.get("/sw.js")
async def pwa_sw():
    from fastapi.responses import Response
    p = Path(__file__).parent / "static" / "sw.js"
    try:
        if p.exists():
            return Response(p.read_text(encoding="utf-8"), media_type="application/javascript")
    except Exception as e:
        print("sw:", e)
    return Response("// CluDari no-op service worker\nself.addEventListener('fetch', function(){});", media_type="application/javascript")


# ─── Phase1 Mahak modules: returns, preinvoice, kardex, treasury ───

def ensure_phase1_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        product_name TEXT DEFAULT '',
        product_code TEXT DEFAULT '',
        qty REAL DEFAULT 0,
        unit_price REAL DEFAULT 0,
        move_type TEXT DEFAULT '',
        ref_type TEXT DEFAULT '',
        ref_id INTEGER DEFAULT 0,
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_type TEXT DEFAULT 'sale_return',
        number TEXT DEFAULT '',
        party TEXT DEFAULT '',
        date TEXT DEFAULT '',
        total REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        product_id INTEGER,
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS preinvoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT DEFAULT '',
        customer TEXT DEFAULT '',
        date TEXT DEFAULT '',
        total REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS preinvoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preinvoice_id INTEGER NOT NULL,
        product_id INTEGER,
        name TEXT DEFAULT '',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS treasury (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_type TEXT DEFAULT 'receive',
        method TEXT DEFAULT 'cash',
        party TEXT DEFAULT '',
        account TEXT DEFAULT '',
        amount REAL DEFAULT 0,
        date TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.commit()

def _apply_stock(conn, product_id, product_name, product_code, qty, unit_price, move_type, ref_type, ref_id, note=""):
    """qty positive = increase stock, negative = decrease"""
    if product_id:
        row = conn.execute("SELECT stock FROM products WHERE id=?", (product_id,)).fetchone()
        if row is not None:
            new_stock = float(row["stock"] or 0) + float(qty)
            conn.execute("UPDATE products SET stock=? WHERE id=?", (new_stock, product_id))
    conn.execute(
        """INSERT INTO stock_movements (product_id, product_name, product_code, qty, unit_price, move_type, ref_type, ref_id, note)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (product_id, product_name or "", product_code or "", qty, unit_price or 0, move_type, ref_type, ref_id, note or "")
    )

@app.get("/api/kardex")
async def get_kardex(product_id: int = 0, q: str = ""):
    conn = get_db(); ensure_phase1_tables(conn)
    if product_id:
        rows = conn.execute(
            "SELECT * FROM stock_movements WHERE product_id=? ORDER BY id DESC LIMIT 500",
            (product_id,)
        ).fetchall()
    elif q:
        like = f"%{q}%"
        rows = conn.execute(
            "SELECT * FROM stock_movements WHERE product_name LIKE ? OR product_code LIKE ? ORDER BY id DESC LIMIT 500",
            (like, like)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM stock_movements ORDER BY id DESC LIMIT 300").fetchall()
    # current stocks
    stocks = [dict(r) for r in conn.execute("SELECT id, code, name, stock, min_stock, buy_price, sell_price FROM products ORDER BY name LIMIT 500").fetchall()]
    result = [dict(r) for r in rows]
    conn.close()
    return {"movements": result, "stocks": stocks}

@app.get("/api/returns")
async def list_returns(return_type: str = ""):
    conn = get_db(); ensure_phase1_tables(conn)
    if return_type:
        rows = conn.execute("SELECT * FROM returns WHERE return_type=? ORDER BY id DESC", (return_type,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM returns ORDER BY id DESC").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        items = conn.execute("SELECT * FROM return_items WHERE return_id=?", (r["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        out.append(d)
    conn.close()
    return out

@app.post("/api/returns")
async def create_return(data: dict):
    conn = get_db(); ensure_phase1_tables(conn)
    rtype = data.get("return_type") or "sale_return"
    items = data.get("items") or []
    total = 0.0
    for it in items:
        total += float(it.get("quantity", 1) or 1) * float(it.get("unit_price", 0) or 0)
    nid = next_id(conn, "returns")
    number = data.get("number") or f"RET-{nid}"
    conn.execute(
        """INSERT INTO returns (id, return_type, number, party, date, total, notes)
           VALUES (?,?,?,?,?,?,?)""",
        (nid, rtype, number, data.get("party", ""), data.get("date", ""), total, data.get("notes", ""))
    )
    for it in items:
        qty = float(it.get("quantity", 1) or 1)
        price = float(it.get("unit_price", 0) or 0)
        pid = it.get("product_id")
        name = it.get("name") or ""
        code = it.get("code") or ""
        conn.execute(
            "INSERT INTO return_items (return_id, product_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?,?)",
            (nid, pid, name, qty, price, qty * price)
        )
        # sale_return increases stock; purchase_return decreases stock
        signed = qty if rtype == "sale_return" else -qty
        _apply_stock(conn, pid, name, code, signed, price, rtype, "return", nid, number)
    conn.commit(); conn.close()
    return {"id": nid, "message": "Return saved"}

@app.delete("/api/returns/{id}")
async def delete_return(id: int):
    conn = get_db(); ensure_phase1_tables(conn)
    conn.execute("DELETE FROM return_items WHERE return_id=?", (id,))
    conn.execute("DELETE FROM returns WHERE id=?", (id,))
    conn.commit(); conn.close()
    return {"message": "deleted"}

@app.get("/api/preinvoices")
async def list_preinvoices():
    conn = get_db(); ensure_phase1_tables(conn)
    rows = conn.execute("SELECT * FROM preinvoices ORDER BY id DESC").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        items = conn.execute("SELECT * FROM preinvoice_items WHERE preinvoice_id=?", (r["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        out.append(d)
    conn.close()
    return out

@app.post("/api/preinvoices")
async def create_preinvoice(data: dict):
    conn = get_db(); ensure_phase1_tables(conn)
    items = data.get("items") or []
    total = sum(float(it.get("quantity", 1) or 1) * float(it.get("unit_price", 0) or 0) for it in items)
    nid = next_id(conn, "preinvoices")
    number = data.get("number") or f"PRE-{nid}"
    conn.execute(
        """INSERT INTO preinvoices (id, number, customer, date, total, status, notes)
           VALUES (?,?,?,?,?,?,?)""",
        (nid, number, data.get("customer", ""), data.get("date", ""), total, data.get("status", "draft"), data.get("notes", ""))
    )
    for it in items:
        qty = float(it.get("quantity", 1) or 1)
        price = float(it.get("unit_price", 0) or 0)
        conn.execute(
            "INSERT INTO preinvoice_items (preinvoice_id, product_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?,?)",
            (nid, it.get("product_id"), it.get("name", ""), qty, price, qty * price)
        )
    conn.commit(); conn.close()
    return {"id": nid, "message": "Preinvoice saved"}

@app.post("/api/preinvoices/{id}/convert")
async def convert_preinvoice(id: int):
    """Convert preinvoice to a sale (stock decreases)."""
    conn = get_db(); ensure_phase1_tables(conn)
    pre = conn.execute("SELECT * FROM preinvoices WHERE id=?", (id,)).fetchone()
    if not pre:
        conn.close(); raise HTTPException(status_code=404, detail="not found")
    if pre["status"] == "converted":
        conn.close(); raise HTTPException(status_code=400, detail="already converted")
    items = conn.execute("SELECT * FROM preinvoice_items WHERE preinvoice_id=?", (id,)).fetchall()
    sid = next_id(conn, "sales")
    inv = f"SALE-{sid}"
    desc = f"از پیش‌فاکتور {pre['number']}"
    try:
        conn.execute(
            """INSERT INTO sales (id, date, customer, location, description, total, discount, payment_status, paid_amount, invoice_no)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (sid, pre["date"] or "", pre["customer"] or "", "", desc, float(pre["total"] or 0), 0, "unpaid", 0, inv)
        )
    except Exception as e:
        conn.close(); raise HTTPException(status_code=500, detail=f"sale insert: {e}")
    for it in items:
        qty = float(it["quantity"] or 1)
        price = float(it["unit_price"] or 0)
        try:
            conn.execute(
                "INSERT INTO sale_items (sale_id, name, quantity, unit_price, total) VALUES (?,?,?,?,?)",
                (sid, it["name"], qty, price, qty * price)
            )
        except Exception:
            pass
        _apply_stock(conn, it["product_id"], it["name"], "", -qty, price, "sale", "sale", sid, f"PRE-{id}")
    conn.execute("UPDATE preinvoices SET status='converted' WHERE id=?", (id,))
    conn.commit(); conn.close()
    return {"sale_id": sid, "message": "converted"}

@app.delete("/api/preinvoices/{id}")
async def delete_preinvoice(id: int):
    conn = get_db(); ensure_phase1_tables(conn)
    conn.execute("DELETE FROM preinvoice_items WHERE preinvoice_id=?", (id,))
    conn.execute("DELETE FROM preinvoices WHERE id=?", (id,))
    conn.commit(); conn.close()
    return {"message": "deleted"}

@app.get("/api/treasury")
async def list_treasury():
    conn = get_db(); ensure_phase1_tables(conn)
    rows = conn.execute("SELECT * FROM treasury ORDER BY id DESC LIMIT 500").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/treasury")
async def create_treasury(data: dict):
    conn = get_db(); ensure_phase1_tables(conn)
    nid = next_id(conn, "treasury")
    conn.execute(
        """INSERT INTO treasury (id, tx_type, method, party, account, amount, date, description)
           VALUES (?,?,?,?,?,?,?,?)""",
        (nid, data.get("tx_type", "receive"), data.get("method", "cash"),
         data.get("party", ""), data.get("account", ""),
         float(data.get("amount", 0) or 0), data.get("date", ""), data.get("description", ""))
    )
    conn.commit(); conn.close()
    return {"id": nid, "message": "saved"}

@app.delete("/api/treasury/{id}")
async def delete_treasury(id: int):
    conn = get_db(); ensure_phase1_tables(conn)
    conn.execute("DELETE FROM treasury WHERE id=?", (id,))
    conn.commit(); conn.close()
    return {"message": "deleted"}

@app.post("/api/checks/{id}/action")
async def check_action(id: int, data: dict):
    """Full check ops: deposit, clear, return, cancel, spend"""
    conn = get_db(); ensure_checks_table(conn)
    action = (data.get("action") or "").strip()
    status_map = {
        "deposit": "deposited",
        "clear": "cleared",
        "return": "returned",
        "cancel": "cancelled",
        "spend": "spent",
        "pending": "pending",
    }
    if action not in status_map:
        conn.close(); raise HTTPException(status_code=400, detail="invalid action")
    cur = conn.execute("UPDATE checks SET status=? WHERE id=?", (status_map[action], id))
    if cur.rowcount == 0:
        conn.close(); raise HTTPException(status_code=404, detail="not found")
    conn.commit(); conn.close()
    return {"message": "ok", "status": status_map[action]}


# ─── Phase2: Chart of accounts, journal, trial balance, P&L ───

DEFAULT_COA = [
    # code, name, type, parent
    ("1", "دارایی‌ها", "asset", ""),
    ("11", "دارایی‌های جاری", "asset", "1"),
    ("1101", "صندوق", "asset", "11"),
    ("1102", "بانک", "asset", "11"),
    ("1103", "حساب‌های دریافتنی", "asset", "11"),
    ("1104", "موجودی کالا", "asset", "11"),
    ("1105", "اسناد دریافتنی (چک)", "asset", "11"),
    ("2", "بدهی‌ها", "liability", ""),
    ("21", "بدهی‌های جاری", "liability", "2"),
    ("2101", "حساب‌های پرداختنی", "liability", "21"),
    ("2102", "اسناد پرداختنی (چک)", "liability", "21"),
    ("3", "حقوق صاحبان سرمایه", "equity", ""),
    ("3101", "سرمایه", "equity", "3"),
    ("3102", "سود (زیان) انباشته", "equity", "3"),
    ("4", "درآمدها", "income", ""),
    ("4101", "فروش کالا", "income", "4"),
    ("4102", "سایر درآمدها", "income", "4"),
    ("5", "هزینه‌ها", "expense", ""),
    ("5101", "بهای تمام‌شده کالای فروش‌رفته", "expense", "5"),
    ("5102", "هزینه عملیاتی", "expense", "5"),
    ("5103", "هزینه اداری", "expense", "5"),
]

def ensure_phase2_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS chart_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        account_type TEXT DEFAULT 'asset',
        parent_code TEXT DEFAULT '',
        is_leaf INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT DEFAULT '',
        date TEXT DEFAULT '',
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'posted',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS journal_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        account_code TEXT NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        description TEXT DEFAULT ''
    )""")
    conn.commit()
    n = conn.execute("SELECT COUNT(*) AS c FROM chart_accounts").fetchone()["c"]
    if not n:
        for code, name, atype, parent in DEFAULT_COA:
            is_leaf = 1 if len(code) >= 4 else 0
            conn.execute(
                "INSERT INTO chart_accounts (code, name, account_type, parent_code, is_leaf) VALUES (?,?,?,?,?)",
                (code, name, atype, parent, is_leaf)
            )
        conn.commit()

@app.get("/api/chart-accounts")
async def list_chart_accounts(q: str = ""):
    conn = get_db(); ensure_phase2_tables(conn)
    if q:
        like = f"%{q}%"
        rows = conn.execute(
            "SELECT * FROM chart_accounts WHERE code LIKE ? OR name LIKE ? ORDER BY code",
            (like, like)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM chart_accounts ORDER BY code").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/chart-accounts")
async def create_chart_account(data: dict):
    conn = get_db(); ensure_phase2_tables(conn)
    code = str(data.get("code") or "").strip()
    name = str(data.get("name") or "").strip()
    if not code or not name:
        conn.close(); raise HTTPException(status_code=400, detail="code and name required")
    try:
        conn.execute(
            """INSERT INTO chart_accounts (code, name, account_type, parent_code, is_leaf, active)
               VALUES (?,?,?,?,?,1)""",
            (code, name, data.get("account_type", "asset"), data.get("parent_code", ""),
             1 if data.get("is_leaf", 1) else 0)
        )
        conn.commit()
    except Exception as e:
        conn.close(); raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"message": "ok"}

@app.put("/api/chart-accounts/{code}")
async def update_chart_account(code: str, data: dict):
    conn = get_db(); ensure_phase2_tables(conn)
    conn.execute(
        "UPDATE chart_accounts SET name=?, account_type=?, parent_code=?, active=? WHERE code=?",
        (data.get("name", ""), data.get("account_type", "asset"),
         data.get("parent_code", ""), 1 if data.get("active", 1) else 0, code)
    )
    conn.commit(); conn.close()
    return {"message": "ok"}

@app.delete("/api/chart-accounts/{code}")
async def delete_chart_account(code: str):
    conn = get_db(); ensure_phase2_tables(conn)
    used = conn.execute("SELECT COUNT(*) AS c FROM journal_lines WHERE account_code=?", (code,)).fetchone()["c"]
    if used:
        conn.close(); raise HTTPException(status_code=400, detail="حساب در اسناد استفاده شده")
    conn.execute("DELETE FROM chart_accounts WHERE code=?", (code,))
    conn.commit(); conn.close()
    return {"message": "ok"}

@app.get("/api/journals")
async def list_journals():
    conn = get_db(); ensure_phase2_tables(conn)
    rows = conn.execute("SELECT * FROM journal_entries ORDER BY id DESC LIMIT 300").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        lines = conn.execute("SELECT * FROM journal_lines WHERE entry_id=?", (r["id"],)).fetchall()
        d["lines"] = [dict(x) for x in lines]
        d["total_debit"] = sum(float(x["debit"] or 0) for x in lines)
        d["total_credit"] = sum(float(x["credit"] or 0) for x in lines)
        out.append(d)
    conn.close()
    return out

@app.post("/api/journals")
async def create_journal(data: dict):
    conn = get_db(); ensure_phase2_tables(conn)
    lines = data.get("lines") or []
    if len(lines) < 2:
        conn.close(); raise HTTPException(status_code=400, detail="حداقل دو ردیف لازم است")
    td = sum(float(x.get("debit", 0) or 0) for x in lines)
    tc = sum(float(x.get("credit", 0) or 0) for x in lines)
    if abs(td - tc) > 0.01:
        conn.close(); raise HTTPException(status_code=400, detail=f"سند تراز نیست بدهکار={td} بستانکار={tc}")
    nid = next_id(conn, "journal_entries")
    number = data.get("number") or f"JE-{nid}"
    conn.execute(
        "INSERT INTO journal_entries (id, number, date, description, status) VALUES (?,?,?,?,?)",
        (nid, number, data.get("date", ""), data.get("description", ""), "posted")
    )
    for ln in lines:
        code = str(ln.get("account_code") or "").strip()
        if not code:
            continue
        acc = conn.execute("SELECT code FROM chart_accounts WHERE code=?", (code,)).fetchone()
        if not acc:
            conn.close(); raise HTTPException(status_code=400, detail=f"حساب {code} یافت نشد")
        conn.execute(
            "INSERT INTO journal_lines (entry_id, account_code, debit, credit, description) VALUES (?,?,?,?,?)",
            (nid, code, float(ln.get("debit", 0) or 0), float(ln.get("credit", 0) or 0), ln.get("description", ""))
        )
    conn.commit(); conn.close()
    return {"id": nid, "message": "سند ثبت شد"}

@app.delete("/api/journals/{id}")
async def delete_journal(id: int):
    conn = get_db(); ensure_phase2_tables(conn)
    conn.execute("DELETE FROM journal_lines WHERE entry_id=?", (id,))
    conn.execute("DELETE FROM journal_entries WHERE id=?", (id,))
    conn.commit(); conn.close()
    return {"message": "ok"}

@app.get("/api/reports/trial-balance")
async def trial_balance():
    conn = get_db(); ensure_phase2_tables(conn)
    rows = conn.execute("""
        SELECT a.code, a.name, a.account_type,
               COALESCE(SUM(l.debit),0) AS debit,
               COALESCE(SUM(l.credit),0) AS credit
        FROM chart_accounts a
        LEFT JOIN journal_lines l ON l.account_code = a.code
        WHERE a.active=1
        GROUP BY a.code, a.name, a.account_type
        ORDER BY a.code
    """).fetchall()
    out = []
    td = tc = 0.0
    for r in rows:
        d = float(r["debit"] or 0)
        c = float(r["credit"] or 0)
        if d == 0 and c == 0:
            continue
        bal_d = max(d - c, 0)
        bal_c = max(c - d, 0)
        td += bal_d; tc += bal_c
        out.append({
            "code": r["code"], "name": r["name"], "type": r["account_type"],
            "debit": d, "credit": c, "balance_debit": bal_d, "balance_credit": bal_c
        })
    conn.close()
    return {"rows": out, "total_debit": td, "total_credit": tc}

@app.get("/api/reports/income-statement")
async def income_statement():
    conn = get_db(); ensure_phase2_tables(conn)
    rows = conn.execute("""
        SELECT a.code, a.name, a.account_type,
               COALESCE(SUM(l.debit),0) AS debit,
               COALESCE(SUM(l.credit),0) AS credit
        FROM chart_accounts a
        LEFT JOIN journal_lines l ON l.account_code = a.code
        WHERE a.account_type IN ('income','expense') AND a.active=1
        GROUP BY a.code, a.name, a.account_type
        ORDER BY a.code
    """).fetchall()
    income = expense = 0.0
    income_rows, expense_rows = [], []
    for r in rows:
        d = float(r["debit"] or 0); c = float(r["credit"] or 0)
        if r["account_type"] == "income":
            amt = c - d
            income += amt
            if amt != 0:
                income_rows.append({"code": r["code"], "name": r["name"], "amount": amt})
        else:
            amt = d - c
            expense += amt
            if amt != 0:
                expense_rows.append({"code": r["code"], "name": r["name"], "amount": amt})
    conn.close()
    return {
        "income": income_rows, "expense": expense_rows,
        "total_income": income, "total_expense": expense, "net": income - expense
    }

@app.get("/api/reports/balance-sheet")
async def balance_sheet():
    conn = get_db(); ensure_phase2_tables(conn)
    rows = conn.execute("""
        SELECT a.code, a.name, a.account_type,
               COALESCE(SUM(l.debit),0) AS debit,
               COALESCE(SUM(l.credit),0) AS credit
        FROM chart_accounts a
        LEFT JOIN journal_lines l ON l.account_code = a.code
        WHERE a.account_type IN ('asset','liability','equity') AND a.active=1
        GROUP BY a.code, a.name, a.account_type
        ORDER BY a.code
    """).fetchall()
    assets = liabilities = equity = 0.0
    a_rows, l_rows, e_rows = [], [], []
    for r in rows:
        d = float(r["debit"] or 0); c = float(r["credit"] or 0)
        if r["account_type"] == "asset":
            amt = d - c
            assets += amt
            if amt != 0: a_rows.append({"code": r["code"], "name": r["name"], "amount": amt})
        elif r["account_type"] == "liability":
            amt = c - d
            liabilities += amt
            if amt != 0: l_rows.append({"code": r["code"], "name": r["name"], "amount": amt})
        else:
            amt = c - d
            equity += amt
            if amt != 0: e_rows.append({"code": r["code"], "name": r["name"], "amount": amt})
    # fold net income into equity for display
    inc = await income_statement()
    net = float(inc.get("net") or 0)
    equity += net
    if net != 0:
        e_rows.append({"code": "NET", "name": "سود (زیان) دوره", "amount": net})
    conn.close()
    return {
        "assets": a_rows, "liabilities": l_rows, "equity": e_rows,
        "total_assets": assets, "total_liabilities": liabilities, "total_equity": equity
    }


# ─── Phase3: multi-warehouse, barcode, credit limit, price levels ───

def ensure_phase3_tables(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        active INTEGER DEFAULT 1
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS warehouse_stock (
        warehouse_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty REAL DEFAULT 0,
        PRIMARY KEY (warehouse_id, product_id)
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS warehouse_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT DEFAULT '',
        from_wh INTEGER,
        to_wh INTEGER,
        date TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT DEFAULT '',
        qty REAL DEFAULT 0
    )""")
    # migrate products: barcode + price levels
    cols = {r[1] for r in conn.execute("PRAGMA table_info(products)").fetchall()}
    for col, decl in [
        ("barcode", "TEXT DEFAULT ''"),
        ("price2", "REAL DEFAULT 0"),
        ("price3", "REAL DEFAULT 0"),
        ("price4", "REAL DEFAULT 0"),
    ]:
        if col not in cols:
            try: conn.execute(f"ALTER TABLE products ADD COLUMN {col} {decl}")
            except Exception: pass
    # migrate customers: credit_limit
    ccols = {r[1] for r in conn.execute("PRAGMA table_info(customers)").fetchall()}
    if "credit_limit" not in ccols:
        try: conn.execute("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 0")
        except Exception: pass
    if "price_level" not in ccols:
        try: conn.execute("ALTER TABLE customers ADD COLUMN price_level INTEGER DEFAULT 1")
        except Exception: pass
    conn.commit()
    n = conn.execute("SELECT COUNT(*) AS c FROM warehouses").fetchone()["c"]
    if not n:
        conn.execute("INSERT INTO warehouses (code, name) VALUES ('MAIN', 'انبار اصلی')")
        conn.execute("INSERT INTO warehouses (code, name) VALUES ('WH2', 'انبار فرعی')")
        conn.commit()

def _wh_adjust(conn, warehouse_id, product_id, qty_delta):
    if not warehouse_id or not product_id:
        return
    row = conn.execute(
        "SELECT qty FROM warehouse_stock WHERE warehouse_id=? AND product_id=?",
        (warehouse_id, product_id)
    ).fetchone()
    if row:
        conn.execute(
            "UPDATE warehouse_stock SET qty=? WHERE warehouse_id=? AND product_id=?",
            (float(row["qty"] or 0) + float(qty_delta), warehouse_id, product_id)
        )
    else:
        conn.execute(
            "INSERT INTO warehouse_stock (warehouse_id, product_id, qty) VALUES (?,?,?)",
            (warehouse_id, product_id, float(qty_delta))
        )

@app.get("/api/warehouses")
async def list_warehouses():
    conn = get_db(); ensure_phase3_tables(conn)
    rows = conn.execute("SELECT * FROM warehouses WHERE active=1 ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/warehouses")
async def create_warehouse(data: dict):
    conn = get_db(); ensure_phase3_tables(conn)
    code = str(data.get("code") or "").strip()
    name = str(data.get("name") or "").strip()
    if not code or not name:
        conn.close(); raise HTTPException(status_code=400, detail="code/name required")
    try:
        conn.execute(
            "INSERT INTO warehouses (code, name, address) VALUES (?,?,?)",
            (code, name, data.get("address", ""))
        )
        conn.commit()
    except Exception as e:
        conn.close(); raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"message": "ok"}

@app.get("/api/warehouses/{id}/stock")
async def warehouse_stock(id: int):
    conn = get_db(); ensure_phase3_tables(conn)
    rows = conn.execute("""
        SELECT ws.qty, p.id AS product_id, p.code, p.name, p.barcode
        FROM warehouse_stock ws
        JOIN products p ON p.id = ws.product_id
        WHERE ws.warehouse_id=? AND ws.qty != 0
        ORDER BY p.name
    """, (id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/transfers")
async def list_transfers():
    conn = get_db(); ensure_phase3_tables(conn)
    rows = conn.execute("""
        SELECT t.*, wf.name AS from_name, wt.name AS to_name
        FROM warehouse_transfers t
        LEFT JOIN warehouses wf ON wf.id = t.from_wh
        LEFT JOIN warehouses wt ON wt.id = t.to_wh
        ORDER BY t.id DESC LIMIT 200
    """).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        items = conn.execute("SELECT * FROM warehouse_transfer_items WHERE transfer_id=?", (r["id"],)).fetchall()
        d["items"] = [dict(i) for i in items]
        out.append(d)
    conn.close()
    return out

@app.post("/api/transfers")
async def create_transfer(data: dict):
    conn = get_db(); ensure_phase3_tables(conn)
    from_wh = int(data.get("from_wh") or 0)
    to_wh = int(data.get("to_wh") or 0)
    if not from_wh or not to_wh or from_wh == to_wh:
        conn.close(); raise HTTPException(status_code=400, detail="انبار مبدأ و مقصد نامعتبر")
    items = data.get("items") or []
    if not items:
        conn.close(); raise HTTPException(status_code=400, detail="اقلام خالی")
    nid = next_id(conn, "warehouse_transfers")
    number = data.get("number") or f"TR-{nid}"
    conn.execute(
        "INSERT INTO warehouse_transfers (id, number, from_wh, to_wh, date, notes) VALUES (?,?,?,?,?,?)",
        (nid, number, from_wh, to_wh, data.get("date", ""), data.get("notes", ""))
    )
    for it in items:
        pid = it.get("product_id")
        name = it.get("name") or ""
        qty = float(it.get("qty", 0) or 0)
        if qty <= 0:
            continue
        if not pid and name:
            pr = conn.execute("SELECT id FROM products WHERE name=? LIMIT 1", (name,)).fetchone()
            if pr: pid = pr["id"]
        conn.execute(
            "INSERT INTO warehouse_transfer_items (transfer_id, product_id, product_name, qty) VALUES (?,?,?,?)",
            (nid, pid, name, qty)
        )
        _wh_adjust(conn, from_wh, pid, -qty)
        _wh_adjust(conn, to_wh, pid, qty)
    conn.commit(); conn.close()
    return {"id": nid, "message": "حواله ثبت شد"}

@app.get("/api/products/by-barcode/{code}")
async def product_by_barcode(code: str):
    conn = get_db(); ensure_phase3_tables(conn)
    row = conn.execute(
        "SELECT * FROM products WHERE barcode=? OR code=? LIMIT 1",
        (code, code)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="کالا یافت نشد")
    return dict(row)

@app.get("/api/customers/{id}/credit")
async def customer_credit(id: int):
    """Return credit limit and simple outstanding estimate from sales."""
    conn = get_db(); ensure_phase3_tables(conn)
    cust = conn.execute("SELECT * FROM customers WHERE id=?", (id,)).fetchone()
    if not cust:
        conn.close(); raise HTTPException(status_code=404, detail="not found")
    # outstanding: sales total - paid for this customer name
    name = cust["name"]
    try:
        rows = conn.execute(
            "SELECT COALESCE(SUM(total),0) AS t, COALESCE(SUM(paid_amount),0) AS p FROM sales WHERE customer=?",
            (name,)
        ).fetchone()
        outstanding = float(rows["t"] or 0) - float(rows["p"] or 0)
    except Exception:
        outstanding = 0.0
    limit = float(cust["credit_limit"] if "credit_limit" in cust.keys() else 0) if cust else 0
    level = int(cust["price_level"] if "price_level" in cust.keys() else 1) if cust else 1
    conn.close()
    return {
        "customer_id": id, "name": name,
        "credit_limit": limit, "outstanding": outstanding,
        "available": limit - outstanding if limit else None,
        "price_level": level,
        "over_limit": bool(limit and outstanding > limit)
    }

@app.put("/api/customers/{id}/credit")
async def set_customer_credit(id: int, data: dict):
    conn = get_db(); ensure_phase3_tables(conn)
    conn.execute(
        "UPDATE customers SET credit_limit=?, price_level=? WHERE id=?",
        (float(data.get("credit_limit", 0) or 0), int(data.get("price_level", 1) or 1), id)
    )
    conn.commit(); conn.close()
    return {"message": "ok"}

@app.put("/api/products/{id}/pricing")
async def set_product_pricing(id: int, data: dict):
    conn = get_db(); ensure_phase3_tables(conn)
    conn.execute(
        """UPDATE products SET barcode=?, sell_price=?, price2=?, price3=?, price4=? WHERE id=?""",
        (
            data.get("barcode", ""),
            float(data.get("sell_price", 0) or 0),
            float(data.get("price2", 0) or 0),
            float(data.get("price3", 0) or 0),
            float(data.get("price4", 0) or 0),
            id
        )
    )
    conn.commit(); conn.close()
    return {"message": "ok"}

@app.get("/api/products/{id}/price")
async def product_price_for_level(id: int, level: int = 1):
    conn = get_db(); ensure_phase3_tables(conn)
    p = conn.execute("SELECT * FROM products WHERE id=?", (id,)).fetchone()
    conn.close()
    if not p:
        raise HTTPException(status_code=404, detail="not found")
    d = dict(p)
    prices = {
        1: float(d.get("sell_price") or 0),
        2: float(d.get("price2") or 0) or float(d.get("sell_price") or 0),
        3: float(d.get("price3") or 0) or float(d.get("sell_price") or 0),
        4: float(d.get("price4") or 0) or float(d.get("sell_price") or 0),
    }
    return {"product_id": id, "level": level, "price": prices.get(level, prices[1]), "prices": prices}


