# Elbow Flexion Tracker

A real-time elbow flexion tracking system using an Arduino Nano 33 BLE and a web-based visualization.

## Overview
This project uses a single flex sensor connected to an Arduino Nano 33 BLE to measure the angle of the elbow. The data is transmitted via Bluetooth Low Energy (BLE) to a web application that visualizes the arm's movement in real-time.

## Features
- **Real-time Tracking**: Low-latency visualization of elbow flexion.
- **Web-based Calibration**: Calibrate the "straight arm" position directly from the web interface.
- **Wireless**: Completely wireless connection using BLE.

## Hardware
- Arduino Nano 33 BLE
- 1x Flex Sensor (Spectra Symbol or similar)
- 1x 10kΩ Resistor (for voltage divider)

## Wiring
1. Connect one pin of the Flex Sensor to **3.3V**.
2. Connect the other pin to **A0** and to one end of the 10kΩ resistor.
3. Connect the other end of the resistor to **GND**.

## Setup

### Arduino
1. Open `arduino/elbow_tracker/elbow_tracker.ino` in the Arduino IDE.
2. Install the **ArduinoBLE** library via the Library Manager.
3. Select your board (**Arduino Nano 33 BLE**) and port.
4. Upload the sketch.

### Web App
1. Open `web-app/index.html` in a BLE-compatible browser (Chrome, Edge, Opera).
2. Click **Connect to Elbow Tracker**.
3. **Calibrate**: Extend your arm straight and click the **"Calibrate (Arm Straight)"** button.
4. **Visualize**: Bend your arm to see the elbow animation respond in real-time.

## Browser Compatibility
- **Desktop**: Chrome, Edge, Opera
- **Android**: Chrome
- **iOS**: Safari does NOT support Web Bluetooth. Use **Bluefy** or **WebBLE** browser apps.

## Running Locally
You can run the web app locally using any HTTP server:
```bash
cd web-app
python -m http.server
```
Then open `http://localhost:8000` in your browser.
