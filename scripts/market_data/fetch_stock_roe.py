import requests
import json
import sys
import pandas as pd
import numpy as np

def fetch_data():
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "600519"
    secucode = f"SH{stock_code}" if stock_code.startswith(('6', '9')) else f"SZ{stock_code}"
    
    url = f"http://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/ZYZBAjaxNew?type=0&code={secucode}"
    try:
        res = requests.get(url, timeout=10).json()
    except Exception as e:
        print(json.dumps({"success": False, "message": f"获取数据失败: {str(e)}"}))
        return

    if "data" not in res or not res["data"]:
        print(json.dumps({"success": False, "message": "无相关 ROE 数据"}))
        return

    df = pd.DataFrame(res["data"])
    
    if 'REPORT_DATE' not in df.columns or 'ROEJQ' not in df.columns or 'PARENTNETPROFIT' not in df.columns:
        print(json.dumps({"success": False, "message": "数据缺少必要的字段"}))
        return

    df['REPORT_DATE'] = pd.to_datetime(df['REPORT_DATE'])
    df = df.sort_values('REPORT_DATE').reset_index(drop=True)

    # 清洗数据
    df['ROEJQ'] = pd.to_numeric(df['ROEJQ'], errors='coerce')
    df['PARENTNETPROFIT'] = pd.to_numeric(df['PARENTNETPROFIT'], errors='coerce')

    # 计算净资产 (根据 ROE = 净利润 / 净资产 * 100)
    # 若 ROEJQ 为 0，避免除以 0
    df['NET_ASSET'] = np.where(df['ROEJQ'] != 0, df['PARENTNETPROFIT'] / (df['ROEJQ'] / 100), np.nan)

    # 提取年份和季度标识
    df['year'] = df['REPORT_DATE'].dt.year
    df['month'] = df['REPORT_DATE'].dt.month

    ttm_results = []
    
    # 按照财报计算 TTM
    # 每年有四次财报：3月, 6月, 9月, 12月
    for index, row in df.iterrows():
        y = row['year']
        m = row['month']
        
        current_profit = row['PARENTNETPROFIT']
        if pd.isna(current_profit) or pd.isna(row['NET_ASSET']):
            continue

        if m == 12:
            # 年报直接取当前净利润
            profit_ttm = current_profit
        else:
            # 非年报 = 当期累计净利润 + 去年全年净利润 - 去年同期累计净利润
            prev_year_annual = df[(df['year'] == y - 1) & (df['month'] == 12)]
            prev_year_same_period = df[(df['year'] == y - 1) & (df['month'] == m)]
            
            if not prev_year_annual.empty and not prev_year_same_period.empty:
                profit_prev_annual = prev_year_annual.iloc[0]['PARENTNETPROFIT']
                profit_prev_same = prev_year_same_period.iloc[0]['PARENTNETPROFIT']
                if not pd.isna(profit_prev_annual) and not pd.isna(profit_prev_same):
                    profit_ttm = current_profit + profit_prev_annual - profit_prev_same
                else:
                    profit_ttm = np.nan
            else:
                profit_ttm = np.nan
                
        if not pd.isna(profit_ttm):
            roe_ttm = (profit_ttm / row['NET_ASSET']) * 100
            
            ttm_results.append({
                "date": row['REPORT_DATE'].strftime('%Y-%m-%d'),
                "report_name": row.get('REPORT_DATE_NAME', ''),
                "company_roe": round(roe_ttm, 2)
            })

    if not ttm_results:
        print(json.dumps({"success": False, "message": "无法计算 ROE TTM 数据"}))
        return

    print(json.dumps({"success": True, "data": ttm_results}))

if __name__ == "__main__":
    fetch_data()
