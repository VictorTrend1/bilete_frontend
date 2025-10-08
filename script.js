// API Configuration
const API_BASE_URL = 'https://bilete-backend.onrender.com/api';

// Messaging Service Configuration
let messagingStatus = null;

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
    
    if (isLoggedIn()) {
        // Show authenticated navigation
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (bileteLink) bileteLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // Hide login/register links
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
    } else {
        // Show non-authenticated navigation
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (bileteLink) bileteLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
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
        const token = getToken();
        
        // First, get ticket details to check if it's a BAL ticket
        const ticketResponse = await fetch(`${API_BASE_URL}/tickets/${id}/qr`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ticketData = await ticketResponse.json();
        
        if (!ticketResponse.ok) {
            throw new Error(ticketData.error || 'Nu am putut descărca QR-ul');
        }
        
        // Check if it's a BAL ticket for custom generation
        if (ticketData.ticket && ticketData.ticket.tip_bilet === 'BAL') {
            // Use custom BAL ticket generation
            const customResponse = await fetch(`${API_BASE_URL}/tickets/${id}/custom-bal`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!customResponse.ok) {
                const errorData = await customResponse.json();
                throw new Error(errorData.error || 'Nu am putut genera biletul personalizat');
            }
            
            // Download the custom ticket as blob
            const blob = await customResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bilet-${ticketData.ticket.nume}-${id}.png`;
            link.click();
            window.URL.revokeObjectURL(url);
        } else {
            // Use regular QR code download for non-BAL tickets
            downloadDataUrl(ticketData.qr_code, `bilet-${id}.png`);
        }
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
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
        // Local format: 0712345678 -> +40712345678
        return '+40' + cleaned.substring(1);
    } else if (cleaned.startsWith('40')) {
        // National format: 40712345678 -> +40712345678
        return '+' + cleaned;
    } else if (cleaned.startsWith('+40')) {
        // Already formatted
        return cleaned;
    } else if (cleaned.length === 9) {
        // Assume local format without 0
        return '+40' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
        // Local format with 0
        return '+40' + cleaned.substring(1);
    }
    
    return phoneNumber; // Return original if can't format
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

// Check messaging service status
async function checkMessagingStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/bot/status`);
        const data = await response.json();
        console.log('Messaging service status response:', data);
        messagingStatus = data;
        return data;
    } catch (error) {
        console.error('Error checking messaging service status:', error);
        return null;
    }
}

// Debug messaging service status
async function debugMessagingStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/bot/debug`);
        const data = await response.json();
        console.log('Messaging service debug response:', data);
        return data;
    } catch (error) {
        console.error('Error checking messaging service debug:', error);
        return null;
    }
}

// Start WhatsApp automation
async function startWhatsAppAutomation() {
    try {
        console.log('Starting WhatsApp automation...');
        
        const response = await fetch(`${API_BASE_URL}/bot/start-automation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            let message = '✅ ' + data.message + '\n\n';
            message += '📱 Instrucțiuni:\n';
            message += '1. ' + data.instructions.step1 + '\n';
            message += '2. ' + data.instructions.step2 + '\n';
            message += '3. ' + data.instructions.step3 + '\n';
            message += '4. ' + data.instructions.step4 + '\n';
            message += '5. ' + data.instructions.step5 + '\n\n';
            message += '⚠️ ' + data.instructions.note;
            
            alert(message);
            
            // Refresh status after a few seconds
            setTimeout(() => {
                refreshMessagingStatus();
            }, 5000);
        } else {
            alert('❌ ' + (data.error || 'Failed to start automation') + '\n\n' + (data.fallback || 'System will continue using manual WhatsApp links'));
        }
    } catch (error) {
        console.error('Error starting automation:', error);
        alert('⚠️ Automation nu poate fi pornit pe acest server.\n\nMotiv: ' + error.message + '\n\n✅ Sistemul va continua să folosească link-uri WhatsApp manuale, care funcționează perfect!');
    }
}

