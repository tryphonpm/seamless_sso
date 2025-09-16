// Pool de connexions SFTP
import { SftpService, SftpConfig } from './sftp'

export interface ConnectionInfo {
  id: string
  service: SftpService
  lastUsed: Date
  inUse: boolean
}

export class SftpConnectionPool {
  private connections: Map<string, ConnectionInfo> = new Map()
  private maxConnections: number
  private connectionTimeout: number

  constructor(maxConnections: number = 10, connectionTimeout: number = 30000) {
    this.maxConnections = maxConnections
    this.connectionTimeout = connectionTimeout
    
    // Nettoyer les connexions inactives toutes les 5 minutes
    setInterval(() => this.cleanupConnections(), 5 * 60 * 1000)
  }

  async getConnection(connectionId: string, config: SftpConfig): Promise<SftpService> {
    const existing = this.connections.get(connectionId)
    
    if (existing && existing.service.isConnected()) {
      existing.lastUsed = new Date()
      existing.inUse = true
      return existing.service
    }

    // Vérifier la limite de connexions
    if (this.connections.size >= this.maxConnections) {
      await this.cleanupOldestConnection()
    }

    // Créer une nouvelle connexion
    const service = new SftpService(config)
    await service.connect()

    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      service,
      lastUsed: new Date(),
      inUse: true
    }

    this.connections.set(connectionId, connectionInfo)
    return service
  }

  async releaseConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.inUse = false
      connection.lastUsed = new Date()
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      await connection.service.disconnect()
      this.connections.delete(connectionId)
    }
  }

  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(
      conn => conn.service.disconnect()
    )
    await Promise.all(promises)
    this.connections.clear()
  }

  private async cleanupConnections(): Promise<void> {
    const now = new Date()
    const toRemove: string[] = []

    for (const [id, conn] of this.connections) {
      const timeSinceLastUse = now.getTime() - conn.lastUsed.getTime()
      
      if (!conn.inUse && timeSinceLastUse > this.connectionTimeout) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      await this.closeConnection(id)
    }
  }

  private async cleanupOldestConnection(): Promise<void> {
    let oldest: { id: string; lastUsed: Date } | null = null
    
    for (const [id, conn] of this.connections) {
      if (!conn.inUse && (!oldest || conn.lastUsed < oldest.lastUsed)) {
        oldest = { id, lastUsed: conn.lastUsed }
      }
    }

    if (oldest) {
      await this.closeConnection(oldest.id)
    }
  }

  getActiveConnections(): string[] {
    return Array.from(this.connections.keys())
  }

  getConnectionCount(): number {
    return this.connections.size
  }
}

// Instance globale du pool de connexions
let globalPool: SftpConnectionPool | null = null

export function getSftpPool(): SftpConnectionPool {
  if (!globalPool) {
    const config = useRuntimeConfig()
    globalPool = new SftpConnectionPool(
      config.sftp?.security?.maxConnections || 10,
      config.sftp?.security?.connectionTimeout || 30000
    )
  }
  return globalPool
}