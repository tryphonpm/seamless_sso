<template>
  <div class="min-h-screen bg-gray-100 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h1 class="text-lg font-medium text-gray-900 mb-4">Test de téléchargement SFTP</h1>
          
          <!-- État de la connexion -->
          <div class="mb-6">
            <h2 class="text-sm font-medium text-gray-700 mb-2">État de la connexion</h2>
            <div class="flex items-center space-x-2">
              <div :class="currentConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                   class="px-2 py-1 rounded-full text-xs">
                {{ currentConnection ? 'Connecté' : 'Non connecté' }}
              </div>
              <span v-if="currentConnection" class="text-sm text-gray-600">
                {{ currentConnection.name }} ({{ currentConnection.host }})
              </span>
            </div>
          </div>

          <!-- Connexions disponibles -->
          <div v-if="!currentConnection" class="mb-6">
            <h2 class="text-sm font-medium text-gray-700 mb-2">Connexions disponibles</h2>
            <div class="space-y-2">
              <button
                v-for="connection in availableConnections"
                :key="connection.id"
                @click="connectToServer(connection.id)"
                :disabled="isLoading"
                class="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <div class="font-medium">{{ connection.name }}</div>
                <div class="text-sm text-gray-500">{{ connection.host }}:{{ connection.port }}</div>
              </button>
            </div>
          </div>

          <!-- Bouton de déconnexion -->
          <div v-if="currentConnection" class="mb-6">
            <button
              @click="disconnect"
              :disabled="isLoading"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Se déconnecter
            </button>
          </div>

          <!-- Liste des fichiers avec boutons de téléchargement -->
          <div v-if="currentConnection && files.length > 0" class="mb-6">
            <h2 class="text-sm font-medium text-gray-700 mb-2">
              Fichiers dans {{ currentPath }} ({{ files.length }} éléments)
            </h2>
            <div class="space-y-2">
              <div
                v-for="file in files"
                :key="file.path"
                class="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-lg">{{ file.type === 'directory' ? '📁' : '📄' }}</span>
                  <div>
                    <div class="font-medium">{{ file.name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ file.type === 'file' ? formatFileSize(file.size) : 'Dossier' }}
                      - {{ formatDate(file.modifyTime) }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    v-if="file.type === 'directory'"
                    @click="navigateToDirectory(file.name)"
                    class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Ouvrir
                  </button>
                  <button
                    v-if="file.type === 'file'"
                    @click="testDownload(file.path, file.name)"
                    :disabled="isLoading"
                    class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div v-if="currentConnection" class="mb-6">
            <div class="flex items-center space-x-2">
              <button
                v-if="currentPath !== '/'"
                @click="navigateUp"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                ← Retour
              </button>
              <button
                @click="listFiles('/')"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                🏠 Racine
              </button>
              <button
                @click="refreshFiles"
                :disabled="isLoading"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          <!-- Messages d'erreur -->
          <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div class="text-sm text-red-800">{{ error }}</div>
          </div>

          <!-- Indicateur de chargement -->
          <div v-if="isLoading" class="text-center py-4">
            <div class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement...
            </div>
          </div>

          <!-- Debug -->
          <details class="mt-6">
            <summary class="cursor-pointer text-sm font-medium text-gray-700">Debug</summary>
            <div class="mt-2 p-3 bg-gray-50 rounded text-xs">
              <div><strong>Connexion actuelle:</strong> {{ JSON.stringify(currentConnection, null, 2) }}</div>
              <div><strong>Chemin actuel:</strong> {{ currentPath }}</div>
              <div><strong>Nombre de fichiers:</strong> {{ files.length }}</div>
              <div><strong>Erreur:</strong> {{ error }}</div>
              <div><strong>Chargement:</strong> {{ isLoading }}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Métadonnées de la page
definePageMeta({
  middleware: 'auth-sftp'
})

// Composables
const { 
  currentConnection, 
  currentPath, 
  files, 
  isLoading, 
  error,
  connect, 
  disconnect,
  listFiles,
  navigateUp,
  navigateToDirectory,
  downloadFile
} = useSftp()

const { availableConnections, loadAvailableConnections } = useSftpConnections()

// Fonctions utilitaires
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Méthodes
const connectToServer = async (connectionId: string) => {
  try {
    console.log('Tentative de connexion à:', connectionId)
    await connect(connectionId)
    console.log('Connexion réussie!')
  } catch (err) {
    console.error('Erreur de connexion:', err)
  }
}

const refreshFiles = async () => {
  if (currentPath.value) {
    await listFiles(currentPath.value)
  }
}

const testDownload = async (remotePath: string, filename: string) => {
  try {
    console.log('Tentative de téléchargement:', remotePath, '->', filename)
    await downloadFile(remotePath, filename)
    console.log('Téléchargement réussi!')
  } catch (err) {
    console.error('Erreur de téléchargement:', err)
  }
}

// Charger les connexions au montage
onMounted(async () => {
  await loadAvailableConnections()
})
</script>

