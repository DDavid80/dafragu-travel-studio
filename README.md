# DaFragu Travel Studio

Dashboard personale per organizzare viaggi, prenotazioni, documenti, budget, checklist e PDF.

## Pubblicazione su GitHub Pages

1. Crea un nuovo repository su GitHub, ad esempio `dafragu-travel-studio`.
2. Carica **il contenuto di questa cartella**: `index.html`, `README.md` e `travel-ai-worker.js`.
3. Nel repository apri **Settings → Pages**.
4. In **Build and deployment** scegli **Deploy from a branch**.
5. Seleziona il branch `main` e la cartella `/(root)`, quindi salva.
6. GitHub fornirà il link pubblico della dashboard dopo pochi minuti.

## Dati del viaggio

La dashboard salva i dati nel browser del dispositivo che la utilizza. Il link rende condivisibile l'applicazione, ma non sincronizza automaticamente gli stessi dati fra telefoni e PC.

Per passare i dati da un dispositivo all'altro usa **Backup JSON** e importa il file nella copia dell'altro dispositivo quando sarà disponibile l'importazione.

## Travel AI (facoltativa)

`travel-ai-worker.js` non va pubblicato su GitHub Pages come chiave o configurazione. Va creato come Cloudflare Worker separato e la chiave OpenAI va inserita nei Secrets del Worker. Poi, nella dashboard, inserisci l'indirizzo del Worker in **Collega AI**.

Non inserire mai una chiave OpenAI nell'HTML o su GitHub.
