export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    './modules/sso-ad'
  ],
  
  // Configuration SSO
  ssoAd: {
    // Configuration Active Directory
    ad: {
      url: process.env.AD_URL || 'ldap://localhost:389',
      baseDN: process.env.AD_BASE_DN || 'dc=example,dc=com',
      username: process.env.AD_USERNAME || '',
      password: process.env.AD_PASSWORD || ''
    },
    
    // Configuration SAML (optionnel)
    saml: {
      enabled: process.env.SAML_ENABLED === 'true',
      entryPoint: process.env.SAML_ENTRY_POINT || '',
      issuer: process.env.SAML_ISSUER || 'nuxt-sso-app',
      callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:3000/auth/saml/callback',
      cert: process.env.SAML_CERT || ''
    },
    
    // Configuration des sessions
    session: {
      secret: process.env.SESSION_SECRET || 'session-secret-super-secure-changez-en-production-2024-' + Math.random().toString(36),
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    },
    
    // Configuration JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'jwt-secret-super-secure-changez-en-production-2024-' + Math.random().toString(36),
      expiresIn: '24h'
    },
    
    // Pages de redirection
    redirects: {
      login: '/auth/login',
      home: '/dashboard',
      unauthorized: '/auth/unauthorized'
    }
  },
  
  runtimeConfig: {
    // Clés privées (accessibles uniquement côté serveur)
    adUrl: process.env.AD_URL,
    adBaseDn: process.env.AD_BASE_DN,
    adUsername: process.env.AD_USERNAME,
    adPassword: process.env.AD_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    
    // Clés publiques (accessibles côté client)
    public: {
      appName: 'SSO Application',
      samlEnabled: process.env.SAML_ENABLED === 'true'
    }
  }
})
