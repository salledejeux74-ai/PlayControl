# Guide de Génération des Fichiers Exécutables — PolyControl

Ce guide explique comment compiler l'application PolyControl en fichier exécutable installable pour **Windows** (.exe) et **macOS** (.dmg), et où trouver les fichiers générés.

---

## 🛠️ Prérequis

Avant de lancer le build, assurez-vous d'avoir installé les dépendances du projet depuis le dossier `app/` :

```bash
cd app
pnpm install
```

---

## 🚀 Commandes de Build (Génération)

Toutes les commandes doivent être exécutées depuis le dossier `app/`.

### 1. Générer pour macOS (.dmg)

Pour compiler l'application sous forme de fichier `.dmg` (installateur Mac universel compatible Intel et Apple Silicon) :

```bash
cd app
CSC_IDENTITY_AUTO_DISCOVERY=false pnpm run electron:build:mac
```
> **Note** : La variable d'environnement `CSC_IDENTITY_AUTO_DISCOVERY=false` permet de bypasser l'étape de signature avec certificat Apple Developer sur votre trousseau d'accès local pour éviter les blocages de compilation.

### 2. Générer pour Windows (.exe)

Pour compiler l'application sous forme de fichier `.exe` d'installation (NSIS avec raccourci bureau et dossier d'installation configurable) :

```bash
cd app
pnpm run electron:build:win
```

### 3. Générer pour toutes les plateformes à la fois

```bash
cd app
pnpm run electron:build
```

---

## 📂 Où trouver les fichiers générés ?

Une fois la compilation terminée avec succès, les installateurs se trouvent dans le dossier de sortie configuré :

* **Chemin absolu** : `/Users/mac/Music/PlayControl/app/release`
* **Dossier local** : `app/release/`

### Fichiers générés :

1. **Pour macOS** :
   - Fichier : `app/release/PolyControl-1.0.0-mac.dmg`
   - Ce fichier double-cliquable contient l'installateur classique glisser-déposer vers le dossier Applications.

2. **Pour Windows** :
   - Fichier : `app/release/PolyControl-1.0.0-setup-win.exe`
   - Ce fichier double-cliquable est l'assistant d'installation NSIS complet pour PC Windows.
