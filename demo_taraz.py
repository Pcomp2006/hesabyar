#!/usr/bin/env python3
"""
Demo سریع موتور حسابداری حساب‌یار (Taraz Bridge)
اجرا: python demo_taraz.py
"""
from datetime import datetime
from taraz_bridge import HesabYarLedger

def main():
    print("=" * 60)
    print("  حساب‌یار – دمو موتور دوبل‌انتری Taraz")
    print("=" * 60)

    ledger = HesabYarLedger(base_currency="IRR")
    ledger.ensure_default_coa()

    # 1. سرمایه اولیه
    ledger.engine.new_entry("CAP-001", "آورده اولیه سرمایه") \
        .debit("1101", 100_000_000) \
        .credit("3100", 100_000_000) \
        .post()
    print("✓ سرمایه اولیه ثبت شد")

    # 2. خرید کالا با ارزش افزوده
    ledger.post_purchase(
        entry_id="PUR-001",
        amount=20_000_000,
        expense_or_asset="1200",
        cash_or_ap="1101",
        description="خرید موجودی کالا",
        vat_rate="0.09"
    )
    print("✓ خرید کالا + VAT ثبت شد")

    # 3. فروش
    ledger.post_sale(
        entry_id="SAL-001",
        amount=35_000_000,
        description="فروش خدمات",
        vat_rate="0.09"
    )
    print("✓ فروش + VAT ثبت شد")

    # گزارش‌ها
    print("\n--- مانده حساب‌های کلیدی ---")
    for code, name in [("1101", "نقد"), ("1200", "موجودی کالا"), ("4101", "درآمد"), ("3100", "سرمایه")]:
        bal = ledger.account_balance(code)
        print(f"  {code} {name:15} : {bal:>15,}")

    print("\n--- ترازنامه (خلاصه) ---")
    bs = ledger.balance_sheet()
    for k, v in list(bs.items())[:8]:
        print(f"  {k}: {v}")

    print("\n--- صحت رمزنگاری دفتر ---")
    ok = ledger.verify_ledger()
    print(f"  Ledger integrity: {'OK ✓' if ok else 'FAILED ✗'}")

    print("\nدمو با موفقیت اجرا شد.")
    print("برای استفاده واقعی از APIهای /api/ در server.py استفاده کنید.")

if __name__ == "__main__":
    main()
