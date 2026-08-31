#!/usr/bin/env python3
"""Seed CluDari products catalog - large hardware/phone/appliance set."""
import sqlite3, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, "cludari.db")

def code_for(name, prefix="P"):
    h = abs(hash(name)) % 100000
    clean = re.sub(r'[^A-Za-z0-9]', '', name)[:8].upper() or "X"
    return f"{prefix}{clean}{h:05d}"[:24]

ITEMS = []

def add(cat, brand, model, name=None):
    name = name or f"{brand} {model}".strip()
    ITEMS.append((cat, brand, model, name))

# ── NVIDIA GPUs ──
for series, models in {
    "RTX 50": ["RTX 5090","RTX 5080","RTX 5070 Ti","RTX 5070","RTX 5060 Ti"],
    "RTX 40": ["RTX 4090","RTX 4080 SUPER","RTX 4080","RTX 4070 Ti SUPER","RTX 4070 SUPER","RTX 4060 Ti","RTX 4060"],
    "RTX 30": ["RTX 3090 Ti","RTX 3090","RTX 3080 Ti","RTX 3080","RTX 3070 Ti","RTX 3070","RTX 3060 Ti","RTX 3060","RTX 3050"],
}.items():
    for m in models:
        add("Video Cards", "NVIDIA", m)

for gen in ["GTX 16","GTX 10","GTX 900","GTX 700","GTX 600","GTX 500","GeForce 200"]:
    add("Video Cards", "NVIDIA", gen)

gtx_list = """GT 120 GT 130 GT 140 GT 220 GT 230 GT 240 GT 320 GT 330 GT 340 GT 420 GT 430 GT 440 GT 520 GT 530 GT 545 GT 610 GT 620 GT 625 GT 630 GT 635 GT 640 GT 645 GT 705 GT 710 GT 720 GT 730 GT 735 GT 740 GT 745 GT 750 GT 755 GT 1010 GT 1030 GTX 260 GTX 275 GTX 280 GTX 285 GTX 295 GTX 460 GTX 465 GTX 470 GTX 480 GTX 550 Ti GTX 560 GTX 560 Ti GTX 570 GTX 580 GTX 590 GTX 650 GTX 650 Ti GTX 660 GTX 660 Ti GTX 670 GTX 680 GTX 690 GTX 745 GTX 750 GTX 750 Ti GTX 760 GTX 770 GTX 780 GTX 780 Ti GTX 950 GTX 960 GTX 970 GTX 980 GTX 980 Ti GTX 1050 GTX 1050 Ti GTX 1060 3GB GTX 1060 6GB GTX 1070 GTX 1070 Ti GTX 1080 GTX 1080 Ti GTX 1630 GTX 1650 GTX 1650 SUPER GTX 1660 GTX 1660 Ti GTX 1660 SUPER""".split()
# fix multi-word
for m in ["GeForce GT 120","GeForce GT 130","GeForce GT 140","GeForce GT 220","GeForce GT 230","GeForce GT 240",
 "GeForce GT 320","GeForce GT 330","GeForce GT 340","GeForce GT 420","GeForce GT 430","GeForce GT 440",
 "GeForce GT 520","GeForce GT 530","GeForce GT 610","GeForce GT 620","GeForce GT 630","GeForce GT 640",
 "GeForce GT 710","GeForce GT 720","GeForce GT 730","GeForce GT 740","GeForce GT 1030",
 "GeForce GTX 260","GeForce GTX 275","GeForce GTX 280","GeForce GTX 285","GeForce GTX 295",
 "GeForce GTX 460","GeForce GTX 470","GeForce GTX 480","GeForce GTX 550 Ti","GeForce GTX 560 Ti",
 "GeForce GTX 570","GeForce GTX 580","GeForce GTX 590","GeForce GTX 650","GeForce GTX 650 Ti",
 "GeForce GTX 660","GeForce GTX 660 Ti","GeForce GTX 670","GeForce GTX 680","GeForce GTX 690",
 "GeForce GTX 750","GeForce GTX 750 Ti","GeForce GTX 760","GeForce GTX 770","GeForce GTX 780","GeForce GTX 780 Ti",
 "GeForce GTX Titan","GeForce GTX 950","GeForce GTX 960","GeForce GTX 970","GeForce GTX 980","GeForce GTX 980 Ti",
 "GeForce GTX 1050","GeForce GTX 1050 Ti","GeForce GTX 1060 6GB","GeForce GTX 1070","GeForce GTX 1070 Ti",
 "GeForce GTX 1080","GeForce GTX 1080 Ti","GeForce GTX 1650","GeForce GTX 1650 SUPER","GeForce GTX 1660",
 "GeForce GTX 1660 Ti","GeForce GTX 1660 SUPER"]:
    add("Video Cards", "NVIDIA", m)

for m in ["RX 9000","RX 7000","RX 6000","RX 5000","Vega","Fury","HD Series"]:
    add("Video Cards", "AMD", m)
