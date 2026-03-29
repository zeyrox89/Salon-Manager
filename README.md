# Salon Manager 💇

Gestionale web per parrucchieri — prenotazioni, clienti, statistiche.
Costruito con HTML/JS puro + Supabase come database.

---

## 📁 Struttura

```
salon-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js       ← inserisci qui le tue credenziali Supabase
│   └── app.js
└── supabase_schema.sql ← esegui questo su Supabase per creare le tabelle
```

---

## 🚀 Deploy in 4 passi

### 1. Crea il database Supabase (gratis)

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito
2. Crea un nuovo progetto (scegli un nome e una password sicura)
3. Aspetta ~2 minuti che il progetto si avvii
4. Vai su **SQL Editor** → incolla tutto il contenuto di `supabase_schema.sql` → clicca **Run**
5. Vai su **Project Settings → API** e copia:
   - **Project URL** (es. `https://abcdefgh.supabase.co`)
   - **anon public key** (stringa lunga)

### 2. Configura le credenziali

Apri `js/config.js` e sostituisci:

```js
const SUPABASE_URL = 'https://TUO-PROGETTO.supabase.co';  // ← il tuo URL
const SUPABASE_ANON_KEY = 'LA-TUA-ANON-KEY';               // ← la tua chiave
```

### 3. Pubblica su Netlify (gratis)

**Opzione A — Drag & Drop (più semplice):**
1. Vai su [netlify.com](https://netlify.com) e crea un account gratuito
2. Dalla dashboard, trascina l'intera cartella `salon-app/` nel browser
3. Netlify pubblica automaticamente → ottieni un URL tipo `https://nome-random.netlify.app`

**Opzione B — Da GitHub (consigliato per aggiornamenti):**
1. Carica la cartella su un repo GitHub
2. Su Netlify: **Add new site → Import from Git**
3. Seleziona il repo, lascia le impostazioni di default → Deploy

### 4. Accedi all'app

Apri l'URL fornito da Netlify. L'app è subito pronta!

---

## 💡 Come usarla

- **Dashboard**: panoramica del giorno e degli appuntamenti imminenti
- **Prenotazioni**: calendario mensile, clicca un giorno per vedere/aggiungere appuntamenti
- **Clienti**: anagrafica completa con storico spesa
- **Servizi**: elenco dei servizi (modificabili da Supabase SQL Editor)
- **Statistiche**: incasso mensile, grafici servizi e trend

---

## 🔐 Sicurezza (per produzione)

Il progetto usa la chiave `anon` di Supabase con RLS permissiva.
Per uso su più saloni o con dati sensibili reali, aggiungere:
- Autenticazione Supabase (email/password)
- RLS policy per isolare i dati per utente

---

## 🛠 Tecnologie

- HTML5 + CSS3 + JavaScript vanilla
- [Supabase](https://supabase.com) — database PostgreSQL gratuito
- [Netlify](https://netlify.com) — hosting gratuito

---

Costo mensile per un salone piccolo: **€0** (nei limiti gratuiti di Supabase e Netlify)