// Get messaging service configuration
async function getMessagingConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/bot/config`);
        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            console.log('Messaging config not available:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error getting messaging config:', error);
        return null;
    }
}

// Show messaging service configuration in the interface
async function showMessagingConfig() {
    const configDisplay = document.getElementById('messaging-config-display');
    const configInfo = document.getElementById('messaging-config-info');
    
    if (!configDisplay || !configInfo) return;
    
    try {
        const config = await getMessagingConfig();
        
        if (config) {
            const services = config.services || {};
            const configStatus = config.config || {};
            
            configInfo.innerHTML = `
                <div class="config-services">
                    <h4>Servicii Disponibile:</h4>
                    <div class="service-status">
                        <span class="service-item ${services.automation ? 'available' : 'unavailable'}">
                            <i class="fas fa-robot"></i> WhatsApp Automation: ${services.automation ? 'Activ' : 'Neactiv'}
                        </span>
                        <span class="service-item available">
                            <i class="fab fa-whatsapp"></i> WhatsApp Link: Disponibil
                        </span>
                    </div>
                </div>
                <div class="config-details">
                    <h4>Detalii Configurare:</h4>
                    <p><strong>WhatsApp:</strong> ${configStatus.whatsappConfigured ? 'Configurat' : 'Neconfigurat'}</p>
                    <p><strong>Automation:</strong> ${configStatus.automationReady ? 'Activ' : 'Neactiv'}</p>
                    <p><strong>Login Status:</strong> ${configStatus.loggedIn ? 'Conectat' : 'Neconectat'}</p>
                </div>
            `;
            configDisplay.style.display = 'block';
        } else {
            configDisplay.style.display = 'none';
        }
    } catch (error) {
        console.error('Error showing messaging config:', error);
        configDisplay.style.display = 'none';
    }
}


// Send ticket via messaging service
async function sendTicketViaMessaging(ticketId, phoneNumber, email = null, customImagePath = null) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        console.log('Sending ticket via messaging service:', { ticketId, phoneNumber, email, customImagePath });

        const response = await fetch(`${API_BASE_URL}/bot/send-ticket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketId, phoneNumber, email, customImagePath }),
        });

        console.log('Messaging service send response status:', response.status);
        const data = await response.json();
        console.log('Messaging service send response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send ticket via messaging service');
        }

        // Show result based on method used
        if (data.result && data.result.results && data.result.results.length > 0) {
            const result = data.result.results[0];
            
            if (result.method === 'WhatsApp_Automation') {
                showSuccess('✅ Bilet trimis automat prin WhatsApp!');
            } else if (result.method === 'WhatsApp_Web_Link' && result.link) {
                const message = `Bilet pregătit pentru WhatsApp!\n\nClick pe link-ul de mai jos pentru a trimite biletul:\n\n${result.link}`;
                showSuccess(message);
                
                // Optionally open the WhatsApp link automatically
                if (confirm('Vrei să deschizi WhatsApp Web automat?')) {
                    window.open(result.link, '_blank');
                }
            } else {
                showSuccess('Bilet pregătit pentru trimitere prin WhatsApp!');
            }
        } else {
            showSuccess('Bilet pregătit pentru trimitere prin WhatsApp!');
        }
        
        return data;
    } catch (error) {
        console.error('Error sending ticket via messaging service:', error);
        showError(error.message);
    }
}

