import akshare as ak
import json
import sys
import datetime
import pandas as pd
import numpy as np
import warnings
import concurrent.futures

warnings.filterwarnings('ignore')

def get_symbol(stock_code):
    if stock_code.startswith('6'):
        return f"sh{stock_code}"
    elif stock_code.startswith('0') or stock_code.startswith('3'):
        return f"sz{stock_code}"
    elif stock_code.startswith('8') or stock_code.startswith('4'):
        return f"bj{stock_code}"
    return stock_code

def process_fundamentals(df_fund, years):
    start_date = (datetime.datetime.now() - datetime.timedelta(days=years*365 + 30)).date()
    if df_fund is None or df_fund.empty:
        return []
    
    df = df_fund.copy()
    df['数据日期'] = pd.to_datetime(df['数据日期']).dt.date
    df = df[df['数据日期'] >= start_date]
    df = df.sort_values('数据日期')
    
    results = []
    for index, row in df.iterrows():
        date_str = str(row['数据日期'])
        pe = float(row.get('PE(TTM)', 0)) if pd.notnull(row.get('PE(TTM)')) else 0
        ps = float(row.get('市销率', 0)) if pd.notnull(row.get('市销率')) else 0
        mc = float(row.get('总市值', 0)) if pd.notnull(row.get('总市值')) else 0
        mc_wan = mc / 10000
        revenue = (mc_wan / ps) if ps > 0 else 0
        
        results.append({
            "trade_date": date_str.replace('-', ''),
            "pe_ttm": pe,
            "pe": pe,
            "total_mv": mc_wan,
            "revenue": revenue
        })
    return results

def process_revenue_cashflow(df_profit, df_cash, years):
    quarters = (years + 1) * 4
    if df_profit is None or df_profit.empty or df_cash is None or df_cash.empty:
        return []
        
    dp = df_profit[['REPORT_DATE', 'TOTAL_OPERATE_INCOME', 'PARENT_NETPROFIT']].copy()
    dp = dp.rename(columns={'TOTAL_OPERATE_INCOME': 'revenue', 'PARENT_NETPROFIT': 'net_profit'})
    dc = df_cash[['REPORT_DATE', 'SALES_SERVICES', 'NETCASH_OPERATE']].copy()
    dc = dc.rename(columns={'SALES_SERVICES': 'cashflow', 'NETCASH_OPERATE': 'operate_cashflow'})
    
    dp['REPORT_DATE'] = pd.to_datetime(dp['REPORT_DATE'])
    dc['REPORT_DATE'] = pd.to_datetime(dc['REPORT_DATE'])

    df_merged = pd.merge(dp, dc, on='REPORT_DATE', how='inner')
    df_merged = df_merged.sort_values(by='REPORT_DATE', ascending=False)
    df_merged = df_merged.head(quarters + 10)
    df_merged = df_merged.sort_values('REPORT_DATE', ascending=True).reset_index(drop=True)
    
    df_merged['year'] = df_merged['REPORT_DATE'].dt.year
    df_merged['month'] = df_merged['REPORT_DATE'].dt.month
    
    ttm_revenue, ttm_cashflow, ttm_operate, ttm_netprofit = [], [], [], []
    
    for i, row in df_merged.iterrows():
        y, m = row['year'], row['month']
        if m == 12:
            ttm_revenue.append(row['revenue'])
            ttm_cashflow.append(row['cashflow'])
            ttm_operate.append(row['operate_cashflow'])
            ttm_netprofit.append(row['net_profit'])
        else:
            q4_last = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == 12)]
            q_last = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == m)]
            
            if not q4_last.empty and not q_last.empty:
                ttm_revenue.append(row['revenue'] + q4_last.iloc[0]['revenue'] - q_last.iloc[0]['revenue'])
                ttm_cashflow.append(row['cashflow'] + q4_last.iloc[0]['cashflow'] - q_last.iloc[0]['cashflow'])
                ttm_operate.append(row['operate_cashflow'] + q4_last.iloc[0]['operate_cashflow'] - q_last.iloc[0]['operate_cashflow'])
                ttm_netprofit.append(row['net_profit'] + q4_last.iloc[0]['net_profit'] - q_last.iloc[0]['net_profit'])
            else:
                ttm_revenue.append(None); ttm_cashflow.append(None); ttm_operate.append(None); ttm_netprofit.append(None)
                
    df_merged['revenue'] = ttm_revenue
    df_merged['cashflow'] = ttm_cashflow
    df_merged['operate_cashflow'] = ttm_operate
    df_merged['net_profit'] = ttm_netprofit
    df_merged = df_merged.dropna()
    
    df_merged = df_merged.tail(quarters)
    
    results = []
    for index, row in df_merged.iterrows():
        results.append({
            "date": row['REPORT_DATE'].strftime('%Y-%m-%d'),
            "revenue": round(row['revenue'] / 100000000, 5) if pd.notna(row['revenue']) else None,
            "cashflow": round(row['cashflow'] / 100000000, 5) if pd.notna(row['cashflow']) else None,
            "operate_cashflow": round(row['operate_cashflow'] / 100000000, 5) if pd.notna(row['operate_cashflow']) else None,
            "net_profit": round(row['net_profit'] / 100000000, 5) if pd.notna(row['net_profit']) else None
        })
    return results

