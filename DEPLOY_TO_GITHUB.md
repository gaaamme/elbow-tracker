# 🚀 Mettre en ligne sur GitHub Pages

Comme je n'ai pas accès à vos identifiants GitHub, vous devez faire ces quelques étapes manuellement pour mettre le site en ligne.

## Étape 1 : Créer le "Repository" sur GitHub
1.  Connectez-vous à votre compte [GitHub](https://github.com).
2.  Cliquez sur le **+** en haut à droite -> **New repository**.
3.  Nom du repository : `spine-tracker` (ou ce que vous voulez).
4.  Visibilité : **Public** (nécessaire pour GitHub Pages gratuit).
5.  Ne cochez **pas** "Add a README file" (on en a déjà un).
6.  Cliquez sur **Create repository**.

## Étape 2 : Envoyer le code (Push)
Une fois le repository créé, GitHub vous montre une page avec des commandes. Copiez et exécutez les commandes suivantes dans votre terminal (une par une) :

```bash
git branch -M main
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/spine-tracker.git
git push -u origin main
```
*(Remplacez `VOTRE_NOM_UTILISATEUR` par votre vrai pseudo GitHub)*

## Étape 3 : Activer GitHub Pages
1.  Allez dans les **Settings** de votre repository sur GitHub.
2.  Dans le menu à gauche, cliquez sur **Pages**.
3.  Sous **Build and deployment** > **Branch**, sélectionnez `main` et le dossier `/(root)`.
4.  Cliquez sur **Save**.

## Étape 4 : C'est prêt !
Attendez 1 ou 2 minutes. Votre site sera accessible à l'adresse :
`https://VOTRE_NOM_UTILISATEUR.github.io/spine-tracker/web-app/`

⚠️ **Note** : N'oubliez pas d'ajouter `/web-app/` à la fin de l'URL car votre site est dans ce sous-dossier.
