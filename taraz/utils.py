import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any
from .engine import AccountingEngine, AccountType

class DevUtils:
    """Developer helper utilities for data mocking and ledger sanity verification."""

    @staticmethod
    def import_journal_from_csv(engine: AccountingEngine, filepath: str) -> int:
        """
        Imports and posts balanced journal entries directly from a structured CSV.
        Groups lines sharing the same entry_id into unified multi-posting transactions.
        """
        from collections import defaultdict
        
        # Structure to group postings: entry_id -> { "desc": ..., "date": ..., "postings": [...] }
        entries_data = defaultdict(lambda: {"description": "", "date": None, "is_adjusting": False, "tags": [], "postings": []})
        
        with open(filepath, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                entry_id = row["entry_id"]
                desc = row.get("description", "")
                date_str = row.get("date", "")
                is_adj = row.get("is_adjusting", "False").lower() == "true"
                tags = [t.strip() for t in row.get("tags", "").split(",") if t.strip()]
                
                # Take entry meta data from the first row of this transaction
                if not entries_data[entry_id]["description"]:
                    entries_data[entry_id]["description"] = desc
                    if date_str:
                        entries_data[entry_id]["date"] = datetime.fromisoformat(date_str)
                    entries_data[entry_id]["is_adjusting"] = is_adj
                    entries_data[entry_id]["tags"] = tags
                
                entries_data[entry_id]["postings"].append({
                    "account_code": row["account_code"],
                    "debit": float(row.get("debit", 0) or 0),
                    "credit": float(row.get("credit", 0) or 0),
                    "cost_center": row.get("cost_center") or None,
                    "currency": row.get("currency", "BASE"),
                    "exchange_rate": float(row.get("exchange_rate", 1.0) or 1.0)
                })
        
        success_count = 0
        for entry_id, data in entries_data.items():
            builder = engine.new_entry(
                entry_id=entry_id,
                description=data["description"],
                date=data["date"],
                is_adjusting=data["is_adjusting"],
                tags=data["tags"]
            )
            for p in data["postings"]:
                if p["debit"] > 0:
                    builder.debit(
                        account_code=p["account_code"],
                        amount=p["debit"],
                        cost_center=p["cost_center"],
                        currency=p["currency"],
                        exchange_rate=p["exchange_rate"]
                    )
                else:
                    builder.credit(
                        account_code=p["account_code"],
                        amount=p["credit"],
                        cost_center=p["cost_center"],
                        currency=p["currency"],
                        exchange_rate=p["exchange_rate"]
                    )
            builder.post()
            success_count += 1
            
        return success_count

    @staticmethod
    def export_journal_to_csv(engine: AccountingEngine, filepath: str):
        """Exports the entire journal database directly to a CSV file (Pure Python)."""
        records = engine.export_journal_to_dict()
        if not records:
            return
        keys = records[0].keys()
        with open(filepath, 'w', newline='', encoding='utf-8') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(records)

    @staticmethod
    def seed_mock_data(engine: AccountingEngine):
        engine.register_account("1000", "Assets parent", AccountType.ASSET)
        engine.register_account("1001", "Main Bank USD", AccountType.ASSET, parent_code="1000", is_current=True)
        engine.register_account("1002", "Tax Receivable", AccountType.ASSET, parent_code="1000", is_current=True)
        engine.register_account("1003", "Inventory Warehouse", AccountType.ASSET, parent_code="1000", is_current=True, is_inventory=True)
        engine.register_account("2000", "Liabilities", AccountType.LIABILITY, is_current=True)
        engine.register_account("3000", "Capital Equity", AccountType.EQUITY)
        engine.register_account("4000", "Revenue", AccountType.REVENUE)
        engine.register_account("5000", "Expenses parent", AccountType.EXPENSE)
        engine.register_account("5001", "Cloud Fees", AccountType.EXPENSE, parent_code="5000")
        engine.register_account("5002", "Rent Fees", AccountType.EXPENSE, parent_code="5000")
        engine.register_account("5003", "Cost of Goods Sold", AccountType.EXPENSE, parent_code="5000", is_cogs=True)

        days_offset = [60, 45, 10, 0]
        engine.new_entry("TXN-SEED-01", "Founder Equity Capital", date=datetime.now() - timedelta(days=days_offset[0])) \
              .debit("1001", "10000.00") \
              .credit("3000", "10000.00") \
              .post()
        engine.new_entry("TXN-SEED-02", "Inventory Purchase", date=datetime.now() - timedelta(days=days_offset[1])) \
              .add_purchase_with_vat(
                  asset_or_expense_code="1003", 
                  cash_or_ap_code="1001", 
                  vat_receivable_code="1002", 
                  base_amount="2000.00", 
                  vat_rate="0.10"
              ) \
              .post()
        engine.new_entry("TXN-SEED-03", "Rent Payment", date=datetime.now() - timedelta(days=days_offset[2])) \
              .debit("5002", "500.00") \
              .credit("1001", "500.00") \
              .post()

    @staticmethod
    def verify_ledger_integrity(engine: AccountingEngine) -> List[str]:
        errors = []
        for code, acc in engine.accounts.items():
            if acc.parent_code:
                if acc.parent_code not in engine.accounts:
                    errors.append(f"Account '{code}' references missing parent '{acc.parent_code}'.")
                else:
                    parent_acc = engine.accounts[acc.parent_code]
                    if parent_acc.type != acc.type:
                        errors.append(f"Account Type mismatch: Child '{code}' is {acc.type.value}, but Parent '{acc.parent_code}' is {parent_acc.type.value}.")
        total_debits = 0
        total_credits = 0
        for entry in engine.journal:
            for p in entry.postings:
                total_debits += p.normalized_debit
                total_credits += p.normalized_credit
        if total_debits != total_credits:
            errors.append(f"Imbalance found in overall database: Total debits = {total_debits}, Total credits = {total_credits}.")
        return errors