
import sqlite3
from pathlib import Path

DB = Path("cludari.db")
conn = sqlite3.connect(str(DB))
cols = [r[1] for r in conn.execute("PRAGMA table_info(products)")]
for c in ("brand", "model"):
    if c not in cols:
        conn.execute(f"ALTER TABLE products ADD COLUMN {c} TEXT DEFAULT ''")
conn.commit()

def items(*pairs):
    out = []
    for p in pairs:
        if isinstance(p, str):
            out.append(("", p))
        elif len(p) == 2:
            out.append((p[0], p[1]))
        else:
            out.append((p[0], " ".join(p[1:])))
    return out

CATALOG = {
"CPUs": items(
 ("Intel","Core i3-12100F"),("Intel","Core i3-13100F"),("Intel","Core i3-14100F"),
 ("Intel","Core i5-12400F"),("Intel","Core i5-13400F"),("Intel","Core i5-14400F"),
 ("Intel","Core i5-14600K"),("Intel","Core i5-14600KF"),
 ("Intel","Core i7-12700K"),("Intel","Core i7-13700K"),("Intel","Core i7-14700K"),("Intel","Core i7-14700KF"),
 ("Intel","Core i9-12900K"),("Intel","Core i9-13900K"),("Intel","Core i9-14900K"),("Intel","Core i9-14900KF"),
 ("Intel","Core Ultra 5 245K"),("Intel","Core Ultra 7 265K"),("Intel","Core Ultra 9 285K"),
 ("AMD","Ryzen 5 5500"),("AMD","Ryzen 5 5600"),("AMD","Ryzen 5 5600X"),
 ("AMD","Ryzen 5 7500F"),("AMD","Ryzen 5 7600"),("AMD","Ryzen 5 7600X"),("AMD","Ryzen 5 9600X"),
 ("AMD","Ryzen 7 5700X"),("AMD","Ryzen 7 5800X"),("AMD","Ryzen 7 5800X3D"),
 ("AMD","Ryzen 7 7700"),("AMD","Ryzen 7 7700X"),("AMD","Ryzen 7 7800X3D"),("AMD","Ryzen 7 9700X"),
 ("AMD","Ryzen 9 5900X"),("AMD","Ryzen 9 5950X"),("AMD","Ryzen 9 7900X"),("AMD","Ryzen 9 7950X"),
 ("AMD","Ryzen 9 7900X3D"),("AMD","Ryzen 9 7950X3D"),("AMD","Ryzen 9 9900X"),("AMD","Ryzen 9 9950X"),
),
"CPU Coolers": items(
 ("Cooler Master","Hyper 212 Black"),("Cooler Master","Hyper 212 Halo"),
 ("Cooler Master","MasterLiquid 240L Core"),("Cooler Master","MasterLiquid 360L Core"),
 ("Noctua","NH-D15"),("Noctua","NH-D15 chromax.black"),("Noctua","NH-U12S"),("Noctua","NH-L9i"),
 ("be quiet!","Dark Rock Pro 5"),("be quiet!","Pure Rock 3"),("be quiet!","Silent Loop 2 240"),
 ("Corsair","iCUE H100i RGB ELITE"),("Corsair","iCUE H150i RGB ELITE"),("Corsair","iCUE H170i ELITE"),
 ("NZXT","Kraken 240"),("NZXT","Kraken 360"),("NZXT","Kraken Elite 360"),
 ("Arctic","Freezer 34 eSports"),("Arctic","Liquid Freezer III 240"),("Arctic","Liquid Freezer III 360"),
 ("Deepcool","AK400"),("Deepcool","AK620"),("Deepcool","LT720"),
 ("Thermalright","Peerless Assassin 120 SE"),("Thermalright","Phantom Spirit 120"),
 ("Scythe","Fuma 3"),("ID-COOLING","SE-224-XTS"),
),
"Motherboards": items(
 ("ASUS","PRIME B650M-A"),("ASUS","TUF GAMING B650-PLUS WIFI"),("ASUS","ROG STRIX B650-A GAMING WIFI"),
 ("ASUS","ROG STRIX X670E-E GAMING WIFI"),("ASUS","ROG MAXIMUS Z790 HERO"),
 ("ASUS","PRIME Z790-P WIFI"),("ASUS","TUF GAMING Z790-PLUS WIFI"),
 ("MSI","B650 GAMING PLUS WIFI"),("MSI","MAG B650 TOMAHAWK WIFI"),("MSI","MPG B650 CARBON WIFI"),
 ("MSI","PRO Z790-A WIFI"),("MSI","MAG Z790 TOMAHAWK WIFI"),("MSI","MEG X670E ACE"),
 ("Gigabyte","B650 AORUS ELITE AX"),("Gigabyte","B650M DS3H"),("Gigabyte","X670 AORUS ELITE AX"),
 ("Gigabyte","Z790 AORUS ELITE AX"),("Gigabyte","Z790 UD AX"),
 ("ASRock","B650M Pro RS"),("ASRock","B650 PG Lightning"),("ASRock","Z790 Pro RS"),
 ("ASRock","X670E Steel Legend"),("ASRock","B550M Pro4"),
),
"Memory": items(
 ("Corsair","Vengeance 16GB (2x8) DDR4-3200"),("Corsair","Vengeance 32GB (2x16) DDR4-3200"),
 ("Corsair","Vengeance RGB 32GB (2x16) DDR5-5600"),("Corsair","Vengeance 32GB (2x16) DDR5-6000"),
 ("Corsair","Dominator Platinum RGB 32GB DDR5-6400"),
 ("G.Skill","Ripjaws V 16GB DDR4-3200"),("G.Skill","Ripjaws V 32GB DDR4-3600"),
 ("G.Skill","Trident Z5 RGB 32GB DDR5-6000"),("G.Skill","Trident Z5 RGB 64GB DDR5-6400"),
 ("G.Skill","Flare X5 32GB DDR5-6000"),
 ("Kingston","Fury Beast 16GB DDR4-3200"),("Kingston","Fury Beast 32GB DDR5-5600"),
 ("Kingston","Fury Beast RGB 32GB DDR5-6000"),
 ("TeamGroup","T-Force Delta RGB 32GB DDR5-6000"),("TeamGroup","T-Create Expert 32GB DDR5-6000"),
 ("Crucial","Pro 32GB DDR5-5600"),("Crucial","Pro 16GB DDR4-3200"),
 ("ADATA","XPG Lancer 32GB DDR5-6000"),("Patriot","Viper Venom 32GB DDR5-6000"),
),
"Storage": items(
 ("Samsung","990 PRO 1TB NVMe"),("Samsung","990 PRO 2TB NVMe"),("Samsung","990 EVO 1TB"),
 ("Samsung","870 EVO 1TB SATA"),("Samsung","870 QVO 2TB SATA"),
 ("WD","Black SN850X 1TB"),("WD","Black SN850X 2TB"),("WD","Black SN770 1TB"),
 ("WD","Blue SA510 1TB SATA"),("WD","Red SA500 2TB NAS"),
 ("Crucial","T500 1TB NVMe"),("Crucial","T700 2TB NVMe"),("Crucial","MX500 1TB SATA"),
 ("Kingston","NV2 1TB"),("Kingston","KC3000 1TB"),("Kingston","KC3000 2TB"),
 ("Seagate","FireCuda 530 1TB"),("Seagate","BarraCuda 2TB HDD"),("Seagate","IronWolf 4TB NAS"),
 ("Toshiba","P300 2TB HDD"),("Sabrent","Rocket 4 Plus 2TB"),
 ("ADATA","LEGEND 850 1TB"),("TeamGroup","MP44L 1TB"),
),
"Video Cards": items(
 ("NVIDIA","GeForce RTX 4060"),("NVIDIA","GeForce RTX 4060 Ti 8GB"),("NVIDIA","GeForce RTX 4060 Ti 16GB"),
 ("NVIDIA","GeForce RTX 4070"),("NVIDIA","GeForce RTX 4070 SUPER"),("NVIDIA","GeForce RTX 4070 Ti"),
 ("NVIDIA","GeForce RTX 4070 Ti SUPER"),("NVIDIA","GeForce RTX 4080"),("NVIDIA","GeForce RTX 4080 SUPER"),
 ("NVIDIA","GeForce RTX 4090"),
 ("AMD","Radeon RX 7600"),("AMD","Radeon RX 7600 XT"),("AMD","Radeon RX 7700 XT"),
 ("AMD","Radeon RX 7800 XT"),("AMD","Radeon RX 7900 GRE"),("AMD","Radeon RX 7900 XT"),("AMD","Radeon RX 7900 XTX"),
 ("ASUS","TUF RTX 4070 SUPER OC"),("ASUS","ROG STRIX RTX 4080 SUPER"),
 ("MSI","Gaming X Slim RTX 4070 Ti SUPER"),("MSI","Ventus 3X RTX 4060"),
 ("Gigabyte","Gaming OC RTX 4070"),("Gigabyte","AORUS Master RTX 4090"),
 ("Zotac","Twin Edge RTX 4060 Ti"),("PNY","Verto RTX 4070"),
 ("Sapphire","PULSE RX 7800 XT"),("XFX","Speedster MERC 310 RX 7900 XTX"),
),
"Cases": items(
 ("NZXT","H5 Flow"),("NZXT","H7 Flow"),("NZXT","H9 Flow"),
 ("Corsair","4000D Airflow"),("Corsair","5000D Airflow"),("Corsair","2500X"),
 ("Lian Li","Lancool 216"),("Lian Li","O11 Dynamic EVO"),("Lian Li","A3-mATX"),
 ("Fractal Design","Meshify 2 Compact"),("Fractal Design","North"),("Fractal Design","Pop Air"),
 ("Cooler Master","MasterBox NR200P"),("Cooler Master","TD500 Mesh"),
 ("be quiet!","Pure Base 500DX"),("be quiet!","Silent Base 802"),
 ("Phanteks","Eclipse G360A"),("Phanteks","NV5"),
 ("Thermaltake","View 270"),("Montech","AIR 903 MAX"),("Deepcool","CH560"),
),
"Power Supplies": items(
 ("Corsair","RM750e 750W 80+ Gold"),("Corsair","RM850e 850W 80+ Gold"),("Corsair","RM1000x 1000W"),
 ("Corsair","SF750 750W SFX"),("Seasonic","FOCUS GX-750"),("Seasonic","FOCUS GX-850"),
 ("Seasonic","VERTEX GX-1000"),("Seasonic","PRIME TX-850"),
 ("be quiet!","Straight Power 12 850W"),("be quiet!","Pure Power 12 M 750W"),
 ("EVGA","SuperNOVA 850 G6"),("EVGA","SuperNOVA 1000 G7"),
 ("MSI","MAG A850GL"),("MSI","MPG A1000G"),
 ("Cooler Master","MWE Gold 750 V2"),("Thermaltake","Toughpower GF3 850W"),
 ("Gigabyte","UD850GM"),("ASUS","ROG STRIX 850W Gold"),
),
"Optical Drives": items(
 ("ASUS","DRW-24B1ST DVD Writer"),("ASUS","BW-16D1HT Blu-ray Writer"),
 ("LG","GH24NSD1 DVD Writer"),("LG","WH16NS60 Blu-ray Writer"),
 ("Pioneer","BDR-212DBK Blu-ray"),("Pioneer","DVR-S21LBK DVD"),
 ("Lite-On","iHAS124 DVD Writer"),("Samsung","SH-224DB DVD"),
 ("Generic","USB 3.0 DVD RW Slim"),("Generic","USB Blu-ray Writer Slim"),
),
"Operating Systems": items(
 ("Microsoft","Windows 11 Home OEM"),("Microsoft","Windows 11 Pro OEM"),
 ("Microsoft","Windows 11 Pro Retail"),("Microsoft","Windows 10 Pro"),
 ("Microsoft","Windows Server 2022"),("Canonical","Ubuntu Desktop 24.04 LTS"),
 ("Red Hat","RHEL Developer"),("SUSE","Linux Enterprise"),
 ("Apple","macOS Apple Silicon"),("VMware","Workstation Pro"),
),
"Monitors": items(
 ("Dell","S2722QC 27 4K USB-C"),("Dell","G2724D 27 QHD 165Hz"),("Dell","U2723QE 27 4K"),
 ("LG","27GP850-B 27 QHD 180Hz"),("LG","32GQ950-B 32 4K 160Hz"),("LG","27UP850-W 27 4K"),
 ("Samsung","Odyssey G5 27"),("Samsung","Odyssey G7 32"),("Samsung","Odyssey OLED G8"),
 ("ASUS","VG27AQ 27 QHD 165Hz"),("ASUS","PG27AQDM OLED"),("ASUS","ProArt PA278QV"),
 ("MSI","MAG 274QRF QD E2"),("MSI","MPG 321URX OLED"),
 ("Gigabyte","M27Q 27 QHD"),("AOC","24G2SP 24 FHD 165Hz"),
 ("BenQ","EX2780Q"),("BenQ","SW270C Photo"),
 ("ViewSonic","XG2431"),("Alienware","AW2725DF OLED"),
),
"External Storage": items(
 ("Samsung","T7 Shield 1TB"),("Samsung","T7 Shield 2TB"),("Samsung","T9 2TB"),
 ("WD","My Passport 2TB"),("WD","My Passport 5TB"),("WD","Black P50 1TB"),
 ("Seagate","One Touch 2TB"),("Seagate","Expansion 4TB"),("Seagate","FireCuda Gaming Hub 8TB"),
 ("SanDisk","Extreme Portable 1TB"),("SanDisk","Extreme Pro 2TB"),
 ("LaCie","Rugged Mini 2TB"),("LaCie","d2 Professional 8TB"),
 ("Crucial","X10 Pro 2TB"),("Kingston","XS2000 1TB"),("Toshiba","Canvio Basics 2TB"),
),
"Case Accessories": items(
 ("CableMod","Pro ModMesh Cable Kit"),("CableMod","24-pin Extension"),
 ("Corsair","LED Expansion Kit"),("NZXT","Internal USB Hub"),
 ("Lian Li","UNI HUB Controller"),("Phanteks","Neon Digital RGB Strip"),
 ("Cooler Master","ARGB Controller"),("Generic","Vertical GPU Mount"),
 ("Generic","PCIe 4.0 Riser 20cm"),("Generic","Dust Filter 120mm"),("Generic","Dust Filter 140mm"),
 ("Generic","GPU Support Bracket"),
),
"Case Fans": items(
 ("Noctua","NF-A12x25 PWM"),("Noctua","NF-A14 PWM"),("Noctua","NF-P12 redux"),
 ("Corsair","RX120 MAX"),("Corsair","QL120 RGB"),("Corsair","AF120 Elite"),
 ("Arctic","P12 PWM PST"),("Arctic","P14 PWM PST"),("Arctic","P12 Slim"),
 ("be quiet!","Silent Wings 4 120"),("be quiet!","Pure Wings 3 120"),
 ("Lian Li","UNI FAN SL-INF 120"),("Lian Li","UNI FAN AL V2"),
 ("Thermalright","TL-C12C"),("Phanteks","T30-120"),
 ("Cooler Master","SickleFlow 120 ARGB"),("NZXT","F120 RGB Core"),
),
"Fan Controllers": items(
 ("Corsair","iCUE Commander Core XT"),("Corsair","Commander Pro"),
 ("NZXT","RGB Fan Controller"),("Lian Li","UNI HUB SL-INF"),
 ("Aquacomputer","Octo"),("Aquacomputer","Quadro"),
 ("Thermaltake","Commander FP"),("Deepcool","SC790"),
 ("Phanteks","PWM Fan Hub 10-port"),("Noctua","NA-FH1 Hub"),
),
"Sound Cards": items(
 ("Creative","Sound Blaster AE-7"),("Creative","Sound Blaster AE-5 Plus"),
 ("Creative","Sound BlasterX G6"),("Creative","Sound Blaster Play 4"),
 ("ASUS","Xonar SE"),("ASUS","Essence STX II"),
 ("EVGA","NU Audio Pro"),("Generic","USB DAC External"),
),
"Wired Network Adapters": items(
 ("Intel","I225-V 2.5GbE"),("Intel","X550-T2 10GbE"),
 ("TP-Link","TX401 10GbE PCIe"),("TP-Link","TG-3468 Gigabit"),
 ("ASUS","XG-C100C 10G"),("QNAP","QXG-10G1T"),
 ("StarTech","2.5G PCIe NIC"),("Generic","USB 3.0 Gigabit Adapter"),
),
"Wireless Network Adapters": items(
 ("ASUS","PCE-AXE59BT WiFi 6E"),("ASUS","PCE-BE92BT WiFi 7"),
 ("TP-Link","Archer TXE75E WiFi 6E"),("TP-Link","Archer TX55E"),
 ("Intel","Wi-Fi 6E AX210"),("Intel","Wi-Fi 7 BE200"),
 ("Gigabyte","GC-WBAX200"),("Generic","USB WiFi 6 Adapter"),("Fenvi","AX210 PCIe"),
),
"Headphones": items(
 ("Sony","WH-1000XM5"),("Sony","WH-CH720N"),
 ("Bose","QuietComfort Ultra"),("Bose","QuietComfort Headphones"),
 ("HyperX","Cloud III"),("HyperX","Cloud Alpha"),
 ("Logitech","G Pro X 2 Lightspeed"),("Logitech","G735"),
 ("SteelSeries","Arctis Nova Pro"),("SteelSeries","Arctis Nova 7"),
 ("Razer","BlackShark V2 Pro"),("Razer","Kraken V3"),
 ("Sennheiser","HD 560S"),("Sennheiser","Momentum 4"),
 ("Audio-Technica","ATH-M50x"),("Beyerdynamic","DT 770 Pro"),
),
"Keyboards": items(
 ("Logitech","MX Keys S"),("Logitech","G Pro X TKL"),("Logitech","G515 Lightspeed"),
 ("Keychron","Q1 HE"),("Keychron","K2 HE"),("Keychron","V6 Max"),
 ("Razer","BlackWidow V4 Pro"),("Razer","Huntsman V3 Pro TKL"),
 ("Corsair","K70 RGB TKL"),("Corsair","K100 RGB"),
 ("SteelSeries","Apex Pro TKL"),("Wooting","60HE"),
 ("NuPhy","Air75 V2"),("Akko","5075B Plus"),("Leopold","FC660M"),
),
"Mice": items(
 ("Logitech","MX Master 3S"),("Logitech","G Pro X Superlight 2"),("Logitech","G502 X Plus"),
 ("Razer","DeathAdder V3 Pro"),("Razer","Viper V3 Pro"),("Razer","Basilisk V3 Pro"),
 ("Zowie","EC2-CW"),("Zowie","FK2-C"),
 ("SteelSeries","Aerox 5 Wireless"),("Corsair","M75 Air"),
 ("Lamzu","Atlantis Mini Pro"),("Pulsar","X2V2"),
 ("Glorious","Model O 2"),("Finalmouse","UltralightX"),
),
"Speakers": items(
 ("Logitech","Z623"),("Logitech","Z407"),("Logitech","G560"),
 ("Creative","Pebble Pro"),("Creative","T100"),
 ("Edifier","R1280DB"),("Edifier","MR4"),("Edifier","R1700BT"),
 ("Audioengine","A2+"),("Audioengine","HD3"),
 ("Klipsch","ProMedia 2.1"),("Bose","Companion 2 Series III"),
 ("Razer","Nommo V2"),("iLoud","Micro Monitor"),
),
"Webcams": items(
 ("Logitech","Brio 4K"),("Logitech","MX Brio"),("Logitech","C920s Pro"),
 ("Logitech","C922 Pro Stream"),("Logitech","StreamCam"),
 ("Razer","Kiyo Pro"),("Razer","Kiyo Pro Ultra"),
 ("Elgato","Facecam Pro"),("Elgato","Facecam MK.2"),
 ("Microsoft","Modern Webcam"),("Anker","PowerConf C200"),
 ("OBSBOT","Tiny 2"),("Insta360","Link"),
),
}

