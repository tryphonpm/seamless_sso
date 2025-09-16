// Route API SFTP - Download fichier
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'
import { promises as fs } from 'fs'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'
import { createReadStream } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const remotePath = query.remotePath as string

    if (!remotePath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Chemin du fichier requis'
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
    
    const tempDir = config.sftp?.paths?.tempDir || './temp'
    const tempFileName = `${randomUUID()}_${basename(remotePath)}`
    const localPath = join(tempDir, tempFileName)

    // Créer le dossier temporaire s'il n'existe pas
    try {
      await fs.mkdir(tempDir, { recursive: true })
    } catch (error) {
      // Ignore si le dossier existe déjà
    }

    // Télécharger le fichier
    await service.downloadFile(remotePath, localPath)
    await pool.releaseConnection(connectionId)

    // Lire le fichier et le retourner
    const fileStats = await fs.stat(localPath)
    const filename = basename(remotePath)

    // Définir les headers pour le téléchargement
    setHeader(event, 'Content-Type', 'application/octet-stream')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', fileStats.size.toString())

    // Créer un stream de lecture
    const fileStream = createReadStream(localPath)

    // Nettoyer le fichier temporaire après l'envoi
    fileStream.on('end', async () => {
      try {
        await fs.unlink(localPath)
      } catch (error) {
        console.warn('Impossible de supprimer le fichier temporaire:', error)
      }
    })

    return sendStream(event, fileStream)
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors du téléchargement'
    })
  }
})