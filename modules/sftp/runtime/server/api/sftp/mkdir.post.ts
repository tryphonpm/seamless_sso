// Route API SFTP - Créer dossier
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { remotePath } = body

    if (!remotePath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Chemin du dossier requis'
      })
    }

    const session = await useSession(event, {
      name: 'sftp-session',
      password: useRuntimeConfig().sftp?.session?.secret || 'sftp-secret'
    })

    const sessionData = await session.data
    const connectionId = sessionData.connectionId

    if (!connectionId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Aucune connexion SFTP active'
      })
    }

    const config = useRuntimeConfig()
    
    // Vérifier les chemins autorisés
    const allowedPaths = config.sftp?.paths?.allowedPaths || ['/']
    const isPathAllowed = allowedPaths.some(allowedPath => 
      remotePath.startsWith(allowedPath)
    )

    if (!isPathAllowed) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Chemin non autorisé'
      })
    }

    const pool = getSftpPool()
    const connectionConfig = config.sftp?.connections?.[connectionId]
    
    if (!connectionConfig) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Configuration de connexion non trouvée'
      })
    }

    const service = await pool.getConnection(connectionId, connectionConfig)
    
    // Créer le dossier
    await service.createDirectory(remotePath)
    await pool.releaseConnection(connectionId)

    return {
      success: true,
      message: 'Dossier créé avec succès',
      remotePath
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors de la création du dossier'
    })
  }
})