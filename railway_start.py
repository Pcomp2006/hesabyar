"""Railway/cloud bootstrap for HesabYar.

The application keeps its existing SQLite architecture, but moves writable
state onto Railway's persistent Volume at /data. On the first deployment,
seed databases bundled in the image are copied into that volume only when the
corresponding persistent files do not already exist.
"""
import os
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
STORAGE = Path(os.environ.get("STORAGE_DIR", "/data"))
STORAGE.mkdir(parents=True, exist_ok=True)

# Keep all mutable application state on the persistent volume.
os.environ.setdefault("STORAGE_DIR", str(STORAGE))
os.environ.setdefault("DB_PATH", str(STORAGE / "cludari.db"))
os.environ.setdefault("AUTH_DB", str(STORAGE / "auth.db"))
os.environ.setdefault("DATA_DIR", str(STORAGE / "data"))

data_dir = STORAGE / "data"
data_dir.mkdir(parents=True, exist_ok=True)

# First boot: seed the volume from the databases shipped with v69.
for name in ("cludari.db", "auth.db"):
    src = BASE / name
    dst = STORAGE / name
    if src.exists() and not dst.exists():
        shutil.copy2(src, dst)

src_data = BASE / "data"
if src_data.exists():
    for src in src_data.glob("*.db"):
        dst = data_dir / src.name
        if not dst.exists():
            shutil.copy2(src, dst)

# Importing server performs schema/auth bootstrap against the volume paths.
import server  # noqa: E402, F401

port = os.environ.get("PORT", "8000")
os.execvp("uvicorn", ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", port, "--proxy-headers"])
