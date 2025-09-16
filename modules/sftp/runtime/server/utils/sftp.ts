// Service principal SFTP
import Client from 'ssh2-sftp-client'
import { createReadStream, createWriteStream } from 'fs'

export interface SftpConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  timeout: number
}

export interface SftpFileInfo {
  name: string
  type: 'file' | 'directory'
  size: number
  modifyTime: Date
  accessTime: Date
  rights: {
    user: string
    group: string
    other: string
  }
}

export class SftpService {
  private client: Client
  private config: SftpConfig
  private connected: boolean = false

  constructor(config: SftpConfig) {
    this.client = new Client()
    this.config = config
  }

  async connect(): Promise<void> {
    if (this.connected) return

    try {
      await this.client.connect(this.config)
      this.connected = true
    } catch (error) {
      throw new Error(`Erreur de connexion SFTP: ${error.message}`)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return

    try {
      await this.client.end()
      this.connected = false
    } catch (error) {
      console.error('Erreur lors de la déconnexion SFTP:', error)
    }
  }

  async listDirectory(remotePath: string): Promise<SftpFileInfo[]> {
    if (!this.connected) await this.connect()

    try {
      const list = await this.client.list(remotePath)
      return list.map(item => ({
        name: item.name,
        type: item.type === 'd' ? 'directory' : 'file',
        size: item.size,
        modifyTime: new Date(item.modifyTime),
        accessTime: new Date(item.accessTime),
        rights: {
          user: item.rights.user,
          group: item.rights.group,
          other: item.rights.other
        }
      }))
    } catch (error) {
      throw new Error(`Erreur lors du listage: ${error.message}`)
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.connected) await this.connect()

    try {
      await this.client.fastPut(localPath, remotePath)
    } catch (error) {
      throw new Error(`Erreur lors de l'upload: ${error.message}`)
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    if (!this.connected) await this.connect()

    try {
      await this.client.fastGet(remotePath, localPath)
    } catch (error) {
      throw new Error(`Erreur lors du download: ${error.message}`)
    }
  }

  async deleteFile(remotePath: string): Promise<void> {
    if (!this.connected) await this.connect()

    try {
      const stats = await this.client.stat(remotePath)
      if (stats.isDirectory) {
        await this.client.rmdir(remotePath, true)
      } else {
        await this.client.delete(remotePath)
      }
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  async createDirectory(remotePath: string): Promise<void> {
    if (!this.connected) await this.connect()

    try {
      await this.client.mkdir(remotePath, true)
    } catch (error) {
      throw new Error(`Erreur lors de la création du dossier: ${error.message}`)
    }
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.connected) await this.connect()

    try {
      await this.client.rename(oldPath, newPath)
    } catch (error) {
      throw new Error(`Erreur lors du déplacement: ${error.message}`)
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}