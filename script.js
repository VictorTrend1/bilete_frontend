// API Configuration
const API_BASE_URL = 'https://bilete-backend.onrender.com/api';

// Health check function
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}

// Utility functions
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function removeUser() {
    localStorage.removeItem('user');
}

function isLoggedIn() {
    const token = getToken();
    console.log('Checking authentication - token exists:', !!token);
    return !!token;
}

function updateNavigation() {
    const dashboardLink = document.getElementById('dashboard-link');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (isLoggedIn()) {
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Authentication functions
async function register(username, password, referralCode) {
    try {
        console.log('Attempting registration with:', { username, password: '***', referralCode });
        
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: username.trim(), 
                password: password,
                referralCode: referralCode.trim()
            }),
        });

        const data = await response.json();
        console.log('Registration response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        if (data.success) {
            console.log('Storing token:', data.token);
            console.log('Storing user:', data.user);
            setToken(data.token);
            setUser(data.user);
            console.log('Token stored, checking auth:', isLoggedIn());
            showSuccess('Registration successful!');
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(data.error || 'Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message);
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        setToken(data.token);
        setUser(data.user);
        showSuccess('Login successful!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}

function logout() {
    removeToken();
    removeUser();
    showSuccess('Logged out successfully!');
    window.location.href = 'login.html';
}

// Ticket functions
async function createTicket(nume, telefon, tip_bilet) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('You must be logged in to create tickets');
        }

        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ nume, telefon, tip_bilet }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create ticket');
        }

        const user = getUser();
        const groupInfo = user && user.group ? ` pentru ${user.group}` : '';
        showSuccess(`Bilet creat cu succes${groupInfo}!`);
        showQRModal(data.ticket);
        loadTickets();
        document.getElementById('ticket-form').reset();
    } catch (error) {
        showError(error.message);
    }
}

async function loadTickets() {
    try {
        const token = getToken();
        if (!token) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load tickets');
        }

        displayTickets(data.tickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

function displayTickets(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    if (!ticketsList) return;

    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p>Nu ai bilete încă. Creează primul tău bilet!</p>';
        return;
    }

    ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket-item">
            <h4>${ticket.nume}</h4>
            <p><strong>Telefon:</strong> ${ticket.telefon}</p>
            <p><strong>Tip bilet:</strong> <span class="ticket-type">${ticket.tip_bilet}</span></p>
            <p><strong>Data creării:</strong> ${new Date(ticket.created_at).toLocaleDateString('ro-RO')}</p>
            <p><strong>Status:</strong> ${ticket.verified ? '✅ Verificat' : '⏳ Ne verificat'}</p>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
                <button class="btn btn-primary" data-id="${ticket._id || ticket.id}" onclick="viewTicketFromButton(this)">Vezi bilet</button>
                <button class="btn btn-secondary" data-id="${ticket._id || ticket.id}" onclick="downloadTicketQRFromButton(this)">Descarcă QR</button>
            </div>
        </div>
    `).join('');
}

async function viewTicketFromButton(el) {
    const id = el.getAttribute('data-id');
    if (!id) return;
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/tickets/${id}/qr`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Nu am putut încărca biletul');
        }
        showQRModal({
            nume: data.ticket.nume,
            telefon: data.ticket.telefon,
            tip_bilet: data.ticket.tip_bilet,
            qr_code: data.qr_code
        });
    } catch (e) {
        showError(e.message);
    }
}

