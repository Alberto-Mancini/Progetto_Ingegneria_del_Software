/************************************
 * CONFIGURAZIONE DINAMICA URL     *
 ************************************/

// Classe App - Gestisce l'applicazione principale
class App {
  constructor() {
    // MODIFICA FONDAMENTALE:
    // Rileva automaticamente l'URL corrente (es. localhost:3000 o https://tua-sessione.ngrok.io)
    // Non serve più cambiare manualmente l'URL ogni volta che riavvii ngrok.
    this.BASE_URL = window.location.origin;

    // Mappa di navigazione: index->microsoft->quantum->index
    this.NAVIGATION = {
      index: { back: "quantum", next: "microsoft" },
      microsoft: { back: "index", next: "quantum" },
      quantum: { back: "microsoft", next: "index" },
    };

    this.currentPage = document.body.getAttribute("data-page") || "index";
    this.socket = null;

    this.qrManager = new QRCodeManager(this);
    this.navigationManager = new NavigationManager(this);
    this.sectionManager = new SectionManager(this);
  }

  init() {
    console.log("Connessione al server su:", this.BASE_URL);
    
    // Connetti al server via Socket.IO usando l'URL dinamico
    this.socket = io(this.BASE_URL);
    window.socket = this.socket; // Mantieni compatibilità con eventuale codice legacy

    // Inizializza i manager
    this.navigationManager.init();
    this.qrManager.init();
    this.sectionManager.init();
  }
}

// Classe QRCodeManager - Gestisce la generazione dei QR code
class QRCodeManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // Genera i due QR (BACK e NEXT) solo se i contenitori esistono nella pagina
    if (document.getElementById("qrcode-back")) {
        this.generateQRCode(
            "qrcode-back",
            this.app.NAVIGATION[this.app.currentPage].back
        );
    }
    
    if (document.getElementById("qrcode-next")) {
        this.generateQRCode(
            "qrcode-next",
            this.app.NAVIGATION[this.app.currentPage].next
        );
    }
  }

  /**
   * Genera un QR Code nel container specificato
   * con link a /redirect?to=page
   */
  generateQRCode(containerId, page) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Usa this.app.BASE_URL invece di quello fisso
    const finalUrl = `${this.app.BASE_URL}/redirect?to=${page}`;
    
    // Pulisce il contenitore prima di disegnare (per evitare duplicati se ricarichi)
    container.innerHTML = "";

    new QRCode(container, {
      text: finalUrl,
      width: 64,
      height: 64,
    });
  }
}

// Classe NavigationManager - Gestisce la navigazione tra le pagine
class NavigationManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // Rendi i pulsanti visivamente disabilitati (sono solo indicatori per i QR)
    const backButton = document.querySelector(
      ".nav-links li:first-child .menu-button"
    );
    const nextButton = document.querySelector(
      ".nav-links li:last-child .menu-button"
    );

    if (backButton) {
      backButton.style.cursor = "default";
      backButton.style.opacity = "0.7";
    }

    if (nextButton) {
      nextButton.style.cursor = "default";
      nextButton.style.opacity = "0.7";
    }

    // Riceve l'evento di cambio pagina dal server
    this.app.socket.on("navigate", (targetPage) => {
      console.log("Ricevuto comando di navigazione:", targetPage);
      if (targetPage === this.app.currentPage) {
        return;
      }

      // Naviga alla pagina corretta
      if (targetPage === "index") {
        window.location.href = "/";
      } else {
        window.location.href = `/${targetPage}`;
      }
    });
  }
}

