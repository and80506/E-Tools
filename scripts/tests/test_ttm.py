import pandas as pd
import akshare as ak
import sys

code = "002594"
df_profit = ak.stock_profit_sheet_by_report_em(symbol="sz" + code)
df_cash = ak.stock_cash_flow_sheet_by_report_em(symbol="sz" + code)

df_profit = df_profit[['REPORT_DATE', 'TOTAL_OPERATE_INCOME']].rename(columns={'TOTAL_OPERATE_INCOME': 'revenue'})
df_cash = df_cash[['REPORT_DATE', 'SALES_SERVICES']].rename(columns={'SALES_SERVICES': 'cashflow'})

df_profit['REPORT_DATE'] = pd.to_datetime(df_profit['REPORT_DATE'])
df_cash['REPORT_DATE'] = pd.to_datetime(df_cash['REPORT_DATE'])

df_merged = pd.merge(df_profit, df_cash, on='REPORT_DATE', how='inner')
df_merged = df_merged.sort_values('REPORT_DATE', ascending=True).reset_index(drop=True)
df_merged = df_merged.dropna()

# Calculate TTM
def calculate_ttm(df):
    df = df.copy()
    df['year'] = df['REPORT_DATE'].dt.year
    df['month'] = df['REPORT_DATE'].dt.month
    
    ttm_revenue = []
    ttm_cashflow = []
    
    for i, row in df.iterrows():
        y = row['year']
        m = row['month']
        
        if m == 12:
            ttm_revenue.append(row['revenue'])
            ttm_cashflow.append(row['cashflow'])
        else:
            # Need Q4 of year y-1, and Q of year y-1
            q4_last_year = df[(df['year'] == y - 1) & (df['month'] == 12)]
            q_last_year = df[(df['year'] == y - 1) & (df['month'] == m)]
            
            if not q4_last_year.empty and not q_last_year.empty:
                rev_ttm = row['revenue'] + q4_last_year.iloc[0]['revenue'] - q_last_year.iloc[0]['revenue']
                cf_ttm = row['cashflow'] + q4_last_year.iloc[0]['cashflow'] - q_last_year.iloc[0]['cashflow']
                ttm_revenue.append(rev_ttm)
                ttm_cashflow.append(cf_ttm)
            else:
                ttm_revenue.append(None)
                ttm_cashflow.append(None)
                
    df['revenue_ttm'] = ttm_revenue
    df['cashflow_ttm'] = ttm_cashflow
    return df

df_ttm = calculate_ttm(df_merged)
print(df_ttm.tail(8))
