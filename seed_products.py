"""
CluDari - Product Database Seed
دیتابیس کالاها
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cludari.db')

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def seed_products():
    conn = get_conn()
    c = conn.cursor()
    count = 0

    products = [
        # ═══ NVIDIA RTX 50 ═══
        ('NV-RTX5090', 'RTX 5090', 'NVIDIA', 'RTX 5090', 'کارت گرافیک'),
        ('NV-RTX5080', 'RTX 5080', 'NVIDIA', 'RTX 5080', 'کارت گرافیک'),
        ('NV-RTX5070TI', 'RTX 5070 Ti', 'NVIDIA', 'RTX 5070 Ti', 'کارت گرافیک'),
        ('NV-RTX5070', 'RTX 5070', 'NVIDIA', 'RTX 5070', 'کارت گرافیک'),
        ('NV-RTX5060TI', 'RTX 5060 Ti', 'NVIDIA', 'RTX 5060 Ti', 'کارت گرافیک'),

        # ═══ NVIDIA RTX 40 ═══
        ('NV-RTX4090', 'RTX 4090', 'NVIDIA', 'RTX 4090', 'کارت گرافیک'),
        ('NV-RTX4080S', 'RTX 4080 SUPER', 'NVIDIA', 'RTX 4080 SUPER', 'کارت گرافیک'),
        ('NV-RTX4080', 'RTX 4080', 'NVIDIA', 'RTX 4080', 'کارت گرافیک'),
        ('NV-RTX4070TIS', 'RTX 4070 Ti SUPER', 'NVIDIA', 'RTX 4070 Ti SUPER', 'کارت گرافیک'),
        ('NV-RTX4070S', 'RTX 4070 SUPER', 'NVIDIA', 'RTX 4070 SUPER', 'کارت گرافیک'),
        ('NV-RTX4060TI', 'RTX 4060 Ti', 'NVIDIA', 'RTX 4060 Ti', 'کارت گرافیک'),
        ('NV-RTX4060', 'RTX 4060', 'NVIDIA', 'RTX 4060', 'کارت گرافیک'),

        # ═══ NVIDIA RTX 30 ═══
        ('NV-RTX3090TI', 'RTX 3090 Ti', 'NVIDIA', 'RTX 3090 Ti', 'کارت گرافیک'),
        ('NV-RTX3090', 'RTX 3090', 'NVIDIA', 'RTX 3090', 'کارت گرافیک'),
        ('NV-RTX3080TI', 'RTX 3080 Ti', 'NVIDIA', 'RTX 3080 Ti', 'کارت گرافیک'),
        ('NV-RTX3080', 'RTX 3080', 'NVIDIA', 'RTX 3080', 'کارت گرافیک'),
        ('NV-RTX3070TI', 'RTX 3070 Ti', 'NVIDIA', 'RTX 3070 Ti', 'کارت گرافیک'),
        ('NV-RTX3070', 'RTX 3070', 'NVIDIA', 'RTX 3070', 'کارت گرافیک'),
        ('NV-RTX3060TI', 'RTX 3060 Ti', 'NVIDIA', 'RTX 3060 Ti', 'کارت گرافیک'),
        ('NV-RTX3060', 'RTX 3060', 'NVIDIA', 'RTX 3060', 'کارت گرافیک'),
        ('NV-RTX3050', 'RTX 3050', 'NVIDIA', 'RTX 3050', 'کارت گرافیک'),

        # ═══ NVIDIA GTX 16 ═══
        ('NV-GTX1660S', 'GTX 1660 SUPER', 'NVIDIA', 'GTX 1660 SUPER', 'کارت گرافیک'),
        ('NV-GTX1660TI', 'GTX 1660 Ti', 'NVIDIA', 'GTX 1660 Ti', 'کارت گرافیک'),
        ('NV-GTX1660', 'GTX 1660', 'NVIDIA', 'GTX 1660', 'کارت گرافیک'),
        ('NV-GTX1650S', 'GTX 1650 SUPER', 'NVIDIA', 'GTX 1650 SUPER', 'کارت گرافیک'),
        ('NV-GTX1650', 'GTX 1650', 'NVIDIA', 'GTX 1650', 'کارت گرافیک'),
        ('NV-GTX1630', 'GTX 1630', 'NVIDIA', 'GTX 1630', 'کارت گرافیک'),

        # ═══ NVIDIA GTX 10 ═══
        ('NV-GTX1080TI', 'GTX 1080 Ti', 'NVIDIA', 'GTX 1080 Ti', 'کارت گرافیک'),
        ('NV-GTX1080', 'GTX 1080', 'NVIDIA', 'GTX 1080', 'کارت گرافیک'),
        ('NV-GTX1070TI', 'GTX 1070 Ti', 'NVIDIA', 'GTX 1070 Ti', 'کارت گرافیک'),
        ('NV-GTX1070', 'GTX 1070', 'NVIDIA', 'GTX 1070', 'کارت گرافیک'),
        ('NV-GTX1060_6G', 'GTX 1060 6GB', 'NVIDIA', 'GTX 1060 6GB', 'کارت گرافیک'),
        ('NV-GTX1060_3G', 'GTX 1060 3GB', 'NVIDIA', 'GTX 1060 3GB', 'کارت گرافیک'),
        ('NV-GTX1050TI', 'GTX 1050 Ti', 'NVIDIA', 'GTX 1050 Ti', 'کارت گرافیک'),
        ('NV-GTX1050', 'GTX 1050', 'NVIDIA', 'GTX 1050', 'کارت گرافیک'),

        # ═══ NVIDIA GTX 900 ═══
        ('NV-GTX980TI', 'GTX 980 Ti', 'NVIDIA', 'GTX 980 Ti', 'کارت گرافیک'),
        ('NV-GTX980', 'GTX 980', 'NVIDIA', 'GTX 980', 'کارت گرافیک'),
        ('NV-GTX970', 'GTX 970', 'NVIDIA', 'GTX 970', 'کارت گرافیک'),
        ('NV-GTX960', 'GTX 960', 'NVIDIA', 'GTX 960', 'کارت گرافیک'),
        ('NV-GTX950', 'GTX 950', 'NVIDIA', 'GTX 950', 'کارت گرافیک'),

        # ═══ NVIDIA GTX 700 ═══
        ('NV-GTX780TI', 'GTX 780 Ti', 'NVIDIA', 'GTX 780 Ti', 'کارت گرافیک'),
        ('NV-GTX780', 'GTX 780', 'NVIDIA', 'GTX 780', 'کارت گرافیک'),
        ('NV-GTX770', 'GTX 770', 'NVIDIA', 'GTX 770', 'کارت گرافیک'),
        ('NV-GTX760', 'GTX 760', 'NVIDIA', 'GTX 760', 'کارت گرافیک'),
        ('NV-GTX750TI', 'GTX 750 Ti', 'NVIDIA', 'GTX 750 Ti', 'کارت گرافیک'),
        ('NV-GTX750', 'GTX 750', 'NVIDIA', 'GTX 750', 'کارت گرافیک'),
        ('NV-GTX745', 'GTX 745', 'NVIDIA', 'GTX 745', 'کارت گرافیک'),

        # ═══ NVIDIA GT ═══
        ('NV-GT1030', 'GT 1030', 'NVIDIA', 'GT 1030', 'کارت گرافیک'),
        ('NV-GT730', 'GT 730', 'NVIDIA', 'GT 730', 'کارت گرافیک'),
        ('NV-GT710', 'GT 710', 'NVIDIA', 'GT 710', 'کارت گرافیک'),
        ('NV-GT720', 'GT 720', 'NVIDIA', 'GT 720', 'کارت گرافیک'),
        ('NV-GT740', 'GT 740', 'NVIDIA', 'GT 740', 'کارت گرافیک'),
        ('NV-GT640', 'GT 640', 'NVIDIA', 'GT 640', 'کارت گرافیک'),
        ('NV-GT630', 'GT 630', 'NVIDIA', 'GT 630', 'کارت گرافیک'),
        ('NV-GT620', 'GT 620', 'NVIDIA', 'GT 620', 'کارت گرافیک'),
        ('NV-GT610', 'GT 610', 'NVIDIA', 'GT 610', 'کارت گرافیک'),
        ('NV-GT545', 'GT 545', 'NVIDIA', 'GT 545', 'کارت گرافیک'),
        ('NV-GT530', 'GT 530', 'NVIDIA', 'GT 530', 'کارت گرافیک'),
        ('NV-GT520', 'GT 520', 'NVIDIA', 'GT 520', 'کارت گرافیک'),
        ('NV-GT440', 'GT 440', 'NVIDIA', 'GT 440', 'کارت گرافیک'),
        ('NV-GT430', 'GT 430', 'NVIDIA', 'GT 430', 'کارت گرافیک'),
        ('NV-GT420', 'GT 420', 'NVIDIA', 'GT 420', 'کارت گرافیک'),
        ('NV-GT340', 'GT 340', 'NVIDIA', 'GT 340', 'کارت گرافیک'),
        ('NV-GT330', 'GT 330', 'NVIDIA', 'GT 330', 'کارت گرافیک'),
        ('NV-GT320', 'GT 320', 'NVIDIA', 'GT 320', 'کارت گرافیک'),
        ('NV-GT240', 'GT 240', 'NVIDIA', 'GT 240', 'کارت گرافیک'),
        ('NV-GT220', 'GT 220', 'NVIDIA', 'GT 220', 'کارت گرافیک'),
        ('NV-GT140', 'GT 140', 'NVIDIA', 'GT 140', 'کارت گرافیک'),
        ('NV-GT130', 'GT 130', 'NVIDIA', 'GT 130', 'کارت گرافیک'),
        ('NV-GT120', 'GT 120', 'NVIDIA', 'GT 120', 'کارت گرافیک'),

        # ═══ AMD RX 9000 ═══
        ('AMD-RX9070XT', 'RX 9070 XT', 'AMD', 'RX 9070 XT', 'کارت گرافیک'),
        ('AMD-RX9070', 'RX 9070', 'AMD', 'RX 9070', 'کارت گرافیک'),

        # ═══ AMD RX 7000 ═══
        ('AMD-RX7900XTX', 'RX 7900 XTX', 'AMD', 'RX 7900 XTX', 'کارت گرافیک'),
        ('AMD-RX7900XT', 'RX 7900 XT', 'AMD', 'RX 7900 XT', 'کارت گرافیک'),
        ('AMD-RX7800XT', 'RX 7800 XT', 'AMD', 'RX 7800 XT', 'کارت گرافیک'),
        ('AMD-RX7700XT', 'RX 7700 XT', 'AMD', 'RX 7700 XT', 'کارت گرافیک'),
        ('AMD-RX7600', 'RX 7600', 'AMD', 'RX 7600', 'کارت گرافیک'),

        # ═══ AMD RX 6000 ═══
        ('AMD-RX6950XT', 'RX 6950 XT', 'AMD', 'RX 6950 XT', 'کارت گرافیک'),
        ('AMD-RX6900XT', 'RX 6900 XT', 'AMD', 'RX 6900 XT', 'کارت گرافیک'),
        ('AMD-RX6800XT', 'RX 6800 XT', 'AMD', 'RX 6800 XT', 'کارت گرافیک'),
        ('AMD-RX6800', 'RX 6800', 'AMD', 'RX 6800', 'کارت گرافیک'),
        ('AMD-RX6750XT', 'RX 6750 XT', 'AMD', 'RX 6750 XT', 'کارت گرافیک'),
        ('AMD-RX6700XT', 'RX 6700 XT', 'AMD', 'RX 6700 XT', 'کارت گرافیک'),
        ('AMD-RX6650XT', 'RX 6650 XT', 'AMD', 'RX 6650 XT', 'کارت گرافیک'),
        ('AMD-RX6600XT', 'RX 6600 XT', 'AMD', 'RX 6600 XT', 'کارت گرافیک'),
        ('AMD-RX6600', 'RX 6600', 'AMD', 'RX 6600', 'کارت گرافیک'),
        ('AMD-RX6500XT', 'RX 6500 XT', 'AMD', 'RX 6500 XT', 'کارت گرافیک'),
        ('AMD-RX6400', 'RX 6400', 'AMD', 'RX 6400', 'کارت گرافیک'),

        # ═══ Intel Arc ═══
        ('INT-ARC770', 'Arc A770', 'Intel', 'Arc A770', 'کارت گرافیک'),
        ('INT-ARC750', 'Arc A750', 'Intel', 'Arc A750', 'کارت گرافیک'),
        ('INT-ARC580', 'Arc A580', 'Intel', 'Arc A580', 'کارت گرافیک'),
        ('INT-ARC380', 'Arc A380', 'Intel', 'Arc A380', 'کارت گرافیک'),
        ('INT-ARC310', 'Arc A310', 'Intel', 'Arc A310', 'کارت گرافیک'),

        # ═══ RAM ═══
        ('RAM-DDR5_5200_16', 'DDR5 5200MHz 16GB', 'Generic', 'DDR5 5200 16GB', 'رم'),
        ('RAM-DDR5_5200_32', 'DDR5 5200MHz 32GB', 'Generic', 'DDR5 5200 32GB', 'رم'),
        ('RAM-DDR5_4800_16', 'DDR5 4800MHz 16GB', 'Generic', 'DDR5 4800 16GB', 'رم'),
        ('RAM-DDR5_4800_32', 'DDR5 4800MHz 32GB', 'Generic', 'DDR5 4800 32GB', 'رم'),
        ('RAM-DDR4_3200_8', 'DDR4 3200MHz 8GB', 'Generic', 'DDR4 3200 8GB', 'رم'),
        ('RAM-DDR4_3200_16', 'DDR4 3200MHz 16GB', 'Generic', 'DDR4 3200 16GB', 'رم'),
        ('RAM-DDR4_3200_32', 'DDR4 3200MHz 32GB', 'Generic', 'DDR4 3200 32GB', 'رم'),
        ('RAM-DDR4_3000_8', 'DDR4 3000MHz 8GB', 'Generic', 'DDR4 3000 8GB', 'رم'),
        ('RAM-DDR4_3000_16', 'DDR4 3000MHz 16GB', 'Generic', 'DDR4 3000 16GB', 'رم'),
        ('RAM-DDR4_2666_8', 'DDR4 2666MHz 8GB', 'Generic', 'DDR4 2666 8GB', 'رم'),
        ('RAM-DDR4_2400_8', 'DDR4 2400MHz 8GB', 'Generic', 'DDR4 2400 8GB', 'رم'),
        ('RAM-DDR3_1600_4', 'DDR3 1600MHz 4GB', 'Generic', 'DDR3 1600 4GB', 'رم'),
        ('RAM-DDR3_1600_8', 'DDR3 1600MHz 8GB', 'Generic', 'DDR3 1600 8GB', 'رم'),
        ('RAM-DDR3_1333_4', 'DDR3 1333MHz 4GB', 'Generic', 'DDR3 1333 4GB', 'رم'),
        ('RAM-DDR2_800_2', 'DDR2 800MHz 2GB', 'Generic', 'DDR2 800 2GB', 'رم'),
        ('RAM-DDR2_800_4', 'DDR2 800MHz 4GB', 'Generic', 'DDR2 800 4GB', 'رم'),
        ('RAM-DDR1_400_512', 'DDR 400MHz 512MB', 'Generic', 'DDR 400 512MB', 'رم'),
        ('RAM-DDR1_400_1', 'DDR 400MHz 1GB', 'Generic', 'DDR 400 1GB', 'رم'),

        # ═══ CPUs ═══
        ('CPU-i9_14900K', 'Intel Core i9-14900K', 'Intel', 'i9-14900K', 'پردازنده'),
        ('CPU-i7_14700K', 'Intel Core i7-14700K', 'Intel', 'i7-14700K', 'پردازنده'),
        ('CPU-i5_14600K', 'Intel Core i5-14600K', 'Intel', 'i5-14600K', 'پردازنده'),
        ('CPU-i9_13900K', 'Intel Core i9-13900K', 'Intel', 'i9-13900K', 'پردازنده'),
        ('CPU-i7_13700K', 'Intel Core i7-13700K', 'Intel', 'i7-13700K', 'پردازنده'),
        ('CPU-i5_13600K', 'Intel Core i5-13600K', 'Intel', 'i5-13600K', 'پردازنده'),
        ('CPU-R9_7950X', 'AMD Ryzen 9 7950X', 'AMD', 'Ryzen 9 7950X', 'پردازنده'),
        ('CPU-R9_7900X', 'AMD Ryzen 9 7900X', 'AMD', 'Ryzen 9 7900X', 'پردازنده'),
        ('CPU-R7_7700X', 'AMD Ryzen 7 7700X', 'AMD', 'Ryzen 7 7700X', 'پردازنده'),
        ('CPU-R5_7600X', 'AMD Ryzen 5 7600X', 'AMD', 'Ryzen 5 7600X', 'پردازنده'),
        ('CPU-R7_5800X', 'AMD Ryzen 7 5800X', 'AMD', 'Ryzen 7 5800X', 'پردازنده'),
        ('CPU-R5_5600X', 'AMD Ryzen 5 5600X', 'AMD', 'Ryzen 5 5600X', 'پردازنده'),

        # ═══ SSDs ═══
        ('SSD-SAM_990_1T', 'Samsung 990 Pro 1TB', 'Samsung', '990 Pro 1TB', 'اس‌اس‌دی'),
        ('SSD-SAM_980_1T', 'Samsung 980 Pro 1TB', 'Samsung', '980 Pro 1TB', 'اس‌اس‌دی'),
        ('SSD-SAM_870_1T', 'Samsung 870 EVO 1TB', 'Samsung', '870 EVO 1TB', 'اس‌اس‌دی'),
        ('SSD-KNG_NV2_2T', 'Kingston NV2 2TB', 'Kingston', 'NV2 2TB', 'اس‌اس‌دی'),
        ('SSD-KNG_NV2_1T', 'Kingston NV2 1TB', 'Kingston', 'NV2 1TB', 'اس‌اس‌دی'),
        ('SSD-WD_SN850X', 'WD Black SN850X 1TB', 'Western Digital', 'SN850X 1TB', 'اس‌اس‌دی'),
        ('SSD-Crucial_P3', 'Crucial P3 Plus 1TB', 'Crucial', 'P3 Plus 1TB', 'اس‌اس‌دی'),

        # ═══ HDDs ═══
        ('HDD-WD_1T', 'WD Blue 1TB', 'Western Digital', 'WD10EZEX', 'هارد دیسک'),
        ('HDD-WD_2T', 'WD Blue 2TB', 'Western Digital', 'WD20EZAZ', 'هارد دیسک'),
        ('HDD-SEG_1T', 'Seagate Barracuda 1TB', 'Seagate', 'ST1000DM010', 'هارد دیسک'),
        ('HDD-SEG_2T', 'Seagate Barracuda 2TB', 'Seagate', 'ST2000DM008', 'هارد دیسک'),

        # ═══ Monitors ═══
        ('SAM-S24D330', 'Samsung S24D330 24"', 'Samsung', 'S24D330', 'مانیتور'),
        ('SAM-S27F350', 'Samsung S27F350 27"', 'Samsung', 'S27F350', 'مانیتور'),
        ('SAM-OG5_27', 'Samsung Odyssey G5 27"', 'Samsung', 'Odyssey G5', 'مانیتور'),
        ('SAM-OG7_27', 'Samsung Odyssey G7 27"', 'Samsung', 'Odyssey G7', 'مانیتور'),
        ('LG-27GP850', 'LG 27GP850 27"', 'LG', '27GP850', 'مانیتور'),
        ('LG-27GL850', 'LG 27GL850 27"', 'LG', '27GL850', 'مانیتور'),
        ('LG-27GR95QE', 'LG UltraGear 27GR95QE', 'LG', '27GR95QE', 'مانیتور'),

        # ═══ Laptops ═══
        ('LAP-MBA_M3', 'MacBook Air M3', 'Apple', 'MacBook Air M3', 'لپ‌تاپ'),
        ('LAP-MBP14_M4', 'MacBook Pro 14 M4', 'Apple', 'MacBook Pro 14 M4', 'لپ‌تاپ'),
        ('LAP-MBP16_M4', 'MacBook Pro 16 M4', 'Apple', 'MacBook Pro 16 M4', 'لپ‌تاپ'),
        ('LAP-ROG_STRIX', 'ASUS ROG Strix G16', 'ASUS', 'ROG Strix G16', 'لپ‌تاپ'),
        ('LAP-TUF_GAMING', 'ASUS TUF Gaming F15', 'ASUS', 'TUF Gaming F15', 'لپ‌تاپ'),
        ('LAP-MSI_RAIDER', 'MSI Raider GE78 HX', 'MSI', 'Raider GE78', 'لپ‌تاپ'),
        ('LAP-DELL_XPS15', 'Dell XPS 15', 'Dell', 'XPS 15', 'لپ‌تاپ'),
        ('LAP-HP_VICTUS', 'HP Victus 16', 'HP', 'Victus 16', 'لپ‌تاپ'),
        ('LAP-LEN_LEGI', 'Lenovo Legion Pro 7i', 'Lenovo', 'Legion Pro 7i', 'لپ‌تاپ'),

        # ═══ Phones ═══
        ('SAM-S25U', 'Samsung Galaxy S25 Ultra', 'Samsung', 'Galaxy S25 Ultra', 'گوشی'),
        ('SAM-S24U', 'Samsung Galaxy S24 Ultra', 'Samsung', 'Galaxy S24 Ultra', 'گوشی'),
        ('SAM-S23U', 'Samsung Galaxy S23 Ultra', 'Samsung', 'Galaxy S23 Ultra', 'گوشی'),
        ('APL-16PM', 'iPhone 16 Pro Max', 'Apple', 'iPhone 16 Pro Max', 'گوشی'),
        ('APL-15PM', 'iPhone 15 Pro Max', 'Apple', 'iPhone 15 Pro Max', 'گوشی'),
        ('XI-MI15', 'Xiaomi Mi 15', 'Xiaomi', 'Mi 15', 'گوشی'),

        # ═══ Huawei Modems ═══
        ('HW-HG8145V', 'Huawei HG8145V', 'Huawei', 'HG8145V', 'مودم'),
        ('HW-HG8245Q', 'Huawei HG8245Q', 'Huawei', 'HG8245Q', 'مودم'),
        ('HW-HS8145V', 'Huawei HS8145V', 'Huawei', 'HS8145V', 'مودم'),

        # ═══ Keyboards ═══
        ('KB-LOG_G915', 'Logitech G915 TKL', 'Logitech', 'G915 TKL', 'کیبورد'),
        ('KB-RAZ_HUNTSM', 'Razer Huntsman Mini', 'Razer', 'Huntsman Mini', 'کیبورد'),
        ('KB-CRS_K70', 'Corsair K70 RGB', 'Corsair', 'K70 RGB', 'کیبورد'),

        # ═══ Mice ═══
        ('MS-LOG_G502', 'Logitech G502 X', 'Logitech', 'G502 X', 'ماوس'),
        ('MS-LOG_MX3', 'Logitech MX Master 3S', 'Logitech', 'MX Master 3S', 'ماوس'),
        ('MS-RAZ_DEATH', 'Razer DeathAdder V3', 'Razer', 'DeathAdder V3', 'ماوس'),

        # ═══ USB Flash ═══
        ('FLASH-SD_32', 'SanDisk 32GB', 'SanDisk', 'Cruzer Blade 32GB', 'فلش مموری'),
        ('FLASH-SD_64', 'SanDisk 64GB', 'SanDisk', 'Ultra 64GB', 'فلش مموری'),
        ('FLASH-SD_128', 'SanDisk 128GB', 'SanDisk', 'Ultra 128GB', 'فلش مموری'),
        ('FLASH-KNG_32', 'Kingston 32GB', 'Kingston', 'DataTraveler 32GB', 'فلش مموری'),
        ('FLASH-KNG_64', 'Kingston 64GB', 'Kingston', 'DataTraveler 64GB', 'فلش مموری'),

        # ═══ Home Appliances ═══
        ('AC-SAM_12K', 'Samsung AC 12000BTU', 'Samsung', 'AR12', 'کولر'),
        ('AC-GREE_12K', 'Gree AC 12000BTU', 'Gree', 'GS12', 'کولر'),
        ('FRG-SAM_BT', 'Samsung Bottom Mount 300L', 'Samsung', 'RB30', 'یخچال'),
        ('WM-SAM_8', 'Samsung 8kg Washing Machine', 'Samsung', 'WW80', 'لباسشویی'),
        ('MW-SAM', 'Samsung Microwave 28L', 'Samsung', 'ME28', 'مایکروویو'),
        ('VC-PHILIPS', 'Philips Vacuum Cleaner', 'Philips', 'FC9352', 'جاروبرقی'),
        ('IRON-PHILIPS', 'Philips Steam Iron', 'Philips', 'GC1750', 'اتو'),

        # ═══ Cases ═══
        ('CASE-NZXT_H7', 'NZXT H7 Flow', 'NZXT', 'H7 Flow', 'کیس'),
        ('CASE-CRS_4000D', 'Corsair 4000D Airflow', 'Corsair', '4000D Airflow', 'کیس'),
        ('CASE-LL_O11', 'Lian Li O11 Dynamic', 'Lian Li', 'O11 Dynamic', 'کیس'),
    ]

    for p in products:
        try:
            c.execute("INSERT OR IGNORE INTO products (code, name, brand, model, category) VALUES (?,?,?,?,?)", p)
            count += 1
        except:
            pass

    conn.commit()
    conn.close()
    return count

if __name__ == "__main__":
    print("Seeding products...")
    count = seed_products()
    print(f"Done! {count} products added.")
