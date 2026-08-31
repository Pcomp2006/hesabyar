from typing import Dict, List, Any
from .engine import AccountingEngine

class UIBridge:
    """Bridge tools to connect Taraz and Python GUI frameworks (Tkinter, CustomTkinter, PyQt/PySide)."""

    @staticmethod
    def get_coa_tree_structure(engine: AccountingEngine) -> List[Dict[str, Any]]:
        """
        Converts the hierarchical chart of accounts into a nested JSON-like structure.
        Perfect for rendering in PyQt's QTreeView/QTreeWidget or Tkinter's ttk.Treeview.
        """
        def _build_node(code: str) -> Dict[str, Any]:
            acc = engine.accounts[code]
            children = []
            for child_code, child_acc in engine.accounts.items():
                if child_acc.parent_code == code:
                    children.append(_build_node(child_code))
            
            return {
                "id": acc.code,
                "text": f"{acc.code} - {acc.name}",
                "type": acc.type.value,
                "balance": float(engine.get_account_balance(code)),
                "children": children
            }

        # Select only top-level (root) accounts to start the nesting process
        roots = []
        for code, acc in engine.accounts.items():
            if not acc.parent_code:
                roots.append(_build_node(code))
        return roots

    @staticmethod
    def generate_matplotlib_chart(engine: AccountingEngine, chart_type: str = "income_statement") -> Any:
        """
        Generates a Matplotlib Figure ready for embedding inside PyQt, PySide or Tkinter canvases.
        Matplotlib is imported lazily to avoid forcing it as a dependency.
        """
        try:
            import matplotlib.pyplot as plt
        except ImportError:
            raise ImportError("Matplotlib is required for UI visual bridges. Please install it using 'pip install matplotlib'.")

        fig, ax = plt.subplots(figsize=(6, 4))
        
        if chart_type == "income_statement":
            data = engine.generate_income_statement()
            categories = ["Revenues", "Expenses", "Net Income"]
            values = [float(data["total_revenues"]), float(data["total_expenses"]), float(data["net_income"])]
            colors = ["#2ecc71", "#e74c3c", "#3498db"]
            ax.bar(categories, values, color=colors)
            ax.set_title("Income Statement Overview")
            ax.set_ylabel("Normalized Value")
            
        elif chart_type == "balance_sheet":
            data = engine.generate_balance_sheet()
            categories = ["Assets", "Liabilities", "Equity & Income"]
            values = [float(data["total_assets"]), float(data["total_liabilities"]), float(data["total_equity_and_income"])]
            colors = ["#2ecc71", "#e74c3c", "#f1c40f"]
            ax.bar(categories, values, color=colors)
            ax.set_title("Balance Sheet Overview")
            ax.set_ylabel("Normalized Value")
            
        else:
            raise ValueError("Supported chart types are 'income_statement' and 'balance_sheet'.")

        plt.tight_layout()
        return fig