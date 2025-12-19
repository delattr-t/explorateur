# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### Étape 1 : Prérequis
```bash
# Installer Node.js depuis https://nodejs.org/

# Installer Expo CLI
npm install -g expo-cli
```

### Étape 2 : Installer le projet
```bash
cd cartographer-native
npm install
```

### Étape 3 : Lancer
```bash
npx expo start
```

## 📱 Test avec Expo Go (rapide mais tracking limité)

1. **Installer Expo Go** sur votre téléphone
2. **Scanner le QR code** affiché dans le terminal
3. **Tester l'interface** (tracking premier-plan seulement)

⚠️ **Expo Go ne supporte PAS le tracking en arrière-plan !**

## 🏗️ Build pour tracking complet

### Méthode recommandée : EAS Build

```bash
# S'inscrire sur expo.dev
npm install -g eas-cli
eas login

# Configurer
eas build:configure

# Build Android APK (à installer sur votre téléphone)
eas build --platform android --profile preview

# Attendez 10-15 minutes
# Téléchargez l'APK depuis le lien fourni
# Installez sur votre Android
```

### Pour iOS

```bash
# Nécessite un Mac + compte Apple Developer
eas build --platform ios --profile preview
```

## ✅ Permissions à accorder

### Sur Android
1. Installer l'APK
2. Autoriser "Localisation" → **"Autoriser tout le temps"**
3. Autoriser "Notifications"

### Sur iOS
1. Installer l'app
2. Autoriser "Localisation" → **"Toujours"**
3. Autoriser "Notifications"

## 🎯 Premier test

1. **Lancez l'app**
2. **Accordez toutes les permissions**
3. **Sortez dehors** (GPS fonctionne mal en intérieur)
4. **"Commencer l'Exploration"**
5. **Attendez 1-2 min** pour fix GPS initial
6. **Marchez un peu**
7. **Verrouillez l'écran** ou changez d'app
8. **Vérifiez les notifications** après quelques minutes
9. **Revenez dans l'app** - les points sont enregistrés ! 🎉

## 🐛 Problèmes courants

**L'app ne build pas**
```bash
rm -rf node_modules
npm install
```

**Pas de tracking en arrière-plan**
- Vérifiez que vous avez fait un BUILD natif (pas Expo Go)
- Permission "Toujours" accordée

**GPS imprécis**
- Sortez dehors
- Attendez le "fix GPS" initial (1-2 min)
- Vérifiez que localisation précise est activée

## 📞 Besoin d'aide ?

Consultez le README.md complet pour plus de détails !
