// Route API SFTP - Liste des connexions disponibles
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const sftpConfig = config.sftp || {}
    const connections = sftpConfig.connections || {}

    // Transformer les connexions en format public (sans mots de passe)
    const publicConnections = Object.entries(connections).map(([id, conn]: [string, any]) => ({
      id,
      name: conn.name || id,
      host: conn.host || 'localhost',
      port: conn.port || 22,
      username: conn.username || '',
      // Ne pas exposer le mot de passe
      hasPassword: !!conn.password,
      hasPrivateKey: !!conn.privateKey
    }))

    return {
      success: true,
      connections: publicConnections,
      count: publicConnections.length
    }
  } catch (error: any) {
    console.error('Erreur lors de la récupération des connexions SFTP:', error)
    
    return {
      success: false,
      connections: [],
      count: 0,
      error: error.message || 'Erreur interne'
    }
  }
})