async function downloadTicketQRFromButton(el) {
    const id = el.getAttribute('data-id');
    if (!id) return;
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/tickets/${id}/qr`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Nu am putut descărca QR-ul');
        }
        downloadDataUrl(data.qr_code, `bilet-${id}.png`);
    } catch (e) {
        showError(e.message);
    }
}

function downloadDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Tickets table functions
async function loadTicketsTable() {
    try {
        const token = getToken();
        if (!token) {
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load tickets');
        }

        displayTicketsTable(data.tickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

function displayTicketsTable(tickets) {
    const tableBody = document.getElementById('tickets-table-body');
    const noTickets = document.getElementById('no-tickets');
    
    if (!tableBody) return;

    if (tickets.length === 0) {
        tableBody.innerHTML = '';
        if (noTickets) noTickets.style.display = 'block';
        return;
    }

    if (noTickets) noTickets.style.display = 'none';

    tableBody.innerHTML = tickets.map((ticket, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${ticket.nume}</td>
            <td>${ticket.telefon}</td>
            <td><span class="ticket-type">${ticket.tip_bilet}</span></td>
            <td><span class="group-badge">${ticket.group || 'N/A'}</span></td>
            <td>${new Date(ticket.created_at).toLocaleDateString('ro-RO')}</td>
            <td class="${ticket.verified ? 'status-verified' : 'status-pending'}">
                ${ticket.verified ? '✅ Verificat' : '⏳ Ne verificat'}
            </td>
            <td class="actions">
                <button class="btn btn-primary" data-id="${ticket._id || ticket.id}" onclick="viewTicketFromButton(this)">
                    <i class="fas fa-eye"></i> Vezi biletul
                </button>
                <button class="btn btn-secondary" data-id="${ticket._id || ticket.id}" onclick="downloadTicketQRFromButton(this)">
                    <i class="fas fa-download"></i> Descarcă cod QR
                </button>
                <button class="btn btn-primary" data-ticket='${JSON.stringify(ticket).replace(/'/g, "&apos;")}' onclick="sendTicketViaWhatsApp(this)">
                    <i class="fab fa-whatsapp"></i> Trimite bilet prin SMS
                </button>
                <button class="btn btn-danger" data-id="${ticket._id || ticket.id}" onclick="deleteTicket(this)">
                    <i class="fas fa-trash"></i> Șterge
                </button>
            </td>
        </tr>
    `).join('');
}

function sendTicketViaWhatsApp(el) {
    try {
        const ticket = JSON.parse(el.getAttribute('data-ticket').replace(/&apos;/g, "'"));
        let phoneNumber = ticket.telefon.replace(/\D/g, ''); // Remove non-digits
        
        // Format Romanian phone number
        if (phoneNumber.startsWith('0')) {
            // If starts with 0, replace with +40
            phoneNumber = '+40' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+40')) {
            // If doesn't start with +40, add it
            phoneNumber = '+40' + phoneNumber;
        }
        
        const message = `Biletul tău pentru eveniment:\n\nNume: ${ticket.nume}\nTip bilet: ${ticket.tip_bilet}\nData creării: ${new Date(ticket.created_at).toLocaleDateString('ro-RO')}\n\nTe rugăm să păstrezi acest bilet pentru verificare.`;
        
        // Open WhatsApp with text message only
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        showSuccess('WhatsApp deschis! Adaugă manual QR code-ul din bilet.');
    } catch (e) {
        console.error('Failed to send ticket via WhatsApp', e);
        showError('Eroare la trimiterea biletului prin WhatsApp');
    }
}

async function deleteTicket(el) {
    const ticketId = el.getAttribute('data-id');
    if (!ticketId) return;
    
    // Confirmation dialog
    if (!confirm('Ești sigur că vrei să ștergi acest bilet? Această acțiune nu poate fi anulată.')) {
        return;
    }
    
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        // Check if backend is healthy before making the request
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
            showError('Backend-ul nu este disponibil. Te rugăm să încerci din nou mai târziu.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server-ul nu răspunde corect. Verifică că backend-ul rulează.');
        }
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            throw new Error('Server-ul a returnat un răspuns invalid. Verifică că backend-ul rulează corect.');
        }
        
        if (!response.ok) {
            throw new Error(data.error || `Eroare server: ${response.status}`);
        }
        
        showSuccess('Bilet șters cu succes!');
        // Reload the tickets table
        loadTicketsTable();
    } catch (error) {
        console.error('Error deleting ticket:', error);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Nu se poate conecta la server. Verifică că backend-ul rulează pe ' + API_BASE_URL);
        } else if (error.message.includes('JSON')) {
            showError('Server-ul nu răspunde corect. Verifică că backend-ul rulează și este accesibil.');
        } else {
            showError(error.message);
        }
    }
}

