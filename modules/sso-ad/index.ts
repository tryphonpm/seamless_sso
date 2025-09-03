import { defineNuxtModule, createResolver, addServerHandler, addPlugin, addImports } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  ad: {
    url: string
    baseDN: string
    username: string
    password: string
  }
  saml: {
    enabled: boolean
    entryPoint: string
    issuer: string
    callbackUrl: string
    cert: string
  }
  session: {
    secret: string
    maxAge: number
    secure: boolean
    httpOnly: boolean
  }
  jwt: {
    secret: string
    expiresIn: string
  }
  redirects: {
    login: string
    home: string
    unauthorized: string
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'sso-ad',
    configKey: 'ssoAd',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    ad: {
      url: 'ldap://localhost:389',
      baseDN: 'dc=example,dc=com',
      username: '',
      password: ''
    },
    saml: {
      enabled: false,
      entryPoint: '',
      issuer: 'nuxt-sso-app',
      callbackUrl: 'http://localhost:3000/auth/saml/callback',
      cert: ''
    },
    session: {
      secret: 'change-me-in-production',
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true
    },
    jwt: {
      secret: 'change-me-in-production',
      expiresIn: '24h'
    },
    redirects: {
      login: '/auth/login',
      home: '/dashboard',
      unauthorized: '/auth/unauthorized'
    }
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Fusionner les options avec les valeurs par défaut
    const moduleOptions = defu(options, nuxt.options.ssoAd)

    // Ajouter les options à la configuration runtime
    nuxt.options.runtimeConfig.ssoAd = moduleOptions

    // Ajouter les gestionnaires de serveur pour l'authentification
    addServerHandler({
      route: '/api/auth/login',
      handler: resolver.resolve('./runtime/server/api/auth/login.post')
    })

    addServerHandler({
      route: '/api/auth/logout',
      handler: resolver.resolve('./runtime/server/api/auth/logout.post')
    })

    addServerHandler({
      route: '/api/auth/me',
      handler: resolver.resolve('./runtime/server/api/auth/me.get')
    })

    addServerHandler({
      route: '/api/auth/refresh',
      handler: resolver.resolve('./runtime/server/api/auth/refresh.post')
    })

    // Gestionnaires SAML si activé
    if (moduleOptions.saml.enabled) {
      addServerHandler({
        route: '/auth/saml',
        handler: resolver.resolve('./runtime/server/api/auth/saml.get')
      })

      addServerHandler({
        route: '/auth/saml/callback',
        handler: resolver.resolve('./runtime/server/api/auth/saml-callback.post')
      })
    }

    // Ajouter le plugin côté client
    addPlugin(resolver.resolve('./runtime/plugin.client'))

    // Ajouter les composables
    addImports([
      {
        name: 'useAuth',
        from: resolver.resolve('./runtime/composables/useAuth')
      },
      {
        name: 'useAuthUser',
        from: resolver.resolve('./runtime/composables/useAuthUser')
      }
    ])

    // Ajouter le middleware d'authentification
    nuxt.hook('nitro:config', async (nitroConfig) => {
      nitroConfig.plugins = nitroConfig.plugins || []
      nitroConfig.plugins.push(resolver.resolve('./runtime/server/plugins/auth'))
    })
  }
})
