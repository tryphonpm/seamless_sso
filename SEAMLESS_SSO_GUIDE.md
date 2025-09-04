# Guide d'installation du SSO Transparent (Seamless SSO)

## 📋 Vue d'ensemble

Ce guide détaille l'installation complète d'un SSO transparent pour votre application Nuxt avec Active Directory. L'utilisateur sera automatiquement authentifié sans saisir ses identifiants s'il est déjà connecté au domaine Windows.

## 🎯 Architecture cible

```
Utilisateur Windows → Domaine AD → Application Nuxt
     ↓                    ↓              ↓
Session Windows → Token Kerberos → JWT Application
```

---

## 🔧 Prérequis techniques

### Côté serveur Windows/IIS
- **Windows Server** avec IIS 7.0+
- **Active Directory** configuré
- **Module IIS Authentication** installé
- **Certificats SSL** valides
- **DNS** correctement configuré

### Côté client
- **Navigateurs** : IE, Edge, Chrome (avec configuration)
- **Domaine Windows** : Postes joints au domaine AD
- **Intranet Zone** : Site ajouté aux sites de confiance

---

## 📦 Étape 1 : Configuration du projet Nuxt

### 1.1 Mise à jour de la configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-09-03',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    './modules/sso-ad'
  ],
  
  ssoAd: {
    // Configuration Active Directory
    ad: {
      url: process.env.AD_URL || 'ldap://dc.votre-domaine.com:389',
      baseDN: process.env.AD_BASE_DN || 'dc=votre-domaine,dc=com',
      username: process.env.AD_USERNAME || 'service-account@votre-domaine.com',
      password: process.env.AD_PASSWORD || 'mot-de-passe-service'
    },
    
    // Configuration SSO Windows
    windowsAuth: {
      enabled: process.env.WINDOWS_AUTH_ENABLED === 'true',
      fallbackToForm: true,
      trustedNetworks: ['192.168.0.0/16', '10.0.0.0/8'],
      browserSupport: ['IE', 'Edge', 'Chrome'],
      domain: process.env.AD_DOMAIN || 'VOTRE-DOMAINE'
    },
    
    // Configuration JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'votre-secret-jwt-super-securise',
      expiresIn: '8h' // Durée de session de travail
    },
    
    // Pages de redirection
    redirects: {
      login: '/auth/login',
      home: '/dashboard',
      unauthorized: '/auth/unauthorized'
    }
  },
  
  runtimeConfig: {
    // Clés privées serveur
    adUrl: process.env.AD_URL,
    adBaseDn: process.env.AD_BASE_DN,
    adUsername: process.env.AD_USERNAME,
    adPassword: process.env.AD_PASSWORD,
    adDomain: process.env.AD_DOMAIN,
    jwtSecret: process.env.JWT_SECRET,
    windowsAuthEnabled: process.env.WINDOWS_AUTH_ENABLED,
    
    // Clés publiques client
    public: {
      appName: 'Application SSO',
      domain: process.env.AD_DOMAIN
    }
  }
})
```

### 1.2 Variables d'environnement

Créez un fichier `.env` :

```bash
# Configuration Active Directory
AD_URL=ldap://dc.votre-domaine.com:389
AD_BASE_DN=dc=votre-domaine,dc=com
AD_USERNAME=service-account@votre-domaine.com
AD_PASSWORD=MotDePasseService123!
AD_DOMAIN=VOTRE-DOMAINE

# Configuration JWT
JWT_SECRET=votre-secret-jwt-super-securise-changez-en-production

# Configuration SSO
WINDOWS_AUTH_ENABLED=true
SESSION_SECRET=votre-secret-session-super-securise

# Configuration serveur
NODE_ENV=production
```

---

## 🔐 Étape 2 : Implémentation de l'authentification Windows

### 2.1 Service d'authentification Windows

```typescript
// modules/sso-ad/runtime/server/utils/windows-auth.ts
import { createHash } from 'crypto'
import { LdapService } from './ldap'
import { JwtService } from './jwt'

export interface WindowsAuthResult {
  success: boolean
  user?: any
  token?: string
  error?: string
}

export class WindowsAuthService {
  private ldapService: LdapService
  private jwtService: JwtService
  private domain: string

