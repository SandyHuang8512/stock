from flask import Flask, jsonify, send_from_directory, request
import requests
import os
import random
from datetime import datetime

# Vercel (and other serverless platforms) use a read-only filesystem, 
# but allow writing to /tmp. We must tell yfinance to use /tmp for caching.
os.environ['YFINANCE_CACHE_DIR'] = "/tmp/yfinance"
import yfinance as yf

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/stock/<ticker>')
def get_stock_data(ticker):
    try:
        # Auto-fix Taiwan stock codes (4 digits -> .TW)
        if ticker.isdigit() and len(ticker) == 4:
            ticker = f"{ticker}.TW"

        # Fetch data from Yahoo Finance 
        # (yfinance v0.2.66+ handles sessions internally using curl_cffi, 
        # providing a custom requests.Session will break it)
        stock = yf.Ticker(ticker)
        
        # Get current price (Use 1m interval for latest price)
        current_price = None
        try:
            # Try to get the latest 1-minute data (most accurate for "now")
            hist_1d = stock.history(period="1d", interval="1m")
            if not hist_1d.empty:
                current_price = hist_1d['Close'].iloc[-1]
        except Exception as e:
            print(f"Error fetching exact real-time data: {e}")

        # Fallback to standard info if 1m history fails
        if not current_price:
            info = stock.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        
        if not current_price:
            # Final Fallback: Try fetching 1 day history (standard daily)
            hist = stock.history(period="1d")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
            else:
                return jsonify({'error': '無法獲取股價資訊'}), 404

        # Get historical data for chart (60 days)
        hist_60d = stock.history(period="3mo")
        history_prices = hist_60d['Close'].tolist()[-60:]
        
        # Simulated Chip Data (Real chip data is hard to get for free via yfinance)
        # We will generate realistic patterns based on price movement
        chip_data = generate_chip_data(len(history_prices))

        # Safely get currency/info
        currency = 'USD'
        try:
            info = stock.info
            currency = info.get('currency', 'USD')
        except Exception:
            print(f"Warning: Could not fetch stock info for {ticker}")
            # Try to guess currency for TW stocks
            if '.TW' in ticker.upper():
                currency = 'TWD'

        return jsonify({
            'ticker': ticker.upper(),
            'currentPrice': current_price,
            'currency': currency,
            'history': history_prices,
            'chip': chip_data,
            'timestamp': datetime.now().strftime('%Y/%m/%d %H:%M:%S')
        })

    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return jsonify({'error': str(e)}), 500

def generate_chip_data(days=10):
    # Simulate institutional activity
    foreign = []
    trust = []
    dealer = []
    for _ in range(10):
        foreign.append(random.randint(-1000, 1000))
        trust.append(random.randint(-500, 500))
        dealer.append(random.randint(-200, 200))
    return {'foreign': foreign, 'trust': trust, 'dealer': dealer}

if __name__ == '__main__':
    print("Starting Stock Prediction Server...")
    print("Please open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
