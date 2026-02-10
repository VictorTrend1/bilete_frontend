// API Configuration
// Auto-detect API URL based on current hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Production domain - use same domain (nginx will proxy to backend)
  if (hostname === 'www.site-bilete.shop' || hostname === 'site-bilete.shop') {
    return `${protocol}//${hostname}/api`;
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return 'http://localhost:3001/api';
  }
  
  // Default to production (for other domains)
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Messaging Service Configuration
let messagingStatus = null;

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleButton(newTheme);
}

function updateThemeToggleButton(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Luminos</span>';
            themeToggle.title = 'Comută la tema luminoasă';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Întunecat</span>';
            themeToggle.title = 'Comută la tema întunecată';
        }
    }
}

// Initialize theme immediately
initTheme();

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
    const bileteLink = document.getElementById('bilete-link');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutBtn = document.getElementById('logout-btn');
    const loguriLink = document.getElementById('loguri-link');
    
    if (isLoggedIn()) {
        const user = getUser();
        const isAdministrator = user && user.group === 'Administrator';
        
        // Show authenticated navigation
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (bileteLink) bileteLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // Show Log-uri link only for Administrator users
        if (loguriLink) {
            loguriLink.style.display = isAdministrator ? 'block' : 'none';
        }
        
        // Hide login/register links
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
    } else {
        // Show non-authenticated navigation
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (bileteLink) bileteLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loguriLink) loguriLink.style.display = 'none';
        
        // Show login/register links
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
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
        // Get ticket details first to get the ticket name for filename
        const token = getToken();
        const ticketResponse = await fetch(`${API_BASE_URL}/tickets/${id}/qr`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ticketData = await ticketResponse.json();
        
        if (!ticketResponse.ok) {
            throw new Error(ticketData.error || 'Nu am putut descărca biletul');
        }
        
        // Use custom-public endpoint for all ticket types to generate full ticket
        const customResponse = await fetch(`${API_BASE_URL}/tickets/${id}/custom-public`);
        
        if (!customResponse.ok) {
            const errorData = await customResponse.json();
            throw new Error(errorData.error || 'Nu am putut genera biletul personalizat');
        }
        
        // Download the custom ticket as blob
        const blob = await customResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename based on ticket type and name
        const ticketType = ticketData.ticket?.tip_bilet || '';
        const ticketName = ticketData.ticket?.nume || 'bilet';
        let filename = `bilet-${ticketName}-${id}.png`;
        
        // Customize filename for specific ticket types
        if (ticketType === 'AFTER') {
            filename = `bilet-after-${ticketName}-${id}.png`;
        } else if (ticketType === 'BAL + AFTER VIP') {
            filename = `bilet-bal-after-vip-${ticketName}-${id}.png`;
        } else if (ticketType === 'AFTER VIP') {
            filename = `bilet-after-vip-${ticketName}-${id}.png`;
        }
        
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        showError(e.message);
    }
}

// Verify ticket from button click
async function verifyTicketFromButton(el) {
    const id = el.getAttribute('data-id');
    if (!id) return;
    
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }
        
        // Show loading state
        const button = el;
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se verifică...';
        
        // Get ticket data
        const ticketResponse = await fetch(`${API_BASE_URL}/tickets/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!ticketResponse.ok) {
            const errorData = await ticketResponse.json();
            throw new Error(errorData.error || 'Nu am putut încărca datele biletului');
        }
        
        const ticketData = await ticketResponse.json();
        
        // Try to use QR code data if available, otherwise use phone number
        let verifyResponse;
        if (ticketData.qr_code) {
            // Use QR code data for precise verification
            verifyResponse = await fetch(`${API_BASE_URL}/verify-ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qrData: ticketData.qr_code }),
            });
        } else {
            // Fallback to phone number verification
            const phoneNumber = formatRomanianPhoneNumber(ticketData.telefon);
            verifyResponse = await fetch(`${API_BASE_URL}/verify-ticket-by-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber }),
            });
        }
        
        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
            throw new Error(verifyData.error || 'Verificare eșuată');
        }
        
        // Update ticket in allTickets array
        const ticketIndex = allTickets.findIndex(t => (t._id || t.id) === ticketData._id || ticketData.id);
        if (ticketIndex !== -1) {
            allTickets[ticketIndex].verified = verifyData.ticket.verified;
            allTickets[ticketIndex].verification_count = verifyData.ticket.verification_count;
            allTickets[ticketIndex].flagged = verifyData.flagged || false;
        }
        
        // Show success message
        if (verifyData.flagged) {
            showError(`⚠️ ATENȚIE: ${verifyData.warning || 'Acest bilet a fost deja validat anterior!'} (Verificări: ${verifyData.verification_count})`);
        } else {
            showSuccess(`✅ Bilet verificat cu succes! (${ticketData.nume} - ${ticketData.tip_bilet})`);
        }
        
        // Update display using filters
        applyFilters();
        
    } catch (error) {
        console.error('Error verifying ticket:', error);
        showError('Eroare la verificarea biletului: ' + error.message);
    } finally {
        // Restore button state
        const button = el;
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check-circle"></i> Validare bilet';
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

function showBALTicketModal(ticket, imageUrl, phoneNumber) {
    console.log('Showing BAL ticket modal with imageUrl:', imageUrl);
    
    // Create simplified modal with only direct sharing
    const modalHTML = `
        <div id="bal-ticket-modal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 90%; max-height: 90%; overflow-y: auto;">
                <span class="close" onclick="closeBALTicketModal()">&times;</span>
                <h3>🎫 Biletul personalizat BAL</h3>
                <div style="text-align: center; margin: 1rem 0;">
                    <img src="${imageUrl}" alt="Bilet BAL" style="max-width: 100%; max-height: 400px; border: 3px solid #007bff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" onload="console.log('BAL ticket image loaded successfully')" onerror="console.error('Failed to load BAL ticket image:', this.src)">
                </div>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <button class="btn btn-success" onclick="shareBALImageDirectly('${imageUrl}', '${phoneNumber}', '${ticket.nume}', '${ticket.tip_bilet}', '${new Date(ticket.created_at).toLocaleDateString('ro-RO')}')" style="background: #25D366; border: none; padding: 15px 30px; border-radius: 8px; color: white; font-weight: bold; font-size: 1.1rem;">
                        <i class="fab fa-whatsapp"></i> Trimite Imaginea Direct
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeBALTicketModal() {
    const modal = document.getElementById('bal-ticket-modal');
    if (modal) {
        modal.remove();
    }
}

// Test function to check if BAL ticket generation is working
async function testBALTicketGeneration(ticketId) {
    try {
        console.log('Testing BAL ticket generation for ID:', ticketId);
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/custom-bal-public`);
        console.log('Test response status:', response.status);
        
        if (response.ok) {
            const blob = await response.blob();
            console.log('Test blob size:', blob.size, 'type:', blob.type);
            return true;
        } else {
            const errorText = await response.text();
            console.error('Test failed:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('Test error:', error);
        return false;
    }
}

function openWhatsAppWithBAL(phoneNumber, nume, tipBilet, dataCrearii) {
    const message = `Biletul tău personalizat BAL pentru eveniment:\n\nNume: ${nume}\nTip bilet: ${tipBilet}\nData creării: ${dataCrearii}\n\nTe rugăm să atașezi imaginea biletului din galerie.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    closeBALTicketModal();
}

function downloadBALImage(imageUrl, nume, ticketId) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `bilet-${nume}-${ticketId}.png`;
    link.click();
}

async function shareBALImageDirectly(imageUrl, phoneNumber, nume, tipBilet, dataCrearii) {
    try {
        // Convert image to blob for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create WhatsApp message
        const message = `Biletul tău personalizat BAL pentru eveniment:\n\nNume: ${nume}\nTip bilet: ${tipBilet}\nData creării: ${dataCrearii}\n\nBiletul personalizat este atașat mai jos.`;
        
        // Try to use Web Share API for direct image sharing
        if (navigator.share && navigator.canShare) {
            try {
                await navigator.share({
                    title: `Bilet BAL - ${nume}`,
                    text: message,
                    files: [new File([blob], `bilet-${nume}.png`, { type: 'image/png' })]
                });
                showSuccess('Biletul a fost trimis cu succes!');
                closeBALTicketModal();
                return;
            } catch (shareError) {
                console.log('Web Share API failed, trying WhatsApp direct');
            }
        }
        
        // Direct WhatsApp sharing to specific phone number
        // Download image first
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `bilet-${nume}.png`;
        link.click();
        
        // Open WhatsApp directly to the phone number with message
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Try to open in same window/tab for better mobile experience
        if (window.navigator.userAgent.includes('Mobile')) {
            window.location.href = whatsappUrl;
        } else {
            window.open(whatsappUrl, '_self');
        }
        
        showSuccess('WhatsApp deschis pentru ' + phoneNumber + '! Atașează imaginea din galerie.');
        closeBALTicketModal();
        
    } catch (error) {
        console.error('Error sharing image:', error);
        showError('Eroare la trimiterea biletului.');
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function copyImageToClipboard(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
            showSuccess('Imaginea a fost copiată în clipboard!');
        } else {
            showError('Copierea imaginii nu este suportată pe acest dispozitiv.');
        }
    } catch (error) {
        console.error('Error copying image:', error);
        showError('Eroare la copierea imaginii.');
    }
}

// Bot Functions

// Phone number utilities
function formatRomanianPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it already has +40, return as is
    if (cleaned.startsWith('+40')) {
        return cleaned;
    }
    
    // Remove + if present but not +40
    cleaned = cleaned.replace(/^\+/, '');
    
    // Handle different formats
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        // Local format: 0712345678 -> +40712345678
        return '+40' + cleaned.substring(1);
    } else if (cleaned.startsWith('40') && cleaned.length === 11) {
        // National format: 40712345678 -> +40712345678
        return '+' + cleaned;
    } else if (cleaned.length === 9) {
        // Assume local format without 0: 712345678 -> +40712345678
        return '+40' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
        // Local format with 0: 0712345678 -> +40712345678
        return '+40' + cleaned.substring(1);
    }
    
    // If we have 11 digits starting with 40, add +
    if (cleaned.length === 11 && cleaned.startsWith('40')) {
        return '+' + cleaned;
    }
    
    // Return original if can't format
    return phoneNumber;
}