PREFIX = {
"CPUs":"CPU","CPU Coolers":"CLR","Motherboards":"MBD","Memory":"RAM","Storage":"STO",
"Video Cards":"GPU","Cases":"CSE","Power Supplies":"PSU","Optical Drives":"OPT",
"Operating Systems":"OS","Monitors":"MON","External Storage":"EXT","Case Accessories":"CAC",
"Case Fans":"FAN","Fan Controllers":"FCT","Sound Cards":"SND","Wired Network Adapters":"NIC",
"Wireless Network Adapters":"WFN","Headphones":"HDP","Keyboards":"KBD","Mice":"MSE",
"Speakers":"SPK","Webcams":"CAM",
}

existing_codes = {r[0] for r in conn.execute("SELECT code FROM products")}
existing_names = {r[0].lower() for r in conn.execute("SELECT name FROM products") if r[0]}

# Get max id
row = conn.execute("SELECT COALESCE(MAX(id),0) FROM products").fetchone()
max_id = row[0]

added = 0
skipped = 0
by_cat = {}
seq = max_id

for cat, plist in CATALOG.items():
    prefix = PREFIX[cat]
    for brand, model in plist:
        name = f"{brand} {model}".strip() if brand else model
        if name.lower() in existing_names:
            skipped += 1
            continue
        seq += 1
        code = f"{prefix}{seq:04d}"
        while code in existing_codes:
            seq += 1
            code = f"{prefix}{seq:04d}"
        existing_codes.add(code)
        existing_names.add(name.lower())
        try:
            conn.execute(
                "INSERT INTO products (id, code, name, brand, model, category, unit, buy_price, sell_price, stock, min_stock, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (seq, code, name, brand, model, cat, "pcs", 0, 0, 0, 0, f"{cat}: {name}")
            )
        except sqlite3.IntegrityError:
            conn.execute(
                "INSERT INTO products (code, name, brand, model, category, unit, buy_price, sell_price, stock, min_stock, description) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (code, name, brand, model, cat, "pcs", 0, 0, 0, 0, f"{cat}: {name}")
            )
        added += 1
        by_cat[cat] = by_cat.get(cat, 0) + 1

# categories
try:
    for cat in CATALOG:
        if not conn.execute("SELECT 1 FROM categories WHERE name=?", (cat,)).fetchone():
            conn.execute("INSERT INTO categories (name, parent_id, icon) VALUES (?,0,'folder')", (cat,))
except Exception as e:
    print("cat err", e)

conn.commit()
total = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
print("ADDED", added)
print("SKIPPED", skipped)
print("TOTAL", total)
for c in CATALOG:
    n = conn.execute("SELECT COUNT(*) FROM products WHERE category=?", (c,)).fetchone()[0]
    print(f"  {c}: {n} (new +{by_cat.get(c,0)})")
conn.close()
