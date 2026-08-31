#!/usr/bin/env python3
"""
مهاجرت خرید و فروش‌های موجود در دیتابیس به دفتر دوبل‌انتری Taraz

استفاده:
  python migrate_to_ledger.py              # کاربر پیش‌فرض (Parham.db اگر باشد)
  python migrate_to_ledger.py Parham       # دیتابیس خاص
  python migrate_to_ledger.py --all        # همه کاربران

بعد از اجرا، نتیجه در حافظه ledger همان فرآیند است.
برای دیدن در سرور، از API زیر استفاده کنید (بعد از لاگین):
  POST /api/ledger/migrate
"""
from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

from taraz_bridge import HesabYarLedger


def _parse_date(s: str):
    if not s:
        return datetime.now()
    s = str(s).strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s[:19], fmt)
        except ValueError:
            continue
    # possible Jalali-looking string – keep as now, description still has original
    return datetime.now()


def migrate_db(db_path: Path, username: str = "default") -> dict:
    if not db_path.exists():
        return {"ok": False, "error": f"DB not found: {db_path}"}

    led = HesabYarLedger(base_currency="IRR")
    led.ensure_default_coa()

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    stats = {
        "username": username,
        "db": str(db_path.name),
        "purchases_posted": 0,
        "purchases_skipped": 0,
        "sales_posted": 0,
        "sales_skipped": 0,
        "errors": [],
    }

    # ---- Purchases (skip soft-deleted) ----
    try:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(purchases)")}
        has_deleted = "deleted_at" in cols
        sql = "SELECT * FROM purchases"
        if has_deleted:
            sql += " WHERE deleted_at IS NULL OR deleted_at = ''"
        sql += " ORDER BY id"
        for row in conn.execute(sql):
            d = dict(row)
            total = float(d.get("total") or 0)
            if total <= 0:
                stats["purchases_skipped"] += 1
                continue
            pid = d.get("id")
            desc = (d.get("description") or d.get("seller") or f"خرید #{pid}").strip()
            currency = (d.get("currency") or "IRT").strip() or "IRT"
            try:
                led.post_purchase(
                    entry_id=f"MIG-PUR-{pid}",
                    amount=total,
                    expense_or_asset="5201",
                    cash_or_ap="1101",
                    description=desc,
                    date=_parse_date(d.get("date") or ""),
                    tags=["migrated", "purchase", currency],
                )
                stats["purchases_posted"] += 1
            except Exception as e:
                stats["errors"].append(f"purchase {pid}: {e}")
                stats["purchases_skipped"] += 1
    except Exception as e:
        stats["errors"].append(f"purchases table: {e}")

    # ---- Sales (skip soft-deleted) ----
    try:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(sales)")}
        has_deleted = "deleted_at" in cols
        sql = "SELECT * FROM sales"
        if has_deleted:
            sql += " WHERE deleted_at IS NULL OR deleted_at = ''"
        sql += " ORDER BY id"
        for row in conn.execute(sql):
            d = dict(row)
            total = float(d.get("total") or 0)
            if total <= 0:
                stats["sales_skipped"] += 1
                continue
            sid = d.get("id")
            desc = (d.get("description") or d.get("customer") or f"فروش #{sid}").strip()
            currency = (d.get("currency") or "IRT").strip() or "IRT"
            try:
                led.post_sale(
                    entry_id=f"MIG-SAL-{sid}",
                    amount=total,
                    cash_or_ar="1101",
                    revenue="4101",
                    description=desc,
                    date=_parse_date(d.get("date") or ""),
                    tags=["migrated", "sale", currency],
                )
                stats["sales_posted"] += 1
            except Exception as e:
                stats["errors"].append(f"sale {sid}: {e}")
                stats["sales_skipped"] += 1
    except Exception as e:
        stats["errors"].append(f"sales table: {e}")

    conn.close()

    stats["journal_entries"] = len(led.engine.journal)
    stats["verify_ok"] = led.verify_ledger()
    try:
        bs = led.balance_sheet()
        stats["total_assets"] = float(bs.get("total_assets") or 0)
        stats["cash_balance"] = float(led.account_balance("1101"))
        stats["inventory_balance"] = float(led.account_balance("1200"))
        stats["revenue_balance"] = float(led.account_balance("4101"))
    except Exception as e:
        stats["errors"].append(f"report: {e}")

    # Attach ledger to module-level cache so server can reuse if same process
    stats["_ledger"] = led
    return stats


def main():
    parser = argparse.ArgumentParser(description="Migrate purchases/sales to Taraz ledger")
    parser.add_argument("user", nargs="?", default="Parham", help="Username or db name")
    parser.add_argument("--all", action="store_true", help="Migrate all user DBs")
    args = parser.parse_args()

    data_dir = BASE / "data"
    results = []

    if args.all:
        dbs = list(data_dir.glob("*.db"))
        if (BASE / "cludari.db").exists():
            dbs.append(BASE / "cludari.db")
        for db in dbs:
            print(f"\n>>> Migrating {db.name} ...")
            st = migrate_db(db, username=db.stem)
            results.append(st)
            _print_stats(st)
    else:
        user = args.user
        candidates = [
            data_dir / f"{user}.db",
            data_dir / user,
            BASE / "cludari.db",
            BASE / f"{user}.db",
        ]
        db_path = next((c for c in candidates if c.exists()), None)
        if not db_path:
            print(f"Database not found for user '{user}'. Tried:", [str(c) for c in candidates])
            sys.exit(1)
        print(f">>> Migrating {db_path} ...")
        st = migrate_db(db_path, username=user)
        results.append(st)
        _print_stats(st)

    print("\nDone.")
    return results


def _print_stats(st: dict):
    print(f"  User: {st.get('username')}  DB: {st.get('db')}")
    print(f"  Purchases posted: {st.get('purchases_posted')}  skipped: {st.get('purchases_skipped')}")
    print(f"  Sales posted:     {st.get('sales_posted')}  skipped: {st.get('sales_skipped')}")
    print(f"  Journal entries:  {st.get('journal_entries')}")
    print(f"  Cash: {st.get('cash_balance', 0):,.0f}   Inventory: {st.get('inventory_balance', 0):,.0f}   Revenue: {st.get('revenue_balance', 0):,.0f}")
    print(f"  Total assets: {st.get('total_assets', 0):,.0f}   Verify: {st.get('verify_ok')}")
    if st.get("errors"):
        print("  Errors:")
        for e in st["errors"][:10]:
            print("   -", e)


if __name__ == "__main__":
    main()