function validateRomanianPhoneNumber(phoneNumber) {
    const formatted = formatRomanianPhoneNumber(phoneNumber);
    const phoneRegex = /^\+40[0-9]{9}$/;
    return phoneRegex.test(formatted);
}

function autoCompletePhoneNumber(input) {
    const value = input.value;
    if (value && !value.startsWith('+')) {
        const formatted = formatRomanianPhoneNumber(value);
        if (formatted !== value) {
            input.value = formatted;
            // Trigger validation
            validatePhoneInput(input);
        }
    }
}

function validatePhoneInput(input) {
    const value = input.value;
    const isValid = validateRomanianPhoneNumber(value);
    
    // Remove existing validation classes
    input.classList.remove('is-valid', 'is-invalid');
    
    if (value) {
        if (isValid) {
            input.classList.add('is-valid');
            input.setCustomValidity('');
        } else {
            input.classList.add('is-invalid');
            input.setCustomValidity('Numărul de telefon nu este valid. Folosește formatul +40712345678');
        }
    }
}

// Check messaging service status (WhatsApp Direct Links)
async function checkMessagingStatus() {
    // WhatsApp messaging is always available via direct links
    return { success: true, data: { isReady: true, service: 'WhatsApp Direct Links' } };
}


// Test WhatsApp functionality
async function testInfobipAPI() {
    alert('✅ WhatsApp este disponibil prin link-uri directe!\n\n🚀 Sistemul folosește link-uri WhatsApp pentru trimiterea biletelor.\n\n✅ Funcționează perfect fără API-uri externe!');
}




// Update WhatsApp status on bilete page
let isUpdatingWhatsAppStatus = false;
async function updateWhatsAppStatus() {
    // Prevent multiple simultaneous calls
    if (isUpdatingWhatsAppStatus) return;
    
    const statusDiv = document.getElementById('whatsapp-status');
    if (!statusDiv) return;

    isUpdatingWhatsAppStatus = true;
    try {
        const status = await checkMessagingStatus();
        if (status && status.success) {
            const statusClass = status.data?.isReady ? 'success' : 'warning';
            const statusIcon = status.data?.isReady ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
            const statusText = 'WhatsApp activ';
            
            statusDiv.innerHTML = `
                <div class="status-indicator ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="status-indicator error">
                    <i class="fas fa-times-circle"></i>
                    <span>WhatsApp Link-uri directe disponibile</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error updating WhatsApp status:', error);
        statusDiv.innerHTML = `
            <div class="status-indicator error">
                <i class="fas fa-times-circle"></i>
                <span>Eroare la verificarea statusului WhatsApp API</span>
            </div>
        `;
    } finally {
        isUpdatingWhatsAppStatus = false;
    }
}

// Removed old showMessagingConfig function - now using WhatsApp Direct Links status display


// Send ticket via messaging service (WhatsApp Direct Links)
async function sendTicketViaMessaging(ticketId, phoneNumber, email = null) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        console.log('Opening WhatsApp for ticket:', { ticketId, phoneNumber });

        // Get ticket data
        const ticketResponse = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!ticketResponse.ok) {
            throw new Error('Failed to fetch ticket data');
        }

        const ticketData = await ticketResponse.json();
        
        // Create WhatsApp link with ticket details
        const ticketLink = `https://www.site-bilete.shop/api/tickets/${ticketData._id}/custom-public`;
        const downloadLink = `https://www.site-bilete.shop/api/tickets/${ticketData._id}/qr.png`;
        
        const message = `*Bilet ${ticketData.tip_bilet}*

*Nume:* ${ticketData.nume}
*Telefon:* ${ticketData.telefon}
*Tip bilet:* ${ticketData.tip_bilet}

*Vezi și descarcă biletul:* ${ticketLink}`;

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        return { success: true, method: 'WhatsApp_Direct', data: { url: whatsappUrl } };
        
    } catch (error) {
        console.error('Error sending ticket via messaging service:', error);
        showError('Eroare la trimiterea biletului: ' + error.message);
        throw error;
    }
}

// Send bulk tickets via messaging service (WhatsApp Direct Links)
async function sendBulkTicketsViaMessaging(ticketIds, phoneNumbers, emails = null, customImagePaths = null) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        console.log('Opening WhatsApp for bulk tickets:', { ticketIds, phoneNumbers });

        // Get all ticket data
        const ticketPromises = ticketIds.map(async (ticketId) => {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch ticket ${ticketId}`);
            }
            return response.json();
        });

        const tickets = await Promise.all(ticketPromises);
        
        // Create WhatsApp links for each ticket
        const results = [];
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const phoneNumber = phoneNumbers[i];
            const message = `*Bilet ${ticket.tip_bilet}*

*Nume:* ${ticket.nume}
*Telefon:* ${ticket.telefon}
*Tip bilet:* ${ticket.tip_bilet}

*Vezi și descarcă biletul:* https://www.site-bilete.shop/api/tickets/${ticket._id}/custom-public`;

            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            results.push({ ticketId: ticket._id, phoneNumber, link: whatsappUrl, method: 'WhatsApp_Link' });
            
            // Open WhatsApp link
            window.open(whatsappUrl, '_blank');
        }
        
        showSuccess(`✅ ${results.length} conversații WhatsApp deschise!`);
        return { success: true, results, method: 'WhatsApp_Links' };

    } catch (error) {
        console.error('Error sending bulk tickets via messaging service:', error);
        showError('Eroare la trimiterea biletelor în masă: ' + error.message);
    }
}

// Schedule ticket sending
async function scheduleTicketSending(ticketId, phoneNumber, sendTime, email = null, customImagePath = null) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/bot/schedule-ticket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketId, phoneNumber, sendTime, email, customImagePath }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to schedule ticket');
        }

        showSuccess(`Bilet programat cu succes pentru ${sendTime}!`);
        return data;
    } catch (error) {
        console.error('Error scheduling ticket:', error);
        showError(error.message);
    }
}

// Get scheduled messages
async function getScheduledMessages() {
    try {
        const token = getToken();
        if (!token) {
            return [];
        }

        const response = await fetch(`${API_BASE_URL}/bot/scheduled-messages`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get scheduled messages');
        }

        return data.scheduledMessages;
    } catch (error) {
        console.error('Error getting scheduled messages:', error);
        return [];
    }
}

