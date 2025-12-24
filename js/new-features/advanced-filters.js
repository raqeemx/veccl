/**
 * ========================================
 * 🔍 Advanced Filters - البحث والفلترة المتقدمة
 * ========================================
 * 
 * نظام بحث وفلترة متقدم للمركبات
 * النسخة 2.0 - إصلاح المشاكل وإضافة فلاتر جديدة
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFFilters = (function() {
    'use strict';
    
    // ===== Default Options =====
    const DEFAULT_OPTIONS = {
        searchFields: ['customerName', 'make', 'model', 'vin', 'contractNo', 'plateNo', 'color', 'notes'],
        debounceDelay: 300,
        saveToUrl: true,
        onFilter: null
    };
    
    // ===== Store original vehicles data =====
    let originalVehicles = [];
    
    // ===== Filter Manager Class =====
    class FilterManager {
        constructor(options = {}) {
            this.options = { ...DEFAULT_OPTIONS, ...options };
            this.filters = {};
            this.searchQuery = '';
            this.sortBy = 'createdAt';
            this.sortDir = 'desc';
            this.debounceTimer = null;
            
            // Load filters from URL
            if (this.options.saveToUrl) {
                this.loadFromUrl();
            }
        }
        
        // Set search query
        setSearch(query) {
            this.searchQuery = query.toLowerCase().trim();
            this.debouncedApply();
            
            // Update clear button visibility
            const searchInput = document.getElementById('nf-search-input');
            const clearBtn = document.querySelector('.nf-search-clear');
            if (clearBtn) {
                clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
            }
        }
        
        // Set a filter
        setFilter(key, value) {
            if (value === '' || value === null || value === undefined) {
                delete this.filters[key];
            } else {
                this.filters[key] = value;
            }
            this.debouncedApply();
        }
        
        // Set sort
        setSort(field, direction = 'desc') {
            this.sortBy = field;
            this.sortDir = direction;
            this.apply();
        }
        
        // Reset all filters
        reset() {
            this.filters = {};
            this.searchQuery = '';
            this.sortBy = 'createdAt';
            this.sortDir = 'desc';
            
            // Clear UI elements
            const searchInput = document.getElementById('nf-search-input');
            if (searchInput) searchInput.value = '';
            
            // Hide clear button
            const clearBtn = document.querySelector('.nf-search-clear');
            if (clearBtn) clearBtn.style.display = 'none';
            
            document.querySelectorAll('.nf-filter-select').forEach(select => {
                select.value = '';
            });
            
            const sortSelect = document.getElementById('nf-sort-select');
            if (sortSelect) sortSelect.value = 'createdAt-desc';
            
            this.apply();
        }
        
        // Debounced apply
        debouncedApply() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.apply();
            }, this.options.debounceDelay);
        }
        
        // Apply filters
        apply() {
            if (this.options.saveToUrl) {
                this.saveToUrl();
            }
            
            // Get filtered data using the stored original vehicles
            const filteredData = this.getFilteredData(originalVehicles);
            
            if (this.options.onFilter) {
                this.options.onFilter(filteredData);
            }
            
            // Update active filters display
            this.updateActiveFiltersDisplay();
        }
        
        // Filter data
        getFilteredData(data = []) {
            let filtered = [...data];
            
            // Apply search
            if (this.searchQuery) {
                filtered = filtered.filter(item => {
                    return this.options.searchFields.some(field => {
                        const value = item[field];
                        return value && value.toString().toLowerCase().includes(this.searchQuery);
                    });
                });
            }
            
            // Apply filters
            Object.keys(this.filters).forEach(key => {
                const filterValue = this.filters[key];
                filtered = filtered.filter(item => {
                    const itemValue = item[key];
                    if (itemValue === null || itemValue === undefined || itemValue === '') {
                        return false;
                    }
                    return itemValue.toString().toLowerCase() === filterValue.toString().toLowerCase();
                });
            });
            
            // Apply sort
            filtered.sort((a, b) => {
                let aVal = a[this.sortBy];
                let bVal = b[this.sortBy];
                
                // Handle null/undefined values
                if (aVal === null || aVal === undefined) aVal = '';
                if (bVal === null || bVal === undefined) bVal = '';
                
                // Handle dates (Firebase timestamps)
                if (aVal && aVal.toDate) aVal = aVal.toDate();
                if (bVal && bVal.toDate) bVal = bVal.toDate();
                
                // Handle numbers
                if (typeof aVal === 'string' && !isNaN(aVal) && aVal !== '') aVal = parseFloat(aVal);
                if (typeof bVal === 'string' && !isNaN(bVal) && bVal !== '') bVal = parseFloat(bVal);
                
                let comparison = 0;
                if (aVal > bVal) comparison = 1;
                if (aVal < bVal) comparison = -1;
                
                return this.sortDir === 'desc' ? -comparison : comparison;
            });
            
            return filtered;
        }
        
        // Save to URL
        saveToUrl() {
            const params = new URLSearchParams();
            
            if (this.searchQuery) {
                params.set('q', this.searchQuery);
            }
            
            Object.keys(this.filters).forEach(key => {
                params.set(key, this.filters[key]);
            });
            
            if (this.sortBy !== 'createdAt') {
                params.set('sort', this.sortBy);
            }
            
            if (this.sortDir !== 'desc') {
                params.set('dir', this.sortDir);
            }
            
            const newUrl = params.toString() 
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;
            
            history.replaceState(null, '', newUrl);
        }
        
        // Load from URL
        loadFromUrl() {
            const params = new URLSearchParams(window.location.search);
            
            if (params.has('q')) {
                this.searchQuery = params.get('q');
            }
            
            if (params.has('sort')) {
                this.sortBy = params.get('sort');
            }
            
            if (params.has('dir')) {
                this.sortDir = params.get('dir');
            }
            
            // Load all other params as filters
            const reservedKeys = ['q', 'sort', 'dir'];
            params.forEach((value, key) => {
                if (!reservedKeys.includes(key)) {
                    this.filters[key] = value;
                }
            });
        }
        
        // Update active filters display
        updateActiveFiltersDisplay() {
            const container = document.getElementById('nf-active-filters');
            if (!container) return;
            
            const tags = [];
            
            if (this.searchQuery) {
                tags.push({
                    label: `بحث: "${this.searchQuery}"`,
                    key: 'search',
                    value: this.searchQuery
                });
            }
            
            Object.keys(this.filters).forEach(key => {
                const displayValue = this.getFilterDisplayValue(key, this.filters[key]);
                tags.push({
                    label: `${this.getFilterLabel(key)}: ${displayValue}`,
                    key: key,
                    value: this.filters[key]
                });
            });
            
            if (tags.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }
            
            container.style.display = 'flex';
            container.innerHTML = `
                <span class="nf-active-filters-label">
                    <i class="fas fa-filter"></i>
                    الفلاتر النشطة (${tags.length}):
                </span>
                ${tags.map(tag => `
                    <span class="nf-filter-tag">
                        ${tag.label}
                        <button class="nf-filter-tag-remove" onclick="NFFilters.instance.removeFilter('${tag.key}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `).join('')}
                <button class="nf-clear-all-btn" onclick="NFFilters.instance.reset()">
                    <i class="fas fa-times-circle"></i>
                    مسح الكل
                </button>
            `;
        }
        
        // Get filter display value (translated)
        getFilterDisplayValue(key, value) {
            const translations = {
                overallRating: {
                    'excellent': 'ممتاز',
                    'good': 'جيد',
                    'fair': 'مقبول',
                    'poor': 'ضعيف'
                },
                fuelType: {
                    'petrol': 'بنزين',
                    'diesel': 'ديزل',
                    'hybrid': 'هجين',
                    'electric': 'كهربائي'
                },
                recommendation: {
                    'sell_as_is': 'البيع كما هي',
                    'repair_sell': 'إصلاح ثم بيع',
                    'auction': 'مزاد',
                    'scrap': 'تخريد'
                }
            };
            
            if (translations[key] && translations[key][value]) {
                return translations[key][value];
            }
            return value;
        }
        
        // Remove single filter
        removeFilter(key) {
            if (key === 'search') {
                this.searchQuery = '';
                const searchInput = document.getElementById('nf-search-input');
                if (searchInput) searchInput.value = '';
                const clearBtn = document.querySelector('.nf-search-clear');
                if (clearBtn) clearBtn.style.display = 'none';
            } else {
                delete this.filters[key];
                const select = document.querySelector(`.nf-filter-select[data-filter="${key}"]`);
                if (select) select.value = '';
            }
            this.apply();
        }
        
        // Get filter label
        getFilterLabel(key) {
            const labels = {
                make: 'الصانع',
                model: 'الموديل',
                year: 'السنة',
                overallRating: 'التقييم',
                fuelType: 'نوع الوقود',
                color: 'اللون',
                recommendation: 'التوصية',
                recoveryLocation: 'موقع الاسترداد'
            };
            return labels[key] || key;
        }
        
        // Get active filters count
        getActiveFiltersCount() {
            let count = Object.keys(this.filters).length;
            if (this.searchQuery) count++;
            return count;
        }
    }
    
    // ===== Create Filters UI =====
    function createFiltersUI(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const manager = new FilterManager(options);
        NFFilters.instance = manager;
        
        container.innerHTML = `
            <div class="nf-filters-section">
                <!-- Search Box -->
                <div class="nf-search-box">
                    <i class="fas fa-search nf-search-icon"></i>
                    <input type="text" 
                           id="nf-search-input" 
                           class="nf-search-input" 
                           placeholder="ابحث عن مركبة... (الاسم، الصانع، الموديل، VIN، رقم العقد، اللوحة)"
                           value="${manager.searchQuery}">
                    <button class="nf-search-clear" style="display: ${manager.searchQuery ? 'flex' : 'none'};" onclick="NFFilters.instance.setSearch('')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Filters Grid - Extended with more options -->
                <div class="nf-filters-grid">
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-industry"></i>
                            الصانع
                        </label>
                        <select class="nf-filter-select" data-filter="make" id="nf-filter-make">
                            <option value="">جميع الصانعين</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-car-side"></i>
                            الموديل
                        </label>
                        <select class="nf-filter-select" data-filter="model" id="nf-filter-model">
                            <option value="">جميع الموديلات</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-calendar"></i>
                            السنة
                        </label>
                        <select class="nf-filter-select" data-filter="year" id="nf-filter-year">
                            <option value="">جميع السنوات</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-star"></i>
                            التقييم
                        </label>
                        <select class="nf-filter-select" data-filter="overallRating" id="nf-filter-rating">
                            <option value="">جميع التقييمات</option>
                            <option value="excellent">ممتاز</option>
                            <option value="good">جيد</option>
                            <option value="fair">مقبول</option>
                            <option value="poor">ضعيف</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-gas-pump"></i>
                            نوع الوقود
                        </label>
                        <select class="nf-filter-select" data-filter="fuelType" id="nf-filter-fuel">
                            <option value="">جميع أنواع الوقود</option>
                            <option value="petrol">بنزين</option>
                            <option value="diesel">ديزل</option>
                            <option value="hybrid">هجين</option>
                            <option value="electric">كهربائي</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-palette"></i>
                            اللون
                        </label>
                        <select class="nf-filter-select" data-filter="color" id="nf-filter-color">
                            <option value="">جميع الألوان</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-clipboard-check"></i>
                            التوصية
                        </label>
                        <select class="nf-filter-select" data-filter="recommendation" id="nf-filter-recommendation">
                            <option value="">جميع التوصيات</option>
                            <option value="sell_as_is">البيع كما هي</option>
                            <option value="repair_sell">إصلاح ثم بيع</option>
                            <option value="auction">مزاد</option>
                            <option value="scrap">تخريد</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">
                            <i class="fas fa-map-marker-alt"></i>
                            موقع الاسترداد
                        </label>
                        <select class="nf-filter-select" data-filter="recoveryLocation" id="nf-filter-location">
                            <option value="">جميع المواقع</option>
                        </select>
                    </div>
                </div>
                
                <!-- Filter Actions -->
                <div class="nf-filter-actions">
                    <div class="nf-results-count">
                        <i class="fas fa-car"></i>
                        <span>عرض <strong id="nf-results-count">0</strong> مركبة</span>
                    </div>
                    
                    <div class="nf-sort-options">
                        <span class="nf-sort-label">
                            <i class="fas fa-sort"></i>
                            ترتيب حسب:
                        </span>
                        <select class="nf-sort-select" id="nf-sort-select">
                            <option value="createdAt-desc">الأحدث إضافة</option>
                            <option value="createdAt-asc">الأقدم إضافة</option>
                            <option value="marketValue-desc">الأعلى قيمة</option>
                            <option value="marketValue-asc">الأقل قيمة</option>
                            <option value="year-desc">الأحدث موديل</option>
                            <option value="year-asc">الأقدم موديل</option>
                            <option value="odometer-asc">الأقل مسافة</option>
                            <option value="odometer-desc">الأكثر مسافة</option>
                            <option value="make-asc">الصانع (أ-ي)</option>
                            <option value="customerName-asc">اسم العميل (أ-ي)</option>
                        </select>
                    </div>
                    
                    <button class="nf-btn-filter nf-btn-reset" onclick="NFFilters.instance.reset()">
                        <i class="fas fa-redo"></i>
                        إعادة تعيين
                    </button>
                </div>
                
                <!-- Active Filters -->
                <div class="nf-active-filters" id="nf-active-filters" style="display: none;"></div>
            </div>
        `;
        
        // Setup event listeners
        const searchInput = document.getElementById('nf-search-input');
        searchInput.addEventListener('input', (e) => {
            manager.setSearch(e.target.value);
        });
        
        // Enter key to apply filter immediately
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(manager.debounceTimer);
                manager.apply();
            }
        });
        
        document.querySelectorAll('.nf-filter-select').forEach(select => {
            const filterKey = select.dataset.filter;
            if (manager.filters[filterKey]) {
                select.value = manager.filters[filterKey];
            }
            select.addEventListener('change', (e) => {
                manager.setFilter(filterKey, e.target.value);
            });
        });
        
        const sortSelect = document.getElementById('nf-sort-select');
        sortSelect.value = `${manager.sortBy}-${manager.sortDir}`;
        sortSelect.addEventListener('change', (e) => {
            const [field, dir] = e.target.value.split('-');
            manager.setSort(field, dir);
        });
        
        return manager;
    }
    
    // ===== Populate Filter Options (Fixed - clears old options first) =====
    function populateFilterOptions(data) {
        // Store the original data for filtering
        originalVehicles = [...data];
        
        // Extract unique values
        const makes = [...new Set(data.map(v => v.make).filter(Boolean))].sort();
        const models = [...new Set(data.map(v => v.model).filter(Boolean))].sort();
        const years = [...new Set(data.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);
        const colors = [...new Set(data.map(v => v.color).filter(Boolean))].sort();
        const locations = [...new Set(data.map(v => v.recoveryLocation).filter(Boolean))].sort();
        
        // Helper function to populate select (FIXED: clears existing options first)
        function populateSelect(selectId, values, currentFilter) {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            // Save current value
            const currentValue = select.value;
            
            // Keep only the first "all" option
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Add new options
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            
            // Restore previous value if it still exists
            if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
                select.value = currentValue;
            }
            
            // Or apply from filter state
            if (currentFilter && NFFilters.instance && NFFilters.instance.filters[currentFilter]) {
                select.value = NFFilters.instance.filters[currentFilter];
            }
        }
        
        populateSelect('nf-filter-make', makes, 'make');
        populateSelect('nf-filter-model', models, 'model');
        populateSelect('nf-filter-year', years, 'year');
        populateSelect('nf-filter-color', colors, 'color');
        populateSelect('nf-filter-location', locations, 'recoveryLocation');
        
        // Restore filter select values
        if (NFFilters.instance) {
            Object.keys(NFFilters.instance.filters).forEach(key => {
                const select = document.querySelector(`.nf-filter-select[data-filter="${key}"]`);
                if (select) {
                    select.value = NFFilters.instance.filters[key];
                }
            });
        }
    }
    
    // ===== Update Results Count =====
    function updateResultsCount(count) {
        const el = document.getElementById('nf-results-count');
        if (el) {
            el.textContent = count;
            // Add animation
            el.classList.add('nf-count-updated');
            setTimeout(() => el.classList.remove('nf-count-updated'), 300);
        }
    }
    
    // ===== Get Original Vehicles =====
    function getOriginalVehicles() {
        return originalVehicles;
    }
    
    console.log('🔍 NFFilters v2.0 initialized - Fixed duplicates & added more filters');
    
    // ===== Public API =====
    return {
        FilterManager: FilterManager,
        createFiltersUI: createFiltersUI,
        populateFilterOptions: populateFilterOptions,
        updateResultsCount: updateResultsCount,
        getOriginalVehicles: getOriginalVehicles,
        instance: null
    };
    
})();