  constructor(config: any) {
    this.ldapService = new LdapService({
      url: config.adUrl,
      baseDN: config.adBaseDn,
      username: config.adUsername,
      password: config.adPassword
    })
    this.jwtService = new JwtService(config.jwtSecret)
    this.domain = config.adDomain
  }

  async authenticateWithNTLM(ntlmToken: string): Promise<WindowsAuthResult> {
    try {
      // Décoder le token NTLM (Type 3 message)
      const userInfo = this.parseNTLMType3(ntlmToken)
      
      if (!userInfo.username) {
        return { success: false, error: 'Impossible d\'extraire le nom d\'utilisateur' }
      }

      // Récupérer les informations utilisateur depuis AD
      const adUser = await this.ldapService.findUser(userInfo.username)
      
      if (!adUser) {
        return { success: false, error: 'Utilisateur non trouvé dans AD' }
      }

      // Récupérer les groupes
      const groups = await this.ldapService.getUserGroups(userInfo.username)

      // Générer le token JWT
      const jwtToken = this.jwtService.generateToken({
        userId: adUser.sAMAccountName,
        username: adUser.sAMAccountName,
        email: adUser.mail,
        domain: userInfo.domain || this.domain,
        groups: groups,
        authMethod: 'windows'
      })

      await this.ldapService.disconnect()

      return {
        success: true,
        user: {
          id: adUser.sAMAccountName,
          username: adUser.sAMAccountName,
          email: adUser.mail,
          name: adUser.cn,
          firstName: adUser.givenName,
          lastName: adUser.sn,
          department: adUser.department,
          title: adUser.title,
          groups: groups
        },
        token: jwtToken
      }

    } catch (error: any) {
      console.error('Erreur authentification Windows:', error)
      return { success: false, error: error.message }
    }
  }

  private parseNTLMType3(token: string): { username: string, domain?: string } {
    try {
      // Décoder le token base64
      const buffer = Buffer.from(token, 'base64')
      
      // Parser le message NTLM Type 3
      // Structure simplifiée - en production, utiliser une bibliothèque spécialisée
      const signature = buffer.slice(0, 8).toString()
      
      if (signature !== 'NTLMSSP\0') {
        throw new Error('Token NTLM invalide')
      }

      // Extraire les offsets et longueurs (structure NTLM)
      const domainLength = buffer.readUInt16LE(28)
      const domainOffset = buffer.readUInt32LE(32)
      const userLength = buffer.readUInt16LE(36)
      const userOffset = buffer.readUInt32LE(40)

      // Extraire domaine et utilisateur
      const domain = buffer.slice(domainOffset, domainOffset + domainLength).toString('utf16le')
      const username = buffer.slice(userOffset, userOffset + userLength).toString('utf16le')

      return { username, domain }

    } catch (error) {
      console.error('Erreur parsing NTLM:', error)
      // Fallback : essayer d'extraire depuis les headers
      return { username: '' }
    }
  }

