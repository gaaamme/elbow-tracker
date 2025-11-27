/*
  Spine Tracker Firmware
  Board: Arduino Nano 33 BLE
  
  Reads 5 flex sensors connected to analog pins A0-A4.
  Transmits data via BLE to a connected central device (phone/web app).
  
  Circuit:
  - 5 x Flex Sensors
  - 5 x 10k Ohm Resistors (Voltage Divider)
  - Pin A0: Sensor 1 (Top/Cervical)
  - Pin A1: Sensor 2
  - Pin A2: Sensor 3
  - Pin A3: Sensor 4
  - Pin A4: Sensor 5 (Bottom/Lumbar)
  - VCC (3.3V) and GND
*/

#include <ArduinoBLE.h>

// BLE Service UUID
const char* serviceUUID = "19B10000-E8F2-537E-4F6C-D104768A1214";
// BLE Characteristic UUID (Read | Notify)
const char* charUUID = "19B10001-E8F2-537E-4F6C-D104768A1214";

BLEService spineService(serviceUUID);
BLECharacteristic spineDataChar(charUUID, BLERead | BLENotify, 5); // 5 bytes for 5 sensors

const int sensorPins[] = {A0, A1, A2, A3, A4};
const int numSensors = 5;
uint8_t sensorValues[5]; // Store mapped values (0-255)

void setup() {
  Serial.begin(9600);
  // while (!Serial); // Uncomment to wait for serial connection for debugging

  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }

  BLE.setLocalName("SpineTracker");
  BLE.setAdvertisedService(spineService);

  spineService.addCharacteristic(spineDataChar);
  BLE.addService(spineService);

  BLE.advertise();

  Serial.println("Bluetooth device active, waiting for connections...");
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Connected to central: ");
    Serial.println(central.address());

    while (central.connected()) {
      readSensors();
      spineDataChar.writeValue(sensorValues, 5);
      delay(50); // 20Hz update rate
    }

    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}

void readSensors() {
  for (int i = 0; i < numSensors; i++) {
    int rawValue = analogRead(sensorPins[i]);
    // Map 10-bit ADC (0-1023) to 8-bit (0-255)
    // Adjust the input range (e.g., 300-700) based on your specific flex sensor calibration
    // For now, we use the full range, but you should calibrate this!
    int mappedValue = map(rawValue, 0, 1023, 0, 255); 
    sensorValues[i] = (uint8_t)constrain(mappedValue, 0, 255);
    
    // Debug print
    Serial.print(sensorValues[i]);
    Serial.print(" ");
  }
  // Serial.println();
}
