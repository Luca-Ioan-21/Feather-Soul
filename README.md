# Jurnal de Scris - Aplicație de Organizare a Poveștilor

O aplicație web modernă pentru scriitori, care permite organizarea poveștilor, personajelor, locațiilor, cronologiei și elementelor de lore.

## 📋 Caracteristici Principale

### 🔐 Sistem de Autentificare
- **Login/Register**: Creare cont și autentificare securizată
- **Persistență sesiune**: Rămâi logat până la delogare explicită
- **Panou de administrare**: Gestionarea utilizatorilor și adminilor
- **Protecție admin**: Întotdeauna minim un admin activ

### 📚 Gestionare Cărți
- Creează și gestionează multiple cărți
- Fiecare utilizator are propriile cărți (date separate)
- Organizare pe capitole și subcapitole
- Scriere și editare conținut

### 👥 Personaje
- Adaugă și gestionează personaje
- Caracteristici generale (text liber)
- Caracteristici structurate (Fizic, Psihic, Emoțional, Puteri)
- Asociere elemente de Lore la personaje

### 📍 Locații
- Creează locații pentru povestea ta
- Descrieri detaliate
- Organizare ierarhică

### ⏰ Cronologie
- Evenimente cronologice
- Organizare pe perioade/epoci
- Descrieri detaliate

### 🔮 Lore (Obiecte, Vrăji, Blestemuri)
- Elemente generale pentru lumea poveștii
- Elemente specifice per personaj
- Categorii: Obiecte, Vrăji, Blestemuri, Artefacte, etc.

### 📝 Notițe Rapide
- Scratchpad pentru idei rapide
- Bullet points automate
- Salvare automată

### 🎨 Teme
- Mod întunecat/luminos
- Teme personalizate (Clasic, Neon, Sunset, Ocean, Forest, Lavender)

## 🚀 Instalare și Rulare

### Cerințe Preliminare
- Node.js 18+ instalat
- npm sau yarn

### Pași de Instalare