  async validateKerberosTicket(ticket: string): Promise<WindowsAuthResult> {
    try {
      // TODO: Implémenter la validation Kerberos
      // En production, utiliser une bibliothèque comme 'kerberos' ou 'node-krb5'
      
      return { success: false, error: 'Validation Kerberos non implémentée' }
      
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
```

### 2.2 API d'authentification Windows

```typescript
// modules/sso-ad/runtime/server/api/auth/windows-auth.get.ts
import { WindowsAuthService } from '../../utils/windows-auth'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    if (!config.windowsAuthEnabled) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Authentification Windows désactivée'
      })
    }

    const authHeader = getHeader(event, 'authorization')
    const userAgent = getHeader(event, 'user-agent') || ''
    
    // Vérifier si le navigateur supporte l'authentification intégrée
    const supportedBrowsers = ['Trident', 'Edge', 'Chrome']
    const browserSupported = supportedBrowsers.some(browser => 
      userAgent.includes(browser)
    )

    if (!browserSupported) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Navigateur non supporté pour l\'authentification Windows'
      })
    }

    if (!authHeader) {
      // Première requête - demander l'authentification
      setResponseHeader(event, 'WWW-Authenticate', 'Negotiate')
      setResponseHeader(event, 'WWW-Authenticate', 'NTLM')
      
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentification Windows requise'
      })
    }

    const windowsAuthService = new WindowsAuthService(config)
    let result: any

    if (authHeader.startsWith('Negotiate ')) {
      // Token Kerberos
      const ticket = authHeader.substring(10)
      result = await windowsAuthService.validateKerberosTicket(ticket)
    } else if (authHeader.startsWith('NTLM ')) {
      // Token NTLM
      const token = authHeader.substring(5)
      result = await windowsAuthService.authenticateWithNTLM(token)
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type d\'authentification non supporté'
      })
    }

    if (!result.success) {
      throw createError({
        statusCode: 401,
        statusMessage: result.error || 'Échec de l\'authentification Windows'
      })
    }

    // Définir le cookie JWT
    setCookie(event, 'auth-token', result.token!, {
      httpOnly: true,
      secure: config.public.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 heures
      domain: config.public.domain ? `.${config.public.domain}` : undefined
    })

    return {
      success: true,
      user: result.user,
      authMethod: 'windows',
      message: 'Authentification Windows réussie'
    }

  } catch (error: any) {
    console.error('Erreur authentification Windows:', error)
    
    // En cas d'erreur, rediriger vers le formulaire de connexion
    if (error.statusCode === 401 && getQuery(event).fallback !== 'false') {
      throw createError({
        statusCode: 302,
        statusMessage: 'Redirection vers formulaire de connexion',
        data: { location: '/auth/login?reason=windows_auth_failed' }
      })
    }
    
    throw error
  }
})
```

### 2.3 Middleware d'auto-détection

```typescript
// middleware/auto-sso.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Éviter sur les pages publiques
  const publicRoutes = ['/auth/login', '/', '/public', '/api']
  if (publicRoutes.some(route => to.path.startsWith(route))) {
    return
  }

  // Vérifier si déjà authentifié
  const token = useCookie('auth-token')
  if (token.value) {
    return // Déjà authentifié
  }

  // Tenter l'authentification Windows automatique
  if (process.client) {
    try {
      const config = useRuntimeConfig()
      
      if (config.public.windowsAuthEnabled) {
        const response = await fetch('/api/auth/windows-auth', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          // Authentification réussie, recharger la page
          window.location.reload()
          return
        }
      }
    } catch (error) {
      console.log('Authentification Windows échouée, redirection vers login')
    }

    // Si l'authentification Windows échoue, rediriger vers login
    return navigateTo('/auth/login')
  }
})
```

---

## 🌐 Étape 3 : Configuration IIS

### 3.1 web.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Configuration de l'authentification -->
    <security>
      <authentication>
        <windowsAuthentication enabled="true">
          <providers>
            <add value="Negotiate" />
            <add value="NTLM" />
          </providers>
        </windowsAuthentication>
        <anonymousAuthentication enabled="true" />
      </authentication>
    </security>
    
    <!-- Configuration des en-têtes -->
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Credentials" value="true" />
        <add name="Access-Control-Allow-Origin" value="https://votre-app.votre-domaine.com" />
        <add name="Access-Control-Allow-Headers" value="Authorization, Content-Type" />
        <add name="Access-Control-Allow-Methods" value="GET, POST, OPTIONS" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Gestion des erreurs -->
    <httpErrors errorMode="Detailed" />
    
    <!-- Configuration Node.js -->
    <handlers>
      <add name="iisnode" path="*.js" verb="*" modules="iisnode" />
    </handlers>
    
    <!-- Réécriture d'URL -->
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Configuration iisnode -->
    <iisnode 
      nodeProcessCommandLine="&quot;%programfiles%\nodejs\node.exe&quot;"
      interceptor="&quot;%programfiles%\iisnode\interceptor.js&quot;" />
      
  </system.webServer>
</configuration>
```

### 3.2 Configuration du site IIS

1. **Créer le site** dans IIS Manager
2. **Configurer l'authentification** :
   - Activer "Windows Authentication"
   - Configurer les fournisseurs : Negotiate, NTLM
   - Désactiver "Anonymous Authentication" pour les routes protégées

3. **Configurer les SPN** (Service Principal Names) :
```cmd
setspn -A HTTP/votre-app.votre-domaine.com DOMAINE\ServiceAccount
setspn -A HTTP/votre-app DOMAINE\ServiceAccount
```

---

## 🖥️ Étape 4 : Configuration côté client

### 4.1 Internet Explorer / Edge

1. **Sites de confiance** :
   - Panneau de configuration → Options Internet
   - Onglet Sécurité → Sites de confiance
   - Ajouter : `https://votre-app.votre-domaine.com`