def process_roe(df_profit, df_balance, years):
    quarters = (years + 1) * 4
    if df_profit is None or df_profit.empty or df_balance is None or df_balance.empty:
        return []
        
    dp = df_profit[['REPORT_DATE', 'PARENT_NETPROFIT']].copy()
    dp = dp.rename(columns={'PARENT_NETPROFIT': 'net_profit'})
    db = df_balance[['REPORT_DATE', 'TOTAL_PARENT_EQUITY']].copy()
    db = db.rename(columns={'TOTAL_PARENT_EQUITY': 'net_asset'})
    
    dp['REPORT_DATE'] = pd.to_datetime(dp['REPORT_DATE'])
    db['REPORT_DATE'] = pd.to_datetime(db['REPORT_DATE'])
    
    df_merged = pd.merge(dp, db, on='REPORT_DATE', how='inner')
    df_merged = df_merged.sort_values(by='REPORT_DATE', ascending=False)
    df_merged = df_merged.head(quarters + 10)
    df_merged = df_merged.sort_values('REPORT_DATE', ascending=True).reset_index(drop=True)
    
    df_merged['year'] = df_merged['REPORT_DATE'].dt.year
    df_merged['month'] = df_merged['REPORT_DATE'].dt.month
    
    ttm_netprofit = []
    for i, row in df_merged.iterrows():
        y, m = row['year'], row['month']
        if m == 12:
            ttm_netprofit.append(row['net_profit'])
        else:
            q4_last = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == 12)]
            q_last = df_merged[(df_merged['year'] == y - 1) & (df_merged['month'] == m)]
            if not q4_last.empty and not q_last.empty:
                ttm_netprofit.append(row['net_profit'] + q4_last.iloc[0]['net_profit'] - q_last.iloc[0]['net_profit'])
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
    return results

def safe_fetch(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except:
        return None

def fetch_stock_all(stock_code, years):
    symbol = get_symbol(stock_code)
    
    # Fetch exactly 4 datasets concurrently, avoiding duplicate downloads
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        f_fund = executor.submit(safe_fetch, ak.stock_value_em, symbol=stock_code)
        f_profit = executor.submit(safe_fetch, ak.stock_profit_sheet_by_report_em, symbol=symbol)
        f_cash = executor.submit(safe_fetch, ak.stock_cash_flow_sheet_by_report_em, symbol=symbol)
        f_balance = executor.submit(safe_fetch, ak.stock_balance_sheet_by_report_em, symbol=symbol)
        
        df_fund = f_fund.result()
        df_profit = f_profit.result()
        df_cash = f_cash.result()
        df_balance = f_balance.result()
        
    try:
        fundamentals = process_fundamentals(df_fund, years)
        rc = process_revenue_cashflow(df_profit, df_cash, years)
        roe = process_roe(df_profit, df_balance, years)
    except Exception as e:
        fundamentals, rc, roe = [], [], []
        
    return {
        "fundamentals": fundamentals,
        "revenueCashflow": rc,
        "roe": roe
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "Missing arguments"}))
        sys.exit(1)
        
    stock_codes = sys.argv[1].split(',')
    years = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    
    results = {}
    
    # We can fetch multiple stocks concurrently. Use max_workers=2 to avoid killing the network or pandas GIL
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_to_code = {executor.submit(fetch_stock_all, code, years): code for code in stock_codes}
        for future in concurrent.futures.as_completed(future_to_code):
            code = future_to_code[future]
            try:
                data = future.result()
                results[code] = data
            except Exception as e:
                results[code] = {"fundamentals": [], "revenueCashflow": [], "roe": []}
                
    print(json.dumps({
        "success": True,
        "data": results
    }))

if __name__ == "__main__":
    main()
