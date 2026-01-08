/*
  Elbow Flexion Tracker Firmware
  Board: Arduino Uno
  Module: Bluetooth v3.0 (HC-05/HC-06)

  Reads 1 flex sensor connected to analog pin A0.
  Sends RAW 10-bit sensor data via Bluetooth Serial (SoftwareSerial).
  Calibration is handled by the client (Web App).

  Circuit:
  - 1 x Flex Sensor on Pin A0
  - 1 x 10k Ohm Resistor (Voltage Divider)
  - Bluetooth Module (HC-05/HC-06):
    - TX -> Pin 10 (Arduino RX)
    - RX -> Pin 11 (Arduino TX) - Use Voltage Divider (2k/1k)
    - VCC -> 5V or 3.3V (Check module specs)
    - GND -> GND
*/

#include <SoftwareSerial.h>

// RX on Pin 10, TX on Pin 11
SoftwareSerial BTSerial(10, 11);

const int sensorPin = A0;

void setup() {
  Serial.begin(9600);
  BTSerial.begin(9600);

  Serial.println("Elbow Tracker Started");
  Serial.println("Waiting for Bluetooth Connection on HC-05...");
}

void loop() {
  readSensor();
  delay(50); 
}

void readSensor() {
  int rawValue = analogRead(sensorPin);
  BTSerial.println(rawValue);
  Serial.print("Min:300\t");     
  Serial.print("Max:850\t"); 
  Serial.print("Capteur:");
  Serial.println(rawValue);
  delay(100);
}

