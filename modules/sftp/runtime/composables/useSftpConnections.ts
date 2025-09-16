// Composable gestion connexions SFTP
export interface SftpConnectionConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  connected?: boolean
  lastConnected?: Date
}

const availableConnections = ref<SftpConnectionConfig[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useSftpConnections = () => {
  // Charger les connexions disponibles depuis la configuration
  const loadAvailableConnections = async () => {
    try {
      // Récupérer les connexions via une API dédiée
      const response = await $fetch<{
        success: boolean
        connections: Array<{
          id: string
          name: string
          host: string
          port: number
          username: string
        }>
      }>('/api/sftp/connections')
      
      if (response.success) {
        availableConnections.value = response.connections.map(conn => ({
          ...conn,
          connected: false
        }))
      }
    } catch (err) {
      console.warn('Impossible de charger les connexions SFTP:', err)
      
      // Fallback: essayer de charger depuis la configuration publique
      try {
        const config = useRuntimeConfig()
        const connections = config.public?.sftpConnections || {}
        
        availableConnections.value = Object.entries(connections).map(([id, config]: [string, any]) => ({
          id,
          name: config.name || id,
          host: config.host || '',
          port: config.port || 22,
          username: config.username || '',
          connected: false
        }))
      } catch (configErr) {
        console.warn('Impossible de charger depuis la configuration:', configErr)
        availableConnections.value = []
      }
    }
  }

  // Tester une connexion
  const testConnection = async (connectionId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await $fetch<{ success: boolean }>(`/api/sftp/test-connection`, {
        method: 'POST',
        body: { connectionId }
      })

      return response.success
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors du test de connexion'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Obtenir les informations d'une connexion
  const getConnectionInfo = (connectionId: string): SftpConnectionConfig | undefined => {
    return availableConnections.value.find(conn => conn.id === connectionId)
  }

  // Marquer une connexion comme connectée
  const markAsConnected = (connectionId: string) => {
    const connection = availableConnections.value.find(conn => conn.id === connectionId)
    if (connection) {
      connection.connected = true
      connection.lastConnected = new Date()
    }
  }

  // Marquer une connexion comme déconnectée
  const markAsDisconnected = (connectionId: string) => {
    const connection = availableConnections.value.find(conn => conn.id === connectionId)
    if (connection) {
      connection.connected = false
    }
  }

  // Marquer toutes les connexions comme déconnectées
  const markAllAsDisconnected = () => {
    availableConnections.value.forEach(conn => {
      conn.connected = false
    })
  }

  // Obtenir le nombre de connexions actives
  const getActiveConnectionsCount = (): number => {
    return availableConnections.value.filter(conn => conn.connected).length
  }

  // Obtenir les connexions actives
  const getActiveConnections = (): SftpConnectionConfig[] => {
    return availableConnections.value.filter(conn => conn.connected)
  }

  // Valider les paramètres de connexion
  const validateConnection = (connection: Partial<SftpConnectionConfig>): string[] => {
    const errors: string[] = []

    if (!connection.host?.trim()) {
      errors.push('L\'hôte est requis')
    }

    if (!connection.username?.trim()) {
      errors.push('Le nom d\'utilisateur est requis')
    }

    if (!connection.port || connection.port < 1 || connection.port > 65535) {
      errors.push('Le port doit être entre 1 et 65535')
    }

    return errors
  }

  // Initialiser au montage
  onMounted(() => {
    loadAvailableConnections()
  })

  return {
    // État
    availableConnections: readonly(availableConnections),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Méthodes
    loadAvailableConnections,
    testConnection,
    getConnectionInfo,
    markAsConnected,
    markAsDisconnected,
    markAllAsDisconnected,
    getActiveConnectionsCount,
    getActiveConnections,
    validateConnection
  }
}