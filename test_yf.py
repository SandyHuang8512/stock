import yfinance as yf
import requests
import time

def test_ticker(ticker_symbol):
    print(f"Testing {ticker_symbol}...")
    
    # 1. Try default (might fail if IP blocked)
    print("1. Testing default yf.Ticker...")
    try:
        t = yf.Ticker(ticker_symbol)
        hist = t.history(period="1d")
        if not hist.empty:
            print(f"   Success (Default)! Price: {hist['Close'].iloc[-1]}")
        else:
            print("   Failed (Default): Empty history")
    except Exception as e:
        print(f"   Error (Default): {e}")

    # 2. Try with custom session
    print("\n2. Testing with Custom Session...")
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        t = yf.Ticker(ticker_symbol, session=session)
        hist = t.history(period="1d")
        if not hist.empty:
            print(f"   Success (Session)! Price: {hist['Close'].iloc[-1]}")
        else:
            print("   Failed (Session): Empty history")
    except Exception as e:
        print(f"   Error (Session): {e}")

if __name__ == "__main__":
    test_ticker("2330.TW")
    test_ticker("AAPL")
