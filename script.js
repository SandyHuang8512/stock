// ==================== Stock Prediction Application ====================

class StockPredictor {
    constructor() {
        this.form = document.getElementById('stockForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.loading = document.getElementById('loading');
        this.resultsContent = document.getElementById('resultsContent');
        this.refreshBtn = document.getElementById('refreshBtn');

        // Chart instances
        this.technicalChart = null;
        this.revenueChart = null;
        this.chipChart = null;

        // State
        this.currentPrediction = null;
        this.selectedSignal = null;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());

        this.setupSignalInteractivity();

        Chart.defaults.color = '#b4b4c8';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    }

    setupSignalInteractivity() {
        const labels = document.querySelectorAll('.meter-labels span');
        const signals = ['強力賣出', '賣出', '持有', '買入', '強力買入'];

        labels.forEach((label, index) => {
            label.addEventListener('click', () => {
                if (!this.currentPrediction) return;

                this.selectedSignal = signals[index];
                this.updateTimingDisplay(this.selectedSignal, index * 25);
                this.recalculateTradePlan(this.selectedSignal);
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        await this.runAnalysis();
    }

    async runAnalysis() {
        const stockTicker = document.getElementById('stockTicker').value.trim();
        const periodValue = document.getElementById('periodValue').value;
        const periodUnit = document.getElementById('periodUnit').value;

        if (!stockTicker) return;

        // Show loading state
        this.resultsSection.classList.add('active');
        this.loading.style.display = 'block';
        this.resultsContent.style.display = 'none';

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });

        try {
            const response = await fetch(`/api/stock/${stockTicker}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '無法獲取數據');
            }

            this.currentPrediction = data;

            // Calculate total holding days
            let holdingDays = periodValue;
            if (periodUnit === 'weeks') holdingDays *= 7;
            if (periodUnit === 'months') holdingDays *= 30;

            this.currentPrediction.holdingDays = holdingDays;

            this.updateUI(data);
            this.renderCharts(data);

            // Hide loading, show content
            this.loading.style.display = 'none';
            this.resultsContent.style.display = 'block';
            document.getElementById('updateInfo').style.display = 'flex';

        } catch (error) {
            alert(error.message);
            this.resultsSection.classList.remove('active');
            this.loading.style.display = 'none';
        }
    }

    updateUI(data) {
        document.getElementById('resultStockName').textContent = `${data.ticker} 分析結果`;
        document.getElementById('resultBadge').textContent = data.currency;

        const currentPrice = data.currentPrice;
        document.getElementById('currentPrice').textContent = formatCurrency(currentPrice);
        document.getElementById('lastUpdateTime').textContent = data.timestamp;

        // Get dynamic parameters based on holding period
        const { volatility, expectedReturn, riskLevel } = this.getDynamicParameters(this.currentPrediction.holdingDays);

        // Update Stats
        document.getElementById('riskLevel').textContent = riskLevel;
        document.getElementById('expectedReturn').textContent = formatPercentage(expectedReturn * 100);
        document.getElementById('holdingPeriodDisplay').textContent = `${document.getElementById('periodValue').value} ${document.getElementById('periodUnit').options[document.getElementById('periodUnit').selectedIndex].text}`;

        // Generate Timing Signals
        const timing = this.generateTimingData(data.history, currentPrice);

        // Update Buy/Sell Cards
        const buyPrice = currentPrice * (1 - volatility);
        const sellPrice = currentPrice * (1 + volatility); // Simple logic for demo

        document.getElementById('buyPrice').textContent = formatCurrency(buyPrice);
        document.getElementById('buyRange').textContent = `${formatCurrency(buyPrice * 0.98)} - ${formatCurrency(buyPrice * 1.02)}`;

        // Random confidence for demo
        const buyConf = Math.floor(60 + Math.random() * 30);
        document.getElementById('buyConfidence').style.width = `${buyConf}%`;
        document.getElementById('buyConfidenceText').textContent = `信心指數: ${buyConf}%`;

        document.getElementById('sellPrice').textContent = formatCurrency(sellPrice);
        document.getElementById('sellRange').textContent = `${formatCurrency(sellPrice * 0.98)} - ${formatCurrency(sellPrice * 1.02)}`;

        const sellConf = Math.floor(60 + Math.random() * 30);
        document.getElementById('sellConfidence').style.width = `${sellConf}%`;
        document.getElementById('sellConfidenceText').textContent = `信心指數: ${sellConf}%`;

        // Update Timing Meter
        this.updateTimingDisplay(timing.signal, timing.score);
        this.recalculateTradePlan(timing.signal);

        // Technical Indicators (Simulated)
        document.getElementById('rsiValue').textContent = (30 + Math.random() * 40).toFixed(2);
        document.getElementById('rsiStatus').textContent = Math.random() > 0.5 ? '中立' : '超買';
        document.getElementById('macdValue').textContent = (Math.random() * 2 - 1).toFixed(2);
        document.getElementById('macdStatus').textContent = Math.random() > 0.5 ? '黃金交叉' : '死亡交叉';
        document.getElementById('kdValue').textContent = (20 + Math.random() * 60).toFixed(2);
        document.getElementById('kdStatus').textContent = '盤整';

        // Revenue YoY/MoM (Simulated)
        document.getElementById('revenueYoy').textContent = (Math.random() * 20 - 5).toFixed(2) + '%';
        document.getElementById('revenueMom').textContent = (Math.random() * 10 - 2).toFixed(2) + '%';

        // Chip Stats (from backend)
        const chips = data.chip;
        const lastForeign = chips.foreign[chips.foreign.length - 1];
        const lastTrust = chips.trust[chips.trust.length - 1];
        const lastDealer = chips.dealer[chips.dealer.length - 1];

        this.setChipValue('foreignBuySell', lastForeign);
        this.setChipValue('trustBuySell', lastTrust);
        this.setChipValue('dealerBuySell', lastDealer);
    }

    setChipValue(id, value) {
        const el = document.getElementById(id);
        el.textContent = value > 0 ? `+${value}` : value;
        el.style.color = value > 0 ? '#ff4d4d' : (value < 0 ? '#00cc44' : '#b4b4c8');
    }

    renderCharts(data) {
        // Destroy existing charts if any
        if (this.technicalChart) this.technicalChart.destroy();
        if (this.revenueChart) this.revenueChart.destroy();
        if (this.chipChart) this.chipChart.destroy();

        const labels = Array.from({ length: data.history.length }, (_, i) => i + 1);

        // 1. Technical Chart
        const ctxTech = document.getElementById('technicalChart').getContext('2d');
        this.technicalChart = new Chart(ctxTech, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '股價走勢',
                    data: data.history,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });

        // 2. Revenue Chart (Simulated)
        const ctxRev = document.getElementById('revenueChart').getContext('2d');
        const revenueData = Array.from({ length: 6 }, () => Math.floor(Math.random() * 5000 + 1000));
        this.revenueChart = new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '月營收',
                    data: revenueData,
                    backgroundColor: '#764ba2',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { display: false }
                }
            }
        });

        // 3. Chip Chart (Foreign/Trust/Dealer)
        const ctxChip = document.getElementById('chipChart').getContext('2d');
        this.chipChart = new Chart(ctxChip, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 10 }, (_, i) => `D-${10 - i}`),
                datasets: [
                    { label: '外資', data: data.chip.foreign, backgroundColor: '#ff4d4d' },
                    { label: '投信', data: data.chip.trust, backgroundColor: '#faa04d' },
                    { label: '自營商', data: data.chip.dealer, backgroundColor: '#00cc44' }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true, display: false },
                    y: { stacked: true, display: false }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });
    }

    async handleRefresh() {
        if (this.currentPrediction) {
            await this.runAnalysis();
        }
    }

    /* ================= 工具方法 ================= */

    getDynamicParameters(days) {
        let volatility, expectedReturn, riskLevel;

        // Ultra-conservative settings to ensure prices are "buyable" (close to market)
        if (days <= 7) {
            volatility = 0.005; // 0.5% range (Very tight)
            expectedReturn = 0.01;
            riskLevel = '高風險 (短期)';
        } else if (days <= 90) {
            volatility = 0.01 + (days / 90) * 0.005; // ~1-1.5% range
            expectedReturn = 0.03 + (days / 90) * 0.02;
            riskLevel = '中等風險';
        } else {
            volatility = 0.02 + (days / 365) * 0.01; // Max ~3% range
            expectedReturn = 0.06 + (days / 365) * 0.04;
            riskLevel = '低風險 (長期)';
        }

        return { volatility, expectedReturn, riskLevel };
    }

    generateTimingData(technical, currentPrice) {
        const score = Math.random() * 100;
        let signal;

        if (score > 80) signal = '強力買入';
        else if (score > 60) signal = '買入';
        else if (score > 40) signal = '持有';
        else if (score > 20) signal = '賣出';
        else signal = '強力賣出';

        const plan = this.calculateTradePlan(signal, currentPrice);
        return { score, signal, ...plan };
    }

    calculateTradePlan(signal, price) {
        let entry, exit, stop;

        // Extremely tight spreads to ensure "Buyable" prices
        switch (signal) {
            case '強力買入':
                entry = price * 1.00;      // Buy at Current
                stop = price * 0.98;       // 2% stop
                exit = price * 1.05;       // 5% target
                break;
            case '買入':
                entry = price * 0.995;     // Buy 0.5% dip
                stop = price * 0.97;
                exit = price * 1.04;
                break;
            case '持有':
                entry = price * 0.99;      // Buy 1% dip
                stop = price * 0.96;
                exit = price * 1.02;
                break;
            case '賣出':
                entry = price * 0.98;      // Wait for 2% dip
                stop = price * 0.95;
                exit = price * 1.01;
                break;
            case '強力賣出':
                entry = price * 0.96;      // Wait for 4% dip
                stop = price * 0.93;
                exit = price * 1.00;
                break;
        }

        return {
            entry: entry.toFixed(2),
            exit: exit.toFixed(2),
            stop: stop.toFixed(2)
        };
    }

    recalculateTradePlan(signal) {
        const price = this.currentPrediction.currentPrice;
        const plan = this.calculateTradePlan(signal, price);

        document.getElementById('entryPoint').textContent = formatCurrency(+plan.entry);
        document.getElementById('exitPoint').textContent = formatCurrency(+plan.exit);
        document.getElementById('stopLoss').textContent = formatCurrency(+plan.stop);

        document.getElementById('overallSignal').textContent = signal;
        document.getElementById('overallSignal').style.color = this.getSignalColor(signal);
    }

    updateTimingDisplay(signal, score) {
        document.getElementById('signalArrow').style.left = `${score}%`;
        document.getElementById('overallSignal').textContent = signal;
        document.getElementById('overallSignal').style.color = this.getSignalColor(signal);
    }

    getSignalColor(signal) {
        if (signal.includes('買入')) return '#00f2fe';
        if (signal.includes('賣出')) return '#fa709a';
        return '#b4b4c8';
    }
}

/* ================== DOM Ready ================== */

document.addEventListener('DOMContentLoaded', () => {
    new StockPredictor();

    const stockInput = document.getElementById('stockTicker');
    stockInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    document.querySelectorAll('.glass-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.1}s`;
    });
});

/* ================== Helpers ================== */

function formatCurrency(value, decimals = 2) {
    return `$${value.toFixed(decimals)}`;
}

function formatPercentage(value) {
    return `${value}%`;
}
