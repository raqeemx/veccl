/**
 * ========================================
 * 📄 Professional PDF Reports - تقارير PDF احترافية
 * ========================================
 * 
 * توليد تقارير PDF احترافية متنوعة
 * مع دعم كامل للغة العربية
 * 
 * الإصدار 2.0
 */

// ===== Namespace to avoid conflicts =====
window.NFReports = (function() {
    'use strict';
    
    // ===== Default Config =====
    const DEFAULT_CONFIG = {
        companyName: 'نظام تقييم المركبات المستردة',
        companyNameEn: 'Repossessed Vehicle Evaluation System',
        logo: null,
        primaryColor: '#1a5f7a',
        secondaryColor: '#667eea'
    };
    
    let config = { ...DEFAULT_CONFIG };
    
    // ===== Set Config =====
    function setConfig(newConfig) {
        config = { ...config, ...newConfig };
    }
    
    // ===== Get jsPDF =====
    function getJsPDF() {
        if (typeof jspdf !== 'undefined') return jspdf.jsPDF;
        if (typeof window.jspdf !== 'undefined') return window.jspdf.jsPDF;
        throw new Error('jsPDF library not loaded');
    }
    
    // ===== Text Mappings (English only for PDF) =====
    const TEXT_MAPS = {
        ratings: {
            'excellent': 'Excellent',
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor'
        },
        ratingsAr: {
            'excellent': 'Excellent',
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor'
        },
        fuelTypes: {
            'petrol': 'Petrol',
            'diesel': 'Diesel',
            'hybrid': 'Hybrid',
            'electric': 'Electric'
        },
        recommendations: {
            'sell_as_is': 'Sell As Is',
            'repair_sell': 'Repair & Sell',
            'auction': 'Auction',
            'scrap': 'Scrap'
        },
        operationalStatus: {
            'working': 'Working',
            'needs_repair': 'Needs Repair',
            'not_working': 'Not Working'
        },
        keysStatus: {
            'available': 'Available',
            'missing': 'Missing',
            'spare_only': 'Spare Only'
        },
        tiresCondition: {
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor',
            'needs_replacement': 'Needs Replacement'
        },
        batteryCondition: {
            'good': 'Good',
            'weak': 'Weak',
            'dead': 'Dead'
        },
        fuelLevel: {
            'full': 'Full',
            'three_quarters': '3/4',
            'half': '1/2',
            'quarter': '1/4',
            'empty': 'Empty'
        }
    };
    
    // ===== Safe Text Function (Remove Arabic characters for PDF) =====
    function safeText(text) {
        if (!text) return 'N/A';
        // Check if text contains Arabic
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
        if (arabicPattern.test(text)) {
            // Return a transliteration or placeholder
            return text.replace(arabicPattern, '') || 'Arabic Text';
        }
        return String(text);
    }
    
    // ===== Get Warehouse Name (English) =====
    function getWarehouseNameEn(warehouse) {
        if (!warehouse) return 'Not Assigned';
        // Try to use code or convert name
        if (warehouse.code) {
            return `${warehouse.code} - ${warehouse.city || 'Unknown'}`;
        }
        return warehouse.city || 'Warehouse';
    }
    
    // ===== Common PDF Setup =====
    function setupPDF(orientation = 'p') {
        const jsPDF = getJsPDF();
        const pdf = new jsPDF(orientation, 'mm', 'a4');
        return pdf;
    }
    
    // ===== Add Header =====
    function addHeader(pdf, title, subtitle = '') {
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Header background
        pdf.setFillColor(26, 95, 122);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        // Gradient effect
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 30, pageWidth, 5, 'F');
        
        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pageWidth / 2, 15, { align: 'center' });
        
        // Subtitle
        if (subtitle) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(subtitle, pageWidth / 2, 25, { align: 'center' });
        }
        
        // Date
        pdf.setFontSize(10);
        pdf.text(`Date: ${new Date().toLocaleDateString('en-US')}`, pageWidth - 15, 25, { align: 'right' });
        
        pdf.setTextColor(0, 0, 0);
        return 45;
    }
    
    // ===== Add Footer =====
    function addFooter(pdf) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const totalPages = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Footer line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
            
            // Footer text
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Vehicle Evaluation System Report', 15, pageHeight - 8);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
        }
    }
    
    // ===== Add Section =====
    function addSection(pdf, title, y) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        pdf.setFillColor(26, 95, 122);
        pdf.rect(15, y - 5, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 18, y);
        pdf.setTextColor(0, 0, 0);
        
        return y + 12;
    }
    
    // ===== Add Row =====
    function addRow(pdf, label, value, y, labelWidth = 55) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label + ':', 18, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value || 'N/A'), 18 + labelWidth, y);
        return y + 6;
    }
    
    // ===== Check Page Break =====
    function checkPageBreak(pdf, y, margin = 30) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        if (y > pageHeight - margin) {
            pdf.addPage();
            return 20;
        }
        return y;
    }
    
    // ===== Generate Comprehensive Inventory Report =====
    async function generateInventoryReport(vehicles, title = 'COMPREHENSIVE INVENTORY REPORT') {
        if (!vehicles || vehicles.length === 0) {
            if (window.showNotification) {
                showNotification('No vehicles to export', 'warning');
            }
            return;
        }
        
        const pdf = setupPDF('p');
        let y = addHeader(pdf, title, `Total Vehicles: ${vehicles.length}`);
        
        // Summary section
        y = addSection(pdf, 'SUMMARY', y);
        
        const totalValue = vehicles.reduce((sum, v) => sum + (parseFloat(v.marketValue) || 0), 0);
        const avgValue = vehicles.length > 0 ? totalValue / vehicles.length : 0;
        
        // Count by rating
        const ratings = { excellent: 0, good: 0, fair: 0, poor: 0 };
        vehicles.forEach(v => {
            if (v.overallRating && ratings.hasOwnProperty(v.overallRating)) {
                ratings[v.overallRating]++;
            }
        });
        
        y = addRow(pdf, 'Total Vehicles', vehicles.length, y);
        y = addRow(pdf, 'Total Value', totalValue.toLocaleString() + ' SAR', y);
        y = addRow(pdf, 'Average Value', Math.round(avgValue).toLocaleString() + ' SAR', y);
        y = addRow(pdf, 'Excellent Rating', ratings.excellent, y);
        y = addRow(pdf, 'Good Rating', ratings.good, y);
        y = addRow(pdf, 'Fair Rating', ratings.fair, y);
        y = addRow(pdf, 'Poor Rating', ratings.poor, y);
        
        y += 10;
        
        // Vehicles list
        y = addSection(pdf, 'VEHICLES LIST', y);
        
        vehicles.forEach((v, index) => {
            y = checkPageBreak(pdf, y, 60);
            
            // Vehicle header
            pdf.setFillColor(240, 240, 240);
            pdf.rect(15, y - 4, pdf.internal.pageSize.getWidth() - 30, 8, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.text(`${index + 1}. ${v.make || ''} ${v.model || ''} ${v.year || ''}`, 18, y);
            y += 10;
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            
            // Two column layout
            const col1X = 18;
            const col2X = 110;
            
            pdf.text(`Contract: ${v.contractNo || 'N/A'}`, col1X, y);
            pdf.text(`Customer: ${v.customerName || 'N/A'}`, col2X, y);
            y += 5;
            
            pdf.text(`VIN: ${v.vin || 'N/A'}`, col1X, y);
            pdf.text(`Plate: ${v.plateNo || 'N/A'}`, col2X, y);
            y += 5;
            
            pdf.text(`Odometer: ${v.odometer ? parseInt(v.odometer).toLocaleString() + ' km' : 'N/A'}`, col1X, y);
            pdf.text(`Color: ${v.color || 'N/A'}`, col2X, y);
            y += 5;
            
            pdf.text(`Value: ${v.marketValue ? parseInt(v.marketValue).toLocaleString() + ' SAR' : 'N/A'}`, col1X, y);
            pdf.text(`Rating: ${TEXT_MAPS.ratings[v.overallRating] || 'N/A'}`, col2X, y);
            y += 5;
            
            pdf.text(`Fuel: ${TEXT_MAPS.fuelTypes[v.fuelType] || 'N/A'}`, col1X, y);
            pdf.text(`Recommendation: ${TEXT_MAPS.recommendations[v.recommendation] || 'N/A'}`, col2X, y);
            y += 5;
            
            // Additional inventory fields
            if (v.operationalStatus) {
                pdf.text(`Status: ${TEXT_MAPS.operationalStatus[v.operationalStatus] || v.operationalStatus}`, col1X, y);
                y += 5;
            }
            
            if (v.notes) {
                pdf.text(`Notes: ${v.notes.substring(0, 60)}${v.notes.length > 60 ? '...' : ''}`, col1X, y);
                y += 5;
            }
            
            y += 5;
        });
        
        addFooter(pdf);
        
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`Inventory_Report_${date}.pdf`);
        
        if (window.showNotification) {
            showNotification('Inventory report exported successfully!', 'success');
        }
    }
    
    // ===== Export Inventory Report (Alias) =====
    function exportInventoryReport(vehicles) {
        return generateInventoryReport(vehicles);
    }
    
    // ===== Generate Warehouse Report =====
    async function generateWarehouseReport(warehouseId = 'all') {
        const pdf = setupPDF('p');
        let y = addHeader(pdf, 'WAREHOUSE REPORT', 'Vehicles by Location');
        
        // Get warehouses data
        let warehouses = [];
        if (window.NFWarehouse) {
            warehouses = NFWarehouse.getWarehouses();
        }
        
        // Get vehicles
        let allVehicles = [];
        if (typeof vehicles !== 'undefined') {
            allVehicles = vehicles;
        }
        
        y = addSection(pdf, 'WAREHOUSE SUMMARY', y);
        
        warehouses.forEach(warehouse => {
            const warehouseVehicles = allVehicles.filter(v => v.warehouseId === warehouse.id);
            const totalValue = warehouseVehicles.reduce((sum, v) => sum + (parseFloat(v.marketValue) || 0), 0);
            
            y = checkPageBreak(pdf, y, 30);
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            // Use code and city instead of Arabic name
            const warehouseLabel = getWarehouseNameEn(warehouse);
            pdf.text(`${warehouseLabel} (${warehouse.code || 'N/A'})`, 18, y);
            y += 6;
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text(`Location: ${safeText(warehouse.city) || 'N/A'}`, 25, y);
            y += 5;
            pdf.text(`Manager: ${safeText(warehouse.manager) || 'N/A'}`, 25, y);
            y += 5;
            pdf.text(`Vehicles: ${warehouseVehicles.length} | Total Value: ${totalValue.toLocaleString()} SAR`, 25, y);
            y += 5;
            const capacityPercent = warehouse.capacity ? Math.round(warehouseVehicles.length / warehouse.capacity * 100) : 0;
            pdf.text(`Capacity: ${warehouseVehicles.length}/${warehouse.capacity || 0} (${capacityPercent}%)`, 25, y);
            y += 10;
        });
        
        // Unassigned vehicles
        const unassignedVehicles = allVehicles.filter(v => !v.warehouseId);
        if (unassignedVehicles.length > 0) {
            y = checkPageBreak(pdf, y, 20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Unassigned Vehicles: ${unassignedVehicles.length}`, 18, y);
        }
        
        addFooter(pdf);
        
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`Warehouse_Report_${date}.pdf`);
        
        if (window.showNotification) {
            showNotification('Warehouse report exported successfully!', 'success');
        }
    }
    
    // ===== Export Warehouse Report (Alias) =====
    function exportWarehouseReport(warehouseId) {
        return generateWarehouseReport(warehouseId);
    }
    
    // ===== Generate Vehicle Detail Report =====
    async function generateVehicleDetailReport(vehicle) {
        if (!vehicle) return;
        
        const pdf = setupPDF('p');
        let y = addHeader(pdf, 'VEHICLE DETAIL REPORT', `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''}`);
        
        // Basic Info
        y = addSection(pdf, 'BASIC INFORMATION', y);
        y = addRow(pdf, 'Contract Number', vehicle.contractNo, y);
        y = addRow(pdf, 'Customer Name', vehicle.customerName, y);
        y = addRow(pdf, 'Make', vehicle.make, y);
        y = addRow(pdf, 'Model', vehicle.model, y);
        y = addRow(pdf, 'Year', vehicle.year, y);
        y = addRow(pdf, 'VIN', vehicle.vin, y);
        y = addRow(pdf, 'Plate Number', vehicle.plateNo, y);
        y = addRow(pdf, 'Color', vehicle.color, y);
        
        y += 5;
        
        // Technical Info
        y = addSection(pdf, 'TECHNICAL INFORMATION', y);
        y = addRow(pdf, 'Odometer', vehicle.odometer ? parseInt(vehicle.odometer).toLocaleString() + ' km' : 'N/A', y);
        y = addRow(pdf, 'Fuel Type', TEXT_MAPS.fuelTypes[vehicle.fuelType] || 'N/A', y);
        y = addRow(pdf, 'Operational Status', TEXT_MAPS.operationalStatus[vehicle.operationalStatus] || 'N/A', y);
        y = addRow(pdf, 'Tires Condition', TEXT_MAPS.tiresCondition[vehicle.tiresCondition] || vehicle.tiresCondition || 'N/A', y);
        y = addRow(pdf, 'Battery Condition', TEXT_MAPS.batteryCondition[vehicle.batteryCondition] || vehicle.batteryCondition || 'N/A', y);
        
        y += 5;
        
        // Valuation
        y = addSection(pdf, 'VALUATION', y);
        y = addRow(pdf, 'Market Value', vehicle.marketValue ? parseInt(vehicle.marketValue).toLocaleString() + ' SAR' : 'N/A', y);
        y = addRow(pdf, 'Overall Rating', TEXT_MAPS.ratings[vehicle.overallRating] || 'N/A', y);
        y = addRow(pdf, 'Recommendation', TEXT_MAPS.recommendations[vehicle.recommendation] || 'N/A', y);
        
        y += 5;
        
        // Notes
        if (vehicle.notes || vehicle.technicalNotes) {
            y = addSection(pdf, 'NOTES', y);
            if (vehicle.notes) {
                y = addRow(pdf, 'General Notes', safeText(vehicle.notes.substring(0, 100)), y);
            }
            if (vehicle.technicalNotes) {
                y = addRow(pdf, 'Technical Notes', safeText(vehicle.technicalNotes.substring(0, 100)), y);
            }
        }
        
        addFooter(pdf);
        
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`Vehicle_${vehicle.contractNo || 'Unknown'}_${date}.pdf`);
        
        if (window.showNotification) {
            showNotification('Vehicle report exported successfully!', 'success');
        }
    }
    
    // ===== Generate Summary Report =====
    async function generateSummaryReport(vehicles) {
        if (!vehicles || vehicles.length === 0) {
            if (window.showNotification) {
                showNotification('No vehicles to export', 'warning');
            }
            return;
        }
        
        const pdf = setupPDF('l'); // Landscape
        let y = addHeader(pdf, 'VEHICLES SUMMARY REPORT', `Generated: ${new Date().toLocaleDateString()}`);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Table headers
        const headers = ['#', 'Contract', 'Customer', 'Make/Model', 'Year', 'VIN', 'Plate', 'Value (SAR)', 'Rating'];
        const colWidths = [10, 30, 40, 35, 15, 45, 25, 30, 20];
        
        // Header row
        pdf.setFillColor(26, 95, 122);
        pdf.rect(15, y - 4, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        
        let x = 18;
        headers.forEach((header, i) => {
            pdf.text(header, x, y);
            x += colWidths[i];
        });
        
        y += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        // Data rows
        vehicles.forEach((v, index) => {
            y = checkPageBreak(pdf, y, 15);
            
            // Alternate row background
            if (index % 2 === 0) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(15, y - 4, pageWidth - 30, 7, 'F');
            }
            
            pdf.setFontSize(8);
            x = 18;
            
            const rowData = [
                String(index + 1),
                (v.contractNo || '-').substring(0, 12),
                (v.customerName || '-').substring(0, 18),
                `${v.make || ''} ${v.model || ''}`.substring(0, 15),
                String(v.year || '-'),
                (v.vin || '-').substring(0, 17),
                (v.plateNo || '-').substring(0, 10),
                v.marketValue ? parseInt(v.marketValue).toLocaleString() : '-',
                TEXT_MAPS.ratings[v.overallRating] || '-'
            ];
            
            rowData.forEach((cell, i) => {
                pdf.text(cell, x, y);
                x += colWidths[i];
            });
            
            y += 7;
        });
        
        // Summary
        y += 10;
        y = checkPageBreak(pdf, y, 30);
        
        const totalValue = vehicles.reduce((sum, v) => sum + (parseFloat(v.marketValue) || 0), 0);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`Total Vehicles: ${vehicles.length}`, 18, y);
        pdf.text(`Total Value: ${totalValue.toLocaleString()} SAR`, 100, y);
        
        addFooter(pdf);
        
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`Vehicles_Summary_${date}.pdf`);
        
        if (window.showNotification) {
            showNotification('Summary report exported successfully!', 'success');
        }
    }
    
    // ===== Return Public API =====
    return {
        setConfig,
        generateInventoryReport,
        exportInventoryReport,
        generateWarehouseReport,
        exportWarehouseReport,
        generateVehicleDetailReport,
        generateSummaryReport,
        TEXT_MAPS
    };
})();

console.log('📄 NFReports v2.0 initialized - PDF Reports with English text');
