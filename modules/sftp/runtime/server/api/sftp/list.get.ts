// Route API SFTP - Lister fichiers/dossiers
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const path = (query.path as string) || '/'

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

    // Vérifier les chemins autorisés
    const config = useRuntimeConfig()
    const allowedPaths = config.sftp?.paths?.allowedPaths || ['/']
    const isPathAllowed = allowedPaths.some(allowedPath => 
      path.startsWith(allowedPath)
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
    const files = await service.listDirectory(path)

    // Ajouter le chemin complet à chaque fichier
    const filesWithPath = files.map(file => ({
      ...file,
      path: path.endsWith('/') ? `${path}${file.name}` : `${path}/${file.name}`
    }))

    await pool.releaseConnection(connectionId)

    return {
      success: true,
      files: filesWithPath,
      path,
      count: files.length
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors du listage des fichiers'
    })
  }
})