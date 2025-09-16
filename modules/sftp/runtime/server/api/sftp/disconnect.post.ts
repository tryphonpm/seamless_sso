// Route API SFTP - Déconnexion
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      name: 'sftp-session',
      password: useRuntimeConfig().sftp?.session?.secret || 'sftp-secret'
    })

    const sessionData = await session.data
    const connectionId = sessionData.connectionId

    if (!connectionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucune connexion active trouvée'
      })
    }

    const pool = getSftpPool()
    await pool.closeConnection(connectionId)

    // Nettoyer la session
    await session.clear()

    return {
      success: true,
      message: 'Déconnexion réussie'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors de la déconnexion'
    })
  }
})