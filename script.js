// ==================== Stock Prediction Application ====================

class StockPredictor {
    constructor() {
        this.form = document.getElementById('stockForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.loading = document.getElementById('loading');
        this.resultsContent = document.getElementById('resultsContent');

        // Chart instances
        this.technicalChart = null;
        this.revenueChart = null;
        this.chipChart = null;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Set Chart.js defaults
        Chart.defaults.color = '#b4b4c8';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    }

    async handleSubmit(e) {
        e.preventDefault();

        const stockTicker = document.getElementById('stockTicker').value.trim().toUpperCase();
        const holdingPeriod = document.getElementById('holdingPeriod').value;

        if (!stockTicker || !holdingPeriod) {
            this.showError('請填寫所有必填欄位');
            return;
        }

        this.showLoading();

        // Simulate API call delay
        await this.delay(1500);

        try {
            const prediction = this.generatePrediction(stockTicker, holdingPeriod);
            this.displayResults(prediction);
            this.renderCharts(prediction);
        } catch (error) {
            this.showError('分析失敗，請稍後再試');
            console.error(error);
        }
    }

    generatePrediction(ticker, period) {
        const basePrice = this.getSimulatedPrice(ticker);
        const params = this.getPeriodParameters(period);

        // Calculate basic price targets
        const volatility = basePrice * params.volatility;
        const expectedReturn = basePrice * params.expectedReturn;

        const buyPrice = basePrice - (volatility * (0.8 + Math.random() * 0.4));
        const sellPrice = basePrice + expectedReturn + (volatility * (0.5 + Math.random() * 0.5));

        // Generate advanced data
        const technicalData = this.generateTechnicalData(basePrice);
        const revenueData = this.generateRevenueData();
        const chipData = this.generateChipData();
        const timingData = this.generateTimingData(period, technicalData);

        return {
            ticker,
            period,
            currentPrice: basePrice,
            buyPrice,
            buyRange: { low: buyPrice * 0.97, high: buyPrice * 1.03 },
            sellPrice,
            sellRange: { low: sellPrice * 0.97, high: sellPrice * 1.03 },
            buyConfidence: 65 + Math.random() * 20,
            sellConfidence: 60 + Math.random() * 25,
            expectedReturn: ((sellPrice - buyPrice) / buyPrice * 100).toFixed(2),
            riskLevel: params.riskLevel,
            periodDisplay: params.displayName,
            technical: technicalData,
            revenue: revenueData,
            chip: chipData,
            timing: timingData
        };
    }

    getSimulatedPrice(ticker) {
        const priceRanges = {
            'AAPL': { min: 150, max: 200 },
            'TSLA': { min: 200, max: 300 },
            'GOOGL': { min: 120, max: 150 },
            'MSFT': { min: 350, max: 400 },
            'AMZN': { min: 140, max: 180 },
            '2330.TW': { min: 500, max: 650 },
            '2317.TW': { min: 80, max: 120 },
            'default': { min: 50, max: 150 }
        };
        const range = priceRanges[ticker] || priceRanges['default'];
        return range.min + Math.random() * (range.max - range.min);
    }

    getPeriodParameters(period) {
        const parameters = {
            'short': { volatility: 0.03, expectedReturn: 0.05, riskLevel: '高風險', displayName: '短期 (1-7天)' },
            'medium': { volatility: 0.05, expectedReturn: 0.12, riskLevel: '中等風險', displayName: '中期 (1-3個月)' },
            'long': { volatility: 0.08, expectedReturn: 0.25, riskLevel: '低風險', displayName: '長期 (6個月以上)' }
        };
        return parameters[period] || parameters['medium'];
    }

    generateTechnicalData(currentPrice) {
        const history = [];
        let price = currentPrice * 0.85;
        for (let i = 0; i < 60; i++) {
            price = price * (1 + (Math.random() - 0.45) * 0.05);
            history.push(price);
        }
        // Ensure last price matches current
        history[history.length - 1] = currentPrice;

        return {
            history,
            rsi: 30 + Math.random() * 40,
            macd: (Math.random() - 0.5) * 2,
            k: 20 + Math.random() * 60,
            d: 20 + Math.random() * 60
        };
    }

    generateRevenueData() {
        const monthly = [];
        for (let i = 0; i < 12; i++) {
            monthly.push(100 + Math.random() * 50 + i * 2);
        }
        return {
            monthly,
            yoy: (Math.random() * 20 - 5).toFixed(2),
            mom: (Math.random() * 10 - 2).toFixed(2)
        };
    }

    generateChipData() {
        const foreign = [];
        const trust = [];
        const dealer = [];
        for (let i = 0; i < 10; i++) {
            foreign.push(Math.floor((Math.random() - 0.5) * 1000));
            trust.push(Math.floor((Math.random() - 0.5) * 500));
            dealer.push(Math.floor((Math.random() - 0.5) * 200));
        }
        return { foreign, trust, dealer };
    }

    generateTimingData(period, technical) {
        const score = Math.random() * 100;
        let signal, entry, exit, stop;

        if (score > 80) signal = '強力買入';
        else if (score > 60) signal = '買入';
        else if (score > 40) signal = '持有';
        else if (score > 20) signal = '賣出';
        else signal = '強力賣出';

        const current = technical.history[technical.history.length - 1];
        entry = (current * 0.98).toFixed(2);
        exit = (current * 1.1).toFixed(2);
        stop = (current * 0.95).toFixed(2);

        return { score, signal, entry, exit, stop };
    }

    displayResults(prediction) {
        // Basic Info
        document.getElementById('resultStockName').textContent = `${prediction.ticker} 分析結果`;
        document.getElementById('resultBadge').textContent = prediction.periodDisplay;

        // Price Cards
        document.getElementById('buyPrice').textContent = formatCurrency(prediction.buyPrice);
        document.getElementById('buyRange').textContent = `${formatCurrency(prediction.buyRange.low)} - ${formatCurrency(prediction.buyRange.high)}`;
        document.getElementById('buyConfidence').style.width = `${prediction.buyConfidence}%`;
        document.getElementById('buyConfidenceText').textContent = `信心指數: ${prediction.buyConfidence.toFixed(0)}%`;

        document.getElementById('sellPrice').textContent = formatCurrency(prediction.sellPrice);
        document.getElementById('sellRange').textContent = `${formatCurrency(prediction.sellRange.low)} - ${formatCurrency(prediction.sellRange.high)}`;
        document.getElementById('sellConfidence').style.width = `${prediction.sellConfidence}%`;
        document.getElementById('sellConfidenceText').textContent = `信心指數: ${prediction.sellConfidence.toFixed(0)}%`;

        // Timing Analysis
        const arrowPos = prediction.timing.score;
        document.getElementById('signalArrow').style.left = `${arrowPos}%`;
        document.getElementById('overallSignal').textContent = prediction.timing.signal;
        document.getElementById('overallSignal').style.color = this.getSignalColor(prediction.timing.signal);
        document.getElementById('entryPoint').textContent = formatCurrency(parseFloat(prediction.timing.entry));
        document.getElementById('exitPoint').textContent = formatCurrency(parseFloat(prediction.timing.exit));
        document.getElementById('stopLoss').textContent = formatCurrency(parseFloat(prediction.timing.stop));

        // Technical Indicators
        this.updateIndicator('rsi', prediction.technical.rsi, 30, 70);
        this.updateIndicator('macd', prediction.technical.macd, 0, 0);
        this.updateIndicator('kd', prediction.technical.k, 20, 80);

        // Revenue & Chip Stats
        document.getElementById('revenueYoy').textContent = formatPercentage(parseFloat(prediction.revenue.yoy));
        document.getElementById('revenueYoy').className = `value ${parseFloat(prediction.revenue.yoy) >= 0 ? 'text-success' : 'text-danger'}`;
        document.getElementById('revenueMom').textContent = formatPercentage(parseFloat(prediction.revenue.mom));

        const sum = arr => arr.reduce((a, b) => a + b, 0);
        this.updateChipStat('foreignBuySell', sum(prediction.chip.foreign));
        this.updateChipStat('trustBuySell', sum(prediction.chip.trust));
        this.updateChipStat('dealerBuySell', sum(prediction.chip.dealer));

        // Detailed Stats
        document.getElementById('currentPrice').textContent = formatCurrency(prediction.currentPrice);
        document.getElementById('expectedReturn').textContent = `${prediction.expectedReturn}%`;
        document.getElementById('riskLevel').textContent = prediction.riskLevel;
        document.getElementById('holdingPeriodDisplay').textContent = prediction.periodDisplay;

        // Show Results
        this.hideLoading();
        this.resultsContent.classList.add('active');

        setTimeout(() => this.animateConfidenceBars(), 100);
    }

    updateIndicator(id, value, low, high) {
        const elValue = document.getElementById(`${id}Value`);
        const elStatus = document.getElementById(`${id}Status`);

        elValue.textContent = value.toFixed(2);

        let status, color;
        if (id === 'macd') {
            status = value > 0 ? '多頭' : '空頭';
            color = value > 0 ? '#00f2fe' : '#fa709a';
        } else {
            if (value > high) { status = '超買'; color = '#fa709a'; }
            else if (value < low) { status = '超賣'; color = '#00f2fe'; }
            else { status = '中立'; color = '#b4b4c8'; }
        }

        elStatus.textContent = status;
        elStatus.style.backgroundColor = `${color}33`; // 20% opacity
        elStatus.style.color = color;
    }

    updateChipStat(id, value) {
        const el = document.getElementById(id);
        el.textContent = value > 0 ? `+${value}` : value;
        el.style.color = value > 0 ? '#00f2fe' : '#fa709a';
    }

    getSignalColor(signal) {
        if (signal.includes('買入')) return '#00f2fe';
        if (signal.includes('賣出')) return '#fa709a';
        return '#b4b4c8';
    }

    renderCharts(prediction) {
        this.destroyCharts();

        // Technical Chart
        const ctxTech = document.getElementById('technicalChart').getContext('2d');
        this.technicalChart = new Chart(ctxTech, {
            type: 'line',
            data: {
                labels: Array.from({ length: 60 }, (_, i) => i + 1),
                datasets: [{
                    label: '股價走勢',
                    data: prediction.technical.history,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });

        // Revenue Chart
        const ctxRev = document.getElementById('revenueChart').getContext('2d');
        this.revenueChart = new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '月營收 (億)',
                    data: prediction.revenue.monthly,
                    backgroundColor: '#4facfe',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Chip Chart
        const ctxChip = document.getElementById('chipChart').getContext('2d');
        this.chipChart = new Chart(ctxChip, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 10 }, (_, i) => `T-${9 - i}`),
                datasets: [
                    { label: '外資', data: prediction.chip.foreign, backgroundColor: '#f093fb' },
                    { label: '投信', data: prediction.chip.trust, backgroundColor: '#4facfe' },
                    { label: '自營商', data: prediction.chip.dealer, backgroundColor: '#fa709a' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }

    destroyCharts() {
        if (this.technicalChart) this.technicalChart.destroy();
        if (this.revenueChart) this.revenueChart.destroy();
        if (this.chipChart) this.chipChart.destroy();
    }

    animateConfidenceBars() {
        const buyBar = document.getElementById('buyConfidence');
        const sellBar = document.getElementById('sellConfidence');
        const buyWidth = buyBar.style.width;
        const sellWidth = sellBar.style.width;
        buyBar.style.width = '0%';
        sellBar.style.width = '0%';
        setTimeout(() => {
            buyBar.style.width = buyWidth;
            sellBar.style.width = sellWidth;
        }, 50);
    }

    showLoading() {
        this.resultsSection.classList.add('active');
        this.loading.style.display = 'block';
        this.resultsContent.classList.remove('active');
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        alert(message);
        this.resultsSection.classList.remove('active');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StockPredictor();
    const stockInput = document.getElementById('stockTicker');
    stockInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

function formatCurrency(value, decimals = 2) {
    return `$${value.toFixed(decimals)}`;
}

function formatPercentage(value, decimals = 2) {
    return `${value}%`;
}
