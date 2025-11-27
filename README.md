# Spine Tracker Prototype

This project visualizes the curvature of a spine using 5 flex sensors connected to an Arduino Nano 33 BLE and a Web Bluetooth application.

## Hardware Requirements
- **Arduino Nano 33 BLE**
- 5 x **Flex Sensors**
- 5 x **10k Ohm Resistors**
- Breadboard and jumper wires
- Smartphone or PC with Bluetooth 4.0+

## Wiring Guide
Each flex sensor acts as a variable resistor. You need to create a voltage divider for each sensor.

**For each sensor (1 to 5):**
1. Connect one pin of the Flex Sensor to **3.3V**.
2. Connect the other pin of the Flex Sensor to an **Analog Pin** (A0 for Sensor 1, A1 for Sensor 2, etc.).
3. Connect the same Analog Pin to one end of a **10k Resistor**.
4. Connect the other end of the 10k Resistor to **GND**.

**Pin Mapping:**
- **Sensor 1 (Top/Cervical)** -> Pin **A0**
- **Sensor 2** -> Pin **A1**
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