2. **Authentification automatique** :
   - Sites de confiance → Niveau personnalisé
   - Activer "Connexion automatique avec nom d'utilisateur et mot de passe actuels"

### 4.2 Google Chrome

Configuration via GPO ou ligne de commande :

```cmd
# Ajouter aux arguments de Chrome
--auth-server-whitelist="votre-app.votre-domaine.com"
--auth-negotiate-delegate-whitelist="votre-app.votre-domaine.com"
```

Ou via registre Windows :
```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome]
"AuthServerWhitelist"="votre-app.votre-domaine.com"
"AuthNegotiateDelegateWhitelist"="votre-app.votre-domaine.com"
```

### 4.3 Firefox

Configuration dans `about:config` :
```
network.negotiate-auth.trusted-uris = .votre-domaine.com
network.negotiate-auth.delegation-uris = .votre-domaine.com
network.automatic-ntlm-auth.trusted-uris = .votre-domaine.com
```

---

## 🚀 Étape 5 : Déploiement et test

### 5.1 Build de production

```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Déployer sur IIS
xcopy /E /I /Y .output\* C:\inetpub\wwwroot\votre-app\
```

### 5.2 Tests de validation

```typescript
// scripts/test-sso.js
const https = require('https')

async function testSSO() {
  console.log('🧪 Test du SSO transparent...')
  
  try {
    const response = await fetch('https://votre-app.votre-domaine.com/api/auth/windows-auth', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ SSO fonctionne:', data.user.username)
    } else {
      console.log('❌ SSO échoué:', response.status)
    }
  } catch (error) {
    console.error('❌ Erreur test SSO:', error)
  }
}

testSSO()
```

### 5.3 Vérifications

1. **DNS** : `nslookup votre-app.votre-domaine.com`
2. **Certificat SSL** : Valide et reconnu
3. **Connectivité AD** : Test LDAP depuis le serveur
4. **SPN** : `setspn -L ServiceAccount`
5. **Logs IIS** : Vérifier les authentifications

---

## 🔧 Dépannage courant

### Erreur 401 - Unauthorized

**Causes possibles** :
- SPN manquants ou incorrects
- Service account sans permissions
- Navigateur non configuré
- Site pas dans la zone intranet

**Solutions** :
```cmd
# Vérifier les SPN
setspn -L ServiceAccount

# Recréer les SPN
setspn -D HTTP/votre-app.votre-domaine.com DOMAINE\ServiceAccount
setspn -A HTTP/votre-app.votre-domaine.com DOMAINE\ServiceAccount
```

### Erreur NTLM - Token invalide

**Solutions** :
- Vérifier la synchronisation de l'heure
- Redémarrer le service IIS
- Vérifier les permissions du service account

### Performance lente

**Optimisations** :
- Mise en cache des groupes AD
- Pool de connexions LDAP
- Compression IIS activée

---

## 📊 Monitoring et logs

### Logs d'authentification

```typescript
// modules/sso-ad/runtime/server/utils/auth-logger.ts
export class AuthLogger {
  static logAuth(event: any, result: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: getClientIP(event),
      userAgent: getHeader(event, 'user-agent'),
      username: result.user?.username,
      authMethod: result.authMethod,
      success: result.success,
      error: result.error
    }
    
    console.log('AUTH:', JSON.stringify(logEntry))
    
    // En production, envoyer vers un système de log centralisé
    // await sendToLogSystem(logEntry)
  }
}
```

---

## ✅ Checklist finale

- [ ] Configuration Active Directory validée
- [ ] Variables d'environnement définies
- [ ] Module SSO configuré dans Nuxt
- [ ] APIs d'authentification Windows implémentées
- [ ] web.config IIS configuré
- [ ] SPN créés et validés
- [ ] Navigateurs clients configurés
- [ ] Tests de bout en bout réussis
- [ ] Monitoring en place
- [ ] Documentation utilisateur créée

---

## 📚 Ressources supplémentaires

- [Documentation Microsoft IIS Authentication](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/security/authentication/)
- [Guide Kerberos Windows](https://docs.microsoft.com/en-us/windows-server/security/kerberos/)
- [Configuration navigateurs pour SSO](https://docs.microsoft.com/en-us/troubleshoot/browsers/enhanced-security-configuration-faq)

Le SSO transparent est maintenant configuré ! Les utilisateurs du domaine seront automatiquement authentifiés sans saisir leurs identifiants.
