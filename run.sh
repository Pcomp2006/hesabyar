#!/usr/bin/env bash
# CluDari - حسابداری شخصی — Linux / macOS
# نصب خودکار وابستگی‌ها در صورت نیاز

set -e
cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       CluDari - حسابداری شخصی           ║"
echo "║         نصب خودکار وابستگی‌ها            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

OS="$(uname -s 2>/dev/null || echo unknown)"

# ─── پیدا کردن / نصب Python ───
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
fi

if [ -z "$PY" ]; then
  echo "[!] Python پیدا نشد — تلاش برای نصب..."
  if [ "$OS" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
    brew install python
    PY=python3
  elif command -v apt-get >/dev/null 2>&1; then
    echo "    نیاز به sudo برای apt..."
    sudo apt-get update -qq
    sudo apt-get install -y python3 python3-pip python3-venv
    PY=python3
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y python3 python3-pip
    PY=python3
  elif command -v pacman >/dev/null 2>&1; then
    sudo pacman -S --noconfirm python python-pip
    PY=python3
  else
    echo "[خطا] Python 3.10+ را دستی نصب کنید:"
    echo "  macOS:  brew install python"
    echo "  Ubuntu: sudo apt install python3 python3-pip"
    exit 1
  fi
fi

echo "[*] Python: $($PY --version)"

# ─── pip ───
if ! $PY -m pip --version >/dev/null 2>&1; then
  echo "[*] نصب pip..."
  $PY -m ensurepip --upgrade 2>/dev/null || true
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get install -y python3-pip 2>/dev/null || true
  fi
fi
$PY -m pip install --upgrade pip -q 2>/dev/null || true

# ─── پکیج‌های Python ───
echo "[*] نصب وابستگی‌های برنامه..."
if [ -f requirements.txt ]; then
  $PY -m pip install -r requirements.txt --user 2>/dev/null || $PY -m pip install -r requirements.txt
else
  $PY -m pip install "fastapi>=0.100.0" "uvicorn>=0.23.0" "python-multipart>=0.0.6" \
    "jdatetime>=4.0.0" "pywebview>=5.0" "a2wsgi>=1.10.0" --user
fi

# ─── وابستگی‌های سیستمی Linux برای WebView ───
if [ "$OS" = "Linux" ]; then
  if ! $PY -c "import webview" >/dev/null 2>&1; then
    echo "[*] تلاش برای نصب پیش‌نیاز WebView (GTK)..."
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get install -y python3-gi python3-gi-cairo gir1.2-gtk-3.0 gir1.2-webkit2-4.1 2>/dev/null || \
      sudo apt-get install -y python3-gi python3-gi-cairo gir1.2-gtk-3.0 2>/dev/null || true
    elif command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y python3-gobject webkit2gtk4.1 2>/dev/null || true
    fi
    $PY -m pip install pywebview --user 2>/dev/null || true
  fi
fi

if $PY -c "import fastapi, jdatetime, a2wsgi" >/dev/null 2>&1; then
  echo "[*] وابستگی‌های اصلی آماده‌اند."
else
  echo "[خطا] نصب پکیج‌ها ناموفق بود. اینترنت را بررسی کنید."
  exit 1
fi

if $PY -c "import webview" >/dev/null 2>&1; then
  echo "[*] pywebview آماده — پنجره دسکتاپ"
else
  echo "[!] بدون pywebview — برنامه در مرورگر باز می‌شود"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║              در حال اجرا...              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
exec $PY main.py