// Cancel scheduled message
async function cancelScheduledMessage(jobId) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/bot/scheduled-messages/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to cancel scheduled message');
        }

        showSuccess('Mesajul programat a fost anulat cu succes!');
        return data;
    } catch (error) {
        console.error('Error cancelling scheduled message:', error);
        showError(error.message);
    }
}

// Send QR code via bot
async function sendQRCodeViaBot(ticketId, phoneNumber) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/bot/send-qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketId, phoneNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send QR code via bot');
        }

        showSuccess('Codul QR a fost trimis cu succes prin WhatsApp!');
        return data;
    } catch (error) {
        console.error('Error sending QR code via bot:', error);
        showError(error.message);
    }
}

// Enhanced ticket sending with WhatsApp redirect
async function sendTicketViaBotEnhanced(el) {
    try {
        // Check if user's group is active
        const user = getUser();
        const groupActive = user && user.groupActive !== undefined ? user.groupActive : true;
        
        if (!groupActive) {
            showError('Evenimentul s-a terminat. Nu mai poți trimite bilete.');
            return;
        }
        
        const ticket = JSON.parse(el.getAttribute('data-ticket').replace(/&apos;/g, "'"));
        let phoneNumber = ticket.telefon.replace(/\D/g, ''); // Remove non-digits
        
        // Format Romanian phone number
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '+40' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+40')) {
            phoneNumber = '+40' + phoneNumber;
        }
        
        console.log('Opening WhatsApp conversation:', { ticketId: ticket._id, phoneNumber });
        console.log('Ticket data:', ticket);
        
        // Create the ticket message
        const ticketLink = `https://www.site-bilete.shop/api/tickets/${ticket._id}/custom-public`;
        const downloadLink = `https://www.site-bilete.shop/api/tickets/${ticket._id}/qr.png`;
        
        const message = `*Bilet ${ticket.tip_bilet}*

*Nume:* ${ticket.nume}
*Telefon:* ${ticket.telefon}
*Tip bilet:* ${ticket.tip_bilet}

*Vezi și descarcă biletul:* ${ticketLink}`;

        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Show confirmation dialog
        const confirmed = confirm(`Deschid conversația WhatsApp cu ${phoneNumber}?\n\nMesajul va fi pre-completat cu detaliile biletului.`);
        
        if (confirmed) {
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            
            // Show success message
            showSuccess('✅ WhatsApp deschis! Completează trimiterea manuală și marchează biletul ca trimis.');
            
            // Ask user to mark as sent after manual sending
            setTimeout(() => {
                const markAsSent = confirm('Ai trimis biletul prin WhatsApp? Marchează-l ca trimis?');
                if (markAsSent) {
                    // Mark ticket as sent
                    markTicketAsSent(ticket._id || ticket.id);
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('Failed to open WhatsApp:', error);
        showError('Eroare la deschiderea WhatsApp: ' + error.message);
    }
}

// Helper function to mark ticket as sent
async function markTicketAsSent(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/sent`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sent: true })
        });
        
        if (response.ok) {
            // Update the ticket in allTickets array
            const ticketIndex = allTickets.findIndex(t => (t._id || t.id) === ticketId);
            if (ticketIndex !== -1) {
                allTickets[ticketIndex].sent = true;
                allTickets[ticketIndex].sent_at = new Date();
            }
            
            // Update the checkbox in the table if it exists
            const checkbox = document.querySelector(`input[data-ticket-id="${ticketId}"]`);
            if (checkbox) {
                checkbox.checked = true;
                const label = checkbox.parentElement;
                const textSpan = label.querySelector('span:not(.checkmark)');
                if (textSpan) {
                    textSpan.textContent = 'Trimis';
                }
            }
            
            // Refresh the display using filters
            applyFilters();
            
            // Update tickets summary
            updateTicketsSummary();
            
            showSuccess('✅ Bilet marcat ca trimis!');
        }
    } catch (error) {
        console.error('Error marking ticket as sent:', error);
        showError('Eroare la marcarea biletului ca trimis: ' + error.message);
    }
}


// Tickets table functions
let allTickets = []; // Store all tickets
let filteredTickets = []; // Store filtered tickets
let currentPage = 1;
let itemsPerPage = 50;

// Filter function
function applyFilters() {
    const searchTerm = (document.getElementById('search-tickets')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const sentFilter = document.getElementById('sent-filter')?.value || 'all';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    
    filteredTickets = allTickets.filter(ticket => {
        // Search filter
        const matchesSearch = !searchTerm || 
            ticket.nume.toLowerCase().includes(searchTerm) ||
            ticket.telefon.toLowerCase().includes(searchTerm);
        
        // Status filter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'verified' && ticket.verified) ||
            (statusFilter === 'pending' && !ticket.verified);
        
        // Sent filter
        const matchesSent = sentFilter === 'all' ||
            (sentFilter === 'sent' && ticket.sent) ||
            (sentFilter === 'not-sent' && !ticket.sent);
        
        // Type filter
        const matchesType = typeFilter === 'all' || ticket.tip_bilet === typeFilter;
        
        return matchesSearch && matchesStatus && matchesSent && matchesType;
    });
    
    // Reset to first page when filtering
    currentPage = 1;
    
    displayTicketsTable();
    updatePagination();
}

async function loadTicketsTable() {
    try {
        const token = getToken();
        if (!token) {
            return;
        }

        // Show loading indicator
        const loadingDiv = document.getElementById('tickets-loading');
        const tableContainer = document.querySelector('.tickets-table-container');
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (tableContainer) tableContainer.style.opacity = '0.5';

        const response = await fetch(`${API_BASE_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load tickets');
        }

        allTickets = data.tickets;
        filteredTickets = [...allTickets]; // Initialize filtered tickets
        
        // Hide loading indicator
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (tableContainer) tableContainer.style.opacity = '1';
        
        // Apply filters and display tickets with pagination
        applyFilters();
        
        // Update tickets summary
        updateTicketsSummary();
    } catch (error) {
        console.error('Error loading tickets:', error);
        const loadingDiv = document.getElementById('tickets-loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `<p style="color: #dc3545;">Eroare la încărcarea biletelor: ${error.message}</p>`;
        }
    }
}

// Update tickets summary display
function updateTicketsSummary() {
    const summaryElement = document.getElementById('tickets-summary');
    if (!summaryElement) return;
    
    const ticketCount = allTickets.length;
    
    // Calculate total cost
    let totalCost = 0;
    allTickets.forEach(ticket => {
        switch(ticket.tip_bilet) {
            case 'BAL + AFTER':
                totalCost += 160;
                break;
            case 'AFTER':
                totalCost += 120;
                break;
            case 'BAL':
                totalCost += 60;
                break;
            case 'AFTER VIP':
                totalCost += 120; // Assuming same as AFTER
                break;
            case 'BAL + AFTER VIP':
                totalCost += 160; // Assuming same as BAL + AFTER
                break;
        }
    });
    
    summaryElement.textContent = `Toate biletele create: ${ticketCount} bilete, valoarea lor: ${totalCost} lei`;
}

// Update ticket sent status
async function updateTicketSentStatus(checkbox) {
    // Check if user's group is active
    const user = getUser();
    const groupActive = user && user.groupActive !== undefined ? user.groupActive : true;
    
    if (!groupActive) {
        checkbox.checked = !checkbox.checked; // Revert checkbox
        showError('Evenimentul s-a terminat. Nu mai poți modifica statusul biletelor.');
        return;
    }
    try {
        const ticketId = checkbox.getAttribute('data-ticket-id');
        const sent = checkbox.checked;
        
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/sent`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sent })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update ticket status');
        }

        // Update the label text
        const label = checkbox.parentElement;
        const textSpan = label.querySelector('span:not(.checkmark)');
        if (textSpan) {
            textSpan.textContent = sent ? 'Trimis' : 'Netrimis';
        }

        showSuccess(`Bilet ${sent ? 'marcat ca trimis' : 'marcat ca netrimis'}`);
        
        // Update the ticket in allTickets array
        const ticketIndex = allTickets.findIndex(ticket => (ticket._id || ticket.id) === ticketId);
        if (ticketIndex !== -1) {
            allTickets[ticketIndex].sent = sent;
            allTickets[ticketIndex].sent_at = sent ? new Date() : null;
        }
        
        // Update display using filters
        applyFilters();
        
        // Update tickets summary
        updateTicketsSummary();
    } catch (error) {
        console.error('Error updating ticket sent status:', error);
        showError('Eroare la actualizarea statusului biletului: ' + error.message);
        // Revert checkbox state
        checkbox.checked = !checkbox.checked;
    }
}

// Optimized rendering using DocumentFragment
function displayTicketsTable() {
    const tableBody = document.getElementById('tickets-table-body');
    const noTickets = document.getElementById('no-tickets');
    
    if (!tableBody) return;

    // Calculate pagination using filteredTickets
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    if (filteredTickets.length === 0) {
        tableBody.innerHTML = '';
        if (noTickets) noTickets.style.display = 'block';
        return;
    }

    if (noTickets) noTickets.style.display = 'none';

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Check if user's group is active (once, outside the loop)
    const user = getUser();
    const groupActive = user && user.groupActive !== undefined ? user.groupActive : true;
    
    paginatedTickets.forEach((ticket, index) => {
        const row = document.createElement('tr');
        const globalIndex = startIndex + index;
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const ticketId = ticket._id || ticket.id;
        const ticketJson = JSON.stringify(ticket).replace(/'/g, "&apos;");
        
        row.innerHTML = `
            <td>${globalIndex + 1}</td>
            <td>${escapeHtml(ticket.nume)}</td>
            <td>${escapeHtml(ticket.telefon)}</td>
            <td><span class="ticket-type">${escapeHtml(ticket.tip_bilet)}</span></td>
            <td><span class="group-badge">${escapeHtml(ticket.group || 'N/A')}</span></td>
            <td>${new Date(ticket.created_at).toLocaleDateString('ro-RO')}</td>
            <td class="${ticket.verified ? 'status-verified' : 'status-pending'}">
                ${ticket.verified ? '✅ Verificat' : '⏳ Ne verificat'}
            </td>
            <td class="sent-status">
                ${groupActive ? `
                <label class="sent-checkbox-label">
                    <input type="checkbox" 
                           class="sent-checkbox" 
                           data-ticket-id="${ticketId}"
                           ${ticket.sent ? 'checked' : ''}
                           onchange="updateTicketSentStatus(this)">
                    <span class="checkmark"></span>
                    ${ticket.sent ? 'Trimis' : 'Netrimis'}
                </label>
                ` : `<span style="color: #999;">${ticket.sent ? 'Trimis' : 'Netrimis'}</span>`}
            </td>
            <td class="actions">
                <button class="btn btn-primary" data-id="${ticketId}" onclick="viewTicketFromButton(this)">
                    <i class="fas fa-eye"></i> Vezi biletul
                </button>
                <button class="btn btn-secondary" data-id="${ticketId}" onclick="downloadTicketQRFromButton(this)">
                    <i class="fas fa-download"></i> Descarcă cod QR
                </button>
                ${groupActive ? `
                <button class="btn btn-warning" data-id="${ticketId}" data-tip-bilet="${escapeHtml(ticket.tip_bilet)}" onclick="editTicketType(this)">
                    <i class="fas fa-edit"></i> Editează tip bilet
                </button>
                <button class="btn btn-success" data-ticket='${ticketJson}' onclick="sendTicketViaBotEnhanced(this)">
                    <i class="fab fa-whatsapp"></i> Trimite prin WhatsApp
                </button>
                <button class="btn btn-danger" data-id="${ticketId}" onclick="deleteTicket(this)">
                    <i class="fas fa-trash"></i> Șterge
                </button>
                ` : ''}
                <button class="btn btn-info" data-id="${ticketId}" onclick="verifyTicketFromButton(this)">
                    <i class="fas fa-check-circle"></i> Validare bilet
                </button>
            </td>
        `;
        
        fragment.appendChild(row);
    });
    
    // Clear and append in one operation
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const paginationControls = document.getElementById('pagination-controls');
    const paginationInfo = document.getElementById('pagination-info-text');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    
    if (!paginationControls) return;
    
    if (filteredTickets.length === 0) {
        paginationControls.style.display = 'none';
        return;
    }
    
    // Only show pagination if there are more tickets than items per page
    if (filteredTickets.length <= itemsPerPage) {
        paginationControls.style.display = 'none';
        return;
    }
    
    paginationControls.style.display = 'flex';
    
    // Update info text
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTickets.length);
    paginationInfo.textContent = `Afișând ${startIndex + 1}-${endIndex} din ${filteredTickets.length} bilete`;
    
    // Update buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Update page numbers
    pageNumbers.innerHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            displayTicketsTable();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pageNumbers.appendChild(pageBtn);
    }
}

async function sendTicketViaWhatsApp(el) {
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
        
        console.log('Opening WhatsApp for ticket:', { ticketId: ticket._id, phoneNumber });
        
        // Send via WhatsApp Direct Links
        try {
            const result = await sendTicketViaMessaging(ticket._id || ticket.id, phoneNumber, null);
            
            if (result && result.success) {
                showSuccess('✅ WhatsApp deschis cu biletul!');
            } else {
                showError('Eroare la deschiderea WhatsApp.');
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            showError('Eroare la deschiderea WhatsApp: ' + error.message);
        }
        
    } catch (e) {
        console.error('Failed to send ticket via WhatsApp', e);
        showError('Eroare la trimiterea biletului prin WhatsApp');
    }
}

async function deleteTicket(el) {
    // Check if user's group is active
    const user = getUser();
    const groupActive = user && user.groupActive !== undefined ? user.groupActive : true;
    
    if (!groupActive) {
        showError('Evenimentul s-a terminat. Nu mai poți șterge bilete.');
        return;
    }
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
        
        // Remove ticket from allTickets array
        allTickets = allTickets.filter(t => (t._id || t.id) !== ticketId);
        
        // Update display using filters
        applyFilters();
        
        // Update tickets summary
        updateTicketsSummary();
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

// Edit ticket type functionality
let currentEditTicketId = null;

function editTicketType(el) {
    // Check if user's group is active
    const user = getUser();
    const groupActive = user && user.groupActive !== undefined ? user.groupActive : true;
    
    if (!groupActive) {
        showError('Evenimentul s-a terminat. Nu mai poți edita bilete.');
        return;
    }
    const ticketId = el.getAttribute('data-id');
    const currentTipBilet = el.getAttribute('data-tip-bilet');
    
    if (!ticketId) return;
    
    currentEditTicketId = ticketId;
    const modal = document.getElementById('edit-ticket-type-modal');
    const select = document.getElementById('edit-ticket-type-select');
    
    // Set current value
    select.value = currentTipBilet;
    
    // Show modal
    modal.style.display = 'block';
}

function closeEditTicketTypeModal() {
    const modal = document.getElementById('edit-ticket-type-modal');
    modal.style.display = 'none';
    currentEditTicketId = null;
}

async function saveTicketType() {
    if (!currentEditTicketId) return;
    
    const select = document.getElementById('edit-ticket-type-select');
    const newTipBilet = select.value;
    
    if (!newTipBilet) {
        showError('Te rugăm să selectezi un tip de bilet.');
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

        const response = await fetch(`${API_BASE_URL}/tickets/${currentEditTicketId}/type`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tip_bilet: newTipBilet })
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
        
        showSuccess('Tip bilet actualizat cu succes!');
        
        // Close modal
        closeEditTicketTypeModal();
        
        // Update ticket in allTickets array
        const ticketIndex = allTickets.findIndex(t => (t._id || t.id) === currentEditTicketId);
        if (ticketIndex !== -1) {
            allTickets[ticketIndex].tip_bilet = newTipBilet;
        }
        
        // Update display using filters
        applyFilters();
        
        // Update tickets summary
        updateTicketsSummary();
    } catch (error) {
        console.error('Error updating ticket type:', error);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Nu s-a putut conecta la server. Verifică conexiunea la internet și că backend-ul rulează.');
        } else if (error.message.includes('JSON')) {
            showError('Server-ul nu răspunde corect. Verifică că backend-ul rulează și este accesibil.');
        } else {
            showError(error.message);
        }
    }
}

// Close modals when clicking outside of them (single handler for all modals)
if (!window.modalClickHandlerAdded) {
    window.onclick = function(event) {
        const editModal = document.getElementById('edit-ticket-type-modal');
        const qrModal = document.getElementById('qr-modal');
        const sendTicketModal = document.getElementById('send-ticket-modal');
        const scheduleModal = document.getElementById('schedule-modal');
        const scheduledMessagesModal = document.getElementById('scheduled-messages-modal');
        
        if (event.target === editModal) {
            closeEditTicketTypeModal();
        }
        if (event.target === qrModal) {
            qrModal.style.display = 'none';
        }
        if (event.target === sendTicketModal) {
            sendTicketModal.style.display = 'none';
        }
        if (event.target === scheduleModal) {
            scheduleModal.style.display = 'none';
        }
        if (event.target === scheduledMessagesModal) {
            scheduledMessagesModal.style.display = 'none';
        }
    };
    window.modalClickHandlerAdded = true;
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

// Verify ticket by phone number
async function verifyTicketByPhone(phoneNumber) {
    const resultDiv = document.getElementById('verification-result');
    
    console.log('=== verifyTicketByPhone START ===');
    console.log('Original phone number:', phoneNumber);
    
    try {
        if (!phoneNumber || !phoneNumber.trim()) {
            throw new Error('Te rugăm să introduci un număr de telefon');
        }
        
        const trimmedPhone = phoneNumber.trim();
        console.log('Trimmed phone number:', trimmedPhone);
        
        // Format phone number
        const formattedPhone = formatRomanianPhoneNumber(trimmedPhone);
        console.log('Formatted phone number:', formattedPhone);
        
        // Validate phone number
        const isValid = validateRomanianPhoneNumber(formattedPhone);
        console.log('Is valid:', isValid);
        
        if (!isValid) {
            throw new Error('Numărul de telefon nu este valid. Folosește formatul +40712345678 sau 0712345678');
        }
        
        // Show loading state
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'verification-result loading';
            resultDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea; margin-bottom: 1rem;"></i>
                    <h4>Se verifică biletul...</h4>
                    <p>Număr: ${formattedPhone}</p>
                </div>
            `;
        }
        
        const requestBody = { phoneNumber: formattedPhone };
        console.log('Request URL:', `${API_BASE_URL}/verify-ticket-by-phone`);
        console.log('Request body:', JSON.stringify(requestBody));
        
        const response = await fetch(`${API_BASE_URL}/verify-ticket-by-phone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        
        // Check if response is ok before parsing JSON
        let data;
        try {
            const responseText = await response.text();
            console.log('Response text:', responseText);
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            throw new Error('Răspuns invalid de la server. Te rugăm să încerci din nou.');
        }

        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Verificare eșuată');
        }

        // Check if multiple tickets were found
        if (data.multiple && data.tickets && data.tickets.length > 1) {
            console.log('Multiple tickets found, showing selection popup');
            showTicketSelectionPopup(data.tickets);
            return;
        }

        console.log('Ticket verification by phone successful:', data);
        showVerificationResult(data.ticket, true, null, data);
    } catch (error) {
        console.error('Ticket verification by phone failed:', error);
        console.error('Error stack:', error.stack);
        showVerificationResult(null, false, error.message);
    }
    
    console.log('=== verifyTicketByPhone END ===');
}

// Show popup to select which ticket to verify when multiple are found
function showTicketSelectionPopup(tickets) {
    // Remove existing popup if any
    const existingPopup = document.getElementById('ticket-selection-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Get current theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Theme-aware colors - modern palette
    const colors = {
        modalBg: isDark ? '#1e293b' : '#ffffff',
        textPrimary: isDark ? '#f1f5f9' : '#0f172a',
        textSecondary: isDark ? '#cbd5e1' : '#475569',
        textMuted: isDark ? '#94a3b8' : '#94a3b8',
        borderColor: isDark ? '#475569' : '#e2e8f0',
        borderVerified: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.5)',
        bgVerified: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.08)',
        overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15, 23, 42, 0.5)',
        primary: isDark ? '#60a5fa' : '#2563eb',
        success: isDark ? '#34d399' : '#10b981',
        warning: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444'
    };

    const popupHTML = `
        <div id="ticket-selection-popup" class="modal" style="display: block; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: ${colors.overlay};">
            <div class="modal-content" style="background: ${colors.modalBg}; margin: 5% auto; padding: 1.75rem; border: 1px solid ${colors.borderColor}; border-radius: 14px; width: 92%; max-width: 680px; max-height: 85vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                <span class="close" onclick="closeTicketSelectionPopup()" style="color: ${colors.textMuted}; float: right; font-size: 24px; font-weight: bold; cursor: pointer; line-height: 1;">&times;</span>
                <h3 style="margin-top: 0; color: ${colors.textPrimary}; font-size: 1.25rem; font-weight: 600; padding-bottom: 0.9rem; border-bottom: 1px solid ${colors.borderColor};">
                    <i class="fas fa-list-ul" style="color: ${colors.warning}; margin-right: 0.5rem;"></i>
                    ${tickets.length} bilete găsite
                </h3>
                <p style="color: ${colors.textSecondary}; margin: 0.9rem 0 1.25rem 0; font-size: 0.9rem;">Selectează biletul pe care dorești să îl verifici:</p>
                <div class="tickets-list" style="display: flex; flex-direction: column; gap: 0.65rem;">
                    ${tickets.map((ticket, index) => `
                        <div class="ticket-option" style="border: 1px solid ${ticket.verified ? colors.borderVerified : colors.borderColor}; border-radius: 10px; padding: 1.1rem; cursor: pointer; transition: all 0.2s ease; background: ${ticket.verified ? colors.bgVerified : 'transparent'};"
                             onmouseover="this.style.borderColor='${colors.primary}'; this.style.boxShadow='0 2px 12px ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)'}';"
                             onmouseout="this.style.borderColor='${ticket.verified ? colors.borderVerified : colors.borderColor}'; this.style.boxShadow='none';"
                             onclick="verifySelectedTicket('${ticket.id}')">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.9rem;">
                                <div style="flex: 1; min-width: 180px;">
                                    <h4 style="margin: 0 0 0.4rem 0; color: ${colors.textPrimary}; font-size: 1rem; font-weight: 600;">
                                        <i class="fas fa-user" style="color: ${colors.primary}; margin-right: 0.4rem;"></i>${escapeHtmlForPopup(ticket.nume)}
                                    </h4>
                                    <p style="margin: 0.3rem 0; color: ${colors.textSecondary}; font-size: 0.85rem;">
                                        <i class="fas fa-phone" style="color: ${colors.textMuted}; margin-right: 0.4rem;"></i>${escapeHtmlForPopup(ticket.telefon)}
                                    </p>
                                    <p style="margin: 0.3rem 0; color: ${colors.textSecondary}; font-size: 0.85rem;">
                                        <i class="fas fa-calendar" style="color: ${colors.textMuted}; margin-right: 0.4rem;"></i>${new Date(ticket.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    ${ticket.group ? `<p style="margin: 0.3rem 0; color: ${colors.textSecondary}; font-size: 0.85rem;"><i class="fas fa-users" style="color: ${colors.textMuted}; margin-right: 0.4rem;"></i>Grup: ${escapeHtmlForPopup(ticket.group)}</p>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <span style="display: inline-block; padding: 0.35rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; background: ${colors.primary}; color: white;">
                                        ${escapeHtmlForPopup(ticket.tip_bilet)}
                                    </span>
                                    <div style="margin-top: 0.6rem;">
                                        ${ticket.verified 
                                            ? `<span style="color: ${colors.success}; font-weight: 600; font-size: 0.85rem;"><i class="fas fa-check-circle"></i> Verificat</span>` 
                                            : `<span style="color: ${colors.warning}; font-weight: 600; font-size: 0.85rem;"><i class="fas fa-clock"></i> Neverificat</span>`}
                                    </div>
                                    ${ticket.verification_count > 0 ? `<div style="margin-top: 0.3rem; font-size: 0.75rem; color: ${colors.danger};"><i class="fas fa-eye"></i> Verificări: ${ticket.verification_count}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1.25rem; text-align: center;">
                    <button onclick="closeTicketSelectionPopup()" class="btn btn-secondary" style="padding: 0.6rem 1.5rem;">
                        <i class="fas fa-times"></i> Anulează
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Close on click outside
    document.getElementById('ticket-selection-popup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTicketSelectionPopup();
        }
    });

    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeTicketSelectionPopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Helper function for escaping HTML in popup
function escapeHtmlForPopup(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get color for ticket type
function getTicketTypeColor(tipBilet) {
    const colors = {
        'BAL + AFTER': '#6366f1',
        'BAL + AFTER VIP': '#a855f7',
        'BAL': '#0ea5e9',
        'AFTER': '#10b981',
        'AFTER VIP': '#f59e0b'
    };
    return colors[tipBilet] || '#64748b';
}

// Get gradient for ticket type (for dark theme popup)
function getTicketTypeGradient(tipBilet) {
    const gradients = {
        'BAL + AFTER': '#6366f1, #8b5cf6',
        'BAL + AFTER VIP': '#a855f7, #c026d3',
        'BAL': '#0ea5e9, #06b6d4',
        'AFTER': '#10b981, #059669',
        'AFTER VIP': '#f59e0b, #d97706'
    };
    return gradients[tipBilet] || '#64748b, #475569';
}

// Close ticket selection popup
function closeTicketSelectionPopup() {
    const popup = document.getElementById('ticket-selection-popup');
    if (popup) {
        popup.remove();
    }
}

// Verify a selected ticket by ID
async function verifySelectedTicket(ticketId) {
    const resultDiv = document.getElementById('verification-result');
    
    // Close the popup
    closeTicketSelectionPopup();
    
    try {
        // Show loading state
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'verification-result loading';
            resultDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea; margin-bottom: 1rem;"></i>
                    <h4>Se verifică biletul selectat...</h4>
                </div>
            `;
        }

        const response = await fetch(`${API_BASE_URL}/verify-ticket-by-id/${ticketId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Verificare eșuată');
        }

        console.log('Selected ticket verification successful:', data);
        showVerificationResult(data.ticket, true, null, data);
    } catch (error) {
        console.error('Selected ticket verification failed:', error);
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
let lastScannedCode = null;
let lastScanTime = 0;
const SCAN_DEBOUNCE_MS = 2000; // Prevent duplicate scans within 2 seconds

async function startScanner() {
    if (scannerActive) return;

    const scannerContainer = document.getElementById('scanner-container');
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');

    if (!scannerContainer || !startBtn || !stopBtn) return;
    
    // Clean up any existing feedback elements
    const existingFeedback = scannerContainer.querySelector('.scan-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Reset scan tracking when starting fresh
    lastScannedCode = null;
    lastScanTime = 0;

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
        
        // Enhanced scanner configuration for maximum sensitivity
        const config = {
            fps: isMobile ? 20 : (isTablet ? 30 : 40), // Much higher FPS for faster detection
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                // Maximum scanning area for better detection - scan almost the entire viewfinder
                const boxSize = Math.floor(minEdge * (isMobile ? 0.95 : 0.9));
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
            // Enhanced detection settings - higher resolution for better sensitivity
            videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1920, min: 1280 }, // Higher resolution for better detection
                height: { ideal: 1080, min: 720 }
            },
            // Additional sensitivity settings
            disableFlip: false // Allow flipping for better detection
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
                
                // Debounce: prevent duplicate scans of the same code within 2 seconds
                const now = Date.now();
                if (decodedText === lastScannedCode && (now - lastScanTime) < SCAN_DEBOUNCE_MS) {
                    console.log("Duplicate scan ignored (debounce)");
                    return;
                }
                
                // Update last scanned code and time
                lastScannedCode = decodedText;
                lastScanTime = now;
                
                // Show brief visual feedback that scan was successful
                const scannerContainer = document.getElementById('scanner-container');
                if (scannerContainer) {
                    // Remove any existing feedback elements first
                    const existingFeedback = scannerContainer.querySelector('.scan-feedback');
                    if (existingFeedback) {
                        existingFeedback.remove();
                    }
                    
                    // Ensure container has relative positioning for absolute feedback
                    if (scannerContainer.style.position !== 'relative') {
                        scannerContainer.style.position = 'relative';
                    }
                    
                    const feedback = document.createElement('div');
                    feedback.className = 'scan-feedback';
                    feedback.style.cssText = `
                        position: absolute;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: rgba(16, 185, 129, 0.95);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        z-index: 1000;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        animation: fadeInOut 1.5s ease;
                        pointer-events: none;
                    `;
                    feedback.innerHTML = '<i class="fas fa-check-circle"></i> Bilet scanat! Continuă să scanezi...';
                    scannerContainer.appendChild(feedback);
                    
                    // Remove feedback after animation
                    setTimeout(() => {
                        if (feedback.parentNode) {
                            feedback.remove();
                        }
                    }, 1500);
                }
                
                // Try to trigger haptic feedback on mobile devices (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(100); // Short vibration
                }
                
                // Process the scanned data immediately (scanner continues running)
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

    // Clean up any feedback elements
    if (scannerContainer) {
        const existingFeedback = scannerContainer.querySelector('.scan-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    // Reset button states immediately
    if (startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-camera"></i> Pornește Scanner';
    }
    if (stopBtn) stopBtn.style.display = 'none';
    if (scannerContainer) scannerContainer.style.display = 'none';

    // Reset scan tracking
    lastScannedCode = null;
    lastScanTime = 0;

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

// ========================================
// TICKET LOGS FUNCTIONS (for Administrator)
// ========================================

async function loadTicketLogs(group) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const ticketsTableContainer = document.getElementById('tickets-table-container');
    const ticketsTableBody = document.getElementById('tickets-table-body');
    const noTicketsMessage = document.getElementById('no-tickets-message');
    const groupInfo = document.getElementById('group-info');
    const selectedGroupName = document.getElementById('selected-group-name');
    const ticketsCount = document.getElementById('tickets-count');

    try {
        // Show loading
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (errorMessage) errorMessage.style.display = 'none';
        if (ticketsTableContainer) ticketsTableContainer.style.display = 'none';
        if (noTicketsMessage) noTicketsMessage.style.display = 'none';

        const token = getToken();
        if (!token) {
            throw new Error('Nu ești autentificat. Te rugăm să te conectezi.');
        }

        const response = await fetch(`${API_BASE_URL}/admin/tickets-logs/${encodeURIComponent(group)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Eroare la încărcarea log-urilor');
        }

        // Hide loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';

        // Update group info
        if (groupInfo) {
            groupInfo.style.display = 'block';
            if (selectedGroupName) selectedGroupName.textContent = group;
            if (ticketsCount) ticketsCount.textContent = data.count || 0;
        }

        // Display tickets
        if (data.tickets && data.tickets.length > 0) {
            displayTicketLogs(data.tickets);
            if (ticketsTableContainer) ticketsTableContainer.style.display = 'block';
            if (noTicketsMessage) noTicketsMessage.style.display = 'none';
        } else {
            if (ticketsTableContainer) ticketsTableContainer.style.display = 'none';
            if (noTicketsMessage) noTicketsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading ticket logs:', error);
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = error.message || 'Eroare la încărcarea log-urilor';
            errorMessage.style.display = 'block';
        }
        if (ticketsTableContainer) ticketsTableContainer.style.display = 'none';
        if (noTicketsMessage) noTicketsMessage.style.display = 'none';
    }
}

function displayTicketLogs(tickets) {
    const ticketsTableBody = document.getElementById('tickets-table-body');
    if (!ticketsTableBody) return;

    // Clear existing rows
    ticketsTableBody.innerHTML = '';

    // Create rows for each ticket
    tickets.forEach(ticket => {
        const row = document.createElement('tr');
        
        const createdDate = ticket.created_at 
            ? new Date(ticket.created_at).toLocaleString('ro-RO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'N/A';

        const statusBadge = ticket.verified 
            ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Verificat</span>'
            : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Ne verificat</span>';

        row.innerHTML = `
            <td>${escapeHtml(ticket.nume || 'N/A')}</td>
            <td>${escapeHtml(ticket.telefon || 'N/A')}</td>
            <td>${escapeHtml(ticket.tip_bilet || 'N/A')}</td>
            <td><strong>${escapeHtml(ticket.creator_username || 'Unknown')}</strong></td>
            <td>${createdDate}</td>
            <td>${statusBadge}</td>
            <td>${ticket.verification_count || 0}</td>
        `;

        ticketsTableBody.appendChild(row);
    });
}

function hideLogsTable() {
    const ticketsTableContainer = document.getElementById('tickets-table-container');
    const noTicketsMessage = document.getElementById('no-tickets-message');
    const groupInfo = document.getElementById('group-info');
    const errorMessage = document.getElementById('error-message');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (ticketsTableContainer) ticketsTableContainer.style.display = 'none';
    if (noTicketsMessage) noTicketsMessage.style.display = 'none';
    if (groupInfo) groupInfo.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

    // Phone verification form
    const phoneVerifyForm = document.getElementById('phone-verify-form');
    if (phoneVerifyForm) {
        phoneVerifyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phone-number').value;
            if (!phoneNumber.trim()) {
                showError('Introdu numărul de telefon');
                return;
            }

            await verifyTicketByPhone(phoneNumber);
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

    // Auto-start scanner on the dedicated mobile/tablet verification page
    // (Triggers permission prompt faster; safe because startScanner() guards missing elements)
    if (window.location.pathname.includes('verificare-mobile.html')) {
        setTimeout(() => {
            // If user already sees the page, attempt to start scanning immediately.
            // If permission is denied, existing error handling will show a message.
            startScanner();
        }, 450);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Modal close buttons
    const qrModal = document.getElementById('qr-modal');
    const qrCloseBtn = qrModal ? qrModal.querySelector('.close') : null;
    
    if (qrCloseBtn) {
        qrCloseBtn.addEventListener('click', function() {
            if (qrModal) qrModal.style.display = 'none';
        });
    }


    // Load user data on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        const user = getUser();
        if (user) {
            const userNameElement = document.getElementById('user-name');
            const userGroupElement = document.getElementById('user-group');
            const userGroupDisplayElement = document.getElementById('user-group-display');
            const adminToolsSection = document.getElementById('admin-tools-section');
            const ticketFormSection = document.getElementById('ticket-form-section');
            const ticketForm = document.getElementById('ticket-form');
            const groupInactiveBanner = document.getElementById('group-inactive-banner');
            
            if (userNameElement) {
                userNameElement.textContent = user.username;
            }
            if (userGroupElement && user.group) {
                userGroupElement.textContent = user.group;
            }
            if (userGroupDisplayElement && user.group) {
                userGroupDisplayElement.textContent = user.group;
            }
            
            // Show Admin Tools section only for Administrator
            if (adminToolsSection && user.group === 'Administrator') {
                adminToolsSection.style.display = 'block';
            }
            
            // Check if group is inactive - disable ticket creation
            const groupActive = user.groupActive !== undefined ? user.groupActive : true;
            if (!groupActive) {
                if (groupInactiveBanner) {
                    groupInactiveBanner.style.display = 'block';
                }
                if (ticketForm) {
                    // Disable all form inputs
                    const inputs = ticketForm.querySelectorAll('input, select, button');
                    inputs.forEach(input => {
                        input.disabled = true;
                        input.style.opacity = '0.5';
                        input.style.cursor = 'not-allowed';
                    });
                    // Prevent form submission
                    ticketForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        showError('Evenimentul s-a terminat. Nu mai poți crea bilete noi.');
                    });
                }
            }
        }

        // Service suspension banner close functionality
        const banner = document.getElementById('service-suspension-banner');
        const closeBtn = document.getElementById('banner-close-btn');
        
        if (banner && closeBtn) {
            // Check if banner was previously closed
            const bannerClosed = localStorage.getItem('serviceSuspensionBannerClosed');
            if (bannerClosed === 'true') {
                banner.classList.add('hidden');
            }

            // Handle close button click
            closeBtn.addEventListener('click', function() {
                banner.classList.add('hidden');
                localStorage.setItem('serviceSuspensionBannerClosed', 'true');
            });
        }

        // Terms update banner close functionality
        const termsBanner = document.getElementById('terms-update-banner');
        const termsCloseBtn = document.getElementById('terms-banner-close-btn');
        
        if (termsBanner && termsCloseBtn) {
            // Check if banner was previously closed
            const termsBannerClosed = localStorage.getItem('termsUpdateBannerClosed');
            if (termsBannerClosed === 'true') {
                termsBanner.classList.add('hidden');
            }

            // Handle close button click
            termsCloseBtn.addEventListener('click', function() {
                termsBanner.classList.add('hidden');
                localStorage.setItem('termsUpdateBannerClosed', 'true');
            });
        }
    }

    // Load logs on loguri page
    if (window.location.pathname.includes('loguri.html')) {
        // Check if user is Administrator
        const user = getUser();
        if (!user || user.group !== 'Administrator') {
            showError('Acces restricționat. Doar utilizatorii Administrator pot accesa această pagină.');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }

        // Setup group selector
        const groupSelect = document.getElementById('group-select');
        if (groupSelect) {
            groupSelect.addEventListener('change', async function(e) {
                const selectedGroup = e.target.value;
                if (selectedGroup) {
                    await loadTicketLogs(selectedGroup);
                } else {
                    hideLogsTable();
                }
            });
        }
    }

    // Load tickets table on bilete page
    if (window.location.pathname.includes('bilete.html')) {
        loadTicketsTable();
        updateWhatsAppStatus();
        
        // Setup filter controls
        const searchInput = document.getElementById('search-tickets');
        const statusFilter = document.getElementById('status-filter');
        const sentFilter = document.getElementById('sent-filter');
        const typeFilter = document.getElementById('type-filter');
        
        if (searchInput) {
            // Use debounce for search to improve performance
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    applyFilters();
                }, 300);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }
        
        if (sentFilter) {
            sentFilter.addEventListener('change', applyFilters);
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', applyFilters);
        }
        
        // Setup pagination controls
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const itemsPerPageSelect = document.getElementById('items-per-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayTicketsTable();
                    updatePagination();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    displayTicketsTable();
                    updatePagination();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
        
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                itemsPerPage = parseInt(e.target.value);
                currentPage = 1;
                applyFilters();
            });
        }
    }

    // Removed bot.html page loading - now integrated into bilete.html

    // Update navigation based on authentication status
    updateNavigation();
    
    // Redirect to login if not authenticated and trying to access protected pages
    console.log('Page load - checking authentication for:', window.location.pathname);
    const protectedPages = ['dashboard.html', 'bilete.html', 'loguri.html'];
    const isProtectedPage = protectedPages.some(page => window.location.pathname.includes(page));
    
    if (isProtectedPage && !isLoggedIn()) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = 'login.html';
    } else if (window.location.pathname.includes('loguri.html')) {
        // Check if user is Administrator for loguri page
        const user = getUser();
        if (!user || user.group !== 'Administrator') {
            console.log('Not Administrator, redirecting to dashboard');
            showError('Acces restricționat. Doar utilizatorii Administrator pot accesa această pagină.');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    } else {
        console.log('Authentication check passed');
    }
});

