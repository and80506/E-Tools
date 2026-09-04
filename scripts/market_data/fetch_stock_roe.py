import akshare as ak
import json
import sys
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings('ignore')

def fetch_data():
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "600519"
    years = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    quarters = (years + 1) * 4
    
    # Format symbol for akshare
    if stock_code.startswith('6'):
        symbol = f"sh{stock_code}"
    elif stock_code.startswith('0') or stock_code.startswith('3'):
        symbol = f"sz{stock_code}"
    elif stock_code.startswith('8') or stock_code.startswith('4'):
        symbol = f"bj{stock_code}"
    else:
        symbol = stock_code # fallback
    
    try:
        df_profit = ak.stock_profit_sheet_by_report_em(symbol=symbol)
        df_balance = ak.stock_balance_sheet_by_report_em(symbol=symbol)
        
        if df_profit is None or df_profit.empty or df_balance is None or df_balance.empty:
            print(json.dumps({"success": False, "message": "无相关利润或资产负债表数据"}))
            sys.exit(0)
            
        df_profit = df_profit[['REPORT_DATE', 'PARENT_NETPROFIT']].rename(columns={'PARENT_NETPROFIT': 'net_profit'})
        df_balance = df_balance[['REPORT_DATE', 'TOTAL_PARENT_EQUITY']].rename(columns={'TOTAL_PARENT_EQUITY': 'net_asset'})
        
        df_profit['REPORT_DATE'] = pd.to_datetime(df_profit['REPORT_DATE'])
        df_balance['REPORT_DATE'] = pd.to_datetime(df_balance['REPORT_DATE'])
        
        df_merged = pd.merge(df_profit, df_balance, on='REPORT_DATE', how='inner')
        
        df_merged = df_merged.sort_values(by='REPORT_DATE', ascending=False)
        df_merged = df_merged.head(quarters + 10)
        
        df_merged = df_merged.sort_values('REPORT_DATE', ascending=True).reset_index(drop=True)
        
        df_merged['year'] = df_merged['REPORT_DATE'].dt.year
        df_merged['month'] = df_merged['REPORT_DATE'].dt.month
        
        ttm_netprofit = []
        
        for i, row in df_merged.iterrows():
            y = row['year']
            m = row['month']
            if m == 12:
                ttm_netprofit.append(row['net_profit'])
            else:
                q4_last_year = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == 12)]
                q_last_year = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == m)]
                if not q4_last_year.empty and not q_last_year.empty:
                    np_ttm = row['net_profit'] + q4_last_year.iloc[0]['net_profit'] - q_last_year.iloc[0]['net_profit']
                    ttm_netprofit.append(np_ttm)
                else:
                    ttm_netprofit.append(np.nan)
                    
        df_merged['profit_ttm'] = ttm_netprofit
        df_merged = df_merged.dropna(subset=['profit_ttm', 'net_asset'])
        
        df_merged = df_merged.tail(quarters)
        
        results = []
        for _, row in df_merged.iterrows():
            roe = (row['profit_ttm'] / row['net_asset']) * 100 if row['net_asset'] != 0 else 0
            results.append({
                "date": row['REPORT_DATE'].strftime('%Y-%m-%d'),
                "company_roe": round(roe, 2),
                "profit_ttm": round(row['profit_ttm'] / 100000000, 2),
                "net_asset": round(row['net_asset'] / 100000000, 2)
            })
            
        print(json.dumps({
            "success": True,
            "data": results
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    fetch_data()
