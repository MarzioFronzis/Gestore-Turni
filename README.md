# Turni

Gestionale turni: griglia settimanale, skill dipendenti, cambio turno tra colleghi,
ferie/permessi, festività/chiusure, turni ricorrenti, notifiche push, storico completo.

## 1. Crea il progetto Firebase

1. https://console.firebase.google.com → "Aggiungi progetto" → nome a piacere (nuovo progetto, separato da quello del salone)
2. Attiva **Authentication** → metodo "Email/Password"
3. Attiva **Firestore Database** → modalità produzione, regione europe-west (Belgio/Francia, più vicina)
4. Console → Impostazioni progetto → "Le tue app" → aggiungi app Web → copia la configurazione
5. Incolla la configurazione in **due punti** (devono essere identiche):
   - `src/lib/firebase.js`
   - `public/firebase-messaging-sw.js`

## 2. Regole di sicurezza Firestore

Console Firebase → Firestore → Regole → incolla il contenuto di `firestore.rules` → Pubblica.

## 3. Crea titolare e dipendenti

Per ogni persona che userà l'app:
1. Authentication → Aggiungi utente (email + password)
2. Firestore → collection `utenti` → documento con **ID uguale allo Uid** dell'utente appena creato:
   ```
   { ruolo: "titolare" }
   ```
   oppure per un dipendente:
   ```
   { ruolo: "dipendente", dipendenteId: "<id del documento in dipendenti/>" }
   ```
3. La scheda dipendente stessa (nome, skill, colore) si crea dall'app, tab "Dipendenti" (solo titolare) — poi la colleghi allo Uid come sopra.

## 4. Notifiche push (opzionale ma richiesto dal funzionale)

1. Console Firebase → Cloud Messaging → "Web Push certificates" → genera coppia di chiavi → copia la **VAPID key**
2. Incollala in `src/lib/notifiche.js` (`vapidKey`)
3. L'invio effettivo delle notifiche (quando qualcuno crea un turno, propone un cambio, ecc.) richiede le **Cloud Functions** nella cartella `functions/` — serve il piano **Blaze** (pay-as-you-go; la soglia gratuita è generosa e per un uso come questo probabilmente non spenderai nulla):
   ```
   npm install -g firebase-tools
   firebase login
   firebase init functions   # scegli il progetto, JavaScript, salta ESLint se vuoi
   # sostituisci functions/index.js con quello già pronto in questo progetto
   firebase deploy --only functions
   ```
4. Nell'app, dopo il login, va chiamata `attivaNotifichePush(user.uid)` (da `src/lib/notifiche.js`) — ad esempio con un bottone "Attiva notifiche" nella dashboard, perché il browser deve chiedere il permesso con un'azione dell'utente.

Se vuoi partire senza push reali, salta questo paragrafo: l'app funziona lo stesso, i dipendenti vedranno le novità aprendo l'app.

## 5. Sviluppo locale

```
npm install
npm run dev
```

## 6. Deploy su GitHub Pages

1. Crea un nuovo repository su GitHub (es. `turni-app`)
2. Se il nome repo è diverso da `turni-app`, aggiorna `base` in `vite.config.js`
3. ```
   git init
   git add .
   git commit -m "Prima versione"
   git branch -M main
   git remote add origin https://github.com/<tuo-utente>/turni-app.git
   git push -u origin main
   ```
4. ```
   npm run deploy
   ```
   Questo builda e pubblica la cartella `dist/` sul branch `gh-pages`.
5. GitHub → repo → Settings → Pages → Source: branch `gh-pages` → Save
6. L'app sarà raggiungibile su `https://<tuo-utente>.github.io/turni-app/`

**Nota sicurezza**: la configurazione Firebase nel codice (`apiKey` ecc.) non è un segreto — è normale che sia pubblica in un'app client-side. La sicurezza vera è nelle Firestore Rules (punto 2), che vanno sempre mantenute attive.

## Cosa manca (scelte già discusse, da tenere a mente)

- Nessun controllo automatico sul riposo minimo di 11 ore tra due turni
- Nessun contatore ferie/permessi residui (solo storico richieste/esiti)
- Il cambio turno tra colleghi diventa definitivo appena il collega accetta, senza passaggio dal titolare
