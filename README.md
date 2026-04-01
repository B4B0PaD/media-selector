# Media Selector

Media Selector è un'applicazione web locale (sviluppata con Next.js) progettata per esplorare, organizzare e confrontare risorse multimediali (video, immagini e testo) attraverso un processo di selezione a torneo 1 contro 1.

L'interfaccia, elegante e in modalità scura, permette all'utente di effettuare scelte tramite confronti diretti e di visualizzare tutto il percorso di selezione (albero decisionale) fino ad arrivare alle risorse vincitrici.

## Funzionalità Principali

- **Torneo 1v1 (Bracket System)**: Sistema avanzato di confronto tra due risorse alla volta. Ottimo per operare una scrematura tramite decisioni dirette.
- **Supporto multi-formato**: Possibilità di selezionare, visualizzare e confrontare video interattivi, immagini e risorse testuali.
- **Sorgente Locale**: Selettore per caricare file o intere cartelle direttamente dal computer, con un file explorer personalizzato e pulito.
- **Integrazione Google Drive**: Supporto all'API ufficiale di Google Drive e al Google Picker per cercare, selezionare e trasmettere risorse direttamente dallo storage cloud. Supporta controlli completi di riproduzione video (seeking/scrubbing).
- **Sessioni Persistenti**: Lo stato di avanzamento del torneo è persistente; puoi mettere in pausa la selezione, chiudere l'app e riprendere il torneo esatto in un secondo momento.
- **Gestione Azioni Avanzate**: Possibilità di annullare la mossa precedente (undo), richiedere un doppio click per la conferma del voto (evita selezioni accidentali) e possibilità di eliminare le sessioni non più necessarie.
- **Albero Decisionale (Decision Tree)**: Visualizzazione grafica e gerarchica di tutti i match giocati per avere un resoconto testuale/visivo di come si è arrivati al vincitore finale.

## Casi d'Uso (Use Cases)

1. **Gestione Foto (Culling) da Servizi Fotografici**
   Hai decine di foto simili scattate durante un evento in cui devi trovare lo scatto perfetto. Puoi caricarle in Media Selector e usare i logici confronti 1v1 per escludere rapidamente foto sfocate o scatti inferiori e trovare lo scatto migliore.

2. **Selezione Clip Video (Footage Selection) per il Montaggio**
   Devi selezionare le clip migliori e scartare quelle mosse o fuori fuoco e i file risiedono in gran parte su Google Drive. Tramite lo streaming interattivo puoi scorrere velocemente le timeline per visionare ogni file, confrontare due clip fianco a fianco e conservare solo le "take" migliori senza dover scaricare prima intere cartelle di gigabyte in locale sulla tua macchina da montaggio.

3. **Valutazione Casting o Audizioni**
   Per agenzie, direttori del casting o docenti: è possibile confrontare e valutare le performance attoriali caricate dai candidati caricando l'intera directory nel media-selector. Il torneo garantisce obiettività forzando l'utente a scegliere sempre e solo tra due performance in contemporanea.

4. **Recensioni e Confronti Creativi (A/B testing manuale)**
   Designer e grafici possono utilizzare l'app per confrontare versioni differenti del proprio lavoro (creatività grafiche per campagne adv, loghi, landing page testuali) e procedere ad una pulizia e scrematura rapida ed efficace per estrapolare la proposta/prototipo più forte da mostrare al cliente.

## Setup Iniziale e Avvio (Sviluppo Locale)

1. Installa tutte le dipendenze:
   ```bash
   npm install
   ```
2. Configura le credenziali di Google Drive (opzionale ma consigliato per i video in cloud) inserite nel `.env.local`
3. Esegui il server di sviluppo Next.js:
   ```bash
   npm run dev
   ```
4. Apri [http://localhost:3000](http://localhost:3000) sul browser.
