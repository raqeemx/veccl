/**
 * ========================================
 * 📱 QR Code & Barcode System - نظام الباركود وQR Code
 * ========================================
 * 
 * توليد ومسح الباركود وQR Code للمركبات
 * دعم المسح بالكاميرا
 * 
 * الإصدار 1.0
 */

// ===== Namespace to avoid conflicts =====
window.NFQRCode = (function() {
    'use strict';
    
    // ===== Load QRCode Library =====
    let qrCodeLibLoaded = false;
    
    function loadQRCodeLib() {
        return new Promise((resolve, reject) => {
            if (qrCodeLibLoaded || typeof QRCode !== 'undefined') {
                qrCodeLibLoaded = true;
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            script.onload = () => {
                qrCodeLibLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // ===== Generate QR Code Data =====
    function generateVehicleQRData(vehicle) {
        const data = {
            type: 'vehicle',
            id: vehicle.id,
            vin: vehicle.vin || '',
            plate: vehicle.plateNo || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            year: vehicle.year || '',
            timestamp: new Date().toISOString()
        };
        return JSON.stringify(data);
    }
    
    // ===== Generate QR Code Image =====
    async function generateQRCode(data, options = {}) {
        await loadQRCodeLib();
        
        const defaultOptions = {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        };
        
        const opts = { ...defaultOptions, ...options };
        
        try {
            const dataUrl = await QRCode.toDataURL(data, opts);
            return dataUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    }
    
    // ===== Generate Vehicle QR Code =====
    async function generateVehicleQRCode(vehicle) {
        const data = generateVehicleQRData(vehicle);
        return await generateQRCode(data);
    }
    
    // ===== Create QR Code Element =====
    async function createQRCodeElement(vehicle, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const qrDataUrl = await generateVehicleQRCode(vehicle);
        if (!qrDataUrl) return;
        
        container.innerHTML = `
            <div class="qr-code-container">
                <img src="${qrDataUrl}" alt="QR Code for ${vehicle.make} ${vehicle.model}">
                <div class="qr-code-info">
                    <strong>${vehicle.make} ${vehicle.model} ${vehicle.year}</strong>
                    <span>${vehicle.vin || 'N/A'}</span>
                    <span>${vehicle.plateNo || 'N/A'}</span>
                </div>
                <div class="qr-code-actions">
                    <button class="btn btn-sm btn-primary" onclick="NFQRCode.downloadQR('${vehicle.id}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="NFQRCode.printQR('${vehicle.id}')">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                </div>
            </div>
        `;
    }
    
    // ===== Download QR Code =====
    async function downloadQR(vehicleId) {
        // Get vehicle from storage
        let vehicle = null;
        if (typeof getVehicles === 'function') {
            const vehicles = getVehicles();
            vehicle = vehicles.find(v => v.id === vehicleId);
        }
        
        if (!vehicle) {
            console.error('Vehicle not found');
            return;
        }
        
        const qrDataUrl = await generateVehicleQRCode(vehicle);
        if (!qrDataUrl) return;
        
        const link = document.createElement('a');
        link.download = `QR_${vehicle.make}_${vehicle.model}_${vehicle.year}.png`;
        link.href = qrDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم تحميل رمز QR', type: 'success' });
        }
    }
    
    // ===== Print QR Code =====
    async function printQR(vehicleId) {
        let vehicle = null;
        if (typeof getVehicles === 'function') {
            const vehicles = getVehicles();
            vehicle = vehicles.find(v => v.id === vehicleId);
        }
        
        if (!vehicle) return;
        
        const qrDataUrl = await generateVehicleQRCode(vehicle);
        if (!qrDataUrl) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${vehicle.make} ${vehicle.model}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .qr-label {
                        border: 2px solid #333;
                        padding: 20px;
                        display: inline-block;
                        margin: 10px;
                    }
                    .qr-label img {
                        width: 150px;
                        height: 150px;
                    }
                    .vehicle-info {
                        margin-top: 10px;
                        font-size: 12px;
                    }
                    .vehicle-info strong {
                        display: block;
                        font-size: 14px;
                        margin-bottom: 5px;
                    }
                    @media print {
                        body { margin: 0; }
                        .qr-label { border: 1px solid #000; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-label">
                    <img src="${qrDataUrl}" alt="QR Code">
                    <div class="vehicle-info">
                        <strong>${vehicle.make} ${vehicle.model} ${vehicle.year}</strong>
                        <span>VIN: ${vehicle.vin || 'N/A'}</span><br>
                        <span>اللوحة: ${vehicle.plateNo || 'N/A'}</span>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // ===== Generate Batch QR Codes =====
    async function generateBatchQRCodes(vehicles) {
        const qrCodes = [];
        
        for (const vehicle of vehicles) {
            const qrDataUrl = await generateVehicleQRCode(vehicle);
            qrCodes.push({
                vehicle: vehicle,
                qrCode: qrDataUrl
            });
        }
        
        return qrCodes;
    }
    
    // ===== Print Batch QR Codes =====
    async function printBatchQRCodes(vehicles) {
        const qrCodes = await generateBatchQRCodes(vehicles);
        
        let labelsHTML = '';
        qrCodes.forEach(item => {
            if (item.qrCode) {
                labelsHTML += `
                    <div class="qr-label">
                        <img src="${item.qrCode}" alt="QR Code">
                        <div class="vehicle-info">
                            <strong>${item.vehicle.make} ${item.vehicle.model} ${item.vehicle.year}</strong>
                            <span>VIN: ${item.vehicle.vin || 'N/A'}</span><br>
                            <span>اللوحة: ${item.vehicle.plateNo || 'N/A'}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Batch QR Codes</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 10px;
                    }
                    .qr-labels-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: flex-start;
                    }
                    .qr-label {
                        border: 1px solid #333;
                        padding: 15px;
                        width: 200px;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .qr-label img {
                        width: 120px;
                        height: 120px;
                    }
                    .vehicle-info {
                        margin-top: 8px;
                        font-size: 10px;
                    }
                    .vehicle-info strong {
                        display: block;
                        font-size: 12px;
                        margin-bottom: 4px;
                    }
                    @media print {
                        .qr-label { border: 1px solid #000; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-labels-container">
                    ${labelsHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // ===== QR Code Scanner =====
    let scannerStream = null;
    let scannerActive = false;
    
    // Load Scanner Library
    function loadScannerLib() {
        return new Promise((resolve, reject) => {
            if (typeof Html5Qrcode !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Start Scanner
    async function startScanner(containerId, onScanSuccess) {
        try {
            await loadScannerLib();
            
            const html5QrCode = new Html5Qrcode(containerId);
            
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    // Parse scanned data
                    try {
                        const data = JSON.parse(decodedText);
                        if (data.type === 'vehicle') {
                            onScanSuccess(data);
                        }
                    } catch (e) {
                        // Not JSON, try as VIN
                        if (decodedText.length === 17) {
                            onScanSuccess({ type: 'vin', vin: decodedText });
                        }
                    }
                },
                (errorMessage) => {
                    // Scan error - ignore
                }
            );
            
            scannerActive = true;
            return html5QrCode;
        } catch (error) {
            console.error('Error starting scanner:', error);
            throw error;
        }
    }
    
    // Stop Scanner
    async function stopScanner(html5QrCode) {
        if (html5QrCode && scannerActive) {
            await html5QrCode.stop();
            scannerActive = false;
        }
    }
    
    // Create Scanner Modal
    function createScannerModal(onVehicleFound) {
        const modalHTML = `
            <div class="qr-scanner-modal" id="qrScannerModal">
                <div class="scanner-content">
                    <div class="scanner-header">
                        <h4><i class="fas fa-qrcode"></i> مسح رمز QR</h4>
                        <button class="btn-close" onclick="NFQRCode.closeScannerModal()">&times;</button>
                    </div>
                    <div class="scanner-body">
                        <div id="qrReader" style="width: 100%;"></div>
                        <p class="scanner-hint">وجّه الكاميرا نحو رمز QR الموجود على المركبة</p>
                    </div>
                    <div class="scanner-result" id="scannerResult" style="display: none;">
                        <h5>تم العثور على المركبة!</h5>
                        <div id="scannedVehicleInfo"></div>
                        <div class="scanner-actions">
                            <button class="btn btn-primary" onclick="NFQRCode.viewScannedVehicle()">
                                <i class="fas fa-eye"></i> عرض التفاصيل
                            </button>
                            <button class="btn btn-outline" onclick="NFQRCode.continueScan()">
                                <i class="fas fa-redo"></i> مسح آخر
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Store callback
        window._qrScanCallback = onVehicleFound;
        
        // Start scanner
        startScanner('qrReader', handleScanSuccess);
    }
    
    // Handle Scan Success
    function handleScanSuccess(data) {
        const resultContainer = document.getElementById('scannerResult');
        const vehicleInfo = document.getElementById('scannedVehicleInfo');
        const readerContainer = document.getElementById('qrReader');
        
        if (resultContainer && vehicleInfo) {
            // Hide scanner, show result
            readerContainer.style.display = 'none';
            resultContainer.style.display = 'block';
            
            // Find vehicle
            let vehicle = null;
            if (typeof getVehicles === 'function') {
                const vehicles = getVehicles();
                if (data.id) {
                    vehicle = vehicles.find(v => v.id === data.id);
                } else if (data.vin) {
                    vehicle = vehicles.find(v => v.vin === data.vin);
                }
            }
            
            if (vehicle) {
                window._scannedVehicle = vehicle;
                vehicleInfo.innerHTML = `
                    <p><strong>${vehicle.make} ${vehicle.model} ${vehicle.year}</strong></p>
                    <p>VIN: ${vehicle.vin || 'N/A'}</p>
                    <p>اللوحة: ${vehicle.plateNo || 'N/A'}</p>
                `;
                
                if (window._qrScanCallback) {
                    window._qrScanCallback(vehicle);
                }
            } else {
                vehicleInfo.innerHTML = `<p class="text-warning">المركبة غير موجودة في النظام</p>`;
            }
        }
        
        if (window.NFNotify) {
            NFNotify.show({ message: 'تم مسح الرمز بنجاح', type: 'success' });
        }
    }
    
    // View Scanned Vehicle
    function viewScannedVehicle() {
        if (window._scannedVehicle && typeof viewVehicle === 'function') {
            closeScannerModal();
            viewVehicle(window._scannedVehicle.id);
        }
    }
    
    // Continue Scan
    function continueScan() {
        const resultContainer = document.getElementById('scannerResult');
        const readerContainer = document.getElementById('qrReader');
        
        if (resultContainer) resultContainer.style.display = 'none';
        if (readerContainer) readerContainer.style.display = 'block';
    }
    
    // Close Scanner Modal
    function closeScannerModal() {
        const modal = document.getElementById('qrScannerModal');
        if (modal) {
            // Stop scanner first
            const reader = document.getElementById('qrReader');
            if (reader && reader._html5QrCode) {
                stopScanner(reader._html5QrCode);
            }
            modal.remove();
        }
        window._scannedVehicle = null;
        window._qrScanCallback = null;
    }
    
    // Open Scanner
    function openScanner(callback) {
        createScannerModal(callback);
    }
    
    // ===== Return Public API =====
    return {
        loadQRCodeLib,
        generateVehicleQRData,
        generateQRCode,
        generateVehicleQRCode,
        createQRCodeElement,
        downloadQR,
        printQR,
        generateBatchQRCodes,
        printBatchQRCodes,
        startScanner,
        stopScanner,
        createScannerModal,
        viewScannedVehicle,
        continueScan,
        closeScannerModal,
        openScanner
    };
})();
