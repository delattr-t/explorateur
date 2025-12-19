# 🗺️ Cartographia Exploratoria - Application Mobile Native

Application mobile native React Native avec **tracking GPS en arrière-plan complet** ! 🎉

## ✨ Fonctionnalités Principales

### 🚀 Tracking GPS Avancé
- ✅ **Tracking en arrière-plan** - Fonctionne même écran verrouillé
- ✅ **Notifications de progression** - Toutes les 10 positions
- ✅ **Sauvegarde automatique** - Ne perdez jamais vos données
- ✅ **Haute précision** - GPS avec précision maximale
- ✅ **Service foreground** - Android (icône notification permanente)
- ✅ **Économie batterie optimisée** - Configuration intelligente

### 📱 Interface Native
- 🎨 Style cartographique ancien authentique
- 📊 Panneau d'informations détaillées
- 🧭 Rose des vents
- 📍 Position en temps réel
- 📏 Calcul de distance automatique
- 💾 Historique persistant

### 🔔 Notifications
- 📢 Démarrage/Pause de l'exploration
- 📊 Progression tous les 10 points
- 🔋 Indicateur actif en permanence (Android)

## 📦 Installation et Configuration

### Prérequis

1. **Node.js** (v16+) : https://nodejs.org/
2. **Expo CLI** :
```bash
npm install -g expo-cli
```

3. **Pour iOS** :
   - Mac avec Xcode installé
   - Compte Apple Developer (pour tester sur appareil réel)

4. **Pour Android** :
   - Android Studio avec SDK
   - Ou simplement Expo Go app

### Installation du projet

```bash
# Aller dans le dossier
cd cartographer-native

# Installer les dépendances
npm install

# Démarrer le projet
npx expo start
```

## 🚀 Lancer l'Application

### Méthode 1 : Expo Go (Plus rapide pour tester)

1. Installer **Expo Go** sur votre téléphone :
   - iOS : https://apps.apple.com/app/expo-go/id982107779
   - Android : https://play.google.com/store/apps/details?id=host.exp.exponent

2. Lancer le projet :
```bash
npx expo start
```

3. Scanner le QR code avec :
   - **iOS** : Appareil photo
   - **Android** : Expo Go app

⚠️ **LIMITATION Expo Go** : Le tracking en arrière-plan ne fonctionne PAS dans Expo Go. Vous devez faire un build natif (voir ci-dessous).

### Méthode 2 : Build Natif (Pour tracking en arrière-plan)

#### Option A : EAS Build (Recommandé - Plus simple)

1. Créer un compte Expo : https://expo.dev/signup

2. Installer EAS CLI :
```bash
npm install -g eas-cli
eas login
```

3. Configurer le projet :
```bash
eas build:configure
```

4. Build pour votre plateforme :

**Pour Android (APK) :**
```bash
eas build --platform android --profile preview
```

**Pour iOS (Simulator) :**
```bash
eas build --platform ios --profile preview
```

**Pour production :**
```bash
# Android (Play Store)
eas build --platform android --profile production

# iOS (App Store)
eas build --platform ios --profile production
```

5. Télécharger l'APK/IPA et installer sur votre téléphone

#### Option B : Build Local

**Android :**
```bash
npx expo run:android
```

**iOS :**
```bash
npx expo run:ios
```

## 📱 Utilisation

### Première utilisation

1. **Lancez l'app**
2. **Autorisez les permissions** :
   - ✅ Localisation "Toujours" (crucial !)
   - ✅ Notifications
3. **Appuyez sur "⚓ Commencer l'Exploration"**
4. **Sortez à l'extérieur** (meilleur signal GPS)
5. **Verrouillez votre écran ou changez d'app** - ça continue à tracker ! 🎉

### Pendant le tracking

- 📊 **Ouvrez le panneau d'infos** pour voir les statistiques
- 🔔 **Notifications régulières** vous informent de la progression
- 📍 **L'icône GPS** reste visible (Android) ou barre bleue (iOS)
- 🔋 **Optimisé batterie** - peut tenir plusieurs heures

### Arrêt

- ⏸ **Appuyez sur "Pause"** pour arrêter
- 💾 **Tout est sauvegardé automatiquement**
- 🔄 **Reprenez** plus tard en relançant

### Nouvelle carte

- 🗑 **"Nouvelle Carte"** efface tout et recommence
- ⚠️ **Confirmation** demandée pour éviter les erreurs

## ⚙️ Configuration des Permissions

### iOS

Dans `app.json`, les permissions sont déjà configurées :

```json
"NSLocationAlwaysAndWhenInUseUsageDescription": "..."
"NSLocationAlwaysUsageDescription": "..."
"UIBackgroundModes": ["location"]
```

**Sur votre iPhone** :
1. Réglages → Cartographia
2. Localisation → **"Toujours"** (pas "Lors de l'utilisation")
3. Localisation précise → **Activé**

### Android

Permissions dans `app.json` :

