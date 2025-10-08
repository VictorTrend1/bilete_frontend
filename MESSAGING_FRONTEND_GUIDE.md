# Ghid Frontend pentru Servicii de Mesagerie

Acest ghid explică actualizările frontend-ului pentru a funcționa cu noile servicii alternative de mesagerie.

## 🔄 **Schimbări Majore**

### 1. **Actualizare script.js**
- Înlocuit `checkBotStatus()` cu `checkMessagingStatus()`
- Înlocuit `sendTicketViaBot()` cu `sendTicketViaMessaging()`
- Adăugat suport pentru email în toate funcțiile de trimitere
- Actualizat status display pentru servicii multiple

### 2. **Actualizare bot.html**
- Schimbat titlul din "Bot Management" în "Servicii de Mesagerie"
- Înlocuit QR code display cu configurare servicii
- Adăugat câmpuri pentru email în formulare
- Actualizat instrucțiunile pentru servicii multiple

### 3. **Actualizare styles.css**
- Adăugat stiluri pentru status servicii
- Stiluri pentru configurare servicii
- Indicatorii vizuali pentru servicii disponibile/neconfigurate

## 📱 **Funcționalități Noi**

### **Status Servicii**
```javascript
// Verifică statusul tuturor serviciilor
const status = await checkMessagingStatus();
// Returnează: SMS, Email, WhatsApp Link status
```

### **Trimitere cu Email**
```javascript
// Trimite bilet cu email opțional
await sendTicketViaMessaging(ticketId, phoneNumber, email, customImagePath);
```

### **Configurare Servicii**
```javascript
// Afișează configurarea serviciilor
await showMessagingConfig();
// Arată: SMS configurat/neconfigurat, Email configurat/neconfigurat
```

## 🎯 **Interfața Utilizator**

### **Pagina Servicii de Mesagerie (bot.html)**

1. **Status Servicii**
   - Afișează statusul fiecărui serviciu
   - SMS: Configurat/Neconfigurat
   - Email: Configurat/Neconfigurat  
   - WhatsApp Link: Disponibil întotdeauna

2. **Acțiuni Mesagerie**
   - **Trimite Bilet**: Cu câmpuri pentru telefon și email
   - **Programează Trimitere**: Cu email opțional
   - **Mesaje Programate**: Lista mesajelor programate

3. **Formulare Actualizate**
   - Câmp pentru număr de telefon (obligatoriu)
   - Câmp pentru email (opțional)
   - Checkbox pentru imagine personalizată (BAL)

## 🔧 **Configurare Frontend**

### **Variabile de Mediu**
Frontend-ul nu necesită configurare suplimentară - funcționează automat cu backend-ul actualizat.

### **API Endpoints**
Toate endpoint-urile rămân la fel:
- `GET /api/bot/status` - Status servicii
- `GET /api/bot/config` - Configurare servicii  
- `POST /api/bot/send-ticket` - Trimite bilet
- `POST /api/bot/send-bulk-tickets` - Trimite în masă
- `POST /api/bot/schedule-ticket` - Programează trimitere

## 📋 **Utilizare**

### **1. Verificare Status**
```javascript
// Verifică statusul serviciilor
await refreshMessagingStatus();
```

### **2. Trimitere Bilet**
```javascript
// Trimite bilet prin toate metodele disponibile
await sendTicketViaMessaging(ticketId, phoneNumber, email);
```

### **3. Programare Trimitere**
```javascript
// Programează trimitere cu email opțional
await scheduleTicketSending(ticketId, phoneNumber, sendTime, email);
```

## 🎨 **Stiluri CSS**

### **Status Servicii**
```css
.service-item.available {
    background: #d4edda;Disponibil
    color: #155724;
}

.service-item.unavailable {
    background: #f8d7da;
    color: #721c24;
}
```

### **Configurare Servicii**
```css
#messaging-config-display {Disponibil
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
}
```

## 🔄 **Compatibilitate**

### **Backward Compatibility**
- Toate funcțiile vechi funcționează în continuare
- API-urile rămân la fel
- Doar adăugate funcționalități noi

### **Fallback Behavior**
- Dacă SMS nu este configurat → încearcă Email
- Dacă Email nu este configurat → încearcă WhatsApp Link
- WhatsApp Link funcționează întotdeauna

## 🚀 **Deployment**

### **Pași pentru Actualizare**
1. **Backup**: Salvează fișierele existente
2. **Update**: Înlocuiește fișierele cu versiunile noi
3. **Test**: Verifică funcționalitatea
4. **Deploy**: Pornește aplicația

### **Verificare Funcționalitate**
```javascript
// Testează statusul serviciilor
fetch('/api/bot/status')
  .then(response => response.json())
  .then(data => console.log('Status:', data));

// Testează configurarea
fetch('/api/bot/config')
  .then(response => response.json())
  .then(data => console.log('Config:', data));
```

## 🐛 **Troubleshooting**

### **Probleme Comune**

1. **"Servicii nu sunt inițializate"**
   - Verifică că backend-ul rulează
   - Verifică configurarea variabilelor de mediu

2. **"Email nu funcționează"**
   - Verifică configurarea EMAIL_USER și EMAIL_PASS
   - Verifică că Gmail App Password este configurat

3. **"SMS nu funcționează"**
   - Verifică configurarea Twilio
   - Verifică creditul Twilio

### **Debug Mode**
```javascript
// Activează debug mode
await debugMessagingStatus();
```

## 📞 **Suport**

Pentru probleme sau întrebări:
1. Verifică logurile browser-ului (F12)
2. Verifică statusul serviciilor
3. Testează fiecare serviciu individual
4. Consulta documentația backend-ului
