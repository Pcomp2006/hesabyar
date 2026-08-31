"""
CluDari server only — used by Electron shell
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

import uvicorn
import server

if __name__ == "__main__":
    host = os.environ.get("CLU_HOST", "127.0.0.1")
    port = int(os.environ.get("CLU_PORT", "8000"))
    uvicorn.run(server.app, host=host, port=port, log_level="warning")
