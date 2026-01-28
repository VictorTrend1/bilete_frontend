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
├── ghid-verificare-bilete.html # Ghid printabil (salvare PDF) pentru verificare
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

### ghid-verificare-bilete.html
Ghid “gata de print” despre cum se verifică biletele folosind `verificare.html`.

**Cum îl transformi în PDF:**
- Deschide `ghid-verificare-bilete.html` în browser
- Apasă `Ctrl + P` → Destination: **Save as PDF**

**Imagini (pentru ghid):**
- Ghidul include o imagine tip “mock screenshot” în `guide_assets/phone-steps.svg`
- Poți înlocui ușor cu capturi reale (PNG/JPG) păstrând același path în HTML

**Assets suplimentare (tabletă/telefon):**
- `guide_assets/tablet-layout-overview.svg` (overview pentru tabletă)
- `guide_assets/phone-verify-by-phone.svg` (verificare prin telefon + selecție bilete multiple)
- `guide_assets/phone-manual-qr-and-flagged.svg` (manual QR + “bilet suspect”)

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