// Classe SectionManager - Gestisce le sezioni nascoste e il loro sblocco
class SectionManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.initSectionQRCodes();

    // Ascolta eventi di rivelazione dal server (quando scansioni col telefono)
    this.app.socket.on("revealSection", (data) => {
      // Verifica se l'evento è per la pagina corrente
      if (data.page === this.app.currentPage) {
        this.revealSection(data.section);
      }
    });
  }

  /**
   * Inizializza i QR code per ogni sezione e imposta la visibilità dei contenuti
   */
  initSectionQRCodes() {
    // Ottieni tutti i titoli di sezione (h3)
    const sectionTitles = document.querySelectorAll("h3");

    // Per ogni titolo, crea un QR code associato se non è già stato rivelato
    sectionTitles.forEach((title) => {
      // Ottieni o crea un ID univoco per il titolo
      if (!title.id) {
        title.id =
          "section-" +
          title.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }

      const sectionId = title.id;

      // Controlla nel LocalStorage se questa sezione è già stata rivelata in passato
      const isRevealed =
        localStorage.getItem(
          `revealed-${this.app.currentPage}-${sectionId}`
        ) === "true";

      // Trova e organizza il contenuto da nascondere
      let contentWrapper = title.nextElementSibling;
      
      // Se il contenuto non è già in un wrapper, creane uno
      if (
        !contentWrapper ||
        !contentWrapper.classList.contains("section-content")
      ) {
        // Prendi tutti i paragrafi dopo il titolo fino al prossimo titolo
        let contentElements = [];
        let nextElement = title.nextElementSibling;

        while (nextElement && !["H2", "H3"].includes(nextElement.tagName)) {
          contentElements.push(nextElement);
          nextElement = nextElement.nextElementSibling;
        }

        // Crea un wrapper per il contenuto
        contentWrapper = document.createElement("div");
        contentWrapper.id = `content-${sectionId}`;
        contentWrapper.className = "section-content";

        // Sposta i paragrafi nel wrapper
        contentElements.forEach((el) => {
          // Nota: appendChild sposta l'elemento, non lo copia, quindi el.remove() non serve
          contentWrapper.appendChild(el); 
        });

        // Inserisci il wrapper dopo il titolo
        title.after(contentWrapper);
      }

      if (!isRevealed) {
        // Nascondi il contenuto inizialmente
        contentWrapper.style.display = "none";

        // Crea il contenitore per il QR code di sblocco
        let qrContainer = document.createElement("div");
        qrContainer.id = `qr-${sectionId}`;
        qrContainer.className = "section-qr";

        const qrElement = document.createElement("div");
        qrElement.id = `qrcode-${sectionId}`;
        qrContainer.appendChild(qrElement);

        const scanText = document.createElement("p");
        scanText.className = "scan-text";
        scanText.textContent = "Scansiona con lo smartphone per sbloccare";
        qrContainer.appendChild(scanText);

        // Aggiungi un pulsante "Mostra" per debug o fallback
        const showButton = document.createElement("button");
        showButton.className = "show-btn";
        showButton.textContent = "Sblocca manualmente (Debug)";
        
        // Aggiungi evento click per sblocco manuale
        showButton.onclick = () => {
            this.app.socket.emit("revealSection", { 
                page: this.app.currentPage, 
                section: sectionId 
            });
            // Simula anche ricezione locale per immediatezza
            this.revealSection(sectionId);
        };
        
        qrContainer.appendChild(showButton);

        // Inserisci il box QR prima del contenuto nascosto
        contentWrapper.before(qrContainer);

        // Genera il QR code usando l'URL dinamico
        const finalUrl = `${this.app.BASE_URL}/reveal-section?page=${this.app.currentPage}&section=${sectionId}`;

        new QRCode(qrElement, {
          text: finalUrl,
          width: 128,
          height: 128,
        });
      } else {
        // Se è già rivelato, assicurati che sia visibile
        contentWrapper.style.display = "block";
      }
    });
  }

  /**
   * Rivela una sezione specifica con animazione
   */
  revealSection(sectionId) {
    const contentSection = document.querySelector(`#content-${sectionId}`);
    const qrContainer = document.querySelector(`#qr-${sectionId}`);

    if (contentSection) {
      // Salva lo stato sbloccato
      localStorage.setItem(
        `revealed-${this.app.currentPage}-${sectionId}`,
        "true"
      );

      // Se c'è il container QR, nascondilo con animazione
      if (qrContainer) {
        qrContainer.style.transition = "opacity 0.5s ease";
        qrContainer.style.opacity = "0";
        
        setTimeout(() => {
            qrContainer.style.display = "none";
            // Mostra il contenuto
            this.showContent(contentSection);
        }, 500);
      } else {
          // Se non c'è container (es. refresh pagina), mostra direttamente
          this.showContent(contentSection);
      }
    }
  }

  showContent(element) {
      element.style.display = "block";
      element.style.opacity = "0";
      
      // Forza reflow per attivare la transizione CSS
      void element.offsetWidth;
      
      element.style.transition = "opacity 0.8s ease";
      element.style.opacity = "1";
  }
}

// Inizializzazione dell'applicazione al caricamento del documento
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});