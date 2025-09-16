// Route API SFTP - Upload fichier
import { getSftpPool } from '../../utils/connection-pool'
import { createError } from 'h3'
import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import formidable from 'formidable'

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
        statusCode: 401,
        statusMessage: 'Aucune connexion SFTP active'
      })
    }

    const config = useRuntimeConfig()
    const maxSize = config.sftp?.security?.uploadMaxSize || 100 * 1024 * 1024 // 100MB
    const tempDir = config.sftp?.paths?.tempDir || './temp'

    // Créer le dossier temporaire s'il n'existe pas
    try {
      await fs.mkdir(tempDir, { recursive: true })
    } catch (error) {
      // Ignore si le dossier existe déjà
    }

    // Parser le formulaire multipart
    const form = formidable({
      maxFileSize: maxSize,
      uploadDir: tempDir,
      keepExtensions: true
    })

    const [fields, files] = await form.parse(event.node.req)
    const remotePath = Array.isArray(fields.remotePath) ? fields.remotePath[0] : fields.remotePath
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file

    if (!uploadedFile || !remotePath) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Fichier et chemin distant requis'
      })
    }

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
    
    // Upload du fichier
    await service.uploadFile(uploadedFile.filepath, remotePath)

    // Nettoyer le fichier temporaire
    try {
      await fs.unlink(uploadedFile.filepath)
    } catch (error) {
      console.warn('Impossible de supprimer le fichier temporaire:', error)
    }

    await pool.releaseConnection(connectionId)

    return {
      success: true,
      message: 'Fichier uploadé avec succès',
      filename: uploadedFile.originalFilename,
      remotePath,
      size: uploadedFile.size
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors de l\'upload'
    })
  }
})