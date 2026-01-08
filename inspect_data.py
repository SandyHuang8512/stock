import yfinance as yf
import pandas as pd
import os

# 設定緩存路徑，避免 Vercel 環境問題 (雖然現在是本地跑，保持一致好習慣)
os.environ['YFINANCE_CACHE_DIR'] = "/tmp/yfinance"

def inspect_data(ticker_symbol):
    print(f"--- Inspecting {ticker_symbol} ---")
    stock = yf.Ticker(ticker_symbol)
    
    print("\n[Income Statement (Annual)]")
    try:
        print(stock.income_stmt.head())
    except Exception as e:
        print(f"Error: {e}")

    print("\n[Quarterly Income Statement]")
    try:
        print(stock.quarterly_income_stmt.head())
    except Exception as e:
        print(f"Error: {e}")

    print("\n[Major Holders]")
    try:
        print(stock.major_holders)
    except Exception as e:
        print(f"Error: {e}")

    print("\n[Institutional Holders]")
    try:
        print(stock.institutional_holders)
    except Exception as e:
        print(f"Error: {e}")
        
    print("\n[Info - Selected Keys]")
    try:
        info = stock.info
        keys_to_check = ['heldPercentInstitutions', 'heldPercentInsiders', 'sharesShort', 'shortRatio']
        for k in keys_to_check:
            print(f"{k}: {info.get(k)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_data("2330.TW")
