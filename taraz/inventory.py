from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional, Union

class InventoryValuationEngine:
    """Handles Perpetual Inventory Costing using FIFO, LIFO, and WAVCO methods (Added in v0.8.0)."""

    def __init__(self):
        # Maps SKU/Code -> List of batches: [{"qty": Decimal, "cost": Decimal, "date": datetime}]
        self.stock: Dict[str, List[Dict[str, Any]]] = {}

    def record_purchase(self, sku: str, quantity: Union[int, float, Decimal, str], 
                        unit_cost: Union[int, float, Decimal, str], date: Optional[datetime] = None):
        """Records a batch purchase in inventory."""
        if sku not in self.stock:
            self.stock[sku] = []
        
        self.stock[sku].append({
            "qty": Decimal(str(quantity)),
            "cost": Decimal(str(unit_cost)),
            "date": date or datetime.now()
        })

    def record_sale(self, sku: str, quantity_to_sell: Union[int, float, Decimal, str], method: str = "FIFO") -> Tuple[Decimal, Decimal]:
        """
        Processes sales of items and calculates the Cost of Goods Sold (COGS).
        Returns a tuple: (COGS, Remaining Inventory Value).
        Supported methods: 'FIFO', 'LIFO', 'WAVCO' (Weighted Average Cost).
        """
        if sku not in self.stock or not self.stock[sku]:
            return Decimal("0.00"), Decimal("0.00")

        qty_needed = Decimal(str(quantity_to_sell))
        cogs = Decimal("0.00")
        
        # Sort chronologically to preserve logic
        batches = sorted(self.stock[sku], key=lambda x: x["date"])

        if method.upper() == "FIFO":
            # First-In, First-Out
            for batch in batches:
                if qty_needed <= 0:
                    break
                if batch["qty"] <= 0:
                    continue
                
                take_qty = min(batch["qty"], qty_needed)
                batch["qty"] -= take_qty
                qty_needed -= take_qty
                cogs += take_qty * batch["cost"]

        elif method.upper() == "LIFO":
            # Last-In, First-Out
            for batch in reversed(batches):
                if qty_needed <= 0:
                    break
                if batch["qty"] <= 0:
                    continue
                
                take_qty = min(batch["qty"], qty_needed)
                batch["qty"] -= take_qty
                qty_needed -= take_qty
                cogs += take_qty * batch["cost"]

        elif method.upper() == "WAVCO":
            # Weighted Average Cost (perpetual)
            total_qty = sum(b["qty"] for b in batches)
            total_cost = sum(b["qty"] * b["cost"] for b in batches)
            if total_qty > 0:
                avg_cost = total_cost / total_qty
                # Overwrite standard batch costs with the new weighted average
                for batch in batches:
                    batch["cost"] = avg_cost
                
                for batch in batches:
                    if qty_needed <= 0:
                        break
                    take_qty = min(batch["qty"], qty_needed)
                    batch["qty"] -= take_qty
                    qty_needed -= take_qty
                    cogs += take_qty * avg_cost
            else:
                avg_cost = Decimal("0.00")

        # Clean up consumed batches
        self.stock[sku] = [b for b in batches if b["qty"] > 0]
        
        # Calculate final inventory valuation
        ending_value = sum(b["qty"] * b["cost"] for b in self.stock[sku])
        
        return cogs.quantize(Decimal("0.01")), ending_value.quantize(Decimal("0.01"))