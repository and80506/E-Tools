import requests
import json
import datetime
import os
import sys
import warnings

warnings.filterwarnings('ignore')

def fetch_data():
    token = os.environ.get('LIXINGER_TOKEN')
    if not token:
        print(json.dumps({
            "success": False,
            "message": "LIXINGER_TOKEN environment variable not set"
        }))
        sys.exit(1)
        
    stock_code = sys.argv[1] if len(sys.argv) > 1 else "000300"

    url = "https://open.lixinger.com/api/cn/index/fundamental"
    eight_years_ago = (datetime.datetime.now() - datetime.timedelta(days=8*365)).strftime('%Y-%m-%d')
    
    payload = {
        "token": token,
        "startDate": eight_years_ago,
        "stockCodes": [stock_code],
        "metricsList": ["pe_ttm.mcw", "mc", "ps_ttm.mcw"]
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        res_data = res.json()
        
        if res_data.get('code') != 1:
            print(json.dumps({
                "success": False,
                "message": res_data.get('error', {}).get('message', 'Lixinger API error')
            }))
            sys.exit(1)
            
        lixinger_data = res_data.get('data', [])
        
        # Format the data for the frontend
        results = []
        for row in lixinger_data:
            date_str = row['date'][:10].replace("-", "")
            pe = row.get('pe_ttm.mcw', 0)
            mc = row.get('mc', 0)
            ps = row.get('ps_ttm.mcw', 0)
            
            # Revenue = Market Cap / PS
            # If PS is 0 or very small, just set revenue to 0 to avoid division by zero
            revenue = (mc / ps) if ps > 0 else 0
            
            # Divide mc and revenue by 100,000,000 to match frontend's expectation if it expects absolute value
            # Wait, the previous frontend expected `total_mv` in some specific unit. Let's just output true values, 
            # and the frontend can format them to billions/trillions.
            results.append({
                "trade_date": date_str,
                "pe_ttm": pe,
                "pe": pe,
                "total_mv": mc,
                "revenue": revenue
            })
            
        # Sort ascending by date
        results.sort(key=lambda x: x['trade_date'])
        
        print(json.dumps({
            "success": True,
            "data": results
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    fetch_data()
