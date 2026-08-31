"""
CluDari - Personal Accounting
Desktop app for tracking purchases
"""

import sys
import os
import time
import subprocess
import threading
import urllib.request
import socket
from datetime import datetime

# For Windows, we'll use a different approach - ensure print statements work
# by avoiding sys.stdout replacement and using try-except blocks
pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "cludari.db")
def _load_server_config():
    """Load host/port from env or cludari_server.ini next to main.py."""
    port = int(os.environ.get("CLU_PORT", "8000") or "8000")
    # Default 0.0.0.0 = reachable from phone on same Wi-Fi
    host = os.environ.get("CLU_HOST", "0.0.0.0") or "0.0.0.0"
    ini = os.path.join(BASE_DIR, "cludari_server.ini")
    if os.path.exists(ini):
        try:
            with open(ini, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or line.startswith(";"):
                        continue
                    if "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k, v = k.strip().lower(), v.strip()
                    if k in ("port", "clu_port"):
                        port = int(v)
                    elif k in ("host", "clu_host"):
                        host = v
        except Exception as e:
            print("Config read error:", e)
    return host, port

HOST, PORT = _load_server_config()
# Desktop window always uses localhost
LOCAL_URL = f"http://127.0.0.1:{PORT}"
URL = LOCAL_URL
PID_FILE = os.path.join(BASE_DIR, ".cludari.pid")


def get_lan_ips():
    """Return local network IPv4 addresses (for phone access)."""
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127."):
                if ip not in ips:
                    ips.append(ip)
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.3)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127.") and ip not in ips:
            ips.insert(0, ip)
    except Exception:
        pass
    return ips


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def check_already_running():
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                old_pid = int(f.read().strip())
            if sys.platform == 'win32':
                result = subprocess.run(['tasklist', '/FI', f'PID eq {old_pid}'],
                                       capture_output=True, text=True)
                if str(old_pid) in result.stdout:
                    return True
            else:
                os.kill(old_pid, 0)
                return True
        except:
            pass
        try:
            os.remove(PID_FILE)
        except:
            pass
    return False


def cleanup_pid():
    try:
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
    except:
        pass


def set_windows_app_id(app_id="CluDari.Accounting"):
    """Stop Windows from using generic Python taskbar icon."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(app_id)
    except Exception:
        pass


def set_windows_icon(hwnd, ico_path):
    """Set taskbar/titlebar icon on Windows using Win32 API."""
    if sys.platform != "win32" or not ico_path or not os.path.exists(ico_path):
        return False
    try:
        import ctypes
        user32 = ctypes.windll.user32
        IMAGE_ICON = 1
        LR_LOADFROMFILE = 0x0010
        WM_SETICON = 0x0080
        ICON_SMALL = 0
        ICON_BIG = 1
        ico_abs = os.path.abspath(ico_path)
        hicon = user32.LoadImageW(None, ico_abs, IMAGE_ICON, 0, 0, LR_LOADFROMFILE)
        if not hicon:
            # try 32x32 / 16x16 explicit
            hicon = user32.LoadImageW(None, ico_abs, IMAGE_ICON, 32, 32, LR_LOADFROMFILE)
        if hicon and hwnd:
            user32.SendMessageW(int(hwnd), WM_SETICON, ICON_SMALL, hicon)
            user32.SendMessageW(int(hwnd), WM_SETICON, ICON_BIG, hicon)
            return True
    except Exception as e:
        print("Icon set error:", e)
    return False


def apply_window_icon(ico_path, titles=None):
    """Find CluDari window HWND and apply .ico (titlebar + taskbar)."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        import time as _t
        user32 = ctypes.windll.user32
        _t.sleep(0.4)
        titles = titles or [
            "CluDari — سرور مرکزی",
            "CluDari - Personal Accounting",
            "CluDari",
        ]
        hwnd = None
        for t in titles:
            hwnd = user32.FindWindowW(None, t)
            if hwnd:
                break
        if not hwnd:
            hwnd = user32.GetForegroundWindow()
        if hwnd and set_windows_icon(hwnd, ico_path):
            print("[*] Taskbar/title icon applied")
        else:
            print("[!] Icon HWND not found or load failed")
    except Exception as e:
        print("Icon apply:", e)

