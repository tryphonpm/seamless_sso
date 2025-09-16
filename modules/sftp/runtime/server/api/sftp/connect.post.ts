// Route API SFTP - Connexion
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { connectionId } = body

    if (!connectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de connexion requis'
      })
    }

    const config = useRuntimeConfig()
    const connectionConfig = config.sftp?.connections?.[connectionId]

    if (!connectionConfig) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Configuration de connexion non trouvée'
      })
    }

    // Vérifier les hôtes autorisés
    const allowedHosts = config.sftp?.security?.allowedHosts || []
    if (allowedHosts.length > 0 && !allowedHosts.includes(connectionConfig.host)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Hôte non autorisé'
      })
    }

    const pool = getSftpPool()
    const service = await pool.getConnection(connectionId, connectionConfig)

    // Stocker l'ID de connexion dans la session
    const session = await useSession(event, {
      name: 'sftp-session',
      password: config.sftp?.session?.secret || 'sftp-secret'
    })
    
    await session.update({
      connectionId,
      connectedAt: new Date().toISOString()
    })

    return {
      success: true,
      connection: {
        id: connectionId,
        name: connectionId,
        host: connectionConfig.host,
        connected: true
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur de connexion SFTP'
    })
  }
})