add("Video Cards", "Intel", "Arc")

# Monitors
for brand, models in {
    "Samsung": ["Odyssey G9","Odyssey G8","Odyssey G7","Odyssey G5","ViewFinity S9","S20B300","S22F350","S24F350","S24R350","S24AG300","S27R350","S27AG500","Odyssey G3 27","Odyssey G5 27","Odyssey G7 27","ViewFinity S8 27"],
    "LG": ["UltraGear 27GR95QE","27GP850","32GQ950","24MK430H","24GN650","27MP400","27UP850","27GP950","27GR83Q"],
    "ASUS": ["ROG Swift PG27AQDM","PG32UCDM"],
    "MSI": ["MAG 274QRF-QD"],
    "Dell": ["U2723QE","AW3423DWF"],
    "AOC": ["24G2","Q27G3XMN"],
    "BenQ": ["EX2710Q","PD3225U"],
    "Gigabyte": ["M27Q","FO32U2P"],
}.items():
    for m in models:
        add("Monitors", brand, m)

# Fiber modems Huawei
for m in ["HG8010H","HG8120H","HG8145V5","HG8245H","HG8245W5","EG8145V5","HS8145V","HS8546V5"]:
    add("Fiber Modem", "Huawei", m)

# Keyboard / Mouse brands
for b in ["Logitech","Razer","Corsair","SteelSeries","HyperX","Redragon","Keychron","Akko","Glorious","ASUS","MSI"]:
    add("Keyboards", b, "Keyboard")
    add("Mice", b, "Mouse")

# Phones Samsung / Apple / Xiaomi
for s in range(6, 26):
    add("Smartphone", "Samsung", f"Galaxy S{s}")
for n in [8,9,10,20]:
    add("Smartphone", "Samsung", f"Galaxy Note{n}")
for a in [12,13,14,15,23,24,25,32,33,34,35,52,53,54,55]:
    add("Smartphone", "Samsung", f"Galaxy A{a}")
for z in ["Z Flip5","Z Flip6","Z Fold5","Z Fold6"]:
    add("Smartphone", "Samsung", f"Galaxy {z}")

iphones = ["iPhone 11","iPhone 12","iPhone 12 Pro","iPhone 13","iPhone 13 Pro","iPhone 14","iPhone 14 Pro",
 "iPhone 15","iPhone 15 Pro","iPhone 15 Pro Max","iPhone 16","iPhone 16 Pro","iPhone 16 Pro Max",
 "iPhone SE 2022","iPhone XR","iPhone XS","iPhone X","iPhone 8","iPhone 7"]
for m in iphones:
    add("Smartphone", "Apple", m)

for m in ["Mi 11","Mi 12","Mi 13","Mi 14","Redmi Note 11","Redmi Note 12","Redmi Note 13","POCO F5","POCO X5","POCO M5"]:
    brand = "Xiaomi" if m.startswith("Mi") or m.startswith("Redmi") or m.startswith("POCO") else "Xiaomi"
    add("Smartphone", brand, m)

# Motherboards
for m in ["B550M DS3H","B650 Gaming X","Z790 Gaming X","X570 AORUS Elite","B760M DS3H","H610M H"]:
    add("Motherboards", "Gigabyte", m)
for m in ["PRIME B550M-A","TUF GAMING B650-PLUS WIFI","ROG STRIX B760-F GAMING WIFI","ROG MAXIMUS Z790 HERO","PRIME H610M-K"]:
    add("Motherboards", "ASUS", m)

# CPUs
for m in ["i3-12100","i5-12400F","i5-13400F","i5-14600K","i7-12700K","i7-13700K","i7-14700K","i9-13900K","i9-14900K",
 "Core Ultra 5 245K","Core Ultra 7 265K","Core Ultra 9 285K"]:
    add("CPUs", "Intel", m)
for m in ["Ryzen 5 5600X","Ryzen 5 7600X","Ryzen 5 9600X","Ryzen 7 5800X3D","Ryzen 7 7800X3D","Ryzen 7 9700X",
 "Ryzen 9 5950X","Ryzen 9 7950X","Ryzen 9 9950X"]:
    add("CPUs", "AMD", m)

# RAM types/brands
for b in ["Corsair","Kingston","G.Skill","Crucial","XPG","TeamGroup"]:
    for cap in ["8GB","16GB","32GB"]:
        for t in ["DDR4 3200","DDR5 5600","DDR5 6000"]:
            add("Memory", b, f"{cap} {t}")

# SSD/HDD brands
for b in ["Samsung","WD","Crucial","Kingston","Seagate","ADATA"]:
    for cap in ["500GB","1TB","2TB"]:
        add("Storage", b, f"SSD {cap}")
        add("Storage", b, f"HDD {cap}")

# PSU brands
for b in ["Corsair","Seasonic","Cooler Master","be quiet!","MSI","ASUS","DeepCool"]:
    for w in ["650W","750W","850W","1000W"]:
        add("Power Supplies", b, w)

