import re
from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from .models import Account, AccountType, JournalEntry, Posting, QueryResult

class AccountingError(Exception):
    pass

class UnbalancedEntryError(AccountingError):
    pass

class AccountNotFoundError(AccountingError):
    pass

class DuplicateAccountError(AccountingError):
    pass

class LockedPeriodError(AccountingError):
    pass


class JournalEntryBuilder:
    def __init__(self, engine: "AccountingEngine", entry_id: str, description: str, date: Optional[datetime] = None, is_adjusting: bool = False, tags: Optional[List[str]] = None):
        self.engine = engine
        self.entry = JournalEntry(entry_id=entry_id, description=description, date=date or datetime.now(), is_adjusting=is_adjusting, tags=tags or [])

    def debit(self, account_code: str, amount: Union[int, float, Decimal, str], 
              cost_center: Optional[str] = None, currency: str = "BASE", 
              exchange_rate: Union[int, float, Decimal, str] = 1.0) -> "JournalEntryBuilder":
        self.entry.add_posting(account_code, debit=amount, cost_center=cost_center, currency=currency, exchange_rate=exchange_rate)
        return self

    def credit(self, account_code: str, amount: Union[int, float, Decimal, str], 
               cost_center: Optional[str] = None, currency: str = "BASE", 
               exchange_rate: Union[int, float, Decimal, str] = 1.0) -> "JournalEntryBuilder":
        self.entry.add_posting(account_code, credit=amount, cost_center=cost_center, currency=currency, exchange_rate=exchange_rate)
        return self

    def add_sale_with_vat(self, cash_or_ar_code: str, revenue_code: str, vat_payable_code: str, 
                          base_amount: Union[int, float, Decimal, str], vat_rate: Union[int, float, Decimal, str],
                          cost_center: Optional[str] = None) -> "JournalEntryBuilder":
        base = Decimal(str(base_amount))
        rate = Decimal(str(vat_rate))
        vat = base * rate
        total = base + vat

        self.debit(cash_or_ar_code, total, cost_center=cost_center)
        self.credit(revenue_code, base, cost_center=cost_center)
        self.credit(vat_payable_code, vat)
        return self

    def add_purchase_with_vat(self, asset_or_expense_code: str, cash_or_ap_code: str, vat_receivable_code: str, 
                              base_amount: Union[int, float, Decimal, str], vat_rate: Union[int, float, Decimal, str],
                              cost_center: Optional[str] = None) -> "JournalEntryBuilder":
        base = Decimal(str(base_amount))
        rate = Decimal(str(vat_rate))
        vat = base * rate
        total = base + vat

        self.debit(asset_or_expense_code, base, cost_center=cost_center)
        self.debit(vat_receivable_code, vat)
        self.credit(cash_or_ap_code, total, cost_center=cost_center)
        return self

    def post(self) -> JournalEntry:
        self.engine.post_entry(self.entry)
        return self.entry


