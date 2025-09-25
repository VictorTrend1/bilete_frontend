// API Configuration
const API_BASE_URL = 'https://bilete-backend.onrender.com/api';

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
    return !!getToken();
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
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, referralCode }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        setToken(data.token);
        setUser(data.user);
        showSuccess('Registration successful!');
        window.location.href = 'dashboard.html';
    } catch (error) {
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

        showSuccess('Ticket created successfully!');
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

function showQRModal(ticket) {
    const modal = document.getElementById('qr-modal');
    const qrContainer = document.getElementById('qr-code-container');
    const ticketDetails = document.getElementById('ticket-details');

    if (qrContainer) {
        qrContainer.innerHTML = `<img src="${ticket.qr_code}" alt="QR Code">`;
    }

    if (ticketDetails) {
        ticketDetails.innerHTML = `
            <h4>Detalii bilet</h4>
            <p><strong>Nume:</strong> ${ticket.nume}</p>
            <p><strong>Telefon:</strong> ${ticket.telefon}</p>
            <p><strong>Tip bilet:</strong> ${ticket.tip_bilet}</p>
        `;
    }

    if (modal) {
        modal.style.display = 'block';
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
    try {
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

        showVerificationResult(data.ticket, true);
    } catch (error) {
        showVerificationResult(null, false, error.message);
    }
}

function showVerificationResult(ticket, success, errorMessage = null) {
    const resultDiv = document.getElementById('verification-result');
    if (!resultDiv) return;

    if (success && ticket) {
        resultDiv.className = 'verification-result success';
        resultDiv.innerHTML = `
            <h4>✅ Bilet Verificat cu Succes!</h4>
            <div class="ticket-info">
                <p><strong>Nume:</strong> ${ticket.nume}</p>
                <p><strong>Telefon:</strong> ${ticket.telefon}</p>
                <p><strong>Tip bilet:</strong> ${ticket.tip_bilet}</p>
                <p><strong>Data creării:</strong> ${new Date(ticket.created_at).toLocaleDateString('ro-RO')}</p>
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

    scannerContainer.style.display = 'block';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';

    try {
        const config = {
            fps: 15,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const boxSize = Math.floor(minEdge * 0.7);
                return { width: boxSize, height: boxSize };
            },
            aspectRatio: window.innerWidth < 600 ? undefined : 1.7778,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        };

        html5QrCodeInstance = new Html5Qrcode("qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        let cameraId = cameras && cameras.length ? cameras[0].id : null;
        // Prefer back camera if available
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        if (back) cameraId = back.id;

        await html5QrCodeInstance.start(
            { deviceId: { exact: cameraId } },
            config,
            (decodedText) => {
                if (!decodedText) return;
                try {
                    JSON.parse(decodedText);
                    verifyTicket(decodedText);
                } catch (_) {
                    verifyTicket(decodedText);
                }
                stopScanner();
            },
            (errMsg) => {
                // ignore scan errors; common on mobile while focusing
            }
        );
        scannerActive = true;
    } catch (err) {
        console.error('Scanner init failed', err);
        showError('Nu s-a putut porni camera. Verifică permisiunile.');
        stopScanner();
    }
}

async function stopScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    if (scannerContainer) scannerContainer.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    try {
        if (html5QrCodeInstance) {
            await html5QrCodeInstance.stop();
            await html5QrCodeInstance.clear();
        }
    } catch (_) {}
    scannerActive = false;
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

    // Code generator
    const generateBtn = document.getElementById('generate-code-btn');
    const copyBtn = document.getElementById('copy-code-btn');
    const codeInput = document.getElementById('generated-code');

    if (generateBtn && codeInput) {
        generateBtn.addEventListener('click', function() {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codeInput.value = code;
        });
    }

    if (copyBtn && codeInput) {
        copyBtn.addEventListener('click', async function() {
            if (!codeInput.value) return;
            try {
                await navigator.clipboard.writeText(codeInput.value);
                showSuccess('Cod copiat în clipboard!');
            } catch (_) {
                showError('Nu am putut copia codul');
            }
        });
    }

    // Load user data on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        loadUserProfile();
    }

    // Load tickets table on bilete page
    if (window.location.pathname.includes('bilete.html')) {
        loadTicketsTable();
    }

    // Redirect to login if not authenticated and trying to access dashboard or bilete
    if ((window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('bilete.html')) && !isLoggedIn()) {
        window.location.href = 'login.html';
    }
});
