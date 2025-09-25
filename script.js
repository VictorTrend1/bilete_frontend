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
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
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
    window.location.href = 'index.html';
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
        </div>
    `).join('');
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

function startScanner() {
    if (scannerActive) return;

    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    if (!scannerContainer || !startBtn || !stopBtn) return;

    scannerContainer.style.display = 'block';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'),
            constraints: {
                width: 400,
                height: 300,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
            ]
        },
    }, function(err) {
        if (err) {
            console.error('Scanner initialization error:', err);
            showError('Eroare la inițializarea scanner-ului');
            stopScanner();
            return;
        }
        console.log("Initialization finished. Ready to start");
        Quagga.start();
        scannerActive = true;
    });

    Quagga.onDetected(function(data) {
        console.log('QR Code detected:', data.codeResult.code);
        try {
            // Try to parse as JSON (our QR format)
            const qrData = JSON.parse(data.codeResult.code);
            verifyTicket(data.codeResult.code);
            stopScanner();
        } catch (e) {
            // If not JSON, treat as plain text
            verifyTicket(data.codeResult.code);
            stopScanner();
        }
    });
}

function stopScanner() {
    if (!scannerActive) return;

    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    if (scannerContainer) scannerContainer.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    Quagga.stop();
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
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                showError('Parolele nu se potrivesc');
                return;
            }

            await register(username, email, password);
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

    // Load user data and tickets on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        const user = getUser();
        if (user) {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = user.username;
            }
        }
        loadTickets();
    }

    // Redirect to login if not authenticated and trying to access dashboard
    if (window.location.pathname.includes('dashboard.html') && !isLoggedIn()) {
        window.location.href = 'login.html';
    }
});
