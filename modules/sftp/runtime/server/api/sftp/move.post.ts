// Route API SFTP - Déplacer/renommer
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { oldPath, newPath } = body

    if (!oldPath || !newPath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ancien et nouveau chemin requis'
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
    const allowedPaths = config.sftp?.paths?.allowedPaths || ['/']
    
    // Vérifier que les deux chemins sont autorisés
    const isOldPathAllowed = allowedPaths.some(allowedPath => 
      oldPath.startsWith(allowedPath)
    )
    const isNewPathAllowed = allowedPaths.some(allowedPath => 
      newPath.startsWith(allowedPath)
    )

    if (!isOldPathAllowed || !isNewPathAllowed) {
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
    
    // Déplacer/renommer le fichier
    await service.moveFile(oldPath, newPath)
    await pool.releaseConnection(connectionId)

    return {
      success: true,
      message: 'Fichier déplacé avec succès',
      oldPath,
      newPath
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors du déplacement'
    })
  }
})