// Bot Management Functions

// Load messaging service management page
async function loadMessagingManagement() {
    await refreshMessagingStatus();
    await loadTicketsForMessaging();
}

// Refresh messaging service status (WhatsApp Direct Links)
async function refreshMessagingStatus() {
    const statusDiv = document.getElementById('messaging-status-info');
    if (!statusDiv) return;

    try {
        const status = await checkMessagingStatus();
        if (status && status.success) {
            const statusClass = status.data?.isReady ? 'status-ready' : 'status-not-ready';
            const statusIcon = status.data?.isReady ? 'fas fa-check-circle' : 'fas fa-times-circle';
            const statusText = 'WhatsApp Link-uri directe activ';
            
            statusDiv.innerHTML = `
                <div class="status-info status-ready">
                    <i class="fas fa-check-circle"></i>
                    <span>${statusText}</span>
                </div>
                <div class="status-details">
                    <p><strong>Serviciu:</strong> WhatsApp Direct Links</p>
                    <p><strong>Metodă:</strong> Link-uri WhatsApp pre-completate</p>
                    <div class="services-status">
                        <p><strong>Servicii disponibile:</strong></p>
                        <ul>
                            <li><i class="fas fa-link text-success"></i> WhatsApp Link: Activ</li>
                            <li><i class="fas fa-mobile-alt text-success"></i> WhatsApp Web: Disponibil</li>
                        </ul>
                    </div>
                    <div class="api-actions">
                        <button onclick="testInfobipAPI()" class="btn btn-primary btn-sm">
                            <i class="fas fa-test-tube"></i> Testează WhatsApp
                        </button>
                    </div>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="status-info status-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Eroare la verificarea statusului WhatsApp</span>
                </div>
                <div class="status-details">
                    <p><strong>Fallback disponibil:</strong> WhatsApp Link-uri manuale</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error refreshing messaging status:', error);
        statusDiv.innerHTML = `
            <div class="status-info status-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Eroare la verificarea statusului serviciilor de mesagerie</span>
            </div>
        `;
    }
}

// Load tickets for messaging service management
async function loadTicketsForMessaging() {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load tickets');
        }

        // Populate ticket selects
        populateTicketSelects(data.tickets);
    } catch (error) {
        console.error('Error loading tickets for messaging service:', error);
    }
}

// Populate ticket select elements
function populateTicketSelects(tickets) {
    const selects = ['ticket-select', 'schedule-ticket'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Clear existing options except first
        select.innerHTML = '<option value="">Alege un bilet...</option>';
        
        tickets.forEach(ticket => {
            const option = document.createElement('option');
            option.value = ticket._id || ticket.id;
            option.textContent = `${ticket.nume} - ${ticket.tip_bilet} (${ticket.telefon})`;
            select.appendChild(option);
        });
    });
    
    // Populate bulk tickets select
    const bulkSelect = document.getElementById('bulk-tickets');
    if (bulkSelect) {
        bulkSelect.innerHTML = '<option value="">Alege biletele...</option>';
        tickets.forEach(ticket => {
            const option = document.createElement('option');
            option.value = ticket._id || ticket.id;
            option.textContent = `${ticket.nume} - ${ticket.tip_bilet} (${ticket.telefon})`;
            bulkSelect.appendChild(option);
        });
    }
}

// Show send ticket modal
function showSendTicketModal() {
    const modal = document.getElementById('send-ticket-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close send ticket modal
function closeSendTicketModal() {
    const modal = document.getElementById('send-ticket-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('send-ticket-form').reset();
    }
}


// Show schedule modal
function showScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close schedule modal
function closeScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('schedule-form').reset();
    }
}

// Show scheduled messages
async function showScheduledMessages() {
    const modal = document.getElementById('scheduled-messages-modal');
    if (modal) {
        modal.style.display = 'block';
        
        const listDiv = document.getElementById('scheduled-messages-list');
        listDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Se încarcă mesajele programate...</span></div>';
        
        try {
            const scheduledMessages = await getScheduledMessages();
            
            if (scheduledMessages.length === 0) {
                listDiv.innerHTML = '<p>Nu există mesaje programate.</p>';
            } else {
                listDiv.innerHTML = scheduledMessages.map(msg => `
                    <div class="scheduled-message-item">
                        <div class="message-info">
                            <h4>${msg.ticketData.nume}</h4>
                            <p><strong>Telefon:</strong> ${msg.phoneNumber}</p>
                            <p><strong>Programat pentru:</strong> ${msg.sendTime}</p>
                            <p><strong>Status:</strong> ${msg.status}</p>
                        </div>
                        <div class="message-actions">
                            <button class="btn btn-danger btn-sm" onclick="cancelScheduledMessage('${msg.jobId}')">
                                <i class="fas fa-times"></i> Anulează
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            listDiv.innerHTML = '<p>Eroare la încărcarea mesajelor programate.</p>';
        }
    }
}

