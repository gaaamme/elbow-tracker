# Comment utiliser Spine Tracker sur Mobile

Pour utiliser cette application sur votre téléphone et vous connecter à l'Arduino via Bluetooth, il y a quelques contraintes techniques importantes à connaître.

## ⚠️ Prérequis Important : HTTPS

La technologie **Web Bluetooth** utilisée par cette application nécessite obligatoirement une **connexion sécurisée (HTTPS)**.
- Cela signifie que vous ne pouvez pas simplement taper l'adresse IP de votre ordinateur (ex: `http://192.168.1.x`) dans le navigateur de votre téléphone. Cela ne fonctionnera pas car ce n'est pas sécurisé.
- La seule exception est `localhost`, mais `localhost` sur votre téléphone fait référence au téléphone lui-même, pas à votre ordinateur.

## Compatibilité Navigateur

### 🤖 Android
- **Navigateur recommandé** : Google Chrome.
- **Support** : Excellent.

### 🍎 iOS (iPhone/iPad)
- **Safari** : ❌ Ne supporte PAS le Web Bluetooth.
- **Solution** : Vous devez télécharger une application navigateur spécifique sur l'App Store qui supporte le Web Bluetooth, comme :
  - **Bluefy** (Gratuit, recommandé)
  - **WebBLE**

---

## Méthode 1 : Débogage USB (Android Uniquement - Recommandé pour le développement)
C'est la méthode la plus rapide pour tester sans héberger le site. Elle permet à votre téléphone d'accéder au serveur de votre PC via le câble USB comme s'il était en local.

1.  Activez les **Options développeur** et le **Débogage USB** sur votre téléphone Android.
2.  Branchez votre téléphone à votre PC via USB.
3.  Sur votre PC, ouvrez Chrome et tapez `chrome://inspect/#devices`.
4.  Cochez **Port forwarding**.
5.  Cliquez sur **Add Rule** :
    - **Port** : `8000` (ou le port que vous utilisez, ex: 5500 avec Live Server).
    - **IP address and port** : `localhost:8000`.
6.  Lancez votre serveur local sur le PC (ex: avec l'extension "Live Server" de VS Code ou Python).
7.  Sur votre téléphone, ouvrez Chrome et allez sur `http://localhost:8000`.
8.  Le téléphone croira être en local, et le Bluetooth fonctionnera !

## Méthode 2 : Hébergement en ligne (Android & iOS)
C'est la méthode la plus simple pour une utilisation quotidienne.

1.  Hébergez ce dossier `web-app` sur un service gratuit comme **Vercel**, **Netlify** ou **GitHub Pages**.
2.  Ces services fournissent automatiquement une adresse en **HTTPS** (ex: `https://mon-app-spine.vercel.app`).
3.  Ouvrez simplement ce lien sur votre mobile (Chrome pour Android, Bluefy pour iOS).

## Méthode 3 : Tunneling (Avancé)
Si vous avez des outils comme **ngrok** installés :
1.  Lancez votre serveur local.
2.  Lancez ngrok : `ngrok http 8000`.
3.  Utilisez l'URL HTTPS fournie par ngrok sur votre mobile.
