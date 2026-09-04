import akshare as ak
import json
import sys
import datetime
import warnings
import pandas as pd

warnings.filterwarnings('ignore')

def fetch_data():
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "600519"
    years = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    
    start_date = (datetime.datetime.now() - datetime.timedelta(days=years*365 + 30)).date()
    
    try:
        # Fetch historical valuation data from EastMoney
        df = ak.stock_value_em(symbol=stock_code)
        
        if df is None or df.empty:
            print(json.dumps({"success": False, "message": "该代码不受支持或无相关历史估值数据"}))
            sys.exit(0)
            
        # Filter for the requested years
        df['数据日期'] = pd.to_datetime(df['数据日期']).dt.date
        df = df[df['数据日期'] >= start_date]
        
        # Sort ascending by date
        df = df.sort_values('数据日期')
        
        results = []
        for index, row in df.iterrows():
            # Convert date to standard string
            date_str = str(row['数据日期'])
            pe = float(row.get('PE(TTM)', 0)) if pd.notnull(row.get('PE(TTM)')) else 0
            ps = float(row.get('市销率', 0)) if pd.notnull(row.get('市销率')) else 0
            mc = float(row.get('总市值', 0)) if pd.notnull(row.get('总市值')) else 0
            
            # EastMoney total_mv is absolute RMB, frontend expects it in 万元 (ten thousands)
            mc_wan = mc / 10000
            
            revenue = (mc_wan / ps) if ps > 0 else 0
            
            results.append({
                "trade_date": date_str.replace('-', ''), # Format as YYYYMMDD
                "pe_ttm": pe,
                "pe": pe,
                "total_mv": mc_wan,
                "revenue": revenue
            })
            
        print(json.dumps({
            "success": True,
            "data": results
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": "AkShare EM API Error: " + str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    fetch_data()