def main():
    set_windows_app_id()
    # Simple print to test encoding - use ASCII only to avoid Unicode issues on Windows
    print("CluDari - Personal Accounting")
    print("========================")
    print("Host=%s Port=%s" % (HOST, PORT))

    if check_already_running():
        print("App is already running!")
        print("Close the other CluDari window, or delete .cludari.pid and free port 8000.")
        try:
            input("Press Enter to close...")
        except Exception:
            time.sleep(8)
        return

    if is_port_in_use(PORT):
        print(f"Port {PORT} is already in use!")
        print("Another program (or old CluDari) is using this port.")
        print("Close it, or set CLU_PORT=8001 and run again.")
        try:
            input("Press Enter to close...")
        except Exception:
            time.sleep(8)
        return

    try:
        with open(PID_FILE, 'w') as f:
            f.write(str(os.getpid()))
    except:
        pass

    server_error = {}

    def run_server():
        try:
            if BASE_DIR not in sys.path:
                sys.path.insert(0, BASE_DIR)
            print("[*] Loading app modules (may take a few seconds)...")
            import server as server_module
            print("[*] Modules loaded. Binding %s:%s ..." % (HOST, PORT))
            try:
                import uvicorn
            except ImportError:
                print("[!] uvicorn missing - pip install uvicorn")
                raise
            config = uvicorn.Config(
                server_module.app,
                host=HOST,
                port=int(PORT),
                log_level="info",
                access_log=True,
                use_colors=False,
            )
            server = uvicorn.Server(config)
            main._uvicorn_server = server
            print("[*] Listening (uvicorn).")
            try:
                server_ready.set()
            except Exception:
                pass
            server.run()
        except Exception as e:
            server_error['error'] = e
            print(f"Server error: {e}")
            import traceback
            traceback.print_exc()

    server_ready = threading.Event()
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    print("Starting server...")
    # Wait until socket is listening (avoid HTTP self-check deadlock with wsgiref/ASGI)
    ready = False
    for i in range(120):
        if server_error.get("error"):
            break
        if server_ready.is_set():
            try:
                import socket as _s
                s = _s.create_connection(("127.0.0.1", int(PORT)), timeout=1)
                s.close()
                ready = True
                break
            except Exception:
                pass
        if i in (4, 10, 20, 40, 60):
            print("  ... still starting (%ss)" % int(i * 0.5))
        time.sleep(0.5)

    if not ready:
        print("Server failed to start in time.")
        print("Is port 8000 blocked? Run stop-server.bat then try again.")
        if server_error.get("error"):
            print("Error:", server_error["error"])
        cleanup_pid()
        return

    print("Server is ready!")
    print("Local:  %s" % LOCAL_URL)
    if HOST in ("0.0.0.0", "::"):
        lan = get_lan_ips()
        if lan:
            print("Phone / LAN (same Wi-Fi):")
            for ip in lan:
                print("  http://%s:%s" % (ip, PORT))
            print("On iPhone Safari: open the URL above -> Share -> Add to Home Screen")
            print("If it fails, allow Python through Windows Firewall (Private network).")
        else:
            print("LAN IP not detected. Check Wi-Fi, then open http://YOUR-PC-IP:%s" % PORT)
    else:
        print("Bound host: %s (set host=0.0.0.0 in cludari_server.ini for phone access)" % HOST)

    # Server-only mode: no desktop window, just keep HTTP API alive
    server_only = os.environ.get("CLU_SERVER_ONLY", "").strip().lower() in ("1", "true", "yes", "server")
    if not server_only:
        try:
            with open(os.path.join(BASE_DIR, "cludari_server.ini"), "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip().lower()
                    if line.startswith("mode=") and "server" in line.split("=", 1)[-1]:
                        server_only = True
                        break
        except Exception:
            pass

    
    if server_only:
        no_window = os.environ.get("CLU_NO_WINDOW", "").strip().lower() in ("1", "true", "yes", "hidden")
        if no_window:
            print("=" * 54)
            print("  CluDari CENTRAL SERVER (hidden / no window)")
            print("=" * 54)
            lan = get_lan_ips()
            print("Local: http://127.0.0.1:%s" % PORT)
            for ip in lan:
                print("LAN:   http://%s:%s" % (ip, PORT))
            print("Press Ctrl+C only if running in visible console.")
            try:
                while True:
                    time.sleep(3600)
            except KeyboardInterrupt:
                print("Server stopped.")
            cleanup_pid()
            return

        print("=" * 54)
        print("  CluDari  |  CENTRAL SERVER")
        print("  Database lives on THIS PC")
        print("=" * 54)
        lan = get_lan_ips()
        local = "http://127.0.0.1:%s" % PORT
        print("This PC window:  %s" % local)
        if lan:
            print("Other devices open one of these in browser:")
            for ip in lan:
                print("   http://%s:%s" % (ip, PORT))
        else:
            print("Other devices: http://YOUR-LAN-IP:%s" % PORT)
        print("Same username on all devices = shared data.")
        print("Close the app window or press Ctrl+C here to stop.")
        print("=" * 54)

        def _open_chrome_app(url):
            """Special frameless-ish Chrome/Edge app window."""
            candidates = []
            if sys.platform.startswith("win"):
                pf = os.environ.get("ProgramFiles", r"C:\Program Files")
                pf86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
                localapp = os.environ.get("LOCALAPPDATA", "")
                candidates = [
                    os.path.join(localapp, r"Google\Chrome\Application\chrome.exe"),
                    os.path.join(pf, r"Google\Chrome\Application\chrome.exe"),
                    os.path.join(pf86, r"Google\Chrome\Application\chrome.exe"),
                    os.path.join(localapp, r"Microsoft\Edge\Application\msedge.exe"),
                    os.path.join(pf, r"Microsoft\Edge\Application\msedge.exe"),
                    os.path.join(pf86, r"Microsoft\Edge\Application\msedge.exe"),
                ]
            profile = os.path.join(BASE_DIR, ".cludari_app_profile")
            try:
                os.makedirs(profile, exist_ok=True)
            except Exception:
                pass
            flags = [
                "--app=" + url,
                "--start-maximized",
                "--new-window",
                "--user-data-dir=" + profile,
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-extensions",
                "--disable-sync",
                "--disable-translate",
                "--disable-features=TranslateUI,ImprovedCookieControls",
                "--class=CluDariCentral",
                "--window-name=CluDari",
            ]
            for exe in candidates:
                if exe and os.path.isfile(exe):
                    try:
                        subprocess.Popen([exe] + flags, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        print("[*] Special app window:", os.path.basename(exe))
                        return True
                    except Exception as e:
                        print("launch fail:", e)
            try:
                import webbrowser
                webbrowser.open(url)
                print("[*] Default browser opened")
                return True
            except Exception as e:
                print("browser error:", e)
                return False

        # Prefer native CluDari window (pywebview) on central PC — looks like real app
        # while HTTP server already serves LAN clients on 0.0.0.0
        try:
            import webview
            print("[*] Opening CluDari native window (central)...")
            icon_path = os.path.abspath(os.path.join(BASE_DIR, "icon.ico"))
            if not os.path.exists(icon_path):
                icon_path = os.path.join(BASE_DIR, "icon.png")
            win_kwargs = dict(
                title="CluDari — سرور مرکزی",
                url=local,
                width=1280,
                height=800,
                minimized=False,
            )
            try:
                win_kwargs["maximized"] = True
            except Exception:
                pass
            if os.path.exists(icon_path):
                try:
                    win_kwargs["icon"] = icon_path
                except Exception:
                    pass
            try:
                window = webview.create_window(**win_kwargs)
            except TypeError:
                window = webview.create_window(
                    title="CluDari — سرور مرکزی",
                    url=local,
                    width=1280,
                    height=800,
                )
            def _on_start_central():
                try:
                    if hasattr(window, "maximize"):
                        window.maximize()
                except Exception:
                    pass
                apply_window_icon(icon_path, [
                    "CluDari — سرور مرکزی",
                    "CluDari - Personal Accounting",
                    "CluDari",
                ])
            try:
                webview.start(func=_on_start_central, debug=False)
            except TypeError:
                try:
                    webview.start(func=_on_start_central)
                except TypeError:
                    webview.start()
                    apply_window_icon(icon_path)
            print("Window closed — stopping server.")
            cleanup_pid()
            return
        except Exception as e:
            print("[!] Native window unavailable (%s) — using Chrome/Edge app mode" % e)
            threading.Timer(0.6, lambda: _open_chrome_app(local)).start()
            try:
                while True:
                    time.sleep(3600)
            except KeyboardInterrupt:
                print("")
                print("Server stopped.")
            cleanup_pid()
            return

    webview_ok = False
    try:
        import webview
        print("Loading window...")
        icon_path = os.path.abspath(os.path.join(BASE_DIR, "icon.ico"))
        if not os.path.exists(icon_path):
            icon_path = os.path.join(BASE_DIR, "icon.png")
        if not os.path.exists(icon_path):
            icon_path = os.path.join(BASE_DIR, "static", "icon.png")
        win_kwargs = dict(
            title="CluDari - Personal Accounting",
            url=URL,
            width=1400,
            height=900,
            min_size=(900, 600),
            maximized=True,
        )
        # icon supported on some platforms
        if os.path.exists(icon_path):
            try:
                win_kwargs["icon"] = icon_path
            except Exception:
                pass
        try:
            window = webview.create_window(**win_kwargs)
        except TypeError:
            # older pywebview without maximized/icon
            window = webview.create_window(
                "CluDari - Personal Accounting", URL, width=1400, height=900
            )
            def _maximize():
                try:
                    window.maximize()
                except Exception:
                    pass
            try:
                window.events.loaded += _maximize
            except Exception:
                pass
        print("[*] Icon:", icon_path if os.path.exists(icon_path) else "not found")
        try:
            def _on_start():
                try:
                    if hasattr(window, "maximize"):
                        window.maximize()
                except Exception:
                    pass
                # try multiple ways to set taskbar icon on Windows
                try:
                    import ctypes
                    import time as _t
                    _t.sleep(0.3)
                    user32 = ctypes.windll.user32
                    apply_window_icon(icon_path, [
                        "CluDari - Personal Accounting",
                        "CluDari — سرور مرکزی",
                        "CluDari",
                    ])
                except Exception as e:
                    print("Icon set:", e)
            try:
                webview.start(func=_on_start, debug=False)
            except TypeError:
                webview.start(debug=False)
        except TypeError:
            webview.start(debug=False)
        webview_ok = True
    except Exception as e:
        print(f"WebView error: {e}")

    if webview_ok:
        cleanup_pid()
        return

    print("Opening in browser...")
    import webbrowser
    webbrowser.open(URL)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup_pid()
        print("Exiting...")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print()
        print("=" * 50)
        print("FATAL ERROR - CluDari crashed:")
        print("=" * 50)
        traceback.print_exc()
        print()
        print("Copy the error above and send it if you need help.")
        try:
            input("Press Enter to close...")
        except Exception:
            import time
            time.sleep(30)
        raise SystemExit(1)

