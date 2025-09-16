// Module principal SFTP
import { defineNuxtModule, createResolver, addServerHandler, addPlugin, addImports } from '@nuxt/kit'
import { defu } from 'defu'

export interface ModuleOptions {
  connections: {
    [key: string]: {
      host: string
      port: number
      username: string
      password?: string
      privateKey?: string
      passphrase?: string
      timeout: number
    }
  }
  security: {
    allowedHosts: string[]
    maxConnections: number
    connectionTimeout: number
    uploadMaxSize: number
  }
  session: {
    secret: string
    maxAge: number
    secure: boolean
    httpOnly: boolean
  }
  paths: {
    tempDir: string
    allowedPaths: string[]
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'sftp',
    configKey: 'sftp',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    connections: {},
    security: {
      allowedHosts: [],
      maxConnections: 10,
      connectionTimeout: 30000,
      uploadMaxSize: 100 * 1024 * 1024 // 100MB
    },
    session: {
      secret: 'change-me-in-production',
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true
    },
    paths: {
      tempDir: './temp',
      allowedPaths: ['/']
    }
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Fusionner les options
    const moduleOptions = defu(options, nuxt.options.sftp)

    // Ajouter aux options runtime
    nuxt.options.runtimeConfig.sftp = moduleOptions

    // Ajouter les gestionnaires de serveur
    addServerHandler({
      route: '/api/sftp/connect',
      handler: resolver.resolve('./runtime/server/api/sftp/connect.post')
    })

    addServerHandler({
      route: '/api/sftp/disconnect',
      handler: resolver.resolve('./runtime/server/api/sftp/disconnect.post')
    })

    addServerHandler({
      route: '/api/sftp/list',
      handler: resolver.resolve('./runtime/server/api/sftp/list.get')
    })

    addServerHandler({
      route: '/api/sftp/upload',
      handler: resolver.resolve('./runtime/server/api/sftp/upload.post')
    })

    addServerHandler({
      route: '/api/sftp/download',
      handler: resolver.resolve('./runtime/server/api/sftp/download.get')
    })

    addServerHandler({
      route: '/api/sftp/delete',
      handler: resolver.resolve('./runtime/server/api/sftp/delete.delete')
    })

    addServerHandler({
      route: '/api/sftp/mkdir',
      handler: resolver.resolve('./runtime/server/api/sftp/mkdir.post')
    })

    addServerHandler({
      route: '/api/sftp/move',
      handler: resolver.resolve('./runtime/server/api/sftp/move.post')
    })

    // Ajouter le plugin côté client
    addPlugin(resolver.resolve('./runtime/plugin.client'))

    // Ajouter les composables
    addImports([
      {
        name: 'useSftp',
        from: resolver.resolve('./runtime/composables/useSftp')
      },
      {
        name: 'useSftpConnections',
        from: resolver.resolve('./runtime/composables/useSftpConnections')
      }
    ])

    // Ajouter le plugin serveur
    nuxt.hook('nitro:config', async (nitroConfig) => {
      nitroConfig.plugins = nitroConfig.plugins || []
      nitroConfig.plugins.push(resolver.resolve('./runtime/server/plugins/sftp'))
    })
  }
})