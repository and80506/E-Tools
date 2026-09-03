import akshare as ak
import json
import sys
import datetime
import warnings
import pandas as pd
import numpy as np

warnings.filterwarnings('ignore')

def fetch_data():
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "600519"
    # Format symbol for akshare balance sheet API (e.g. sh600519, sz002594)
    if stock_code.startswith('6'):
        symbol = f"sh{stock_code}"
    elif stock_code.startswith('0') or stock_code.startswith('3'):
        symbol = f"sz{stock_code}"
    elif stock_code.startswith('8') or stock_code.startswith('4'):
        symbol = f"bj{stock_code}"
    else:
        symbol = stock_code # fallback

    try:
        df = ak.stock_balance_sheet_by_report_em(symbol=symbol)
        
        if df is None or df.empty:
            print(json.dumps({"success": False, "message": "无相关资产负债表数据"}))
            sys.exit(0)
            
        reports = []
        # Fetch up to 10 periods
        for idx in range(min(10, len(df))):
            report = df.iloc[idx]
            
            def get_val(key):
                val = report.get(key, 0)
                if pd.isna(val) or val is None:
                    return 0
                return float(val) / 100000000.0

            data = {
                "date": str(report.get('REPORT_DATE', '未知日期'))[:10] if 'REPORT_DATE' in report else "最新",
                "report_type": str(report.get('REPORT_TYPE', '')),
                "cash": get_val('MONETARYFUNDS'), 
                "receivables": get_val('NOTE_ACCOUNTS_RECE'), 
                "prepayments": get_val('PREPAYMENT'), 
                "inventory": get_val('INVENTORY'), 
                "other_current_assets": get_val('OTHER_CURRENT_ASSET'), 
                "long_term_investments": get_val('LONG_EQUITY_INVEST') + get_val('OTHER_EQUITY_INVEST') + get_val('OTHER_NONCURRENT_FINASSET'), 
                "fixed_assets": get_val('FIXED_ASSET') + get_val('CIP'), 
                "intangible_and_goodwill": get_val('INTANGIBLE_ASSET') + get_val('GOODWILL'), 
                "other_fixed_assets": get_val('USERIGHT_ASSET') + get_val('LONG_PREPAID_EXPENSE') + get_val('DEFER_TAX_ASSET') + get_val('OTHER_NONCURRENT_ASSET'), 
                "short_term_borrowings": get_val('SHORT_LOAN') + get_val('NONCURRENT_LIAB_1YEAR'), 
                "payables": get_val('NOTE_ACCOUNTS_PAYABLE'), 
                "advance_receipts": get_val('CONTRACT_LIAB') + get_val('ADVANCE_RECEIVABLES'), 
                "compensation_and_tax": get_val('STAFF_SALARY_PAYABLE') + get_val('TAX_PAYABLE'), 
                "other_current_liabilities": get_val('OTHER_PAYABLE') + get_val('OTHER_CURRENT_LIAB'), 
                "long_term_borrowings": get_val('LONG_LOAN') + get_val('BOND_PAYABLE'), 
                "other_non_current_liabilities": get_val('LEASE_LIAB') + get_val('LONG_PAYABLE') + get_val('DEFER_INCOME') + get_val('DEFER_TAX_LIAB') + get_val('OTHER_NONCURRENT_LIAB')
            }
            reports.append(data)

        print(json.dumps({
            "success": True,
            "data": reports
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": "AkShare API Error: " + str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    fetch_data()
