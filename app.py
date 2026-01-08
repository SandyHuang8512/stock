from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import requests
import os
import random
from datetime import datetime, timedelta
import pandas as pd

# Vercel (and other serverless platforms) use a read-only filesystem, 
# but allow writing to /tmp. We must tell yfinance to use /tmp for caching.
os.environ['YFINANCE_CACHE_DIR'] = "/tmp/yfinance"
import yfinance as yf

app = Flask(__name__, static_folder='.')
CORS(app)

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
        
        # Get current price
        # Strategy: 
        # 1. Try stock.info['currentPrice'] or 'regularMarketPrice' (Often fresher snapshot)
        # 2. Try stock.fast_info['last_price'] (e.g. for some exchanges)
        # 3. Fallback to 1m history
        
        current_price = None
        price_time = None
        
        try:
            info = stock.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            if info.get('regularMarketTime'):
                price_time = datetime.fromtimestamp(info.get('regularMarketTime')).strftime('%Y/%m/%d %H:%M:%S')
        except:
            pass
            
        if not current_price:
            try:
                # yfinance 'fast_info' is sometimes faster/better
                current_price = stock.fast_info.last_price
                # Fast info doesn't always provide easy timestamp, default to now if found
            except:
                pass

        if not current_price:
            try:
                # Fallback to history
                hist_1d = stock.history(period="1d", interval="1m")
                if not hist_1d.empty:
                    current_price = hist_1d['Close'].iloc[-1]
                    # Index is timestamp
                    dt = hist_1d.index[-1]
                    # Handle timezone if present
                    if dt.tzinfo:
                         # Convert to local string directly or strip
                         price_time = dt.strftime('%Y/%m/%d %H:%M:%S')
                    else:
                         price_time = dt.strftime('%Y/%m/%d %H:%M:%S')
            except Exception as e:
                print(f"Error fetching real-time history: {e}")
        
        if not current_price:
            # Final Fallback
            hist = stock.history(period="1d")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
            else:
               return jsonify({'error': '無法獲取股價資訊'}), 404

        # Get historical data for chart (60 days)
        hist_60d = stock.history(period="3mo")
        history_prices = hist_60d['Close'].tolist()[-60:]
        
        # Real Revenue Data (Quarterly)
        revenue_data = []
        try:
            q_income = stock.quarterly_income_stmt
            # Use 'Total Revenue' (sometimes 'Operating Revenue' depending on accounting standard)
            rev_key = 'Total Revenue' if 'Total Revenue' in q_income.index else 'Operating Revenue'
            if rev_key in q_income.index:
                rev_series = q_income.loc[rev_key]
                # Sort by date ascending
                rev_series = rev_series.sort_index()
                for date, val in rev_series.items():
                    # Handle NaN
                    if pd.notna(val):
                        # Manual quarter calculation (%q is not supported in Python standard strftime)
                        quarter = (date.month - 1) // 3 + 1
                        revenue_data.append({
                            'date': f"{date.year}-Q{quarter}", 
                            'date_full': date.strftime('%Y-%m'),
                            'value': float(val)
                        })
        except Exception as e:
            print(f"Error fetching revenue: {e}")

        # Real Institutional Holdings (No Daily Flow available via yfinance free tier for TW)
        holdings = {
            'institutions': 0.0,
            'insiders': 0.0
        }
        try:
            info = stock.info
            # Values are usually decimals (0.42 = 42%)
            holdings['institutions'] = info.get('heldPercentInstitutions', 0)
            holdings['insiders'] = info.get('heldPercentInsiders', 0)
        except Exception as e:
            print(f"Error fetching holdings: {e}")

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
            'revenue': revenue_data,
            'holdings': holdings,
            'timestamp': (datetime.utcnow() + timedelta(hours=8)).strftime('%Y/%m/%d %H:%M:%S'),
            'price_time': price_time # Pass actual data time
        })

    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Stock Prediction Server...")
    print("Please open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
