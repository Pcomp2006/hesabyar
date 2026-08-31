import uuid
import hashlib
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Union, List, Optional

class AccountType(Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    REVENUE = "Revenue"
    EXPENSE = "Expense"

@dataclass
class Account:
    code: str
    name: str
    type: AccountType
    parent_code: Optional[str] = None
    is_current: bool = False
    is_inventory: bool = False
    is_cogs: bool = False
    cash_flow_category: Optional[str] = None

    def __repr__(self) -> str:
        parent_info = f", Parent: {self.parent_code}" if self.parent_code else ""
        flags = []
        if self.is_current: flags.append("Current")
        if self.is_inventory: flags.append("Inventory")
        if self.is_cogs: flags.append("COGS")
        if self.cash_flow_category: flags.append(f"CashFlow: {self.cash_flow_category}")
        flag_info = f" ({', '.join(flags)})" if flags else ""
        return f"Account({self.code} - {self.name} [{self.type.value}]{parent_info}{flag_info})"

@dataclass
class Posting:
    account_code: str
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    cost_center: Optional[str] = None
    currency: str = "BASE"
    exchange_rate: Decimal = Decimal("1.0000")
    reconciled: bool = False
    posting_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])

    def __post_init__(self):
        self.debit = Decimal(str(self.debit))
        self.credit = Decimal(str(self.credit))
        self.exchange_rate = Decimal(str(self.exchange_rate))

    @property
    def normalized_debit(self) -> Decimal:
        return self.debit * self.exchange_rate

    @property
    def normalized_credit(self) -> Decimal:
        return self.credit * self.exchange_rate

    def __repr__(self) -> str:
        cc_info = f", CostCenter: {self.cost_center}" if self.cost_center else ""
        curr_info = f", Currency: {self.currency}" if self.currency != "BASE" else ""
        rec_info = f" [RECONCILED]" if self.reconciled else ""
        return f"Posting({self.posting_id} | {self.account_code}: Dr={self.debit}, Cr={self.credit}{cc_info}{curr_info}{rec_info})"

@dataclass
class JournalEntry:
    entry_id: str
    description: str
    date: datetime = field(default_factory=datetime.now)
    postings: List[Posting] = field(default_factory=list)
    is_adjusting: bool = False
    tags: List[str] = field(default_factory=list)
    
    # Cryptographic validation layers added in v1.0.0
    hash: str = ""
    previous_hash: str = ""

    def add_posting(self, account_code: str, debit: Union[int, float, Decimal, str] = 0, 
                    credit: Union[int, float, Decimal, str] = 0, cost_center: Optional[str] = None,
                    currency: str = "BASE", exchange_rate: Union[int, float, Decimal, str] = 1.0):
        self.postings.append(Posting(
            account_code=account_code, 
            debit=Decimal(str(debit)), 
            credit=Decimal(str(credit)),
            cost_center=cost_center,
            currency=currency,
            exchange_rate=Decimal(str(exchange_rate))
        ))

    def calculate_hash(self, previous_hash: str = "") -> str:
        """Generates a cryptographic signature (SHA-256) of this entry and its internal postings."""
        sha = hashlib.sha256()
        date_str = self.date.isoformat() if isinstance(self.date, datetime) else str(self.date)
        data_string = f"{self.entry_id}|{self.description}|{date_str}|{previous_hash}"
        
        # Sort postings by ID to ensure consistency in string building
        for p in sorted(self.postings, key=lambda x: x.posting_id):
            data_string += f"|{p.posting_id}:{p.account_code}:{p.debit}:{p.credit}"
            
        sha.update(data_string.encode('utf-8'))
        return sha.hexdigest()

    @property
    def is_balanced(self) -> bool:
        total_debit = sum(p.normalized_debit for p in self.postings)
        total_credit = sum(p.normalized_credit for p in self.postings)
        return total_debit == total_credit

    @property
    def balance_difference(self) -> Decimal:
        total_debit = sum(p.normalized_debit for p in self.postings)
        total_credit = sum(p.normalized_credit for p in self.postings)
        return total_debit - total_credit

    def __repr__(self) -> str:
        date_str = self.date.strftime('%Y-%m-%d %H:%M') if isinstance(self.date, datetime) else str(self.date)
        adj_tag = " [ADJUSTING]" if self.is_adjusting else ""
        tag_info = f" | Tags: {self.tags}" if self.tags else ""
        hash_info = f" | Hash: {self.hash[:8]}..." if self.hash else ""
        return f"JournalEntry({self.entry_id}{adj_tag} - '{self.description}' on {date_str}{tag_info}{hash_info}, Postings: {len(self.postings)})"

@dataclass
class QueryResult:
    entry_id: str
    date: datetime
    description: str
    tags: List[str]
    posting: Posting

    def __repr__(self) -> str:
        return f"QueryResult({self.entry_id} | {self.date.strftime('%Y-%m-%d')} | Tags: {self.tags} | {self.posting})"