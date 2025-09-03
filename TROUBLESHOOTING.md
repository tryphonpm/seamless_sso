# Guide de dépannage - Installation npm

## Erreur -4048 lors de npm install

### Problème identifié
Le code d'erreur -4048 est un code d'erreur Windows qui peut avoir plusieurs causes.

### Solutions à essayer (dans l'ordre)

#### 1. Nettoyer le cache npm
```bash
npm cache clean --force
```

#### 2. Supprimer node_modules et package-lock.json
```bash
rmdir /s node_modules
del package-lock.json
```

#### 3. Mettre à jour npm
```bash
npm install -g npm@latest
```

#### 4. Installer avec des options spécifiques pour Windows
```bash
# Option 1 : Désactiver les liens symboliques
npm install --no-optional --no-shrinkwrap --no-package-lock

# Option 2 : Utiliser un cache différent
npm install --cache C:\temp\npm-cache

# Option 3 : Installer en mode administrateur
# Ouvrir PowerShell en tant qu'administrateur puis :
npm install
```

#### 5. Configuration npm pour Windows
```bash
# Configurer npm pour éviter les problèmes de chemins longs
npm config set scripts-prepend-node-path true
npm config set fund false
npm config set audit false
```

#### 6. Utiliser yarn comme alternative
```bash
# Installer yarn globalement
npm install -g yarn

# Installer les dépendances avec yarn
yarn install
```

#### 7. Installation manuelle des dépendances problématiques
Si certaines dépendances posent problème, les installer séparément :

```bash
# Dépendances principales
npm install nuxt@^3.8.0 --save-dev
npm install @nuxtjs/tailwindcss@^6.8.4
npm install @pinia/nuxt@^0.5.1
npm install pinia@^2.1.7

# Dépendances d'authentification
npm install ldapjs@^3.0.5
npm install passport@^0.6.0
npm install passport-saml@^3.2.4
npm install jsonwebtoken@^9.0.2
npm install bcryptjs@^2.4.3

# Dépendances de session
npm install express-session@^1.17.3
npm install connect-redis@^7.1.0
npm install redis@^4.6.10
npm install cookie-parser@^1.4.6
npm install dotenv@^16.3.1
```

### Vérifications système

#### Vérifier les permissions
1. S'assurer que le dossier P:\DEV-GIT\SSO a les bonnes permissions
2. Exécuter le terminal en tant qu'administrateur si nécessaire

#### Vérifier l'antivirus
1. Ajouter le dossier du projet aux exceptions de l'antivirus
2. Désactiver temporairement la protection en temps réel

#### Vérifier l'espace disque
1. S'assurer qu'il y a suffisamment d'espace libre sur le disque P:
2. Nettoyer les fichiers temporaires si nécessaire

### Package.json simplifié

Si les problèmes persistent, utiliser cette version simplifiée du package.json :

```json
{
  "name": "nuxt-sso-ad",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview"
  },
  "devDependencies": {
    "nuxt": "^3.8.0"
  },
  "dependencies": {
    "@nuxtjs/tailwindcss": "^6.8.4",
    "ldapjs": "^3.0.5",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}
```

Puis ajouter les autres dépendances progressivement.

### Alternative avec pnpm

```bash
# Installer pnpm
npm install -g pnpm

# Installer les dépendances
pnpm install
```

### Si rien ne fonctionne

1. **Changer d'emplacement** : Déplacer le projet vers C:\dev\sso (chemin plus court)
2. **Utiliser WSL** : Installer et utiliser Windows Subsystem for Linux
3. **Docker** : Utiliser un conteneur de développement

### Commandes de diagnostic

```bash
# Vérifier la configuration npm
npm config list

# Vérifier les versions
node --version
npm --version

# Tester la connectivité
npm ping

# Vérifier les permissions sur le dossier
icacls P:\DEV-GIT\SSO
```
