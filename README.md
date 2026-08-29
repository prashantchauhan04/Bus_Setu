# 🚌 Bus Setu (बस सेतु) — Haryana Bus Service Live Tracker

> **Aapki Yatra Ka Setu (आपकी यात्रा का सेतु)** • Real-time crowdsourced live bus tracking and route finding across Haryana State, Chandigarh, and New Delhi.

---

## 🌟 Key Features

1. **Live GPS Bridge**: Commuters inside moving buses tap **📍 Share Location** to broadcast live position coordinates every 4 seconds to passengers waiting at upcoming stations.
2. **Instant Search & Autocomplete**: Search by depot code (e.g. *HR-05, HR-68, HR-20*), city (*Karnal, Hisar, Rohtak, Ambala, Gurugram, Delhi, Chandigarh*), or intermediate highway stops (*Murthal, Kundli, Pehowa, Agroha*).
3. **Route Corridors & Polyline Mapping**: High-definition route corridors mapped along NH-44 GT Road, NH-9, NH-48, and state highways with Leaflet + OpenStreetMap.
4. **Crowdsourced Timetable Updates**: Passengers and staff can add new routes or update driver names, contact numbers, and stops.
5. **⚡ Test Demo Simulator**: Built-in 38 km/h highway simulator for instant demonstrations without traveling.
6. **Progressive Web App (PWA)**: Installable directly on Android and iPhone home screens.

---

## 🛣️ Pre-Configured Corridors

- **NH-44 (GT Road)**: Chandigarh ISBT ➔ Ambala ➔ Kurukshetra ➔ Karnal ➔ Panipat ➔ Murthal ➔ ISBT Kashmere Gate Delhi
- **NH-9 (Western Haryana)**: Sirsa ➔ Fatehabad ➔ Hisar ➔ Hansi ➔ Rohtak ➔ Bahadurgarh ➔ Delhi
- **NH-48 (Southern Haryana & NCR)**: Rewari ➔ Manesar ➔ Gurugram ➔ Dhaula Kuan ➔ Delhi ISBT
- **Central Haryana Link**: Chandigarh ISBT ➔ Ambala ➔ Pehowa ➔ Kaithal ➔ Narwana ➔ Jind
- **IGI Airport Express**: Kalka / Panchkula ➔ Chandigarh ➔ Panipat ➔ IGI Airport T3 Delhi

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## 🌐 Deploy to Cloud (Free 24/7 Hosting)

1. Upload this repository to **GitHub**.
2. Connect to **[Render.com](https://render.com)** as a free Web Service:
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Your live link will be ready at `https://your-app-name.onrender.com`!
