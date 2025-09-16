# Module SFTP pour Nuxt 3

Ce module fournit une intégration complète SFTP pour les applications Nuxt 3, permettant la gestion de fichiers sur des serveurs distants avec une interface utilisateur moderne.

## Fonctionnalités

- 🔐 **Authentification sécurisée** avec gestion de sessions
- 📁 **Navigation de fichiers** intuitive avec arborescence
- ⬆️ **Upload de fichiers** avec drag & drop et barre de progression
- ⬇️ **Téléchargement de fichiers** direct depuis l'interface
- 🗂️ **Gestion des dossiers** (création, suppression, navigation)
- ✏️ **Renommage** de fichiers et dossiers
- 🔍 **Recherche et filtrage** des fichiers
- 🔄 **Pool de connexions** pour optimiser les performances
- 🛡️ **Sécurité** avec validation des chemins et contrôle d'accès
- 📱 **Interface responsive** avec Tailwind CSS

## Installation

Le module est déjà intégré dans cette application. Les dépendances nécessaires sont :

```json
{
  "ssh2-sftp-client": "^10.0.3",
  "formidable": "^3.5.1",
  "multer": "^1.4.5-lts.1",
  "mime-types": "^2.1.35"
}
```

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Configuration SFTP Server 1
SFTP_SERVER1_HOST=votre-serveur-sftp.com
SFTP_SERVER1_PORT=22
SFTP_SERVER1_USERNAME=votre-utilisateur-sftp
SFTP_SERVER1_PASSWORD=votre-mot-de-passe-sftp

# Sécurité SFTP
SFTP_ALLOWED_HOSTS=votre-serveur-sftp.com,autre-serveur.com
SFTP_MAX_CONNECTIONS=10
SFTP_CONNECTION_TIMEOUT=30000
SFTP_UPLOAD_MAX_SIZE=104857600

# Session SFTP
SFTP_SESSION_SECRET=votre-secret-session-sftp-tres-long

# Chemins SFTP
SFTP_TEMP_DIR=./temp
SFTP_ALLOWED_PATHS=/,/uploads,/data,/public
```

### 2. Configuration Nuxt

Dans `nuxt.config.ts`, le module est configuré comme suit :

```typescript
export default defineNuxtConfig({
  modules: [
    './modules/sftp'
  ],
  
  sftp: {
    connections: {
      server1: {
        host: process.env.SFTP_SERVER1_HOST || 'localhost',
        port: parseInt(process.env.SFTP_SERVER1_PORT || '22'),
        username: process.env.SFTP_SERVER1_USERNAME || '',
        password: process.env.SFTP_SERVER1_PASSWORD || '',
        timeout: 30000
      },
      // Ajoutez d'autres serveurs si nécessaire
      server2: {
        host: process.env.SFTP_SERVER2_HOST || 'localhost',
        port: parseInt(process.env.SFTP_SERVER2_PORT || '22'),
        username: process.env.SFTP_SERVER2_USERNAME || '',
        password: process.env.SFTP_SERVER2_PASSWORD || '',
        timeout: 30000
      }
    },
    security: {
      allowedHosts: process.env.SFTP_ALLOWED_HOSTS?.split(',') || [],
      maxConnections: parseInt(process.env.SFTP_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.SFTP_CONNECTION_TIMEOUT || '30000'),
      uploadMaxSize: parseInt(process.env.SFTP_UPLOAD_MAX_SIZE || '104857600')
    },
    session: {
      secret: process.env.SFTP_SESSION_SECRET || 'sftp-session-secret',
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    },
    paths: {
      tempDir: process.env.SFTP_TEMP_DIR || './temp',
      allowedPaths: process.env.SFTP_ALLOWED_PATHS?.split(',') || ['/']
    }
  }
})
```

## Utilisation

### 1. Pages disponibles

- `/sftp` - Interface principale avec connexion rapide
- `/sftp/connections` - Gestion des connexions
- `/sftp/browser` - Navigateur de fichiers (composant)

### 2. Composables

#### `useSftp()`

Composable principal pour la gestion SFTP :

```vue
<script setup>
const { 
  currentConnection,
  currentPath,
  files,
  isLoading,
  error,
  connect,
  disconnect,
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  createDirectory
} = useSftp()

