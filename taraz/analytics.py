from decimal import Decimal
from typing import List, Dict, Any, Union

class FinancialAnalytics:
    @staticmethod
    def net_present_value(rate: float, cash_flows: List[Union[float, Decimal, str]]) -> Decimal:
        r = Decimal(str(rate))
        npv = Decimal("0.00")
        for t, cf in enumerate(cash_flows):
            cf_dec = Decimal(str(cf))
            npv += cf_dec / ((Decimal("1.0") + r) ** t)
        return npv.quantize(Decimal("0.01"))

    @staticmethod
    def internal_rate_of_return(cash_flows: List[Union[float, Decimal, str]], max_iter: int = 100, tolerance: float = 1e-6) -> float:
        flows = [float(cf) for cf in cash_flows]
        def npv_func(r):
            return sum(cf / ((1.0 + r) ** t) for t, cf in enumerate(flows))
        r0 = 0.1
        r1 = 0.2
        f0 = npv_func(r0)
        for _ in range(max_iter):
            f1 = npv_func(r1)
            if abs(f1) < tolerance:
                return round(r1, 6)
            if abs(f1 - f0) < 1e-12:
                break
            r_next = r1 - f1 * (r1 - r0) / (f1 - f0)
            r0, r1 = r1, r_next
            f0 = f1
        return round(r1, 6)

    @staticmethod
    def generate_loan_amortization_schedule(principal: Union[int, float, Decimal, str], 
                                            annual_rate: float, terms_months: int) -> List[Dict[str, Any]]:
        p_dec = Decimal(str(principal))
        r_monthly = Decimal(str(annual_rate)) / Decimal("12.0")
        n = terms_months
        if r_monthly == Decimal("0.00"):
            monthly_payment = p_dec / Decimal(str(n))
        else:
            monthly_payment = p_dec * (r_monthly * ((Decimal("1.0") + r_monthly) ** n)) / (((Decimal("1.0") + r_monthly) ** n) - Decimal("1.0"))
        schedule = []
        remaining_balance = p_dec
        for month in range(1, n + 1):
            interest = remaining_balance * r_monthly
            principal_paid = monthly_payment - interest
            if month == n:
                principal_paid = remaining_balance
                monthly_payment = principal_paid + interest
            remaining_balance -= principal_paid
            schedule.append({
                "month": month,
                "payment": monthly_payment.quantize(Decimal("0.01")),
                "interest": interest.quantize(Decimal("0.01")),
                "principal": principal_paid.quantize(Decimal("0.01")),
                "remaining_balance": abs(remaining_balance).quantize(Decimal("0.01"))
            })
        return schedule

    @staticmethod
    def straight_line_depreciation(cost: Union[float, Decimal, str], 
                                   salvage_value: Union[float, Decimal, str], 
                                   useful_life_years: int) -> Decimal:
        c = Decimal(str(cost))
        s = Decimal(str(salvage_value))
        return ((c - s) / Decimal(str(useful_life_years))).quantize(Decimal("0.01"))

    @staticmethod
    def double_declining_depreciation(cost: Union[float, Decimal, str], 
                                      salvage_value: Union[float, Decimal, str], 
                                      useful_life_years: int, period_year: int) -> Decimal:
        c = Decimal(str(cost))
        s = Decimal(str(salvage_value))
        life = Decimal(str(useful_life_years))
        rate = Decimal("2.0") / life
        book_value = c
        depreciation = Decimal("0.00")
        for _ in range(period_year):
            depreciation = book_value * rate
            if book_value - depreciation < s:
                depreciation = book_value - s
                book_value = s
                break
            book_value -= depreciation
        return depreciation.quantize(Decimal("0.01"))

    @staticmethod
    def weighted_average_cost_of_capital(equity_val: float, debt_val: float, cost_of_equity: float, 
                                         cost_of_debt: float, tax_rate: float) -> float:
        v = equity_val + debt_val
        if v == 0:
            return 0.0
        wacc = (equity_val / v * cost_of_equity) + (debt_val / v * cost_of_debt * (1.0 - tax_rate))
        return round(wacc, 6)


class CorporateFinanceAnalytics:
    """Advanced Analytical Formulas for Corporate Performance Evaluations added in v0.8.0."""

    @staticmethod
    def dupont_analysis(net_income: Union[int, float, Decimal, str], 
                        sales: Union[int, float, Decimal, str], 
                        total_assets: Union[int, float, Decimal, str], 
                        total_equity: Union[int, float, Decimal, str]) -> Dict[str, Decimal]:
        """
        Deconstructs Return on Equity (ROE) using the DuPont Model.
        ROE = Net Profit Margin * Asset Turnover * Equity Multiplier
        """
        ni = Decimal(str(net_income))
        sl = Decimal(str(sales))
        ta = Decimal(str(total_assets))
        te = Decimal(str(total_equity))

        pm = ni / sl if sl != 0 else Decimal("0.00")
        at = sl / ta if ta != 0 else Decimal("0.00")
        em = ta / te if te != 0 else Decimal("0.00")
        roe = pm * at * em

        return {
            "net_profit_margin": pm.quantize(Decimal("0.0001")),
            "asset_turnover": at.quantize(Decimal("0.0001")),
            "equity_multiplier": em.quantize(Decimal("0.0001")),
            "return_on_equity": roe.quantize(Decimal("0.0001"))
        }

    @staticmethod
    def altman_z_score_private(working_capital: float, retained_earnings: float, ebit: float, 
                                book_value_equity: float, total_liabilities: float, 
                                sales: float, total_assets: float) -> Dict[str, Any]:
        """
        Calculates Altman Z-Score for private manufacturing firms.
        Z' = 0.717X1 + 0.847X2 + 3.107X3 + 0.420X4 + 0.998X5
        """
        if total_assets == 0 or total_liabilities == 0:
            return {"score": 0.0, "zone": "N/A"}

        x1 = working_capital / total_assets
        x2 = retained_earnings / total_assets
        x3 = ebit / total_assets
        x4 = book_value_equity / total_liabilities
        x5 = sales / total_assets

        score = (0.717 * x1) + (0.847 * x2) + (3.107 * x3) + (0.420 * x4) + (0.998 * x5)
        score = round(score, 4)

        if score > 2.9:
            zone = "Safe Zone"
        elif score >= 1.23:
            zone = "Grey Zone"
        else:
            zone = "Distress Zone"

        return {"score": score, "zone": zone}