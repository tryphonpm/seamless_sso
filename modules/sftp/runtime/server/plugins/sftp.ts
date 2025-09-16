// Plugin serveur SFTP
import { getSftpPool } from '../utils/connection-pool'

export default async function sftpServerPlugin() {
  // Initialiser le pool de connexions au démarrage du serveur
  const pool = getSftpPool()
  
  console.log('🔌 Plugin serveur SFTP initialisé')
  console.log(`📊 Pool de connexions SFTP configuré (max: ${pool.getConnectionCount()})`)

  // Nettoyer les connexions lors de l'arrêt du serveur
  process.on('SIGTERM', async () => {
    console.log('🔌 Fermeture des connexions SFTP...')
    await pool.closeAllConnections()
    console.log('✅ Connexions SFTP fermées')
  })

  process.on('SIGINT', async () => {
    console.log('🔌 Fermeture des connexions SFTP...')
    await pool.closeAllConnections()
    console.log('✅ Connexions SFTP fermées')
  })
}