// Close scheduled messages modal
function closeScheduledMessagesModal() {
    const modal = document.getElementById('scheduled-messages-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Event listeners for bot management
document.addEventListener('DOMContentLoaded', function() {
    // Send ticket form
    const sendTicketForm = document.getElementById('send-ticket-form');
    if (sendTicketForm) {
        sendTicketForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const ticketId = document.getElementById('ticket-select').value;
            const phoneNumber = document.getElementById('phone-number').value;
            const includeCustomImage = document.getElementById('include-custom-image').checked;
            
            if (!ticketId || !phoneNumber) {
                showError('Te rugăm să completezi toate câmpurile.');
                return;
            }
            
            try {
                await sendTicketViaMessaging(ticketId, phoneNumber, null);
                closeSendTicketModal();
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    
    // Schedule form
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const ticketId = document.getElementById('schedule-ticket').value;
            const phoneNumber = document.getElementById('schedule-phone').value;
            // Email removed - using WhatsApp only
            const sendTime = document.getElementById('schedule-datetime').value;
            
            if (!ticketId || !phoneNumber || !sendTime) {
                showError('Te rugăm să completezi toate câmpurile obligatorii.');
                return;
            }
            
            // Convert to proper format
            const date = new Date(sendTime);
            const formattedTime = date.toISOString().replace('T', ' ').substring(0, 19);
            
            try {
                await scheduleTicketSending(ticketId, phoneNumber, formattedTime, null);
                closeScheduleModal();
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    // Modal close handlers are now handled by the single window.onclick handler above
});

// Ticket Preview Functionality for verificare.html
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the verification page and if there's a ticket ID in the URL
    if (window.location.pathname.includes('verificare.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketId = urlParams.get('id');
        
        if (ticketId) {
            // Show ticket preview section and hide verification section
            const ticketPreviewSection = document.getElementById('ticket-preview-section');
            const verificationSection = document.getElementById('verification-section');
            
            if (ticketPreviewSection && verificationSection) {
                ticketPreviewSection.style.display = 'block';
                verificationSection.style.display = 'none';
                
                // Load ticket data and preview
                loadTicketPreview(ticketId);
            }
        }
    }
});

// Load ticket preview data and image
async function loadTicketPreview(ticketId) {
    try {
        // Show loading state
        const loadingDiv = document.getElementById('ticket-loading');
        const previewImg = document.getElementById('ticket-preview-img');
        
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (previewImg) previewImg.style.display = 'none';
        
        // Fetch ticket data
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/public`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load ticket data');
        }
        
        const ticket = data.ticket;
        
        // Update ticket details
        document.getElementById('ticket-name').textContent = ticket.nume;
        document.getElementById('ticket-phone').textContent = ticket.telefon;
        document.getElementById('ticket-type').textContent = ticket.tip_bilet;
        
        // Update status
        const statusElement = document.getElementById('ticket-status');
        if (ticket.verified) {
            statusElement.textContent = '✅ Verificat';
            statusElement.className = 'status-badge status-verified';
        } else {
            statusElement.textContent = '⏳ Ne verificat';
            statusElement.className = 'status-badge status-pending';
        }
        
        // Generate and show ticket preview image
        if (ticket.tip_bilet === 'BAL') {
            // For BAL tickets, use the custom ticket generation
            const ticketImageUrl = `${API_BASE_URL}/tickets/${ticketId}/custom-bal-public`;
            if (previewImg) {
                previewImg.src = ticketImageUrl;
                previewImg.onload = function() {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    previewImg.style.display = 'block';
                };
                previewImg.onerror = function() {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    showError('Eroare la generarea preview-ului biletului');
                };
            }
            
            // Show download button
            const downloadBtn = document.getElementById('download-ticket');
            if (downloadBtn) {
                downloadBtn.style.display = 'inline-block';
                downloadBtn.onclick = () => {
                    window.open(ticketImageUrl, '_blank');
                };
            }
        } else if (ticket.tip_bilet === 'AFTER') {
            // For AFTER tickets, use the custom ticket generation
            const ticketImageUrl = `${API_BASE_URL}/tickets/${ticketId}/custom-public`;
            if (previewImg) {
                previewImg.src = ticketImageUrl;
                previewImg.onload = function() {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    previewImg.style.display = 'block';
                };
                previewImg.onerror = function() {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    showError('Eroare la generarea preview-ului biletului AFTER');
                };
            }
            
            // Show download button
            const downloadBtn = document.getElementById('download-ticket');
            if (downloadBtn) {
                downloadBtn.style.display = 'inline-block';
                downloadBtn.onclick = () => {
                    window.open(ticketImageUrl, '_blank');
                };
            }
        } else {
            // For other ticket types, show a message
            if (loadingDiv) {
                loadingDiv.innerHTML = `
                    <i class="fas fa-info-circle" style="font-size: 2rem; color: #17a2b8; margin-bottom: 1rem;"></i>
                    <p>Preview personalizat disponibil doar pentru biletele BAL și AFTER</p>
                    <p>Tip bilet: ${ticket.tip_bilet}</p>
                `;
            }
        }
        
        // Show verify button
        const verifyBtn = document.getElementById('verify-ticket');
        if (verifyBtn) {
            verifyBtn.style.display = 'inline-block';
            verifyBtn.onclick = () => {
                // Redirect to verification without ID to use scanner
                window.location.href = 'verificare.html';
            };
        }
        
    } catch (error) {
        console.error('Error loading ticket preview:', error);
        showError('Eroare la încărcarea biletului: ' + error.message);
        
        // Hide loading and show error
        const loadingDiv = document.getElementById('ticket-loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <p>Eroare la încărcarea biletului</p>
                <p>${error.message}</p>
            `;
        }
    }
}
