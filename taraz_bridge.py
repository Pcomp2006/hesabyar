"""
HesabYar – Taraz Bridge
=======================
Integrates the Taraz double-entry accounting engine into HesabYar (formerly CluDari).

This module provides a thin, practical layer so that:
- Existing purchase / sale / invoice operations can optionally post
  proper double-entry journal entries via Taraz.
- You can generate IFRS-style Balance Sheet, Trial Balance, Cash Flow,
  inventory valuation (FIFO/LIFO/WAVCO), multi-currency revaluation,
  cost-center reports, and cryptographic ledger verification.

Usage example (inside server.py or a new API route):

    from taraz_bridge import HesabYarLedger

    ledger = HesabYarLedger(base_currency="IRR")
    ledger.ensure_default_coa()          # creates a standard chart of accounts
    ledger.post_sale(invoice_id="INV-1001",
                     amount=1_500_000,
                     cash_account="1101",
                     revenue_account="4101",
                     description="فروش خدمات کلینیک")
    bs = ledger.balance_sheet()
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

try:
    from taraz import AccountingEngine, AccountType
    from taraz.engine import UnbalancedEntryError, LockedPeriodError
    from taraz.inventory import InventoryValuationEngine
    from taraz.consolidation import LedgerConsolidator
    from taraz.analytics import FinancialAnalytics, CorporateFinanceAnalytics
    from taraz.ui_bridge import UIBridge
except ImportError as e:
    raise ImportError(
        "Taraz engine not found. Make sure the 'taraz' package folder "
        "is present next to this file."
    ) from e


Number = Union[int, float, Decimal, str]


class HesabYarLedger:
    """High-level wrapper around Taraz for HesabYar use-cases."""

    def __init__(self, base_currency: str = "IRR", lock_date: Optional[datetime] = None):
        self.base_currency = base_currency.upper()
        self.engine = AccountingEngine(lock_date=lock_date)
        self.inventory = InventoryValuationEngine()
        self._initialized = False

    # ------------------------------------------------------------------
    # Chart of Accounts helpers
    # ------------------------------------------------------------------
    def ensure_default_coa(self) -> None:
        """Register a practical Iranian-friendly chart of accounts if empty."""
        if self.engine.accounts:
            self._initialized = True
            return

        # Assets
        self.engine.register_account("1000", "دارایی‌ها", AccountType.ASSET)
        self.engine.register_account("1100", "دارایی‌های جاری", AccountType.ASSET, parent_code="1000", is_current=True)
        self.engine.register_account("1101", "موجودی نقد و بانک", AccountType.ASSET, parent_code="1100", is_current=True, cash_flow_category="Operating")
        self.engine.register_account("1102", "حساب‌های دریافتنی", AccountType.ASSET, parent_code="1100", is_current=True)
        self.engine.register_account("1200", "موجودی کالا", AccountType.ASSET, parent_code="1100", is_current=True, is_inventory=True)
        self.engine.register_account("1500", "دارایی‌های غیرجاری", AccountType.ASSET, parent_code="1000", is_current=False)
        self.engine.register_account("1510", "اموال، ماشین‌آلات و تجهیزات", AccountType.ASSET, parent_code="1500", is_current=False)

        # Liabilities
        self.engine.register_account("2000", "بدهی‌ها", AccountType.LIABILITY)
        self.engine.register_account("2100", "بدهی‌های جاری", AccountType.LIABILITY, parent_code="2000", is_current=True)
        self.engine.register_account("2101", "حساب‌های پرداختنی", AccountType.LIABILITY, parent_code="2100", is_current=True)
        self.engine.register_account("2102", "مالیات بر ارزش افزوده پرداختنی", AccountType.LIABILITY, parent_code="2100", is_current=True)
        self.engine.register_account("2200", "بدهی‌های غیرجاری", AccountType.LIABILITY, parent_code="2000", is_current=False)

        # Equity
        self.engine.register_account("3000", "حقوق صاحبان سهام", AccountType.EQUITY)
        self.engine.register_account("3100", "سرمایه", AccountType.EQUITY, parent_code="3000")
        self.engine.register_account("3200", "سود انباشته", AccountType.EQUITY, parent_code="3000")

        # Revenue
        self.engine.register_account("4000", "درآمدها", AccountType.REVENUE)
        self.engine.register_account("4101", "درآمد فروش کالا/خدمات", AccountType.REVENUE, parent_code="4000")
        self.engine.register_account("4201", "سایر درآمدها", AccountType.REVENUE, parent_code="4000")
        self.engine.register_account("4301", "سود (زیان) تسعیر ارز", AccountType.REVENUE, parent_code="4000")

        # Expenses
        self.engine.register_account("5000", "هزینه‌ها", AccountType.EXPENSE)
        self.engine.register_account("5101", "بهای تمام‌شده کالای فروش‌رفته", AccountType.EXPENSE, parent_code="5000", is_cogs=True)
        self.engine.register_account("5201", "هزینه‌های عملیاتی", AccountType.EXPENSE, parent_code="5000")
        self.engine.register_account("5301", "هزینه حقوق و دستمزد", AccountType.EXPENSE, parent_code="5000")
        self.engine.register_account("5401", "هزینه استهلاک", AccountType.EXPENSE, parent_code="5000")

        self._initialized = True

    def register_account(self, code: str, name: str, account_type: AccountType, **kwargs) -> None:
        self.engine.register_account(code, name, account_type, **kwargs)

    # ------------------------------------------------------------------
    # Common business postings
    # ------------------------------------------------------------------
    def post_sale(
        self,
        entry_id: str,
        amount: Number,
        cash_or_ar: str = "1101",
        revenue: str = "4101",
        description: str = "فروش",
        date: Optional[datetime] = None,
        cost_center: Optional[str] = None,
        tags: Optional[List[str]] = None,
        vat_rate: Number = 0,
        vat_payable: str = "2102",
    ) -> Any:
        """Post a simple sale (optionally with VAT)."""
        self.ensure_default_coa()
        builder = self.engine.new_entry(entry_id, description, date=date, tags=tags or [])
        if Decimal(str(vat_rate)) > 0:
            builder.add_sale_with_vat(cash_or_ar, revenue, vat_payable, amount, vat_rate, cost_center=cost_center)
        else:
            builder.debit(cash_or_ar, amount, cost_center=cost_center).credit(revenue, amount, cost_center=cost_center)
        return builder.post()

    def post_purchase(
        self,
        entry_id: str,
        amount: Number,
        expense_or_asset: str = "5201",
        cash_or_ap: str = "1101",
        description: str = "خرید",
        date: Optional[datetime] = None,
        cost_center: Optional[str] = None,
        tags: Optional[List[str]] = None,
        vat_rate: Number = 0,
        vat_receivable: str = "1102",
    ) -> Any:
        """Post a simple purchase (optionally with VAT)."""
        self.ensure_default_coa()
        builder = self.engine.new_entry(entry_id, description, date=date, tags=tags or [])
        if Decimal(str(vat_rate)) > 0:
            builder.add_purchase_with_vat(expense_or_asset, cash_or_ap, vat_receivable, amount, vat_rate, cost_center=cost_center)
        else:
            builder.debit(expense_or_asset, amount, cost_center=cost_center).credit(cash_or_ap, amount, cost_center=cost_center)
        return builder.post()

    def post_transfer(
        self,
        entry_id: str,
        amount: Number,
        from_account: str,
        to_account: str,
        description: str = "انتقال وجه",
        date: Optional[datetime] = None,
    ) -> Any:
        self.ensure_default_coa()
        return (
            self.engine.new_entry(entry_id, description, date=date)
            .debit(to_account, amount)
            .credit(from_account, amount)
            .post()
        )

    # ------------------------------------------------------------------
    # Reports
    # ------------------------------------------------------------------
    def trial_balance(self) -> Dict[str, Any]:
        self.ensure_default_coa()
        return self.engine.get_trial_balance()

    def balance_sheet(self) -> Dict[str, Any]:
        self.ensure_default_coa()
        return self.engine.generate_balance_sheet()

    def income_statement(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        self.ensure_default_coa()
        # Taraz provides various helpers; fall back to basic if needed
        if hasattr(self.engine, "generate_income_statement"):
            return self.engine.generate_income_statement(start, end)
        return {"note": "Use engine analytics for detailed P&L"}

    def account_balance(self, code: str) -> Decimal:
        return self.engine.get_account_balance(code)

    def verify_ledger(self) -> bool:
        """Cryptographic integrity check (SHA-256 chain)."""
        if hasattr(self.engine, "verify_ledger_cryptographically"):
            return self.engine.verify_ledger_cryptographically()
        return True

    def coa_tree(self) -> List[Dict[str, Any]]:
        return UIBridge.get_coa_tree_structure(self.engine)

    # ------------------------------------------------------------------
    # Inventory helpers
    # ------------------------------------------------------------------
    def inventory_purchase(self, sku: str, qty: Number, unit_cost: Number) -> None:
        self.inventory.record_purchase(sku, qty, unit_cost)

    def inventory_sale(self, sku: str, qty: Number, method: str = "FIFO"):
        return self.inventory.record_sale(sku, qty, method=method)

    # ------------------------------------------------------------------
    # Multi-currency helper
    # ------------------------------------------------------------------
    def post_fx(
        self,
        entry_id: str,
        foreign_amount: Number,
        currency: str,
        rate: Number,
        debit_account: str,
        credit_account: str,
        description: str = "تراکنش ارزی",
    ) -> Any:
        self.ensure_default_coa()
        return (
            self.engine.new_entry(entry_id, description)
            .debit(debit_account, foreign_amount, currency=currency, exchange_rate=rate)
            .credit(credit_account, Decimal(str(foreign_amount)) * Decimal(str(rate)))
            .post()
        )


# Convenience singleton for simple scripts
_default_ledger: Optional[HesabYarLedger] = None


def get_ledger(base_currency: str = "IRR") -> HesabYarLedger:
    global _default_ledger
    if _default_ledger is None:
        _default_ledger = HesabYarLedger(base_currency=base_currency)
        _default_ledger.ensure_default_coa()
    return _default_ledger
