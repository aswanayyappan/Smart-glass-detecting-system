# Smart Blind / Smart Glass System

A complete IoT Backend and Real-Time Frontend system designed to monitor sensor distances using Firebase Realtime Database and broadcast audio/visual alerts via WebSockets.

## Features

- **Real-Time Firebase Monitoring:** The frontend connects directly to Firebase to stream and display live distance changes instantly.
- **Event-Driven WebSockets:** The Node.js backend listens for distance data and pushes strictly categorized states (`mid`, `detected`, `near`) to clients only when the state changes.
- **Strict Distance Classification:**
  - `near` (≤ 30 cm) → Plays `too_close.mp3`
  - `detected` (31 - 50 cm) → Plays `detected.mp3`
  - `mid` (51 - 70 cm) → Plays `mid_way.mp3`
  - `clear` (> 70 cm or ≤ 0) → Stops all audio
- **Continuous Looping Audio Engine:** Alerts loop continuously while in a specific state. Implements strict zero-overlap and auto-silencing when the path is clear.
- **Development Ready:** Configured with `nodemon` for automatic server reloads during development.

## Project Structure

```
Smart-glass/
├── backend/
│   ├── index.html           # Real-time frontend UI with Audio Engine
│   ├── server.js            # Node.js backend with Express & WebSocket server
│   ├── package.json         # Project dependencies and npm scripts
│   ├── mid_way.mp3          # Audio asset for "mid" state
│   ├── detected.mp3         # Audio asset for "detected" state
│   ├── too_close.mp3        # Audio asset for "near" state
│   └── smart-blindsystem-firebase-adminsdk-...json # Firebase Service Account Key (User Provided)
```

## Prerequisites

1. [Node.js](https://nodejs.org/) installed.
2. A **Firebase Realtime Database** project containing the node `/sensor/current` with a `distance` value.
3. Your Firebase **Service Account Private Key** JSON file.

## Setup & Installation

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Ensure your Firebase Service Account JSON file is placed directly inside the `backend` folder and named exactly as referenced in `server.js` (e.g., `smart-blindsystem-firebase-adminsdk-fbsvc-9e9d5c2c49.json`).

## Running the Server

**Development Mode (Auto-restarts on changes):**
```bash
npm run dev
```

**Production/Standard Mode:**
```bash
npm start
```

## Using the Frontend

1. Once the server is running, open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)
2. Click the **"Enable Sound"** button to unlock the browser's audio context (required by modern browsers for autoplaying media).
3. The UI will begin reflecting real-time distance from Firebase, and whenever an obstacle crosses the defined thresholds, the WebSocket will trigger the respective looping audio alert.

## License

This project is intended for personal/educational IoT use.
