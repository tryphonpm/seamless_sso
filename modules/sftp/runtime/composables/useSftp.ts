// Composable principal SFTP
export interface SftpConnection {
  id: string
  name: string
  host: string
  connected: boolean
}

export interface SftpFile {
  name: string
  type: 'file' | 'directory'
  size: number
  modifyTime: Date
  path: string
  rights?: {
    user: string
    group: string
    other: string
  }
}

const currentConnection = ref<SftpConnection | null>(null)
const currentPath = ref<string>('/')
const files = ref<SftpFile[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const uploadProgress = ref<number>(0)

export const useSftp = () => {
  const { markAsConnected, markAsDisconnected } = useSftpConnections()

  // Connexion à un serveur SFTP
  const connect = async (connectionId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await $fetch<{
        success: boolean
        connection: SftpConnection
      }>('/api/sftp/connect', {
        method: 'POST',
        body: { connectionId }
      })

      if (response.success) {
        currentConnection.value = response.connection
        markAsConnected(connectionId)
        await listFiles('/')
      }
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur de connexion'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Déconnexion
  const disconnect = async () => {
    try {
      isLoading.value = true
      
      await $fetch('/api/sftp/disconnect', {
        method: 'POST'
      })
      
      if (currentConnection.value) {
        markAsDisconnected(currentConnection.value.id)
      }
      
      currentConnection.value = null
      files.value = []
      currentPath.value = '/'
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur de déconnexion'
    } finally {
      isLoading.value = false
    }
  }

  // Lister les fichiers d'un répertoire
  const listFiles = async (path: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await $fetch<{
        success: boolean
        files: SftpFile[]
        path: string
      }>('/api/sftp/list', {
        query: { path }
      })

      if (response.success) {
        files.value = response.files.map(file => ({
          ...file,
          modifyTime: new Date(file.modifyTime)
        }))
        currentPath.value = response.path
      }
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors du listage'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Naviguer vers un répertoire parent
  const navigateUp = async () => {
    if (currentPath.value === '/') return
    
    const parentPath = currentPath.value.split('/').slice(0, -1).join('/') || '/'
    await listFiles(parentPath)
  }

  // Naviguer vers un répertoire
  const navigateToDirectory = async (directoryName: string) => {
    const newPath = currentPath.value.endsWith('/') 
      ? `${currentPath.value}${directoryName}`
      : `${currentPath.value}/${directoryName}`
    
    await listFiles(newPath)
  }

  // Upload d'un fichier
  const uploadFile = async (file: File, remotePath?: string) => {
    try {
      isLoading.value = true
      error.value = null
      uploadProgress.value = 0

      const targetPath = remotePath || (currentPath.value.endsWith('/') 
        ? `${currentPath.value}${file.name}`
        : `${currentPath.value}/${file.name}`)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('remotePath', targetPath)

      await $fetch('/api/sftp/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progress) => {
          uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
        }
      })

      // Rafraîchir la liste des fichiers
      await listFiles(currentPath.value)
      uploadProgress.value = 0
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors de l\'upload'
      uploadProgress.value = 0
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Upload de plusieurs fichiers
  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (let i = 0; i < fileArray.length; i++) {
      await uploadFile(fileArray[i])
    }
  }

  // Téléchargement d'un fichier
  const downloadFile = async (remotePath: string, filename: string) => {
    try {
      isLoading.value = true
      error.value = null

      // Construire l'URL avec le paramètre remotePath dans la query string
      const url = `/api/sftp/download?remotePath=${encodeURIComponent(remotePath)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        }
      })

      if (!response.ok) {
        let errorMessage = 'Erreur de téléchargement'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Créer le blob et déclencher le téléchargement
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      
      // Nettoyer
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du téléchargement'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Suppression d'un fichier ou dossier
  const deleteFile = async (remotePath: string) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch('/api/sftp/delete', {
        method: 'DELETE',
        body: { remotePath }
      })

      // Rafraîchir la liste des fichiers
      await listFiles(currentPath.value)
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors de la suppression'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Création d'un dossier
  const createDirectory = async (directoryName: string) => {
    try {
      isLoading.value = true
      error.value = null

      const remotePath = currentPath.value.endsWith('/') 
        ? `${currentPath.value}${directoryName}`
        : `${currentPath.value}/${directoryName}`

      await $fetch('/api/sftp/mkdir', {
        method: 'POST',
        body: { remotePath }
      })

      // Rafraîchir la liste des fichiers
      await listFiles(currentPath.value)
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors de la création'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Déplacement/renommage d'un fichier
  const moveFile = async (oldPath: string, newPath: string) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch('/api/sftp/move', {
        method: 'POST',
        body: { oldPath, newPath }
      })

      // Rafraîchir la liste des fichiers
      await listFiles(currentPath.value)
    } catch (err: any) {
      error.value = err.data?.message || 'Erreur lors du déplacement'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Renommer un fichier dans le répertoire courant
  const renameFile = async (currentName: string, newName: string) => {
    const oldPath = currentPath.value.endsWith('/') 
      ? `${currentPath.value}${currentName}`
      : `${currentPath.value}/${currentName}`
    
    const newPath = currentPath.value.endsWith('/') 
      ? `${currentPath.value}${newName}`
      : `${currentPath.value}/${newName}`

    await moveFile(oldPath, newPath)
  }

  // Obtenir les informations d'un fichier
  const getFileInfo = (filename: string): SftpFile | undefined => {
    return files.value.find(file => file.name === filename)
  }

  // Filtrer les fichiers
  const filterFiles = (searchTerm: string): SftpFile[] => {
    if (!searchTerm.trim()) return files.value
    
    const term = searchTerm.toLowerCase()
    return files.value.filter(file => 
      file.name.toLowerCase().includes(term)
    )
  }

  // Trier les fichiers
  const sortFiles = (sortBy: 'name' | 'size' | 'date', ascending: boolean = true): SftpFile[] => {
    const sorted = [...files.value].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'date':
          comparison = a.modifyTime.getTime() - b.modifyTime.getTime()
          break
      }
      
      return ascending ? comparison : -comparison
    })

    // Toujours mettre les dossiers en premier
    return sorted.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'directory') return 1
      return 0
    })
  }

  return {
    // État
    currentConnection: readonly(currentConnection),
    currentPath: readonly(currentPath),
    files: readonly(files),
    isLoading: readonly(isLoading),
    error: readonly(error),
    uploadProgress: readonly(uploadProgress),
    
    // Méthodes de connexion
    connect,
    disconnect,
    
    // Méthodes de navigation
    listFiles,
    navigateUp,
    navigateToDirectory,
    
    // Méthodes de gestion des fichiers
    uploadFile,
    uploadFiles,
    downloadFile,
    deleteFile,
    createDirectory,
    moveFile,
    renameFile,
    
    // Méthodes utilitaires
    getFileInfo,
    filterFiles,
    sortFiles
  }
}