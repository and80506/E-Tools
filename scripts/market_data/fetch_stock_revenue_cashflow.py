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
    years = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    
    # Calculate how many quarters we need (buffer extra 2 quarters for TTM calculation)
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
        # Fetch profit sheet (for Revenue)
        df_profit = ak.stock_profit_sheet_by_report_em(symbol=symbol)
        # Fetch cash flow sheet (for Operating Cash Flow)
        df_cash = ak.stock_cash_flow_sheet_by_report_em(symbol=symbol)
        
        if df_profit is None or df_profit.empty or df_cash is None or df_cash.empty:
            print(json.dumps({"success": False, "message": "无相关营收或现金流数据"}))
            sys.exit(0)
            
        # Select key columns
        df_profit = df_profit[['REPORT_DATE', 'TOTAL_OPERATE_INCOME', 'PARENT_NETPROFIT']].rename(columns={
            'TOTAL_OPERATE_INCOME': 'revenue',
            'PARENT_NETPROFIT': 'net_profit'
        })
        df_cash = df_cash[['REPORT_DATE', 'SALES_SERVICES', 'NETCASH_OPERATE']].rename(columns={
            'SALES_SERVICES': 'cashflow',
            'NETCASH_OPERATE': 'operate_cashflow'
        })
        
        # Ensure REPORT_DATE is datetime for sorting
        df_profit['REPORT_DATE'] = pd.to_datetime(df_profit['REPORT_DATE'])
        df_cash['REPORT_DATE'] = pd.to_datetime(df_cash['REPORT_DATE'])

        # Merge on REPORT_DATE
        df_merged = pd.merge(df_profit, df_cash, on='REPORT_DATE', how='inner')
        
        # Sort descending to get the latest ones first, take top N periods
        df_merged = df_merged.sort_values(by='REPORT_DATE', ascending=False)
        df_merged = df_merged.head(quarters + 10) # 10 periods buffer for TTM
        
        # Sort ascending (from old to new) for the chart
        df_merged = df_merged.sort_values('REPORT_DATE', ascending=True).reset_index(drop=True)
        
        # Calculate TTM
        df_merged['year'] = df_merged['REPORT_DATE'].dt.year
        df_merged['month'] = df_merged['REPORT_DATE'].dt.month
        
        ttm_revenue = []
        ttm_cashflow = []
        ttm_operate = []
        ttm_netprofit = []
        
        for i, row in df_merged.iterrows():
            y = row['year']
            m = row['month']
            
            if m == 12:
                ttm_revenue.append(row['revenue'])
                ttm_cashflow.append(row['cashflow'])
                ttm_operate.append(row['operate_cashflow'])
                ttm_netprofit.append(row['net_profit'])
            else:
                q4_last_year = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == 12)]
                q_last_year = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == m)]
                
                if not q4_last_year.empty and not q_last_year.empty:
                    rev_ttm = row['revenue'] + q4_last_year.iloc[0]['revenue'] - q_last_year.iloc[0]['revenue']
                    cf_ttm = row['cashflow'] + q4_last_year.iloc[0]['cashflow'] - q_last_year.iloc[0]['cashflow']
                    op_ttm = row['operate_cashflow'] + q4_last_year.iloc[0]['operate_cashflow'] - q_last_year.iloc[0]['operate_cashflow']
                    np_ttm = row['net_profit'] + q4_last_year.iloc[0]['net_profit'] - q_last_year.iloc[0]['net_profit']
                    ttm_revenue.append(rev_ttm)
                    ttm_cashflow.append(cf_ttm)
                    ttm_operate.append(op_ttm)
                    ttm_netprofit.append(np_ttm)
                else:
                    ttm_revenue.append(None)
                    ttm_cashflow.append(None)
                    ttm_operate.append(None)
                    ttm_netprofit.append(None)
                    
        df_merged['revenue'] = ttm_revenue
        df_merged['cashflow'] = ttm_cashflow
        df_merged['operate_cashflow'] = ttm_operate
        df_merged['net_profit'] = ttm_netprofit
        df_merged = df_merged.dropna()
        
        # Take the requested number of quarters
        df_merged = df_merged.tail(quarters)
        
        result_data = []
        for index, row in df_merged.iterrows():
            # Convert units to 100 million (亿元)
            revenue_in_100m = round(row['revenue'] / 100000000, 5) if pd.notna(row['revenue']) else None
            cashflow_in_100m = round(row['cashflow'] / 100000000, 5) if pd.notna(row['cashflow']) else None
            operate_in_100m = round(row['operate_cashflow'] / 100000000, 5) if pd.notna(row['operate_cashflow']) else None
            netprofit_in_100m = round(row['net_profit'] / 100000000, 5) if pd.notna(row['net_profit']) else None
            
            result_data.append({
                "date": row['REPORT_DATE'].strftime('%Y-%m-%d'),
                "revenue": revenue_in_100m,
                "cashflow": cashflow_in_100m,
                "operate_cashflow": operate_in_100m,
                "net_profit": netprofit_in_100m
            })

        print(json.dumps({
            "success": True,
            "data": result_data
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))

if __name__ == "__main__":
    fetch_data()
