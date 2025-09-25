# Frontend - Site Bilete

Frontend pentru sistemul de gestionare a biletelor.

## Structura Fișierelor

```
frontend/
├── index.html          # Pagina principală
├── login.html          # Pagina de conectare
├── register.html       # Pagina de înregistrare
├── dashboard.html      # Dashboard utilizator
├── verificare.html     # Pagina de verificare bilete
├── styles.css          # Stiluri CSS
├── script.js           # JavaScript principal
└── README.md           # Acest fișier
```

## Pagini

### index.html
Pagina principală cu:
- Prezentare generală a sistemului
- Link-uri către înregistrare și conectare
- Caracteristici ale aplicației

### login.html
Pagina de conectare cu:
- Formular pentru username/email și parolă
- Link către înregistrare
- Gestionare erori

### register.html
Pagina de înregistrare cu:
- Formular pentru username, email, parolă și confirmare parolă
- Link către conectare
- Gestionare erori

### dashboard.html
Dashboard-ul utilizatorului cu:
- Formular pentru crearea de bilete noi
- Lista biletelor existente
- Modal pentru afișarea QR code-ului
- Opțiune de descărcare QR code

### verificare.html
Pagina de verificare pentru organizatori cu:
- Scanner QR code live
- Opțiune de introducere manuală a datelor
- Afișare rezultate verificare

## Funcționalități JavaScript

### Autentificare
- `register()` - Înregistrare utilizator nou
- `login()` - Conectare utilizator
- `logout()` - Deconectare
- `isLoggedIn()` - Verificare status autentificare

### Bilete
- `createTicket()` - Creare bilet nou
- `loadTickets()` - Încărcare bilete utilizator
- `displayTickets()` - Afișare bilete în dashboard
- `showQRModal()` - Afișare modal cu QR code

### Verificare
- `verifyTicket()` - Verificare bilet prin API
- `showVerificationResult()` - Afișare rezultate verificare
- `startScanner()` - Pornire scanner QR code
- `stopScanner()` - Oprire scanner QR code

### Utilitare
- `showError()` - Afișare mesaje de eroare
- `showSuccess()` - Afișare mesaje de succes
- `getToken()` / `setToken()` - Gestionare token JWT
- `getUser()` / `setUser()` - Gestionare date utilizator

## Stiluri CSS

### Design Modern
- Gradient background
- Card-uri cu shadow și border-radius
- Hover effects și transitions
- Design responsive pentru mobile

### Componente
- **Navbar**: Navigare cu logo și meniu
- **Hero Section**: Secțiune principală cu CTA buttons
- **Feature Cards**: Card-uri pentru caracteristici
- **Auth Forms**: Formulare pentru autentificare
- **Dashboard**: Layout cu formular și listă bilete
- **Modal**: Modal pentru afișare QR code
- **Scanner**: Container pentru scanner QR code
- **Verification Result**: Afișare rezultate verificare

### Responsive Design
- Breakpoints pentru tablet (768px) și mobile (480px)
- Grid layout adaptiv
- Navigation stack pe mobile
- Formulare optimizate pentru touch

## Dependențe Externe

- **Font Awesome 6.0.0**: Iconițe
- **QuaggaJS 0.12.1**: Scanner QR code

## Configurare

Asigurați-vă că backend-ul rulează pe `http://localhost:3001` sau modificați `API_BASE_URL` în `script.js`.

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers cu suport pentru camera

## Caracteristici Mobile

- Touch-friendly interface
- Camera access pentru scanner
- Responsive forms
- Optimized navigation