// Send bulk tickets via messaging service
async function sendBulkTicketsViaMessaging(ticketIds, phoneNumbers, emails = null, customImagePaths = null) {
    try {
        const token = getToken();
        if (!token) {
            showError('Nu ești autentificat. Te rugăm să te conectezi din nou.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/bot/send-bulk-tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketIds, phoneNumbers, emails, customImagePaths }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send bulk tickets via messaging service');
        }

        showSuccess(`Bilete în masă procesate cu succes! Verifică rezultatele pentru detalii.`);
        return data;
    } catch (error) {
        console.error('Error sending bulk tickets via messaging service:', error);
        showError(error.message);
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

// Enhanced ticket sending with bot integration
async function sendTicketViaBotEnhanced(el) {
    try {
        const ticket = JSON.parse(el.getAttribute('data-ticket').replace(/&apos;/g, "'"));
        let phoneNumber = ticket.telefon.replace(/\D/g, ''); // Remove non-digits
        
        // Format Romanian phone number
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '+40' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+40')) {
            phoneNumber = '+40' + phoneNumber;
        }
        
        // Check bot status first
        const botStatus = await checkBotStatus();
        if (!botStatus || !botStatus.ready) {
            showError('Bot-ul WhatsApp nu este inițializat. Te rugăm să scanezi codul QR mai întâi.');
            return;
        }
        
        // Check if it's a BAL ticket for custom image generation
        if (ticket.tip_bilet === 'BAL') {
            try {
                // Generate custom BAL ticket
                const customResponse = await fetch(`${API_BASE_URL}/tickets/${ticket._id || ticket.id}/custom-bal-public`);
                
                if (customResponse.ok) {
                    const blob = await customResponse.blob();
                    const imageUrl = window.URL.createObjectURL(blob);
                    
                    // Send via bot with custom image
                    await sendTicketViaBot(ticket._id || ticket.id, phoneNumber, imageUrl);
                    
                    // Clean up
                    setTimeout(() => {
                        window.URL.revokeObjectURL(imageUrl);
                    }, 30000);
                    
                    return;
                }
            } catch (error) {
                console.error('Failed to generate custom BAL ticket:', error);
                // Fall through to regular sending
            }
        }
        
        // Regular ticket sending via bot
        await sendTicketViaBot(ticket._id || ticket.id, phoneNumber);
        
    } catch (error) {
        console.error('Failed to send ticket via bot:', error);
        showError('Eroare la trimiterea biletului prin WhatsApp: ' + error.message);
    }
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
                <button class="btn btn-success" data-ticket='${JSON.stringify(ticket).replace(/'/g, "&apos;")}' onclick="sendTicketViaBotEnhanced(this)">
                    <i class="fab fa-whatsapp"></i> Trimite prin WhatsApp
                </button>
                <button class="btn btn-danger" data-id="${ticket._id || ticket.id}" onclick="deleteTicket(this)">
                    <i class="fas fa-trash"></i> Șterge
                </button>
            </td>
        </tr>
    `).join('');
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
        
        // Check if it's a BAL ticket for custom image generation
        if (ticket.tip_bilet === 'BAL') {
            try {
                console.log('Generating custom BAL ticket for:', ticket);
                // Use public endpoint for sharing (no auth required)
                const customResponse = await fetch(`${API_BASE_URL}/tickets/${ticket._id || ticket.id}/custom-bal-public`);
                
                console.log('Custom BAL response status:', customResponse.status);
                
                if (customResponse.ok) {
                    // Get the custom ticket image as blob
                    const blob = await customResponse.blob();
                    console.log('BAL ticket blob size:', blob.size, 'type:', blob.type);
                    
                    const imageUrl = window.URL.createObjectURL(blob);
                    console.log('Created image URL:', imageUrl);
                    
                    // Create a temporary link to download the image
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `bilet-${ticket.nume}-${ticket._id || ticket.id}.png`;
                    
                    // Show modal with image preview and direct WhatsApp sharing
                    showBALTicketModal(ticket, imageUrl, phoneNumber);
                    
                    // Don't auto-download, just show the modal
                    // Clean up after modal is closed
                    setTimeout(() => {
                        window.URL.revokeObjectURL(imageUrl);
                    }, 30000); // Keep image available longer
                    
                    return;
                } else {
                    const errorText = await customResponse.text();
                    console.error('Custom BAL ticket generation failed:', customResponse.status, errorText);
                }
            } catch (error) {
                console.error('Failed to generate custom BAL ticket:', error);
                // Fall through to regular text message
            }
        }
        
        // Fallback to regular text message for non-BAL tickets or if custom generation fails
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

    // Load messaging service management page
    if (window.location.pathname.includes('bot.html')) {
        loadMessagingManagement();
    }

    // Update navigation based on authentication status
    updateNavigation();
    
    // Redirect to login if not authenticated and trying to access dashboard or bilete
    console.log('Page load - checking authentication for:', window.location.pathname);
    if ((window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('bilete.html')) && !isLoggedIn()) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = 'login.html';
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

// Refresh messaging service status
async function refreshMessagingStatus() {
    const statusDiv = document.getElementById('messaging-status-info');
    if (!statusDiv) return;

    try {
        const status = await checkMessagingStatus();
        if (status) {
            const statusClass = status.ready ? 'status-ready' : 'status-not-ready';
            const statusIcon = status.ready ? 'fas fa-check-circle' : 'fas fa-times-circle';
            const statusText = status.ready ? 'Servicii de mesagerie active' : 'Servicii de mesagerie nu sunt inițializate';
            
            const services = status.status?.services || {};
            const config = status.status?.config || {};
            
            statusDiv.innerHTML = `
                <div class="status-info ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
                <div class="status-details">
                    <p><strong>Mesaje programate:</strong> ${status.status?.scheduledMessages || 0}</p>
                    <div class="services-status">
                        <p><strong>Servicii disponibile:</strong></p>
                        <ul>
                            <li><i class="fas fa-sms ${services.sms ? 'text-success' : 'text-muted'}"></i> SMS: ${services.sms ? 'Configurat' : 'Neconfigurat'}</li>
                            <li><i class="fas fa-envelope ${services.email ? 'text-success' : 'text-muted'}"></i> Email: ${services.email ? 'Configurat' : 'Neconfigurat'}</li>
                            <li><i class="fab fa-whatsapp text-success"></i> WhatsApp Link: Disponibil</li>
                        </ul>
                    </div>
                </div>
            `;
            
            // Show messaging configuration instead of QR code
            await showMessagingConfig();
        } else {
            statusDiv.innerHTML = `
                <div class="status-info status-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Eroare la verificarea statusului serviciilor de mesagerie</span>
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
                await sendTicketViaMessaging(ticketId, phoneNumber, null, includeCustomImage ? 'auto' : null);
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
    
    // Modal close handlers
    const modals = ['send-ticket-modal', 'schedule-modal', 'scheduled-messages-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            window.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
});
