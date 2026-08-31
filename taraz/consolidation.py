from typing import List, Dict, Optional
from .engine import AccountingEngine
from .models import AccountType

class LedgerConsolidator:
    """Consolidates multiple independent corporate ledgers into a single parent entity (v0.9.0)."""

    @staticmethod
    def consolidate(engines: List[AccountingEngine], parent_engine: Optional[AccountingEngine] = None) -> AccountingEngine:
        """
        Merges charts of accounts and transactions history from multiple engines.
        Resolves ID collisions during consolidated ledger construction.
        """
        target = parent_engine or AccountingEngine()

        # 1. Merge all Accounts definition safely
        for eng in engines:
            for code, acc in eng.accounts.items():
                if code not in target.accounts:
                    target.register_account(
                        code=acc.code,
                        name=acc.name,
                        account_type=acc.type,
                        parent_code=acc.parent_code,
                        is_current=acc.is_current,
                        is_inventory=acc.is_inventory,
                        is_cogs=acc.is_cogs,
                        cash_flow_category=acc.cash_flow_category
                    )

        # 2. Merge all Journal History
        for eng in engines:
            for entry in eng.journal:
                consolidated_id = f"{entry.entry_id}"
                collision_counter = 1
                
                # Check for entry ID collisions
                while any(e.entry_id == consolidated_id for e in target.journal):
                    consolidated_id = f"{entry.entry_id}_CONSOL_{collision_counter}"
                    collision_counter += 1

                # Recreate the entry within consolidated engine
                builder = target.new_entry(
                    entry_id=consolidated_id,
                    description=entry.description,
                    date=entry.date,
                    is_adjusting=entry.is_adjusting,
                    tags=entry.tags
                )
                
                for p in entry.postings:
                    if p.debit > 0:
                        builder.debit(
                            account_code=p.account_code,
                            amount=p.debit,
                            cost_center=p.cost_center,
                            currency=p.currency,
                            exchange_rate=p.exchange_rate
                        )
                    else:
                        builder.credit(
                            account_code=p.account_code,
                            amount=p.credit,
                            cost_center=p.cost_center,
                            currency=p.currency,
                            exchange_rate=p.exchange_rate
                        )
                builder.post()

        return target