1. **Clonează repository-ul** (sau descarcă ZIP-ul)
\`\`\`bash
git clone <repository-url>
cd jurnal-de-scris
\`\`\`

2. **Instalează dependențele**
\`\`\`bash
npm install
# sau
yarn install
\`\`\`

3. **Rulează aplicația în modul development**
\`\`\`bash
npm run dev
# sau
yarn dev
\`\`\`

4. **Deschide browser-ul**
\`\`\`
http://localhost:3000
\`\`\`

### Build pentru Producție

\`\`\`bash
# Build
npm run build
# sau
yarn build

# Start server producție
npm start
# sau
yarn start
\`\`\`

## 👤 Cont Admin Predefinit

Pentru a accesa panoul de administrare, folosește:

- **Email**: `admin@journalscris.ro`
- **Parolă**: `Admin123!`

## 📖 Ghid de Utilizare

### 1. Autentificare

#### Creare Cont Nou
1. Accesează pagina de login
2. Click pe tab-ul "Cont Nou"
3. Introdu email și parolă (minim 6 caractere)
4. Confirmă parola
5. Click "Creează Cont"

#### Login
1. Introdu email și parola
2. Click "Autentificare"
3. Vei fi redirecționat la pagina principală

### 2. Gestionare Cărți

#### Creare Carte Nouă
1. Click pe butonul "+ Carte" din sidebar
2. Introdu titlul cărții
3. Carte va apărea în lista din sidebar

#### Adăugare Capitole
1. Selectează cartea din sidebar
2. Click pe butonul "+" lângă carte
3. Introdu titlul capitolului
4. Capitolul va apărea sub carte

#### Scriere Conținut
1. Selectează un capitol
2. Scrie în editorul principal
3. Conținutul se salvează automat

### 3. Referințe pentru Carte

Click pe butonul "Referințe" lângă titlul cărții pentru a accesa:

#### Tab Personaje
- Adaugă personaje noi
- Editează nume și descriere
- Adaugă caracteristici generale (text liber)
- Adaugă caracteristici structurate (Fizic, Psihic, Emoțional, Puteri)

#### Tab Caracteristici
- Selectează un personaj
- Adaugă caracteristici în categorii
- Text liber pentru notițe generale
- Caracteristici sortate pe categorii

#### Tab Locații
- Adaugă locații pentru povestea ta
- Descrieri detaliate
- Organizare cu drag & drop

#### Tab Cronologie
- Adaugă evenimente cronologice
- Specifică perioada/epoca
- Descrieri detaliate

#### Tab Lore
- Selectează "General" pentru elemente ale lumii
- SAU selectează un personaj pentru obiecte specifice
- Adaugă obiecte, vrăji, blestemuri, etc.
- Fiecare personaj are propria listă de elemente

### 4. Notițe Rapide

- Click pe iconița de notițe din toolbar
- Scrie idei rapide
- Bullet points automate (• la fiecare rând nou)
- Salvare automată

### 5. Panou de Administrare (doar Admin)

#### Acces
1. Login cu cont de admin
2. Click "Panou Admin" din header

#### Funcționalități
- **Vizualizare utilizatori**: Vezi toți utilizatorii înregistrați
- **Promovare/Retrogradare**: Schimbă rolul utilizatorilor (Admin/Utilizator)
- **Ștergere utilizatori**: Șterge utilizatori (nu poți șterge ultimul admin)
- **Statistici**: Vezi numărul total de utilizatori și admini

#### Protecții
- Nu poți retrograda ultimul admin
- Nu poți șterge ultimul admin
- Nu poți modifica propriul cont (pentru siguranță)

### 6. Delogare

- Click pe butonul "Delogare" din header
- Vei fi redirecționat la pagina de login
- Datele tale sunt salvate și vor fi disponibile la următoarea autentificare

## 💾 Stocare Date

### Stocare Locală (localStorage)
Aplicația folosește localStorage pentru a stoca:
- **Utilizatori**: `users` - lista tuturor utilizatorilor
- **Sesiune curentă**: `currentUser` - sesiunea utilizatorului logat
- **Date utilizator**: `userData_{userId}` - cărți, personaje, locații, etc. pentru fiecare utilizator

### Separare Date per Utilizator
- Fiecare utilizator are propriile date complet separate
- Nu există interferențe între utilizatori
- Datele sunt salvate automat la fiecare modificare

### Backup Date
Pentru a face backup la datele tale:
1. Deschide Developer Tools (F12)
2. Mergi la tab-ul "Application" sau "Storage"
3. Selectează "Local Storage"
4. Copiază valorile pentru backup

## 🔒 Securitate

### Hash Parole
- Parolele sunt hash-ate înainte de stocare
- Nu se stochează parole în text clar

### Protecție Rute
- Rutele protejate redirecționează la login dacă nu ești autentificat
- Panoul de admin este accesibil doar pentru admini

### Validări
- Email valid obligatoriu
- Parolă minim 6 caractere
- Confirmare parolă la înregistrare

## 🛠️ Tehnologii Utilizate

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS v4
- **Componente**: shadcn/ui
- **Icoane**: Lucide React
- **Editor**: Textarea cu funcționalități custom
- **Stocare**: localStorage (browser)

## 📁 Structura Proiectului

\`\`\`
jurnal-de-scris/
├── app/
│   ├── login/
│   │   └── page.tsx              # Pagina de login/register
│   ├── decrypted/
│   │   ├── page.tsx              # Pagina principală (protejată)
│   │   ├── components/           # Componente React
│   │   │   ├── admin-panel.tsx   # Panou de administrare
│   │   │   ├── book-references-dialog.tsx
│   │   │   ├── character-editor.tsx
│   │   │   ├── lore-editor.tsx
│   │   │   └── ...
│   │   ├── lib/                  # Funcții utilitare
│   │   │   ├── auth.ts           # Autentificare
│   │   │   └── storage.ts        # Stocare date
│   │   └── types/                # TypeScript interfaces
│   │       ├── auth.ts           # Tipuri autentificare
│   │       └── book.ts           # Tipuri cărți
│   └── globals.css               # Stiluri globale
├── public/                       # Fișiere statice
├── README.md                     # Documentație
└── package.json                  # Dependențe
\`\`\`

## 🐛 Troubleshooting

### Problema: Nu pot face login
- Verifică că email-ul și parola sunt corecte
- Verifică că ai creat cont mai întâi
- Încearcă să ștergi localStorage și să creezi un cont nou

### Problema: Datele nu se salvează
- Verifică că browser-ul permite localStorage
- Verifică că nu ești în modul incognito
- Verifică consola pentru erori

### Problema: Nu văd panoul de admin
- Verifică că ești logat cu un cont de admin
- Contul predefinit: `admin@journalscris.ro` / `Admin123!`

### Problema: Am uitat parola
- Momentan nu există funcție de recuperare parolă
- Poți șterge localStorage și crea un cont nou
- SAU poți edita manual localStorage pentru a reseta parola

## 📝 Notițe Dezvoltare

### Adăugare Funcționalități Viitoare
- [ ] Recuperare parolă prin email
- [ ] Export/Import date (JSON, PDF)
- [ ] Colaborare multiplayer
- [ ] Sincronizare cloud (Firebase, Supabase)
- [ ] Versioning pentru capitole
- [ ] Statistici scriere (cuvinte, caractere, timp)
- [ ] Teme personalizate avansate
- [ ] Notificări și reminder-e

### Migrare la Bază de Date
Pentru a migra de la localStorage la o bază de date:
1. Alege un provider (Supabase, Firebase, PostgreSQL)
2. Creează schema de bază de date
3. Modifică funcțiile din `lib/auth.ts` și `lib/storage.ts`
4. Implementează API routes pentru operațiuni CRUD
5. Testează migrarea datelor existente

## 📄 Licență

Acest proiect este open-source și disponibil sub licența MIT.

## 🤝 Contribuții

Contribuțiile sunt binevenite! Pentru a contribui:
1. Fork repository-ul
2. Creează un branch pentru feature-ul tău
3. Commit modificările
4. Push la branch
5. Deschide un Pull Request

## 📧 Contact

Pentru întrebări sau sugestii, deschide un issue pe GitHub.

---

**Dezvoltat cu ❤️ pentru scriitori**
