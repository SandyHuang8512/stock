import yfinance as yf
import pandas as pd
import os

os.environ['YFINANCE_CACHE_DIR'] = "/tmp/yfinance"

def check_keys(ticker_symbol):
    stock = yf.Ticker(ticker_symbol)
    try:
        q_income = stock.quarterly_income_stmt
        print(f"Indices: {q_income.index.tolist()}")
        
        if 'Total Revenue' in q_income.index:
            print("Found 'Total Revenue'")
            print(q_income.loc['Total Revenue'])
        elif 'Operating Revenue' in q_income.index:
            print("Found 'Operating Revenue'")
            print(q_income.loc['Operating Revenue'])
        else:
            print("Revenue key not found")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_keys("2330.TW")
