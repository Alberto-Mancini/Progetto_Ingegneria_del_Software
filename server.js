const express = require("express");
const path = require("path");
const qrcode = require("qrcode");
const http = require("http");
const socketIo = require("socket.io");

// CONFIGURAZIONE
// Nota: Sostituisci con il tuo URL pubblico (es. ngrok) o IP locale quando presenti il progetto
const BASE_URL = process.env.PUBLIC_URL || "http://localhost:3000"; 

class ServerApp {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);

    // Inizializza i gestori
    this.routeHandler = new RouteHandler(this.app, this.io);
    this.socketHandler = new SocketHandler(this.io);
  }

  start() {
    const PORT = process.env.PORT || 3000;
    this.server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server avviato.`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`Public Base URL per QR Codes: ${BASE_URL}`);
    });
  }
}

class RouteHandler {
  constructor(app, io) {
    this.app = app;
    this.io = io;
    
    this.setupStaticFiles();
    this.setupMainRoutes();
    this.setupQrCodeRoutes();
    this.setupNavigationRoutes();
  }

  setupStaticFiles() {
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  setupMainRoutes() {
    // Serve le pagine HTML
    const pages = ["index", "microsoft", "quantum"];
    
    this.app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
    
    pages.forEach(page => {
        this.app.get(`/${page}`, (req, res) => 
            res.sendFile(path.join(__dirname, "public", `${page}.html`))
        );
    });
  }

  setupQrCodeRoutes() {
    this.app.get("/qrcode/:page", (req, res) => {
      const page = req.params.page;
      // Usa la costante BASE_URL definita in alto
      const url = `${BASE_URL}/redirect?to=${page}`;
      
      qrcode.toDataURL(url, (err, qrCodeDataUrl) => {
        if (err) {
          console.error("Errore generazione QR:", err);
          return res.status(500).send("Errore generazione QR");
        }
        res.json({ qrCodeDataUrl });
      });
    });
  }

  setupNavigationRoutes() {
    this.app.get("/redirect", (req, res) => {
      const page = req.query.to;
      const validPages = ["index", "microsoft", "quantum"];
      
      if (validPages.includes(page)) {
        this.io.emit("navigate", page);
        return res.send(`Navigazione verso ${page} inviata con successo. Puoi chiudere questa pagina.`);
      }
      res.status(400).send("Pagina non valida");
    });

    this.app.get("/reveal-section", (req, res) => {
      const { page, section } = req.query;
      if (page && section) {
        this.io.emit("revealSection", { page, section });
        return res.send("Contenuto sbloccato con successo!");
      }
      res.status(400).send("Parametri mancanti");
    });
  }
}

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on("connection", (socket) => {
      console.log("Nuovo client connesso ID:", socket.id);
      
      socket.on("changePage", (page) => {
        this.io.emit("navigate", page);
      });
    });
  }
}

new ServerApp().start();