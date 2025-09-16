<template>
  <div class="max-w-4xl mx-auto p-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Exemple d'utilisation du module SFTP
    </h2>

    <!-- État de la connexion -->
    <div class="mb-6">
      <div v-if="currentConnection" class="bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex items-center">
          <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-400 mr-3" />
          <div>
            <h3 class="text-sm font-medium text-green-800">
              Connecté à {{ currentConnection.name }}
            </h3>
            <p class="text-sm text-green-700">{{ currentConnection.host }}</p>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex items-center">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-yellow-400 mr-3" />
          <div>
            <h3 class="text-sm font-medium text-yellow-800">
              Non connecté
            </h3>
            <p class="text-sm text-yellow-700">
              Sélectionnez une connexion pour commencer
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sélection de connexion -->
    <div v-if="!currentConnection" class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Connexions disponibles
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="connection in availableConnections"
          :key="connection.id"
          @click="connectToServer(connection.id)"
          :disabled="isLoading"
          class="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <div class="text-left">
            <h4 class="font-medium text-gray-900">{{ connection.name }}</h4>
            <p class="text-sm text-gray-500">{{ connection.host }}:{{ connection.port }}</p>
            <p class="text-sm text-gray-500">{{ connection.username }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Actions rapides -->
    <div v-if="currentConnection" class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Actions rapides
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="listFiles('/')"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Lister racine
        </button>
        <button
          @click="listFiles('/uploads')"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Dossier uploads
        </button>
        <button
          @click="createDirectory('test-' + Date.now())"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Créer dossier test
        </button>
        <button
          @click="disconnect"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Déconnecter
        </button>
      </div>
    </div>

    <!-- Zone d'upload -->
    <div v-if="currentConnection" class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Upload de fichiers
      </h3>
      <SftpUploadZone @uploaded="handleFileUploaded" />
    </div>

    <!-- Informations sur le répertoire courant -->
    <div v-if="currentConnection" class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">
          Répertoire courant: {{ currentPath }}
        </h3>
        <div class="text-sm text-gray-500">
          {{ files.length }} élément(s)
        </div>
      </div>

      <!-- Liste des fichiers -->
      <div v-if="files.length > 0" class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          <li
            v-for="file in files"
            :key="file.path"
            class="px-6 py-4 hover:bg-gray-50"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="text-2xl mr-3">
                  {{ getFileIcon(file.name, file.type === 'directory') }}
                </span>
                <div>
                  <button
                    v-if="file.type === 'directory'"
                    @click="navigateToDirectory(file.name)"
                    class="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {{ file.name }}
                  </button>
                  <span v-else class="font-medium text-gray-900">
                    {{ file.name }}
                  </span>
                  <div class="text-sm text-gray-500 mt-1">
                    <span v-if="file.type === 'file'">
                      {{ formatFileSize(file.size) }} - 
                    </span>
                    {{ formatDate(file.modifyTime) }}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  v-if="file.type === 'file'"
                  @click="downloadFile(file.path, file.name)"
                  class="text-blue-600 hover:text-blue-800"
                  title="Télécharger"
                >
                  <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
                </button>
                <button
                  @click="deleteFile(file.path)"
                  class="text-red-600 hover:text-red-800"
                  title="Supprimer"
                >
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="!isLoading" class="text-center py-8 text-gray-500">
        Aucun fichier dans ce répertoire
      </div>

      <div v-if="isLoading" class="text-center py-8">
        <Icon name="heroicons:arrow-path" class="animate-spin h-8 w-8 text-gray-400 mx-auto" />
        <p class="mt-2 text-gray-500">Chargement...</p>
      </div>
    </div>

    <!-- Messages d'erreur -->
    <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex items-center">
        <Icon name="heroicons:x-circle" class="h-5 w-5 text-red-400 mr-3" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Erreur</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Logs d'activité -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Journal d'activité
      </h3>
      <div class="bg-gray-50 rounded-md p-4 max-h-40 overflow-y-auto">
        <div
          v-for="(log, index) in activityLogs"
          :key="index"
          class="text-sm text-gray-600 mb-1"
        >
          <span class="text-gray-400">{{ log.timestamp }}</span> - {{ log.message }}
        </div>
        <div v-if="activityLogs.length === 0" class="text-sm text-gray-500 italic">
          Aucune activité enregistrée
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  navigateToDirectory,
  downloadFile,
  deleteFile,
  createDirectory
} = useSftp()

const { 
  availableConnections,
  loadAvailableConnections
} = useSftpConnections()

const { formatFileSize, formatDate, getFileIcon } = useNuxtApp().$sftp

// État local
const activityLogs = ref<Array<{ timestamp: string; message: string }>>([])

// Méthodes
const addLog = (message: string) => {
  activityLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString('fr-FR'),
    message
  })
  
  // Limiter à 50 entrées
  if (activityLogs.value.length > 50) {
    activityLogs.value = activityLogs.value.slice(0, 50)
  }
}

const connectToServer = async (connectionId: string) => {
  try {
    addLog(`Tentative de connexion à ${connectionId}...`)
    await connect(connectionId)
    addLog(`Connexion réussie à ${connectionId}`)
  } catch (error) {
    addLog(`Erreur de connexion à ${connectionId}: ${error}`)
  }
}

const handleFileUploaded = (files: File[]) => {
  addLog(`Upload réussi: ${files.length} fichier(s)`)
}

// Watchers pour logger les changements
watch(currentPath, (newPath, oldPath) => {
  if (oldPath && newPath !== oldPath) {
    addLog(`Navigation vers: ${newPath}`)
  }
})

watch(files, (newFiles) => {
  if (newFiles.length > 0) {
    addLog(`Répertoire chargé: ${newFiles.length} élément(s)`)
  }
})

// Initialisation
onMounted(() => {
  loadAvailableConnections()
  addLog('Interface SFTP initialisée')
})
</script>
