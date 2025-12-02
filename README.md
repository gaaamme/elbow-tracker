- **Sensor 3** -> Pin **A2**
- **Sensor 4** -> Pin **A3**
- **Sensor 5 (Bottom/Lumbar)** -> Pin **A4**

## Installation

### 1. Arduino Firmware
1. Open `arduino/spine_tracker.ino` in the Arduino IDE.
2. Install the **ArduinoBLE** library via the Library Manager.
3. Select your board (**Arduino Nano 33 BLE**) and port.
4. Upload the sketch.
5. Open the Serial Monitor (9600 baud) to verify initialization.

### 2. Web Application
The Web Bluetooth API requires a secure context (**HTTPS**) or **localhost**.

**Option A: Run Locally (PC)**
1. You can use a simple HTTP server (e.g., Python, VS Code Live Server).
   ```bash
   # If you have Python installed
   cd web-app
   python -m http.server
   ```
2. Open `http://localhost:8000` in Chrome or Edge.

**Option B: Run on Mobile**
To run on mobile, you need to host the `web-app` folder on a secure server (GitHub Pages, Vercel, Netlify) OR use port forwarding from your PC.

**Browser Compatibility:**
- **Android**: Use **Chrome**.
- **iOS**: Safari does NOT support Web Bluetooth. Use **Bluefy** or **WebBLE** browser apps.
- **PC/Mac**: Use **Chrome** or **Edge**.

## Usage
1. Power on the Arduino.
2. Open the web app on your device.
3. Click **"Connect to Spine"**.
4. Select **"SpineTracker"** from the device list.
5. Once connected, the spine visualization will react to the sensor bending in real-time.
