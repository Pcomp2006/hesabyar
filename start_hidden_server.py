"""CluDari server — no console window. Logs to server-hidden.log"""
import os
import sys
import traceback

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)
if BASE not in sys.path:
    sys.path.insert(0, BASE)

LOG = os.path.join(BASE, "server-hidden.log")

os.environ["CLU_SERVER_ONLY"] = "1"
os.environ["CLU_NO_WINDOW"] = "1"
os.environ["CLU_HOST"] = os.environ.get("CLU_HOST", "0.0.0.0")

if sys.platform == "win32":
    try:
        import ctypes
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)
    except Exception:
        pass


class _Tee:
    """File-like stdout/stderr for pythonw (must support isatty for uvicorn)."""

    def __init__(self, path):
        self.path = path
        self.encoding = "utf-8"
        self.name = path

    def write(self, data):
        if not data:
            return 0
        try:
            with open(self.path, "a", encoding="utf-8", errors="replace") as f:
                f.write(data if isinstance(data, str) else data.decode("utf-8", "replace"))
        except Exception:
            pass
        return len(data) if hasattr(data, "__len__") else 0

    def flush(self):
        pass

    def isatty(self):
        return False

    def fileno(self):
        raise OSError("no fileno")

    def readable(self):
        return False

    def writable(self):
        return True

    def seekable(self):
        return False


sys.stdout = _Tee(LOG)
sys.stderr = _Tee(LOG)

def log(msg):
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            from datetime import datetime
            f.write("%s %s\n" % (datetime.now().isoformat(timespec="seconds"), msg))
    except Exception:
        pass

log("=== start_hidden_server begin ===")
log("python=%s" % sys.executable)
try:
    import main as cludari_main
    log("calling main()")
    cludari_main.main()
    log("main() returned")
except Exception:
    log("FATAL:\n" + traceback.format_exc())
    raise