```json
"ACCESS_FINE_LOCATION"
"ACCESS_BACKGROUND_LOCATION"
"FOREGROUND_SERVICE"
"FOREGROUND_SERVICE_LOCATION"
```

**Sur votre Android** :
1. Paramètres → Applications → Cartographia
2. Autorisations → Localisation → **"Autoriser tout le temps"**
3. Localisation précise → **Activée**

## 🔋 Optimisation Batterie

### Configuration Intelligente

L'app utilise :
- ⏱️ **5 secondes** OU **10 mètres** entre les mises à jour
- 🎯 **High Accuracy** pour précision maximale
- 📉 **ActivityType.Fitness** pour optimiser batterie
- 🔄 **Ne se met pas en pause** automatiquement

### Conseils d'utilisation

- ✅ **Charge complète** avant une longue exploration
- 🔌 **Batterie externe** pour sorties 3h+
- 🌓 **Mode économie d'énergie** compatible (l'app continue)
- 📵 **Mode avion + GPS** = batterie maximale (mais pas de data)

### Consommation attendue

- 🏃 **Marche/Course** : ~15-20% batterie/heure
- 🚴 **Vélo** : ~10-15% batterie/heure
- 🚗 **Voiture** : ~8-12% batterie/heure

## 📊 Stockage des Données

- 💾 **AsyncStorage** - Données locales
- 🔄 **Sauvegarde continue** - Chaque position
- 📦 **Format JSON** simple
- 🗂️ **Clé** : `@cartographia_path`

### Exporter vos données (à venir)

Futures fonctionnalités prévues :
- 📤 Export GPX
- 🌐 Sync cloud
- 📧 Partage par email
- 🗺️ Export image de la carte

## 🔧 Troubleshooting

### L'app ne track pas en arrière-plan

1. ✅ Vérifiez que vous avez fait un **build natif** (pas Expo Go)
2. ✅ Permission "Toujours" accordée
3. ✅ Localisation activée sur le téléphone
4. ✅ App non fermée de force dans le gestionnaire de tâches
5. ✅ Pas de "mode économie d'énergie extrême" activé

### Pas de notifications

1. ✅ Autorisez les notifications dans les paramètres
2. ✅ Ne pas mettre en "Ne pas déranger"
3. ✅ Vérifiez que l'app a l'autorisation

### GPS imprécis

1. 🌍 Sortez à l'extérieur (pas de murs)
2. ⏱️ Attendez 1-2 minutes pour "fix GPS" initial
3. 🛰️ Ciel dégagé = meilleure précision
4. 📶 Données mobiles activées = GPS assisté plus rapide

### Batterie s'épuise vite

1. 🔆 Réduisez la luminosité d'écran
2. 📵 Désactivez Bluetooth/WiFi si pas nécessaires
3. 🔋 Mode économie d'énergie compatible
4. 📱 Fermez les autres apps gourmandes

## 📚 Documentation Technique

### Stack Technique

- **Framework** : React Native (Expo)
- **Géolocalisation** : `expo-location`
- **Background Tasks** : `expo-task-manager`
- **Notifications** : `expo-notifications`
- **Stockage** : `@react-native-async-storage/async-storage`
- **Graphics** : `react-native-svg`

### APIs Utilisées

- `Location.startLocationUpdatesAsync()` - Tracking arrière-plan
- `Location.watchPositionAsync()` - Tracking premier-plan
- `TaskManager.defineTask()` - Tâches background
- `Notifications.scheduleNotificationAsync()` - Notifications

### Configuration Expo

Voir `app.json` pour :
- Permissions iOS/Android
- Background modes
- Foreground service config

## 🚀 Prochaines Fonctionnalités

- [ ] Visualisation de la carte réelle (MapView)
- [ ] Export GPX/KML
- [ ] Statistiques avancées (vitesse, dénivelé)
- [ ] Mode offline complet
- [ ] Synchronisation cloud
- [ ] Partage social
- [ ] Historique des explorations
- [ ] Thèmes de cartes

## 📝 Notes Importantes

### iOS

- ⚠️ Nécessite un **compte Apple Developer** ($99/an) pour distribuer
- 📱 TestFlight gratuit pour bêta-testeurs (max 10,000)
- 🔵 **Barre bleue** visible quand GPS actif en arrière-plan
- ⚡ iOS est très strict sur la batterie

### Android

- ✅ **Gratuit** pour publier sur Play Store (25$ one-time)
- 🔔 **Notification permanente** obligatoire pour foreground service
- 🟢 **Icône GPS** dans la barre de notification
- 🔋 Moins restrictif qu'iOS sur background tasks

## 📞 Support

Pour toute question :
- 📖 Documentation Expo : https://docs.expo.dev/
- 🌍 Location API : https://docs.expo.dev/versions/latest/sdk/location/
- 🔔 Notifications : https://docs.expo.dev/versions/latest/sdk/notifications/

---

⚜️ **Bonne exploration, cartographe !** 🗺️🧭

💡 **Pro Tip** : Pour une exploration longue durée, activez le mode avion AVEC GPS pour économiser 50% de batterie !