# Cases
for b in ["NZXT","Lian Li","Corsair","Cooler Master","Fractal Design","DeepCool","Green","Tsco"]:
    add("Cases", b, "PC Case")

# Laptops
for m in ["MacBook Air M2","MacBook Air M3","MacBook Pro 14 M4","ROG Zephyrus G14","TUF Gaming F15",
 "Legion 5","LOQ 15","Victus 15","OMEN 16","XPS 15","ThinkPad E14","Nitro V15","Katana 15"]:
    brand = "Apple" if "MacBook" in m else ("ASUS" if m.startswith(("ROG","TUF")) else ("Lenovo" if m.startswith(("Legion","LOQ","Think")) else ("HP" if m.startswith(("Victus","OMEN")) else ("Dell" if "XPS" in m else ("Acer" if "Nitro" in m else ("MSI" if "Katana" in m else "Laptop"))))))
    add("Laptop", brand, m)

# Earbuds / Watches
for m in ["AirPods Pro 2","AirPods 4","Galaxy Buds3 Pro","Galaxy Buds2 Pro","Redmi Buds 5 Pro"]:
    brand = "Apple" if "AirPods" in m else ("Samsung" if "Galaxy" in m else "Xiaomi")
    add("Headphones", brand, m)
for m in ["Apple Watch Series 10","Apple Watch Ultra 2","Galaxy Watch 7","Galaxy Watch Ultra","Huawei Watch GT 5"]:
    brand = "Apple" if "Apple" in m else ("Samsung" if "Galaxy" in m else "Huawei")
    add("Smartwatch", brand, m)

# Home appliances categories (as products)
for name in ["چای ساز","کتری برقی","قهوه ساز","اسپرسوساز","مخلوط کن","غذاساز","آبمیوه گیری","همزن","گوشت کوب برقی","چرخ گوشت","زودپز برقی","سرخ کن بدون روغن","توستر","اتو بخار"]:
    add("لوازم خانگی", "عمومی", name, name)

# Car parts categories
for name in ["روغن موتور","فیلتر روغن","فیلتر هوا","شمع","باتری","لنت جلو","لنت عقب","کمک فنر","لاستیک","ضدیخ","تسمه تایم","رادیاتور"]:
    add("خودرو", "عمومی", name, name)

# Phone cases / chargers
for b in ["Spigen","ESR","UAG","Nillkin","Baseus","Green Lion"]:
    add("Phone Case", b, "Case")
for m in ["Apple 20W USB-C","Apple 30W USB-C","Samsung 25W","Samsung 45W","Anker Nano 30W","Ugreen Nexode 65W","Xiaomi 67W"]:
    brand = m.split()[0]
    add("Phone Charger", brand, m)

# Power banks
for b in ["Anker","Xiaomi","Baseus","UGREEN","Green Lion","TSCO"]:
    for cap in ["10000mAh","20000mAh","30000mAh"]:
        add("Power Bank", b, cap)

# Cables
for m in ["HDMI","DisplayPort","USB-C to USB-C","USB-A to USB-C","Lightning","Cat6","SATA III","3.5mm AUX"]:
    add("Cables", "عمومی", m)

# External storage
for brand, models in {
    "WD": ["My Passport","Elements Portable","Black P10"],
    "Seagate": ["Expansion Portable","Backup Plus Slim","One Touch"],
    "Samsung": ["T7","T7 Shield","T9"],
    "SanDisk": ["Extreme Portable SSD"],
}.items():
    for m in models:
        add("External Storage", brand, m)

# Subscriptions as products
for m in ["ChatGPT Plus","Netflix","Spotify","Adobe Creative Cloud","Microsoft 365","iCloud+","Google One","NordVPN","ExpressVPN"]:
    add("Subscriptions", "Service", m)

print(f"Prepared {len(ITEMS)} items")

conn = sqlite3.connect(DB)
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
# ensure columns
cols = {r[1] for r in conn.execute("PRAGMA table_info(products)")}
for c, d in [("brand","''"),("model","''"),("category","''")]:
    if c not in cols:
        try: conn.execute(f"ALTER TABLE products ADD COLUMN {c} TEXT DEFAULT {d}")
        except: pass

existing = {r[0] for r in conn.execute("SELECT code FROM products")}
existing_names = {r[0].lower() for r in conn.execute("SELECT lower(name) FROM products")}
added = 0
for cat, brand, model, name in ITEMS:
    c = code_for(name, prefix=cat[:3].upper().replace(" ","") or "P")
    if c in existing or name.lower() in existing_names:
        continue
    try:
        conn.execute(
            "INSERT INTO products (code,name,brand,model,category) VALUES (?,?,?,?,?)",
            (c, name, brand, model, cat)
        )
        existing.add(c)
        existing_names.add(name.lower())
        added += 1
    except sqlite3.IntegrityError:
        pass
conn.commit()
total = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
conn.close()
print(f"Added {added}, total products now {total}")
