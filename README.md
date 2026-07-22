# 🏴‍☠️ Caccia al Tesoro

### *Esplora la città. Trova gli origami. Svela il mistero.*

---

## 📖 Descrizione

**Caccia al Tesoro** è un'app di esplorazione urbana gamificata che trasforma le città in parchi giochi digitali. Gli utenti cercano e nascondono "tesori" (oggetti fisici come libri, peluche, biglietti) in luoghi pubblici, guidati da indizi e da un sistema di geolocalizzazione.

L'app unisce:
- **Mondo fisico** e **digitale**
- **Esplorazione** e **community**
- **Gamification** e **sicurezza**

---

## ✨ Funzionalità Principali

| Funzionalità | Descrizione |
|--------------|-------------|
| 🗺️ **Mappa Interattiva** | Esplora la città e scopri i tesori nascosti nelle tue vicinanze |
| 📦 **Nascondi un Tesoro** | Lascia un oggetto fisico in un luogo pubblico con un indizio |
| 🔍 **Cerca Tesori** | Segui gli indizi e trova gli oggetti nascosti dagli altri utenti |
| ⭐ **Sistema di Karma** | Guadagna punti trovando e nascondendo tesori, sblocca nuovi livelli |
| 🔥 **Tesori "Caldi"** | Tesori che stanno per diventare Reliquie, con Karma bonus |
| ⚡ **Reliquie Dimenticate** | Tesori non trovati da 30 giorni che diventano eventi speciali (Karma x3) |
| 📡 **Modalità Radar** | Quando sei vicino a un tesoro, la mappa si trasforma in un radar immersivo |
| 🛡️ **Sistema di Sicurezza** | Verifica identità, geofencing, segnalazioni e moderazione della community |
| 👤 **Profilo Utente** | Statistiche, badge, streak e classifica cittadina |

---

## 🔒 Sicurezza

La sicurezza è il pilastro centrale dell'app. Abbiamo implementato:

- **Verifica Identità Progressiva** (KYC con SPID/CIE per funzioni avanzate)
- **Geofencing** (zone proibite: scuole, ospedali, ferrovie)
- **Coprifuoco Digitale** (tesori invisibili di notte in zone isolate)
- **Sistema di Segnalazione** (due segnalazioni = rimozione automatica)
- **Blocco Dispositivo** (IMEI ban per utenti malevoli)
- **Fiducia Graduale** (nuovi utenti possono solo cercare, non nascondere)

---

## 🛠️ Tecnologie Utilizzate

### Frontend
- **HTML5** / **CSS3**
- **JavaScript (Vanilla)**
- **Leaflet.js** + **OpenStreetMap** (mappe)
- **Google Fonts** (Montserrat)

### Backend (in sviluppo)
- **Node.js** / **Express** (API)
- **PostgreSQL** / **Firebase** (database)
- **JWT** (autenticazione)
- **SPID / CIE** (verifica identità)

---

## 🚀 Installazione e Avvio

### 1. Clona il repository
```bash
git clone https://github.com/tuo-username/caccia-tesoro.git
cd caccia-tesoro
