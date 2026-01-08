# Visualisation de l'angle du doigt

Un système professionnel de suivi de la flexion du doigt en temps réel utilisant un **Arduino Uno**, un module **Bluetooth Classic (HC-05)**, et une **Interface Web Premium**.

## 📝 Présentation
Ce projet utilise un capteur de pression pour mesurer l'angle d'un doigt. Les données sont transmises sans fil via Bluetooth à un tableau de bord web, avec une visualisation anatomique d'une main robotique et un feedback biomécanique en temps réel.

## ✨ Caractéristiques principales
- **Interface Premium "Cyberpunk"** : Mode sombre, glassmorphism, accents néon et animations fluides.
- **Visualisation de la Main** : Une main stylisée avec un doigt articulé (3 segments) qui se plie en synchronisation avec vos mouvements.
- **Feedback Dynamique** :
    - **Bleu (Sûr)** : Flexion légère.
    - **Ambre (Avertissement)** : Flexion moyenne.
    - **Rouge (Critique)** : Flexion maximale.
- **Web Serial API** : Connexion à faible latence via Chrome/Edge sur PC.
- **Mode Miroir** : Permet d'afficher la visualisation sur un téléphone ou une tablette en utilisant le PC comme pont (via PeerJS).
- **Calibrage Instantané** : Calibrage en un clic pour définir la position de base (doigt tendu).

## 🛠 Matériel Requis
- **Microcontrôleur** : Arduino Uno (ou compatible).
- **Bluetooth** : Module HC-05 ou HC-06 (Bluetooth v3.0 / Classic).
- **Capteur** : Capteur de Pression.

## 🔌 Guide de Câblage

| Composant | Broche | Broche Arduino | Note |
| :--- | :--- | :--- | :--- |
| **Capteur Pression** | VCC | Arduino **3.3V** |
| **Capteur Pression** | GND | Arduino **GND** |
| **Capteur Pression** | A0 | Arduino **A0** | 
| **HC-05 TX** | TX | **Pin 10** | Arduino RX |
| **HC-05 RX** | RX | **Pin 11** | Arduino TX |
| **HC-05 Alimentation**| VCC |Arduino **5V** |
| **HC-05 GND** | GND | Arduino **GND** |

## 🚀 Installation et Configuration

### 1. Firmware Arduino
1. Ouvrez `arduino/elbow_tracker/elbow_tracker.ino`.
2. Sélectionnez la carte : **Arduino Uno**.
3. Téléversez le code via USB.

### 2. Appairage Bluetooth (Windows)
1. Allez dans **Paramètres > Bluetooth et appareils**.
2. Cliquez sur **Ajouter un appareil > Bluetooth**.
3. Sélectionnez votre module (ex: "HC-05").
4. Entrez le code PIN : `1234` ou `0000`.

### 3. Tableau de Bord Web
1. Lancez le serveur local sur votre PC :
    ```bash
    cd web-app
    npx serve .
    ```
2. Ouvrez `http://localhost:3000` dans **Chrome**.
3. Cliquez sur **SE CONNECTER** et choisissez le port COM du Bluetooth.

## 📱 Utilisation du Mode Miroir (Téléphone)
1. Connectez votre PC en Bluetooth.
2. Notez le **Code Miroir** (ex: `XBT1`) en bas de la page sur le PC.
3. Sur votre téléphone, ouvrez le site (via l'IP de votre PC).
4. Entrez le code dans la section **Mode Miroir** et cliquez sur **REJOINDRE**.

## 🧪 Utilisation
1. **Connexion** : Bouton "Se connecter" sur le PC.
2. **Calibrage** : Tendez votre doigt au maximum et cliquez sur **CALIBRER**. Cela définit le point 0°.
3. **Suivi** : Observez le doigt virtuel se plier selon votre propre mouvement.