class AccountingEngine:
    def __init__(self, lock_date: Optional[datetime] = None):
        self.accounts: Dict[str, Account] = {}
        self.journal: List[JournalEntry] = []
        self.lock_date: Optional[datetime] = lock_date
        self.budgets: List[Any] = []
        self.templates: Dict[str, Any] = {}
        self.matches: List[Dict[str, Any]] = []

    def set_lock_date(self, lock_date: datetime):
        self.lock_date = lock_date

    def register_account(self, code: str, name: str, account_type: AccountType, 
                         parent_code: Optional[str] = None, is_current: bool = False, 
                         is_inventory: bool = False, is_cogs: bool = False,
                         cash_flow_category: Optional[str] = None) -> Account:
        if code in self.accounts:
            raise DuplicateAccountError(f"Account code '{code}' is already registered.")
        
        if parent_code and parent_code not in self.accounts:
            raise AccountNotFoundError(f"Parent account '{parent_code}' does not exist.")

        resolved_type = account_type
        if parent_code:
            resolved_type = self.accounts[parent_code].type

        account = Account(
            code=code, 
            name=name, 
            type=resolved_type, 
            parent_code=parent_code,
            is_current=is_current,
            is_inventory=is_inventory,
            is_cogs=is_cogs,
            cash_flow_category=cash_flow_category
        )
        self.accounts[code] = account
        return account

    def new_entry(self, entry_id: str, description: str, date: Optional[datetime] = None, is_adjusting: bool = False, tags: Optional[List[str]] = None) -> JournalEntryBuilder:
        return JournalEntryBuilder(self, entry_id, description, date, is_adjusting, tags)

    def post_entry(self, entry: JournalEntry):
        if self.lock_date and entry.date <= self.lock_date:
            raise LockedPeriodError(
                f"Cannot post entry '{entry.entry_id}' dated {entry.date}. "
                f"The accounting period is locked up to {self.lock_date}."
            )

        if not entry.is_balanced:
            raise UnbalancedEntryError(
                f"Journal entry '{entry.entry_id}' is not balanced. Difference: {entry.balance_difference}"
            )

        for posting in entry.postings:
            if posting.account_code not in self.accounts:
                raise AccountNotFoundError(f"Account code '{posting.account_code}' does not exist.")

        # --- CRYPTOGRAPHIC IMMUTABILITY SEALING (v1.0.0) ---
        prev_hash = self.journal[-1].hash if self.journal else "0" * 64
        entry.previous_hash = prev_hash
        entry.hash = entry.calculate_hash(prev_hash)

        self.journal.append(entry)

    def _is_leaf(self, code: str) -> bool:
        """Return True if the account has no children."""
        for acc in self.accounts.values():
            if acc.parent_code == code:
                return False
        return True

    def get_account_balance(self, code: str, cost_center: Optional[str] = None, include_adjusting: bool = True) -> Decimal:
        """
        Calculate the current balance of an account.
        For hierarchical accounts, recursively sum all leaf descendants.
        Normal balance: Asset/Expense = Debit normal, Liability/Equity/Revenue = Credit normal.
        """
        if code not in self.accounts:
            raise AccountNotFoundError(f"Account code '{code}' does not exist.")

        # Collect all leaf codes under this account (including itself if leaf)
        def collect_leaves(c: str) -> list:
            children = [a.code for a in self.accounts.values() if a.parent_code == c]
            if not children:
                return [c]
            result = []
            for ch in children:
                result.extend(collect_leaves(ch))
            return result

        leaf_codes = collect_leaves(code)
        total = Decimal("0.00")

        for entry in self.journal:
            if not include_adjusting and entry.is_adjusting:
                continue
            for posting in entry.postings:
                if posting.account_code not in leaf_codes:
                    continue
                if cost_center and posting.cost_center != cost_center:
                    continue
                # Use normalized amounts (already converted by exchange rate)
                total += posting.normalized_debit - posting.normalized_credit

        acc = self.accounts[code]
        # For credit-normal accounts we conventionally show positive when credit > debit
        if acc.type in (AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE):
            total = -total
        return total.quantize(Decimal("0.01"))


    # --- CRYPTOGRAPHIC INTEGRITY VERIFICATION (v1.0.0) ---

    def verify_ledger_cryptographically(self) -> bool:
        """
        Cryptographically verifies the entire journal ledger data sequence.
        Returns False if any transaction values were manipulated directly in database memory.
        """
        prev_hash = "0" * 64
        for entry in self.journal:
            expected_hash = entry.calculate_hash(prev_hash)
            if entry.hash != expected_hash:
                return False
            prev_hash = entry.hash
        return True

    # --- IFRS / GAAP CLASS STRUCTURING REPORTS (v1.0.0) ---

    def generate_balance_sheet(self, cost_center: Optional[str] = None, include_adjusting: bool = True) -> Dict[str, Any]:
        """IFRS (IAS 1) Structured Balance Sheet: current vs non-current categorization."""
        current_assets = {}
        non_current_assets = {}
        current_liabilities = {}
        non_current_liabilities = {}
        equity = {}

        total_ca = Decimal("0.00")
        total_nca = Decimal("0.00")
        total_cl = Decimal("0.00")
        total_ncl = Decimal("0.00")
        total_eq = Decimal("0.00")

        for code, acc in self.accounts.items():
            is_leaf = self._is_leaf(code)
            balance = self.get_account_balance(code, cost_center, include_adjusting)

            if acc.type == AccountType.ASSET:
                if acc.is_current:
                    current_assets[acc.name] = balance
                    if is_leaf: total_ca += balance
                else:
                    non_current_assets[acc.name] = balance
                    if is_leaf: total_nca += balance
                    
            elif acc.type == AccountType.LIABILITY:
                if acc.is_current:
                    current_liabilities[acc.name] = balance
                    if is_leaf: total_cl += balance
                else:
                    non_current_liabilities[acc.name] = balance
                    if is_leaf: total_ncl += balance
                    
            elif acc.type == AccountType.EQUITY:
                equity[acc.name] = balance
                if is_leaf: total_eq += balance

        income_stmt = self.generate_income_statement(cost_center, include_adjusting)
        net_income = income_stmt["net_income"]
        total_equity_with_net_income = total_eq + net_income

        return {
            "current_assets": current_assets,
            "total_current_assets": total_ca.quantize(Decimal("0.01")),
            "non_current_assets": non_current_assets,
            "total_non_current_assets": total_nca.quantize(Decimal("0.01")),
            "total_assets": (total_ca + total_nca).quantize(Decimal("0.01")),
            
            "current_liabilities": current_liabilities,
            "total_current_liabilities": total_cl.quantize(Decimal("0.01")),
            "non_current_liabilities": non_current_liabilities,
            "total_non_current_liabilities": total_ncl.quantize(Decimal("0.01")),
            "total_liabilities": (total_cl + total_ncl).quantize(Decimal("0.01")),
            
            "equity_accounts": equity,
            "current_period_net_income": net_income.quantize(Decimal("0.01")),
            "total_equity_and_income": total_equity_with_net_income.quantize(Decimal("0.01")),
            
            "is_balanced": (total_ca + total_nca) == (total_cl + total_ncl + total_equity_with_net_income)
        }

    # --- STANDARD ROUTINES ---

    def _find_posting_by_id(self, posting_id: str) -> Optional[Posting]:
        for entry in self.journal:
            for p in entry.postings:
                if p.posting_id == posting_id:
                    return p
        return None

    def match_postings(self, debit_posting_id: str, credit_posting_id: str, amount: Union[int, float, Decimal, str]):
        amt = Decimal(str(amount))
        debit_p = self._find_posting_by_id(debit_posting_id)
        credit_p = self._find_posting_by_id(credit_posting_id)
        if not debit_p or not credit_p:
            raise AccountingError("Posting ID(s) not found.")
        unmatched_dr = self.get_unmatched_amount(debit_posting_id)
        unmatched_cr = self.get_unmatched_amount(credit_posting_id)
        if amt > unmatched_dr or amt > unmatched_cr:
            raise AccountingError(f"Amount {amt} exceeds outstanding values (Dr: {unmatched_dr}, Cr: {unmatched_cr}).")
        self.matches.append({"debit_id": debit_posting_id, "credit_id": credit_posting_id, "amount": amt})

    def get_unmatched_amount(self, posting_id: str) -> Decimal:
        p = self._find_posting_by_id(posting_id)
        if not p:
            raise AccountingError(f"Posting '{posting_id}' not found.")
        total_val = p.debit if p.debit > 0 else p.credit
        matched = sum(m["amount"] for m in self.matches if m["debit_id"] == posting_id or m["credit_id"] == posting_id)
        return total_val - matched

    def revalue_currency_account(self, account_code: str, target_currency: str, 
                                 current_rate: Union[int, float, Decimal, str], 
                                 gain_loss_account_code: str, entry_id: str) -> JournalEntry:
        if account_code not in self.accounts:
            raise AccountNotFoundError(f"Account '{account_code}' not found.")
        if gain_loss_account_code not in self.accounts:
            raise AccountNotFoundError(f"Exchange Gain/Loss account '{gain_loss_account_code}' not found.")

        acc = self.accounts[account_code]
        new_rate = Decimal(str(current_rate))
        foreign_balance = Decimal("0.00")
        historical_base_balance = Decimal("0.00")

        for entry in self.journal:
            for p in entry.postings:
                if p.account_code == account_code and p.currency == target_currency:
                    if acc.type in (AccountType.ASSET, AccountType.EXPENSE):
                        foreign_balance += (p.debit - p.credit)
                        historical_base_balance += (p.normalized_debit - p.normalized_credit)
                    else:
                        foreign_balance += (p.credit - p.debit)
                        historical_base_balance += (p.normalized_credit - p.normalized_debit)

        if foreign_balance == 0:
            raise AccountingError(f"No foreign balance found on '{account_code}' in currency '{target_currency}'.")

        current_base_value = foreign_balance * new_rate
        difference = current_base_value - historical_base_balance
        if difference == 0:
            raise AccountingError("Exchange rates match historical values. No adjustment required.")

        builder = self.new_entry(entry_id, f"Exchange rate revaluation for {account_code}", is_adjusting=True)
        if acc.type in (AccountType.ASSET, AccountType.EXPENSE):
            if difference > 0:
                builder.debit(account_code, difference).credit(gain_loss_account_code, difference)
            else:
                builder.debit(gain_loss_account_code, abs(difference)).credit(account_code, abs(difference))
        else:
            if difference > 0:
                builder.debit(gain_loss_account_code, difference).credit(account_code, difference)
            else:
                builder.debit(account_code, abs(difference)).credit(gain_loss_account_code, abs(difference))
        return builder.post()

    def generate_cash_flow_statement(self) -> Dict[str, Decimal]:
        operating = Decimal("0.00")
        investing = Decimal("0.00")
        financing = Decimal("0.00")
        for code, acc in self.accounts.items():
            if not self._is_leaf(code) or not acc.cash_flow_category:
                continue
            total_debit = Decimal("0.00")
            total_credit = Decimal("0.00")
            for entry in self.journal:
                for p in entry.postings:
                    if p.account_code == code:
                        total_debit += p.normalized_debit
                        total_credit += p.normalized_credit
            net_effect = total_credit - total_debit
            cat = acc.cash_flow_category.upper()
            if cat == "OPERATING":
                operating += net_effect
            elif cat == "INVESTING":
                investing += net_effect
            elif cat == "FINANCING":
                financing += net_effect
        net_increase = operating + investing + financing
        return {
            "operating_activities": operating.quantize(Decimal("0.01")),
            "investing_activities": investing.quantize(Decimal("0.01")),
            "financing_activities": financing.quantize(Decimal("0.01")),
            "net_increase_in_cash": net_increase.quantize(Decimal("0.01"))
        }

    def query_postings(self, account_code: Optional[str] = None, cost_center: Optional[str] = None, 
                       tag: Optional[str] = None, start_date: Optional[datetime] = None, 
                       end_date: Optional[datetime] = None) -> List[QueryResult]:
        results = []
        for entry in self.journal:
            if start_date and entry.date < start_date:
                continue
            if end_date and entry.date > end_date:
                continue
            if tag and tag not in entry.tags:
                continue
            for posting in entry.postings:
                if account_code:
                    all_target_codes = self._get_all_descendant_codes(account_code)
                    all_target_codes.add(account_code)
                    if posting.account_code not in all_target_codes:
                        continue
                if cost_center and posting.cost_center != cost_center:
                    continue
                results.append(QueryResult(entry_id=entry.entry_id, date=entry.date, description=entry.description, tags=entry.tags, posting=posting))
        return results

    def set_budget(self, account_code: str, amount: Union[int, float, Decimal, str], start_date: datetime, end_date: datetime):
        from .engine import Budget
        if account_code not in self.accounts:
            raise AccountNotFoundError(f"Account '{account_code}' not found.")
        self.budgets.append(Budget(account_code=account_code, amount=Decimal(str(amount)), start_date=start_date, end_date=end_date))

    def get_budget_variance(self, account_code: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        if account_code not in self.accounts:
            raise AccountNotFoundError(f"Account '{account_code}' not found.")
        acc = self.accounts[account_code]
        total_budget = Decimal("0.00")
        for b in self.budgets:
            if b.account_code == account_code and b.start_date >= start_date and b.end_date <= end_date:
                total_budget += b.amount
        all_target_codes = self._get_all_descendant_codes(account_code)
        all_target_codes.add(account_code)
        total_actual = Decimal("0.00")
        for entry in self.journal:
            if start_date <= entry.date <= end_date:
                for posting in entry.postings:
                    if posting.account_code in all_target_codes:
                        net_debit_credit = posting.normalized_debit - posting.normalized_credit
                        if acc.type in (AccountType.ASSET, AccountType.EXPENSE):
                            total_actual += net_debit_credit
                        else:
                            total_actual += -net_debit_credit
        variance = total_actual - total_budget
        status = "N/A"
        if acc.type == AccountType.EXPENSE:
            status = "Unfavorable" if total_actual > total_budget else "Favorable"
        elif acc.type == AccountType.REVENUE:
            status = "Favorable" if total_actual > total_budget else "Unfavorable"
        return {"budget": total_budget, "actual": total_actual, "variance": variance, "status": status}

    def register_template(self, template_id: str, description: str, postings: List[Posting]):
        from .engine import EntryTemplate
        self.templates[template_id] = EntryTemplate(template_id=template_id, description=description, postings=postings)

    def save_entry_as_template(self, entry_id: str, template_id: str):
        from .engine import EntryTemplate
        target_entry = None
        for entry in self.journal:
            if entry.entry_id == entry_id:
                target_entry = entry
                break
        if not target_entry:
            raise AccountingError(f"Entry '{entry_id}' not found.")
        cloned_postings = []
        for p in target_entry.postings:
            cloned_postings.append(Posting(account_code=p.account_code, debit=p.debit, credit=p.credit, cost_center=p.cost_center, currency=p.currency, exchange_rate=p.exchange_rate))
        self.templates[template_id] = EntryTemplate(template_id=template_id, description=target_entry.description, postings=cloned_postings)

    def post_from_template(self, template_id: str, entry_id: str, date: Optional[datetime] = None) -> JournalEntry:
        if template_id not in self.templates:
            raise AccountingError(f"Template '{template_id}' not found.")
        tpl = self.templates[template_id]
        copied_postings = []
        for p in tpl.postings:
            copied_postings.append(Posting(account_code=p.account_code, debit=p.debit, credit=p.credit, cost_center=p.cost_center, currency=p.currency, exchange_rate=p.exchange_rate))
        entry = JournalEntry(entry_id=entry_id, description=tpl.description, date=date or datetime.now(), postings=copied_postings)
        self.post_entry(entry)
        return entry

    def get_unreconciled_postings(self, account_code: str) -> List[Posting]:
        unreconciled = []
        for entry in self.journal:
            for posting in entry.postings:
                if posting.account_code == account_code and not posting.reconciled:
                    unreconciled.append(posting)
        return unreconciled

    def detect_sequence_gaps(self, prefix: str) -> List[int]:
        numbers = []
        pattern = re.compile(rf"^{re.escape(prefix)}(\d+)$")
        for entry in self.journal:
            match = pattern.match(entry.entry_id)
            if match:
                numbers.append(int(match.group(1)))
        if not numbers:
            return []
        numbers.sort()
        full_set = set(range(numbers[0], numbers[-1] + 1))
        return sorted(list(full_set - set(numbers)))

    def generate_aging_report(self, account_code: str, as_of_date: Optional[datetime] = None) -> Dict[str, Decimal]:
        if account_code not in self.accounts:
            raise AccountNotFoundError(f"Account code '{account_code}' not found.")
        target_date = as_of_date or datetime.now()
        aging = {
            "0-30 days": Decimal("0.00"),
            "31-60 days": Decimal("0.00"),
            "61-90 days": Decimal("0.00"),
            "90+ days": Decimal("0.00")
        }
        acc = self.accounts[account_code]
        for entry in self.journal:
            age_days = (target_date - entry.date).days
            for posting in entry.postings:
                if posting.account_code == account_code:
                    if acc.type in (AccountType.ASSET, AccountType.EXPENSE):
                        net_val = posting.normalized_debit - posting.normalized_credit
                    else:
                        net_val = posting.normalized_credit - posting.normalized_debit
                    if age_days <= 30:
                        aging["0-30 days"] += net_val
                    elif age_days <= 60:
                        aging["31-60 days"] += net_val
                    elif age_days <= 90:
                        aging["61-90 days"] += net_val
                    else:
                        aging["90+ days"] += net_val
        return aging

    def export_journal_to_dict(self) -> List[Dict[str, Any]]:
        flat_list = []
        for entry in self.journal:
            for posting in entry.postings:
                flat_list.append({
                    "entry_id": entry.entry_id,
                    "description": entry.description,
                    "date": entry.date.strftime("%Y-%m-%d %H:%M:%S") if isinstance(entry.date, datetime) else str(entry.date),
                    "is_adjusting": entry.is_adjusting,
                    "posting_id": posting.posting_id,
                    "account_code": posting.account_code,
                    "account_name": self.accounts[posting.account_code].name,
                    "account_type": self.accounts[posting.account_code].type.value,
                    "debit": float(posting.debit),
                    "credit": float(posting.credit),
                    "normalized_debit": float(posting.normalized_debit),
                    "normalized_credit": float(posting.normalized_credit),
                    "currency": posting.currency,
                    "exchange_rate": float(posting.exchange_rate),
                    "cost_center": posting.cost_center,
                    "reconciled": posting.reconciled,
                    "tags": entry.tags,
                    "hash": entry.hash,
                    "previous_hash": entry.previous_hash
                })
        return flat_list

    def get_trial_balance(self, cost_center: Optional[str] = None, include_adjusting: bool = True) -> Dict[str, Decimal]:
        return {code: self.get_account_balance(code, cost_center, include_adjusting) for code in self.accounts}

    def generate_income_statement(self, cost_center: Optional[str] = None, include_adjusting: bool = True) -> Dict[str, Any]:
        revenues = {}
        expenses = {}
        total_revenues = Decimal("0.00")
        total_expenses = Decimal("0.00")
        for code, acc in self.accounts.items():
            is_leaf = self._is_leaf(code)
            balance = self.get_account_balance(code, cost_center, include_adjusting)
            if acc.type == AccountType.REVENUE:
                revenues[acc.name] = balance
                if is_leaf: total_revenues += balance
            elif acc.type == AccountType.EXPENSE:
                expenses[acc.name] = balance
                if is_leaf: total_expenses += balance
        net_income = total_revenues - total_expenses
        return {"revenues": revenues, "total_revenues": total_revenues, "expenses": expenses, "total_expenses": total_expenses, "net_income": net_income}

    def detect_abnormal_balances(self) -> Dict[str, Dict[str, Any]]:
        abnormal = {}
        for code, acc in self.accounts.items():
            balance = self.get_account_balance(code)
            if balance < Decimal("0.00"):
                abnormal[code] = {"name": acc.name, "type": acc.type.value, "balance": balance, "warning": f"Abnormal balance! {acc.type.value} has negative net balance."}
        return abnormal

    def _get_sum_of_leaves(self, account_type: AccountType, flag_attr: str) -> Decimal:
        total = Decimal("0.00")
        for code, acc in self.accounts.items():
            if acc.type == account_type and getattr(acc, flag_attr) and self._is_leaf(code):
                total += self.get_account_balance(code)
        return total

    @property
    def working_capital(self) -> Decimal:
        current_assets = self._get_sum_of_leaves(AccountType.ASSET, "is_current")
        current_liabilities = self._get_sum_of_leaves(AccountType.LIABILITY, "is_current")
        return current_assets - current_liabilities

    @property
    def current_ratio(self) -> Decimal:
        current_assets = self._get_sum_of_leaves(AccountType.ASSET, "is_current")
        current_liabilities = self._get_sum_of_leaves(AccountType.LIABILITY, "is_current")
        if current_liabilities == Decimal("0.00"): return Decimal("0.00")
        return (current_assets / current_liabilities).quantize(Decimal("0.0001"))

    @property
    def quick_ratio(self) -> Decimal:
        current_assets = self._get_sum_of_leaves(AccountType.ASSET, "is_current")
        inventory = self._get_sum_of_leaves(AccountType.ASSET, "is_inventory")
        current_liabilities = self._get_sum_of_leaves(AccountType.LIABILITY, "is_current")
        if current_liabilities == Decimal("0.00"): return Decimal("0.00")
        return ((current_assets - inventory) / current_liabilities).quantize(Decimal("0.0001"))

    @property
    def debt_to_equity_ratio(self) -> Decimal:
        bs = self.generate_balance_sheet()
        total_liabilities = bs["total_liabilities"]
        total_equity = bs["total_equity_and_income"]
        if total_equity == Decimal("0.00"): return Decimal("0.00")
        return (total_liabilities / total_equity).quantize(Decimal("0.0001"))

    @property
    def gross_profit_margin(self) -> Decimal:
        inc = self.generate_income_statement()
        total_revenue = inc["total_revenues"]
        if total_revenue == Decimal("0.00"): return Decimal("0.00")
        cogs = self._get_sum_of_leaves(AccountType.EXPENSE, "is_cogs")
        return ((total_revenue - cogs) / total_revenue).quantize(Decimal("0.0001"))

    @property
    def net_profit_margin(self) -> Decimal:
        inc = self.generate_income_statement()
        total_revenue = inc["total_revenues"]
        if total_revenue == Decimal("0.00"): return Decimal("0.00")
        return (inc["net_income"] / total_revenue).quantize(Decimal("0.0001"))