// Se connecter à un serveur
await connect('server1')

// Lister les fichiers d'un répertoire
await listFiles('/uploads')

// Upload d'un fichier
await uploadFile(file, '/uploads/nouveau-fichier.txt')

// Télécharger un fichier
await downloadFile('/uploads/fichier.txt', 'fichier.txt')
</script>
```

#### `useSftpConnections()`

Composable pour la gestion des connexions :

```vue
<script setup>
const {
  availableConnections,
  isLoading,
  error,
  testConnection,
  getConnectionInfo,
  markAsConnected
} = useSftpConnections()

// Tester une connexion
const isValid = await testConnection('server1')

// Obtenir les informations d'une connexion
const info = getConnectionInfo('server1')
</script>
```

### 3. Composants

#### `<SftpBrowser />`

Navigateur de fichiers complet avec toutes les fonctionnalités :

```vue
<template>
  <div>
    <SftpBrowser />
  </div>
</template>
```

#### `<SftpUploadZone />`

Zone d'upload avec drag & drop :

```vue
<template>
  <SftpUploadZone 
    :max-file-size="50 * 1024 * 1024"
    @uploaded="handleUploaded"
  />
</template>

<script setup>
const handleUploaded = (files) => {
  console.log('Fichiers uploadés:', files)
}
</script>
```

### 4. API Routes

Le module expose automatiquement les routes API suivantes :

- `POST /api/sftp/connect` - Connexion à un serveur
- `POST /api/sftp/disconnect` - Déconnexion
- `GET /api/sftp/list` - Lister les fichiers
- `POST /api/sftp/upload` - Upload de fichier
- `GET /api/sftp/download` - Téléchargement de fichier
- `DELETE /api/sftp/delete` - Suppression
- `POST /api/sftp/mkdir` - Création de dossier
- `POST /api/sftp/move` - Déplacement/renommage

## Sécurité

### 1. Authentification

Le module utilise le middleware `auth` pour s'assurer que seuls les utilisateurs authentifiés peuvent accéder aux fonctionnalités SFTP.

### 2. Validation des chemins

- Les chemins sont validés contre la liste `allowedPaths`
- Les caractères dangereux sont filtrés
- Navigation limitée aux répertoires autorisés

### 3. Limitation des connexions

- Pool de connexions avec limite configurable
- Timeout automatique des connexions inactives
- Gestion des erreurs de connexion

### 4. Upload sécurisé

- Validation de la taille des fichiers
- Types de fichiers contrôlés
- Stockage temporaire sécurisé

## Architecture

```
modules/sftp/
├── index.ts                    # Module principal
├── runtime/
│   ├── composables/
│   │   ├── useSftp.ts         # Composable principal
│   │   └── useSftpConnections.ts # Gestion connexions
│   ├── server/
│   │   ├── api/sftp/          # Routes API
│   │   ├── utils/
│   │   │   ├── sftp.ts        # Service SFTP
│   │   │   └── connection-pool.ts # Pool de connexions
│   │   └── plugins/
│   │       └── sftp.ts        # Plugin serveur
│   └── plugin.client.ts       # Plugin client
```

## Dépannage

### Erreurs de connexion

1. Vérifiez les variables d'environnement
2. Testez la connexion depuis le serveur
3. Vérifiez les permissions réseau
4. Consultez les logs serveur

### Erreurs d'upload

1. Vérifiez la taille maximale configurée
2. Vérifiez les permissions sur le serveur distant
3. Vérifiez l'espace disque disponible
4. Consultez les logs d'erreur

### Performances

1. Ajustez le nombre maximum de connexions
2. Optimisez le timeout de connexion
3. Utilisez des chemins autorisés spécifiques
4. Surveillez l'utilisation mémoire

## Contribution

Pour contribuer au module SFTP :

1. Respectez la structure existante
2. Ajoutez des tests pour les nouvelles fonctionnalités
3. Documentez les changements
4. Suivez les conventions de code TypeScript

## Support

Pour toute question ou problème :

1. Consultez cette documentation
2. Vérifiez les logs d'erreur
3. Testez avec des connexions simples
4. Contactez l'équipe de développement