function showQRModal(ticket) {
    const modal = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('qr-code-container');
    const ticketDetails = document.getElementById('ticket-details');

    if (qrContainer) {
        // Clear any existing content and reset styles
        qrContainer.innerHTML = '';
        qrContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 1rem 0;
            padding: 0;
            background: transparent;
            border: none;
            position: relative;
            min-height: 300px;
            width: 100%;
        `;
        
        // Create and configure the QR code image with optimal settings
        const qrImg = document.createElement('img');
        qrImg.src = ticket.qr_code;
        qrImg.alt = 'QR Code';
        qrImg.style.cssText = `
            max-width: 100%;
            width: 300px;
            height: 300px;
            object-fit: contain;
            display: block;
            margin: 0;
            padding: 0;
            border: 2px solid #000;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        `;
        
        // Add loading state
        qrImg.onload = function() {
            console.log('QR Code loaded successfully');
        };
        
        qrImg.onerror = function() {
            qrContainer.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 2rem;">Eroare la încărcarea QR code-ului</p>';
        };
        
        qrContainer.appendChild(qrImg);
    }

    if (ticketDetails) {
        const user = getUser();
        const groupInfo = user && user.group ? `<p><strong>Grup:</strong> ${user.group}</p>` : '';
        
        ticketDetails.innerHTML = `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                <h4 style="margin-bottom: 1rem; color: #333;">Detalii bilet</h4>
                <p><strong>Nume:</strong> ${ticket.nume}</p>
                <p><strong>Telefon:</strong> ${ticket.telefon}</p>
                <p><strong>Tip bilet:</strong> ${ticket.tip_bilet}</p>
                ${groupInfo}
            </div>
        `;
    }

    if (modal) {
        modal.style.display = 'block';
        // Ensure modal is on top
        modal.style.zIndex = '2000';
    }
}

function downloadQR() {
    const qrImg = document.querySelector('#qr-code-container img');
    if (qrImg) {
        const link = document.createElement('a');
        link.download = 'bilet-qr-code.png';
        link.href = qrImg.src;
        link.click();
    }
}

// Verification functions
async function verifyTicket(qrData) {
    const resultDiv = document.getElementById('verification-result');
    
    try {
        console.log('Verifying ticket with data:', qrData);
        
        // Show loading state
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'verification-result loading';
            resultDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea; margin-bottom: 1rem;"></i>
                    <h4>Se verifică biletul...</h4>
                    <p>Te rugăm să aștepți</p>
                </div>
            `;
        }
        
        const response = await fetch(`${API_BASE_URL}/verify-ticket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qrData }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }

        console.log('Ticket verification successful:', data);
        showVerificationResult(data.ticket, true, null, data);
    } catch (error) {
        console.error('Ticket verification failed:', error);
        showVerificationResult(null, false, error.message);
    }
}

function showVerificationResult(ticket, success, errorMessage = null, responseData = null) {
    const resultDiv = document.getElementById('verification-result');
    if (!resultDiv) return;

    if (success && ticket) {
        let warningHtml = '';
        let resultClass = 'success';
        
        // Check if ticket is flagged (verified multiple times)
        if (responseData && responseData.flagged) {
            resultClass = 'warning';
            warningHtml = `
                <div class="fraud-warning" style="background: #ff4444; color: white; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center; font-weight: bold; animation: pulse 1s infinite;">
                    <h4>🚨 ATENȚIE: BILET SUSPECT! 🚨</h4>
                    <p>${responseData.warning || 'Acest bilet a fost deja validat anterior!'}</p>
                    <p><strong>Numărul de verificări:</strong> ${responseData.verification_count || ticket.verification_count}</p>
                    ${responseData.ticket && responseData.ticket.first_verified ? `<p><strong>Prima verificare:</strong> ${new Date(responseData.ticket.first_verified).toLocaleString('ro-RO')}</p>` : ''}
                </div>
            `;
        }

        resultDiv.className = `verification-result ${resultClass}`;
        resultDiv.innerHTML = `
            <h4>✅ Bilet Verificat cu Succes!</h4>
            ${warningHtml}
            <div class="ticket-info">
                <p><strong>Nume:</strong> ${ticket.nume}</p>
                <p><strong>Telefon:</strong> ${ticket.telefon}</p>
                <p><strong>Tip bilet:</strong> ${ticket.tip_bilet}</p>
                <p><strong>Data creării:</strong> ${new Date(ticket.created_at).toLocaleDateString('ro-RO')}</p>
                ${ticket.verification_count ? `<p><strong>Verificări:</strong> ${ticket.verification_count}</p>` : ''}
            </div>
        `;
    } else {
        resultDiv.className = 'verification-result error';
        resultDiv.innerHTML = `
            <h4>❌ Verificare Eșuată</h4>
            <p>${errorMessage || 'Biletul nu a putut fi verificat.'}</p>
        `;
    }

    resultDiv.style.display = 'block';
}

// QR Code Scanner
let scannerActive = false;
let html5QrCodeInstance = null;

