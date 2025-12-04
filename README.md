# 📱 Remote QR Navigation System

**University Project - Software Engineering (A.Y. 2024/2025)**

An interactive web application exploring the concept of **Cross-Device Interaction**. It allows users to navigate pages and unlock hidden content on a main screen (Desktop) using a smartphone as a remote controller, simply by scanning dynamic QR Codes.

## 🚀 Key Features

* **Remote Navigation:** Scan a QR code with your smartphone to instantly change the page on the main desktop monitor.
* **Unlockable Content:** Reveal hidden text sections ("educational easter eggs") on the main screen via mobile interaction.
* **Real-Time Communication:** Powered by **WebSockets (Socket.IO)** to ensure instant synchronization between devices with minimal latency.
* **OOP Architecture:** Both Client and Server codebases are structured using **Object-Oriented Programming** principles (Classes, Modules) to ensure readability and maintainability.

## 🛠 Technology Stack

* **Backend:** Node.js, Express
* **Real-Time Engine:** Socket.IO
* **Frontend:** HTML5, CSS3 (Glassmorphism design), Vanilla JavaScript
* **Utilities:** QRCode.js

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/progetto-qrcode-nav.git](https://github.com/YOUR_USERNAME/progetto-qrcode-nav.git)
    cd progetto-qrcode-nav
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```
    The server will start at `http://localhost:3000`.

## 📱 How to Test with a Smartphone (Tunneling)

To control the desktop app using your smartphone (if not on the same local Wi-Fi), it is recommended to expose your local server using **ngrok**:

1.  Start ngrok:
    ```bash
    ngrok http 3000
    ```
2.  Copy the generated HTTPS URL (e.g., `https://xyz.ngrok-free.app`).
3.  The application is designed to automatically detect the base URL. Simply open the ngrok URL on your Desktop browser.
4.  Scan the QR codes displayed on the Desktop with your smartphone.

## 👨‍💻 Author

**Alberto Mancini** 
University of Perugia  
Course: Operating Systems
