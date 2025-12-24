/**
 * ========================================
 * 📊 Dashboard Stats - إحصائيات لوحة التحكم المتقدمة
 * ========================================
 * 
 * نظام إحصائيات متقدم للوحة التحكم مع رسوم بيانية
 * النسخة 2.0 - مع Chart.js
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFStats = (function() {
    'use strict';
    
    // Store chart instances for cleanup
    let chartInstances = {};
    
    // ===== Calculate Stats =====
    function calculateStats(vehicles) {
        const stats = {
            total: vehicles.length,
            totalValue: 0,
            avgValue: 0,
            thisMonth: 0,
            lastMonth: 0,
            ratings: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0
            },
            topVehicles: [],
            byMake: {},
            byYear: {},
            byFuel: {},
            byRecommendation: {},
            monthlyData: {},
            recentVehicles: []
        };
        
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // Initialize monthly data for last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            stats.monthlyData[key] = { count: 0, value: 0 };
        }
        
        vehicles.forEach(v => {
            // Total value
            const value = parseFloat(v.marketValue) || 0;
            stats.totalValue += value;
            
            // Ratings count
            if (v.overallRating && stats.ratings.hasOwnProperty(v.overallRating)) {
                stats.ratings[v.overallRating]++;
            }
            
            // By make
            if (v.make) {
                stats.byMake[v.make] = (stats.byMake[v.make] || 0) + 1;
            }
            
            // By year
            if (v.year) {
                stats.byYear[v.year] = (stats.byYear[v.year] || 0) + 1;
            }
            
            // By fuel type
            if (v.fuelType) {
                stats.byFuel[v.fuelType] = (stats.byFuel[v.fuelType] || 0) + 1;
            }
            
            // By recommendation
            if (v.recommendation) {
                stats.byRecommendation[v.recommendation] = (stats.byRecommendation[v.recommendation] || 0) + 1;
            }
            
            // This month and last month count
            if (v.createdAt) {
                const date = v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
                
                if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
                    stats.thisMonth++;
                }
                
                const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
                    stats.lastMonth++;
                }
                
                // Monthly data for charts
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (stats.monthlyData[key]) {
                    stats.monthlyData[key].count++;
                    stats.monthlyData[key].value += value;
                }
            }
        });
        
        // Average value
        stats.avgValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
        
        // Top 5 vehicles by value
        stats.topVehicles = [...vehicles]
            .filter(v => v.marketValue)
            .sort((a, b) => (parseFloat(b.marketValue) || 0) - (parseFloat(a.marketValue) || 0))
            .slice(0, 5);
        
        // Recent vehicles
        stats.recentVehicles = [...vehicles]
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            })
            .slice(0, 5);
        
        // Month over month trend
        stats.monthTrend = stats.lastMonth > 0 
            ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
            : (stats.thisMonth > 0 ? 100 : 0);
        
        return stats;
    }
    
    // ===== Calculate Average Rating =====
    function calculateAvgRating(ratings) {
        const values = { excellent: 4, good: 3, fair: 2, poor: 1 };
        const total = Object.values(ratings).reduce((a, b) => a + b, 0);
        if (total === 0) return 0;
        
        let sum = 0;
        Object.keys(ratings).forEach(key => {
            sum += ratings[key] * values[key];
        });
        
        return (sum / total).toFixed(1);
    }
    
    // ===== Get Rating Text =====
    function getRatingText(rating) {
        const texts = {
            excellent: 'ممتاز',
            good: 'جيد',
            fair: 'مقبول',
            poor: 'ضعيف'
        };
        return texts[rating] || rating;
    }
    
    // ===== Get Fuel Type Text =====
    function getFuelText(fuel) {
        const texts = {
            petrol: 'بنزين',
            diesel: 'ديزل',
            hybrid: 'هجين',
            electric: 'كهربائي'
        };
        return texts[fuel] || fuel;
    }
    
    // ===== Get Recommendation Text =====
    function getRecommendationText(rec) {
        const texts = {
            'sell_as_is': 'البيع كما هي',
            'repair_sell': 'إصلاح ثم بيع',
            'auction': 'مزاد',
            'scrap': 'تخريد'
        };
        return texts[rec] || rec;
    }
    
    // ===== Format Number =====
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.round(num).toLocaleString('ar-SA');
    }
    
    // ===== Format Full Number =====
    function formatFullNumber(num) {
        return Math.round(num).toLocaleString('ar-SA');
    }
    
    // ===== Get Month Name =====
    function getMonthName(monthKey) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, month] = monthKey.split('-');
        return months[parseInt(month) - 1];
    }
    
    // ===== Create Enhanced Stats HTML =====
    function createEnhancedStatsHTML(stats) {
        const avgRating = calculateAvgRating(stats.ratings);
        const totalRatings = Object.values(stats.ratings).reduce((a, b) => a + b, 0);
        
        // Sort makes by count
        const topMakes = Object.entries(stats.byMake)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        return `
            <div class="nf-dashboard-container">
                <!-- Summary Cards Row -->
                <div class="nf-stats-row">
                    <!-- Total Vehicles Card -->
                    <div class="nf-stat-card nf-card-gradient-1">
                        <div class="nf-stat-icon-bg">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="nf-stat-content">
                            <div class="nf-stat-value">${stats.total}</div>
                            <div class="nf-stat-label">إجمالي المركبات</div>
                            <div class="nf-stat-trend ${parseFloat(stats.monthTrend) >= 0 ? 'up' : 'down'}">
                                <i class="fas fa-${parseFloat(stats.monthTrend) >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                                ${Math.abs(stats.monthTrend)}% عن الشهر الماضي
                            </div>
                        </div>
                    </div>
                    
                    <!-- Total Value Card -->
                    <div class="nf-stat-card nf-card-gradient-2">
                        <div class="nf-stat-icon-bg">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="nf-stat-content">
                            <div class="nf-stat-value">${formatNumber(stats.totalValue)}</div>
                            <div class="nf-stat-label">القيمة الإجمالية (ر.س)</div>
                            <div class="nf-stat-subtext">
                                متوسط: ${formatNumber(stats.avgValue)} ر.س
                            </div>
                        </div>
                    </div>
                    
                    <!-- Average Rating Card -->
                    <div class="nf-stat-card nf-card-gradient-3">
                        <div class="nf-stat-icon-bg">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="nf-stat-content">
                            <div class="nf-stat-value">${avgRating > 0 ? avgRating : '-'}<span class="nf-stat-unit">/4</span></div>
                            <div class="nf-stat-label">متوسط التقييم</div>
                            <div class="nf-stat-subtext">
                                من ${totalRatings} تقييم
                            </div>
                        </div>
                    </div>
                    
                    <!-- This Month Card -->
                    <div class="nf-stat-card nf-card-gradient-4">
                        <div class="nf-stat-icon-bg">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="nf-stat-content">
                            <div class="nf-stat-value">${stats.thisMonth}</div>
                            <div class="nf-stat-label">مركبات هذا الشهر</div>
                            <div class="nf-stat-subtext">
                                الشهر الماضي: ${stats.lastMonth}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts Row -->
                <div class="nf-charts-row">
                    <!-- Monthly Trend Chart -->
                    <div class="nf-chart-card nf-chart-large">
                        <div class="nf-chart-header">
                            <h3><i class="fas fa-chart-line"></i> المركبات المضافة شهرياً</h3>
                        </div>
                        <div class="nf-chart-body">
                            <canvas id="nf-monthly-chart" height="280"></canvas>
                        </div>
                    </div>
                    
                    <!-- Rating Distribution Chart -->
                    <div class="nf-chart-card">
                        <div class="nf-chart-header">
                            <h3><i class="fas fa-chart-pie"></i> توزيع التقييمات</h3>
                        </div>
                        <div class="nf-chart-body">
                            <canvas id="nf-rating-chart" height="280"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Secondary Charts Row -->
                <div class="nf-charts-row nf-charts-secondary">
                    <!-- Top Makes Chart -->
                    <div class="nf-chart-card">
                        <div class="nf-chart-header">
                            <h3><i class="fas fa-industry"></i> أكثر الصانعين</h3>
                        </div>
                        <div class="nf-chart-body">
                            <canvas id="nf-makes-chart" height="250"></canvas>
                        </div>
                    </div>
                    
                    <!-- Fuel Type Chart -->
                    <div class="nf-chart-card">
                        <div class="nf-chart-header">
                            <h3><i class="fas fa-gas-pump"></i> أنواع الوقود</h3>
                        </div>
                        <div class="nf-chart-body">
                            <canvas id="nf-fuel-chart" height="250"></canvas>
                        </div>
                    </div>
                    
                    <!-- Recommendations Chart -->
                    <div class="nf-chart-card">
                        <div class="nf-chart-header">
                            <h3><i class="fas fa-clipboard-check"></i> التوصيات</h3>
                        </div>
                        <div class="nf-chart-body">
                            <canvas id="nf-recommendation-chart" height="250"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Lists Row -->
                <div class="nf-lists-row">
                    <!-- Top Vehicles List -->
                    <div class="nf-list-card">
                        <div class="nf-list-header">
                            <h3><i class="fas fa-trophy"></i> أعلى 5 مركبات قيمة</h3>
                        </div>
                        <div class="nf-list-body">
                            ${stats.topVehicles.length > 0 ? `
                                <ul class="nf-top-list">
                                    ${stats.topVehicles.map((v, i) => `
                                        <li class="nf-top-item">
                                            <span class="nf-top-rank rank-${i + 1}">${i + 1}</span>
                                            <div class="nf-top-info">
                                                <div class="nf-top-name">${v.make || ''} ${v.model || ''} ${v.year || ''}</div>
                                                <div class="nf-top-detail">${v.customerName || 'غير محدد'}</div>
                                            </div>
                                            <span class="nf-top-value">${formatFullNumber(v.marketValue || 0)} ر.س</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            ` : '<p class="nf-empty-text">لا توجد مركبات</p>'}
                        </div>
                    </div>
                    
                    <!-- Recent Vehicles List -->
                    <div class="nf-list-card">
                        <div class="nf-list-header">
                            <h3><i class="fas fa-clock"></i> آخر المركبات المضافة</h3>
                        </div>
                        <div class="nf-list-body">
                            ${stats.recentVehicles.length > 0 ? `
                                <ul class="nf-recent-list">
                                    ${stats.recentVehicles.map(v => {
                                        const date = v.createdAt?.toDate ? v.createdAt.toDate() : new Date(v.createdAt || 0);
                                        const formattedDate = date.toLocaleDateString('ar-SA');
                                        return `
                                            <li class="nf-recent-item">
                                                <div class="nf-recent-icon">
                                                    <i class="fas fa-car"></i>
                                                </div>
                                                <div class="nf-recent-info">
                                                    <div class="nf-recent-name">${v.make || ''} ${v.model || ''} ${v.year || ''}</div>
                                                    <div class="nf-recent-detail">
                                                        <span class="nf-badge nf-badge-${v.overallRating || 'good'}">${getRatingText(v.overallRating)}</span>
                                                        <span>${formattedDate}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            ` : '<p class="nf-empty-text">لا توجد مركبات</p>'}
                        </div>
                    </div>
                    
                    <!-- Rating Details -->
                    <div class="nf-list-card">
                        <div class="nf-list-header">
                            <h3><i class="fas fa-star-half-alt"></i> تفاصيل التقييمات</h3>
                        </div>
                        <div class="nf-list-body">
                            <div class="nf-rating-details">
                                ${Object.entries(stats.ratings).map(([key, count]) => {
                                    const percentage = totalRatings > 0 ? (count / totalRatings * 100).toFixed(0) : 0;
                                    return `
                                        <div class="nf-rating-row">
                                            <span class="nf-rating-label">${getRatingText(key)}</span>
                                            <div class="nf-rating-bar">
                                                <div class="nf-rating-fill nf-fill-${key}" style="width: ${percentage}%"></div>
                                            </div>
                                            <span class="nf-rating-count">${count}</span>
                                            <span class="nf-rating-percent">${percentage}%</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===== Initialize Charts =====
    function initializeCharts(stats) {
        // Destroy existing charts
        Object.values(chartInstances).forEach(chart => {
            if (chart) chart.destroy();
        });
        chartInstances = {};
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded');
            return;
        }
        
        // Configure Chart.js defaults
        Chart.defaults.font.family = "'Cairo', sans-serif";
        Chart.defaults.font.size = 12;
        
        // Monthly Trend Chart
        const monthlyCtx = document.getElementById('nf-monthly-chart');
        if (monthlyCtx) {
            const labels = Object.keys(stats.monthlyData).map(getMonthName);
            const data = Object.values(stats.monthlyData).map(d => d.count);
            
            chartInstances.monthly = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'المركبات المضافة',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // Rating Distribution Chart
        const ratingCtx = document.getElementById('nf-rating-chart');
        if (ratingCtx) {
            const ratingLabels = Object.keys(stats.ratings).map(getRatingText);
            const ratingData = Object.values(stats.ratings);
            
            chartInstances.rating = new Chart(ratingCtx, {
                type: 'doughnut',
                data: {
                    labels: ratingLabels,
                    datasets: [{
                        data: ratingData,
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 20 }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
        
        // Top Makes Chart
        const makesCtx = document.getElementById('nf-makes-chart');
        if (makesCtx) {
            const topMakes = Object.entries(stats.byMake)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);
            
            chartInstances.makes = new Chart(makesCtx, {
                type: 'bar',
                data: {
                    labels: topMakes.map(m => m[0]),
                    datasets: [{
                        label: 'عدد المركبات',
                        data: topMakes.map(m => m[1]),
                        backgroundColor: [
                            '#667eea', '#764ba2', '#f093fb', 
                            '#10b981', '#f59e0b', '#3b82f6'
                        ],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // Fuel Type Chart
        const fuelCtx = document.getElementById('nf-fuel-chart');
        if (fuelCtx) {
            const fuelLabels = Object.keys(stats.byFuel).map(getFuelText);
            const fuelData = Object.values(stats.byFuel);
            
            chartInstances.fuel = new Chart(fuelCtx, {
                type: 'pie',
                data: {
                    labels: fuelLabels.length > 0 ? fuelLabels : ['لا توجد بيانات'],
                    datasets: [{
                        data: fuelData.length > 0 ? fuelData : [1],
                        backgroundColor: fuelData.length > 0 
                            ? ['#667eea', '#f59e0b', '#10b981', '#3b82f6']
                            : ['#e5e7eb']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 15 }
                        }
                    }
                }
            });
        }
        
        // Recommendations Chart
        const recCtx = document.getElementById('nf-recommendation-chart');
        if (recCtx) {
            const recLabels = Object.keys(stats.byRecommendation).map(getRecommendationText);
            const recData = Object.values(stats.byRecommendation);
            
            chartInstances.recommendation = new Chart(recCtx, {
                type: 'bar',
                data: {
                    labels: recLabels.length > 0 ? recLabels : ['لا توجد بيانات'],
                    datasets: [{
                        label: 'عدد المركبات',
                        data: recData.length > 0 ? recData : [0],
                        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
    
    // ===== Initialize Enhanced Stats =====
    function init(containerId, vehicles) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const stats = calculateStats(vehicles);
        container.innerHTML = createEnhancedStatsHTML(stats);
        
        // Initialize charts after DOM update
        setTimeout(() => {
            initializeCharts(stats);
        }, 100);
    }
    
    // ===== Update Stats =====
    function update(containerId, vehicles) {
        init(containerId, vehicles);
    }
    
    console.log('📊 NFStats v2.0 initialized - Enhanced Dashboard with Charts');
    
    // ===== Public API =====
    return {
        init: init,
        update: update,
        calculateStats: calculateStats
    };
    
})();