async function startScanner() {
    if (scannerActive) return;

    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    if (!scannerContainer || !startBtn || !stopBtn) return;

    try {
        // Enhanced security context check
        const isSecureContext = (location.protocol === 'https:') || 
                               (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ||
                               (location.hostname === '0.0.0.0') ||
                               (location.hostname.includes('127.0.0.1'));
        
        if (!isSecureContext) {
            showError('🔒 Camera necesită conexiune securizată (HTTPS). Accesează site-ul prin HTTPS sau localhost.');
            return;
        }

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('❌ Browser-ul nu suportă accesul la cameră. Încearcă cu Chrome, Firefox sau Safari.');
            return;
        }

        // Show loading state
        const originalBtnText = startBtn.innerHTML;
        startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se conectează...';
        startBtn.disabled = true;

        // Test camera access with multiple fallback strategies
        let cameraConfig = null;
        const cameraStrategies = [
            // Strategy 1: Back camera with environment facing
            { facingMode: { ideal: "environment" } },
            // Strategy 2: Any camera with user facing
            { facingMode: "user" },
            // Strategy 3: No constraints - any available camera
            true
        ];

        for (let i = 0; i < cameraStrategies.length; i++) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: cameraStrategies[i],
                    audio: false 
                });
                
                // Stop the test stream immediately
                stream.getTracks().forEach(track => track.stop());
                cameraConfig = cameraStrategies[i];
                console.log(`Camera strategy ${i + 1} successful`);
                break;
            } catch (err) {
                console.log(`Camera strategy ${i + 1} failed:`, err.name);
                if (i === cameraStrategies.length - 1) {
                    throw err; // Re-throw the last error
                }
            }
        }

        if (!cameraConfig) {
            throw new Error('No camera access available');
        }

        // Show scanner UI
        scannerContainer.style.display = 'block';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        
        // Scroll to scanner section for better visibility
        setTimeout(() => {
            scannerContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);

        // Device detection
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        // Enhanced scanner configuration for better sensitivity
        const config = {
            fps: isMobile ? 10 : (isTablet ? 20 : 30), // Higher FPS for better detection
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                // Larger scanning area for better detection
                const boxSize = Math.floor(minEdge * (isMobile ? 0.9 : 0.8));
                return { width: boxSize, height: boxSize };
            },
            aspectRatio: isMobile ? undefined : (isTablet ? 1.7778 : 1.3333),
            experimentalFeatures: { 
                useBarCodeDetectorIfSupported: true,
                useZxing: true, // Use ZXing for better QR detection
                useBarCodeDetectorIfSupported: true
            },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            useBarCodeDetectorIfSupported: true,
            rememberLastUsedCamera: true,
            showPermissionRequestIfDenied: true,
            // Enhanced detection settings
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        // Initialize scanner
        html5QrCodeInstance = new Html5Qrcode("qr-reader");
        
        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        let cameraId = cameras && cameras.length ? cameras[0].id : null;
        
        // Smart camera selection
        if (cameras && cameras.length > 1) {
            // Prefer back camera for QR scanning
            const backCamera = cameras.find(c => 
                /back|rear|environment/i.test(c.label) || 
                c.label.includes('back') || 
                c.label.includes('rear')
            );
            
            if (backCamera) {
                cameraId = backCamera.id;
            } else {
                // Fallback: find camera with higher resolution
                const highResCamera = cameras.find(c => 
                    c.label.includes('4K') || 
                    c.label.includes('1080') || 
                    c.label.includes('HD')
                );
                if (highResCamera) {
                    cameraId = highResCamera.id;
                }
            }
        }

        // Start scanner with selected camera
        const startConfig = cameraId ? 
            { deviceId: { exact: cameraId } } : 
            cameraConfig;

        await html5QrCodeInstance.start(
            startConfig,
            config,
            (decodedText) => {
                if (!decodedText) return;
                
                console.log("QR Code detected:", decodedText);
                
                // Stop scanner immediately to prevent multiple scans
                stopScanner();
                
                // Process the scanned data immediately
                try {
                    // Try to parse as JSON first
                    const parsed = JSON.parse(decodedText);
                    if (parsed.ticket_id) {
                        verifyTicket(JSON.stringify(parsed));
                    } else {
                        verifyTicket(decodedText);
                    }
                } catch (_) {
                    verifyTicket(decodedText);
                }
            },
            (errMsg) => {
                // Only log errors in development
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    console.log("QR scan error:", errMsg);
                }
            }
        );
        
        scannerActive = true;
        showSuccess('📷 Scanner pornit cu succes! Ține camera stabilă pentru scanare.');
        
    } catch (err) {
        console.error('Scanner init failed', err);
        
        // Reset button state
        startBtn.innerHTML = originalBtnText;
        startBtn.disabled = false;
        
        const name = (err && err.name) ? err.name : '';
        const msgMap = {
            NotAllowedError: '🚫 Acces la cameră refuzat. Apasă pe "Permite" când browser-ul îți cere permisiunea.',
            NotFoundError: '📷 Nu s-a găsit cameră. Verifică dacă dispozitivul are cameră funcțională.',
            NotReadableError: '📱 Camera este utilizată de o altă aplicație. Închide alte aplicații și încearcă din nou.',
            OverconstrainedError: '⚙️ Constrângerile camerei nu pot fi satisfăcute. Încearcă cu un alt browser.',
            SecurityError: '🔒 Context nesecurizat. Deschide site-ul prin HTTPS.',
            AbortError: '⏱️ Operațiunea a fost întreruptă. Încearcă din nou.',
            TypeError: '🌐 Browser-ul nu suportă această funcționalitate. Încearcă cu Chrome, Firefox sau Safari.'
        };
        
        const errorMessage = msgMap[name] || `❌ Nu s-a putut porni camera: ${err.message || 'Eroare necunoscută'}`;
        showError(errorMessage);
        
        // Additional troubleshooting tips
        setTimeout(() => {
            showError(`
                <strong>💡 Sfaturi pentru rezolvare:</strong><br>
                • Verifică că ai permis accesul la cameră<br>
                • Încearcă cu Chrome, Firefox sau Safari<br>
                • Asigură-te că site-ul rulează pe HTTPS<br>
                • Închide alte aplicații care folosesc camera<br>
                • Folosește butonul "Introdu manual" ca alternativă
            `);
        }, 2000);
        
        stopScanner();
    }
}

