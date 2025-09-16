export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    './modules/sso-ad',
    './modules/sftp'
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

  // Configuration SFTP
  sftp: {
    connections: {
      server1: {
        host: process.env.SFTP_SERVER1_HOST || 'localhost',
        port: parseInt(process.env.SFTP_SERVER1_PORT || '22'),
        username: process.env.SFTP_SERVER1_USERNAME || '',
        password: process.env.SFTP_SERVER1_PASSWORD || '',
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
  },

  runtimeConfig: {
    // Clés privées (accessibles uniquement côté serveur)
    adUrl: process.env.AD_URL,
    adBaseDn: process.env.AD_BASE_DN,
    adUsername: process.env.AD_USERNAME,
    adPassword: process.env.AD_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,

    // Variables privées serveur pour SFTP
    sftpServer1Host: process.env.SFTP_SERVER1_HOST,
    sftpServer1Username: process.env.SFTP_SERVER1_USERNAME,
    sftpServer1Password: process.env.SFTP_SERVER1_PASSWORD,
    
    // Clés publiques (accessibles côté client)
    public: {
      appName: 'Alfa3a GDSI',
      samlEnabled: process.env.SAML_ENABLED === 'true',
      sftpEnabled: true
    }
  }
})
