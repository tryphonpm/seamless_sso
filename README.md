# Module SSO Active Directory pour Nuxt 3

Ce module fournit une solution complète d'authentification SSO (Single Sign-On) intégrée avec Active Directory pour les applications Nuxt 3.

## Fonctionnalités

- ✅ Authentification LDAP avec Active Directory
- ✅ Support SAML pour SSO avancé
- ✅ Gestion des sessions avec JWT
- ✅ Middleware d'authentification automatique
- ✅ Composables Vue pour la gestion de l'état utilisateur
- ✅ Gestion des rôles et permissions basée sur les groupes AD
- ✅ Interface d'administration
- ✅ Rafraîchissement automatique des tokens
- ✅ Support TypeScript complet

## Installation

1. **Cloner le projet :**
   ```bash
   git clone <votre-repo>
   cd sso-nuxt-ad
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   ```bash
   cp .env.example .env
   ```
   
   Éditez le fichier `.env` avec vos paramètres Active Directory :
   ```env
   # Configuration Active Directory
   AD_URL=ldap://votre-serveur-ad:389
   AD_BASE_DN=dc=votre-domaine,dc=com
   AD_USERNAME=compte-service@domaine.com
   AD_PASSWORD=mot-de-passe-du-compte-service

   # Configuration SAML (optionnel)
   SAML_ENABLED=false
   SAML_ENTRY_POINT=https://votre-adfs/adfs/ls/
   SAML_ISSUER=nuxt-sso-app
   SAML_CALLBACK_URL=http://localhost:3000/auth/saml/callback
   SAML_CERT=certificat-saml-base64

   # Sécurité
   SESSION_SECRET=votre-cle-secrete-session
   JWT_SECRET=votre-cle-secrete-jwt
   ```

4. **Démarrer l'application :**
   ```bash
   npm run dev
   ```

## Configuration

### Configuration de base

Dans `nuxt.config.ts`, le module est configuré avec les options suivantes :

```typescript
export default defineNuxtConfig({
  modules: ['./modules/sso-ad'],
  
  ssoAd: {
    // Configuration Active Directory
    ad: {
      url: process.env.AD_URL,
      baseDN: process.env.AD_BASE_DN,
      username: process.env.AD_USERNAME,
      password: process.env.AD_PASSWORD
    },
    
    // Configuration SAML
    saml: {
      enabled: process.env.SAML_ENABLED === 'true',
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      callbackUrl: process.env.SAML_CALLBACK_URL,
      cert: process.env.SAML_CERT
    },
    
    // Configuration des sessions
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      secure: process.env.NODE_ENV === 'production'
    },
    
    // Configuration JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h'
    }
  }
})
```

### Configuration Active Directory

1. **Créer un compte de service :** Créez un compte utilisateur dédié dans AD pour les requêtes LDAP
2. **Permissions minimales :** Le compte doit avoir les droits de lecture sur l'annuaire
3. **Test de connexion :** Utilisez l'interface d'administration pour tester la connexion

### Configuration SAML (optionnel)

Pour utiliser SAML avec ADFS :

1. **Configurer ADFS :** Créez une nouvelle application dans ADFS
2. **Certificat :** Récupérez le certificat public d'ADFS
3. **Points de terminaison :** Configurez les URL de callback

## Utilisation

### Composables disponibles

#### `useAuth()`

```vue
<script setup>
const { 
  user,              // Utilisateur connecté
  isAuthenticated,   // État de connexion
  isLoading,         // État de chargement
  login,             // Fonction de connexion
  logout,            // Fonction de déconnexion
  checkPermission,   // Vérifier les permissions
  hasRole           // Vérifier un rôle
} = useAuth()
</script>
```

#### `useAuthUser()`

```vue
<script setup>
const { 
  fullName,      // Nom complet
  initials,      // Initiales
  displayName,   // Nom d'affichage
  isAdmin,       // Est administrateur
  department,    // Département
  groups         // Groupes AD
} = useAuthUser()
</script>
```

### Middleware

#### Middleware global (`auth.global.ts`)
- Protection automatique des routes sensibles
- Redirection vers la page de connexion si non authentifié

#### Middleware admin (`admin.ts`)
- Vérification des droits d'administration
- Basé sur les groupes Active Directory

### Pages protégées

```vue
<script setup>
// Protection par middleware
definePageMeta({
  middleware: 'auth'  // ou 'admin' pour les pages admin
})
</script>
```

### API Routes

- `POST /api/auth/login` - Connexion avec identifiants
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/refresh` - Rafraîchissement du token
- `GET /auth/saml` - Initiation SAML (si activé)
- `POST /auth/saml/callback` - Callback SAML

## Structure du projet

```
modules/sso-ad/
├── index.ts                    # Module principal
└── runtime/
    ├── composables/
    │   ├── useAuth.ts         # Composable principal d'authentification
    │   └── useAuthUser.ts     # Composable utilisateur
    ├── server/
    │   ├── api/auth/          # Routes API d'authentification
    │   ├── utils/
    │   │   ├── ldap.ts        # Service LDAP
    │   │   └── jwt.ts         # Service JWT
    │   └── plugins/
    │       └── auth.ts        # Plugin serveur
    └── plugin.client.ts       # Plugin client

pages/
├── index.vue                  # Page d'accueil
├── auth/
│   └── login.vue             # Page de connexion
├── dashboard/
│   └── index.vue             # Tableau de bord utilisateur
└── admin/
    └── index.vue             # Interface d'administration

middleware/
├── auth.global.ts            # Middleware global d'authentification
└── admin.ts                  # Middleware administrateur
```

## Sécurité

### Bonnes pratiques implémentées

- **Tokens JWT sécurisés** avec expiration
- **Cookies httpOnly** pour éviter les attaques XSS
- **Validation côté serveur** de tous les tokens
- **Hachage sécurisé** des mots de passe (délégué à AD)
- **Protection CSRF** avec SameSite cookies
- **Logs d'audit** des connexions

### Recommandations

1. **HTTPS obligatoire** en production
2. **Certificats SSL valides** pour LDAP/SAML
3. **Rotation régulière** des secrets JWT/Session
4. **Monitoring** des tentatives de connexion
5. **Sauvegarde** des configurations

## Dépannage

### Problèmes courants

#### Erreur de connexion LDAP
```bash
# Tester la connectivité
telnet votre-serveur-ad 389
```

#### Token JWT invalide
- Vérifier la configuration `JWT_SECRET`
- Contrôler l'expiration des tokens
- Vider le cache navigateur

#### Permissions insuffisantes
- Vérifier les groupes AD de l'utilisateur
- Contrôler la configuration des rôles

### Logs et débogage

Les logs sont disponibles dans la console serveur et via l'interface d'administration.

## Développement

### Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Prévisualisation
npm run preview
```

### Tests

```bash
# Tests unitaires (à implémenter)
npm run test

# Tests d'intégration LDAP
npm run test:ldap
```

## Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Créer une Pull Request

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## Support

Pour toute question ou problème :
1. Consulter la documentation
2. Vérifier les issues GitHub existantes
3. Créer une nouvelle issue si nécessaire

---

**Note :** Ce module est conçu pour fonctionner avec Active Directory et ADFS. Pour d'autres fournisseurs d'identité, des adaptations peuvent être nécessaires.