async function stopScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    // Reset button states immediately
    if (startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-camera"></i> Pornește Scanner';
    }
    if (stopBtn) stopBtn.style.display = 'none';
    if (scannerContainer) scannerContainer.style.display = 'none';

    // Stop the scanner instance
    try {
        if (html5QrCodeInstance) {
            await html5QrCodeInstance.stop();
            await html5QrCodeInstance.clear();
            html5QrCodeInstance = null;
        }
    } catch (error) {
        console.log('Scanner stop error (non-critical):', error);
    }
    
    scannerActive = false;
    console.log('Scanner stopped successfully');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();

    // Registration form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const referralCode = document.getElementById('referralCode').value;
            await register(username, password, referralCode);
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            await login(username, password);
        });
    }

    // Ticket form
    const ticketForm = document.getElementById('ticket-form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nume = document.getElementById('nume').value;
            const telefon = document.getElementById('telefon').value;
            const tip_bilet = document.getElementById('tip_bilet').value;

            await createTicket(nume, telefon, tip_bilet);
        });
    }

    // Manual verification form
    const manualVerifyForm = document.getElementById('manual-verify-form');
    if (manualVerifyForm) {
        manualVerifyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const qrData = document.getElementById('qr-data').value;
            if (!qrData.trim()) {
                showError('Introdu datele QR code');
                return;
            }

            await verifyTicket(qrData);
        });
    }

    // Scanner controls
    const startScannerBtn = document.getElementById('start-scanner');
    const stopScannerBtn = document.getElementById('stop-scanner');

    if (startScannerBtn) {
        startScannerBtn.addEventListener('click', startScanner);
    }

    if (stopScannerBtn) {
        stopScannerBtn.addEventListener('click', stopScanner);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Modal close
    const modal = document.getElementById('qr-modal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }

    if (modal) {
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }


    // Load user data on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        const user = getUser();
        if (user) {
            const userNameElement = document.getElementById('user-name');
            const userGroupElement = document.getElementById('user-group');
            const userGroupDisplayElement = document.getElementById('user-group-display');
            
            if (userNameElement) {
                userNameElement.textContent = user.username;
            }
            if (userGroupElement && user.group) {
                userGroupElement.textContent = user.group;
            }
            if (userGroupDisplayElement && user.group) {
                userGroupDisplayElement.textContent = user.group;
            }
        }
    }

    // Load tickets table on bilete page
    if (window.location.pathname.includes('bilete.html')) {
        loadTicketsTable();
    }

    // Redirect to login if not authenticated and trying to access dashboard or bilete
    console.log('Page load - checking authentication for:', window.location.pathname);
    if ((window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('bilete.html')) && !isLoggedIn()) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = 'login.html';
    } else {
        console.log('Authentication check passed');
    }
});
