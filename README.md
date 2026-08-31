# حساب‌یار (HesabYar) v3.0

**سیستم حسابداری شخصی + کسب‌وکار + کلینیک قوی و لوکال**

ادغام هوشمند سه پروژه:
- **CluDari** → پایه اپلیکیشن لوکال، UI، multi-user، خرید/فروش/فاکتور/کلینیک
- **Taraz** → موتور حسابداری دوبل‌انتری حرفه‌ای (IFRS، موجودی FIFO/LIFO، چندارزی، رمزنگاری SHA-256)
- ایده‌های **Kharji** → چندارزی تاریخی، تجربه کاربری مدرن، تقویم جلالی

---

## چرا حساب‌یار؟

| قابلیت | وضعیت |
|--------|--------|
| کاملاً لوکال و آفلاین | ✅ |
| حسابداری دوبل‌انتری واقعی | ✅ (Taraz) |
| Multi-Currency + تجدید ارزیابی | ✅ |
| موجودی کالا (FIFO / LIFO / میانگین) | ✅ |
| خرید / فروش / فاکتور | ✅ |
| ماژول کلینیک (پزشک، پرستار، پذیرش) | ✅ |
| بودجه + Cost Center + Variance | ✅ |
| Multi-user با دیتابیس جدا | ✅ |
| تقویم جلالی | ✅ |
| دسترسی از موبایل روی LAN / Tailscale | ✅ |
| Desktop window (pywebview) | ✅ |
| گزارش ترازنامه IFRS | ✅ |
| زنجیره رمزنگاری اسناد (ضد دستکاری) | ✅ |

---

## نصب سریع

### پیش‌نیاز
- Python 3.10+
- pip

```bash
cd HesabYar
pip install -r requirements.txt
```

### اجرا

**ویندوز:**
```bat
run.bat
```
یا برای حالت سرور (دسترسی از موبایل/دیگر سیستم‌ها):
```bat
run-server.bat
```

**لینوکس / مک:**
```bash
chmod +x run.sh
./run.sh
```

پورت پیش‌فرض: `http://127.0.0.1:8000`  
برای دسترسی از گوشی روی همان Wi-Fi، host روی `0.0.0.0` تنظیم شده است.

---

## موتور حسابداری Taraz

فایل `taraz_bridge.py` لایه ارتباطی تمیز بین UI فعلی و موتور Taraz است.

مثال استفاده در کد:

```python
from taraz_bridge import HesabYarLedger, get_ledger

ledger = get_ledger(base_currency="IRR")

# ثبت فروش
ledger.post_sale(
    entry_id="INV-1405-001",
    amount=15_000_000,
    description="فروش خدمات دندانپزشکی",
    vat_rate="0.09"          # ۹٪ ارزش افزوده
)

# ترازنامه
bs = ledger.balance_sheet()
print(bs["total_current_assets"])

# بررسی صحت رمزنگاری دفتر
assert ledger.verify_ledger() is True
```

نمودار حساب‌های پیش‌فرض فارسی در `ensure_default_coa()` تعریف شده و قابل گسترش است.

---

## ساختار پروژه

```
HesabYar/
├── main.py / server.py     # لانچر و API اصلی (از CluDari)
├── taraz/                  # موتور حسابداری دوبل‌انتری (از Taraz)
├── taraz_bridge.py         # لایه ادغام
├── static/                 # رابط کاربری وب
├── data/                   # دیتابیس هر کاربر
├── backups/                # بک‌آپ‌ها
├── requirements.txt
├── run.bat / run.sh
└── README.md
```

---

## مسیر توسعه پیشنهادی (Roadmap)

1. اتصال کامل APIهای خرید/فروش به `taraz_bridge` (ثبت خودکار سند دوبل‌انتری)
2. صفحه گزارش‌های IFRS (ترازنامه، سود و زیان، جریان وجوه نقد)
3. بهبود UI با الهام از طراحی مدرن (Dark Mode، نمودارهای بهتر)
4. پشتیبانی کامل‌تر نرخ ارز تاریخی
5. Export/Import اکسل پیشرفته

---

## لایسنس

- بخش CluDari: متعلق به نویسنده اصلی
- بخش Taraz: MIT License (Ali Kamrani)
- لایه ادغام و توسعه حساب‌یار: برای استفاده شخصی و تجاری آزاد است

---

## نکات مهم

- داده‌های نمونه کاربر از نسخه اصلی حذف شده‌اند.
- برای دسترسی خارج از خانه از **Tailscale** استفاده کنید (Cloudflare Tunnel اغلب در ایران بلاک است).
- قبل از استفاده جدی حتماً بک‌آپ بگیرید.

ساخته‌شده با ادغام بهترین بخش‌های سه پروژه برای یک حسابداری واقعی، قوی و کاملاً لوکال.

## اتصال کامل انجام شد (v3.0)

از این نسخه به بعد:

1. **هر خرید** (`POST /api/purchases`) → به‌طور خودکار سند دوبل‌انتری در موتور Taraz ثبت می‌شود  
   (بدهکار: موجودی کالا / بستانکار: نقد)
2. **هر فروش** (`POST /api/sales`) → سند دوبل‌انتری  
   (بدهکار: نقد / بستانکار: درآمد فروش)
3. APIهای جدید گزارش حسابداری:
   - `GET /api/ledger/status`
   - `GET /api/ledger/trial-balance`
   - `GET /api/ledger/balance-sheet`
   - `GET /api/ledger/income-statement`
   - `GET /api/ledger/verify`   (بررسی صحت زنجیره SHA-256)
   - `GET /api/ledger/coa`     (نمودار حساب‌ها)
   - `GET /api/ledger/entries` (آخرین اسناد)

اگر موتور Taraz به هر دلیلی خطا بدهد، ذخیره خرید/فروش اصلی **قطع نمی‌شود** (best-effort).




## مهاجرت داده‌های قبلی

داده‌های خرید و فروش کاربر **Parham** (و سایر کاربران) داخل پوشه `data/` قرار گرفته‌اند.

- با اولین درخواست به `/api/ledger/...` بعد از لاگین، مهاجرت خودکار انجام می‌شود.
- یا دستی:
  ```bat
  python migrate_to_ledger.py Parham
  ```
- یا از API:
  ```bat
  curl -X POST http://127.0.0.1:8000/api/ledger/migrate?force=1
  ```

اسناد soft-deleted منتقل نمی‌شوند. فقط رکوردهای فعال.
