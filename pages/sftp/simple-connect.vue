<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test Connexion SFTP Simple</h1>
    
    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-4">Connexions disponibles</h2>
      
      <div v-if="availableConnections.length > 0" class="space-y-4">
        <div 
          v-for="connection in availableConnections" 
          :key="connection.id"
          class="p-4 border rounded"
        >
          <h3 class="font-medium">{{ connection.name }}</h3>
          <p class="text-sm text-gray-600">{{ connection.host }}:{{ connection.port }}</p>
          <p class="text-sm text-gray-600">Utilisateur: {{ connection.username }}</p>
          
          <button 
            @click="connectToServer(connection.id)"
            :disabled="isLoading"
            class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {{ isLoading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </div>
      </div>
      
      <div v-else class="text-gray-500">
        Aucune connexion disponible
      </div>
    </div>

    <!-- État de connexion -->
    <div v-if="currentConnection" class="mb-6 p-4 bg-green-50 border border-green-200 rounded">
      <h3 class="text-green-800 font-medium">Connecté à {{ currentConnection.name }}</h3>
      <p class="text-green-700">{{ currentConnection.host }}</p>
      
      <button 
        @click="disconnect"
        class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Déconnecter
      </button>
    </div>

    <!-- Erreurs -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
      <h3 class="text-red-800 font-medium">Erreur</h3>
      <p class="text-red-700">{{ error }}</p>
    </div>

    <!-- Logs de debug -->
    <div class="mt-8">
      <h3 class="font-semibold mb-2">Logs de debug</h3>
      <div class="bg-gray-100 p-4 rounded text-sm">
        <div v-for="(log, index) in debugLogs" :key="index" class="mb-1">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pas de middleware pour cette page de test
definePageMeta({
  middleware: []
})

// Composables
const { currentConnection, isLoading, error, connect, disconnect } = useSftp()
const { availableConnections, loadAvailableConnections } = useSftpConnections()

// Logs de debug
const debugLogs = ref<string[]>([])

const addLog = (message: string) => {
  debugLogs.value.unshift(`${new Date().toLocaleTimeString()}: ${message}`)
  if (debugLogs.value.length > 20) {
    debugLogs.value = debugLogs.value.slice(0, 20)
  }
}

// Méthodes
const connectToServer = async (connectionId: string) => {
  try {
    addLog(`Tentative de connexion à ${connectionId}`)
    await connect(connectionId)
    addLog(`Connexion réussie à ${connectionId}`)
  } catch (err: any) {
    addLog(`Erreur de connexion: ${err.message}`)
    console.error('Erreur de connexion:', err)
  }
}

// Initialisation
onMounted(async () => {
  addLog('Page montée, chargement des connexions...')
  try {
    await loadAvailableConnections()
    addLog(`${availableConnections.value.length} connexion(s) chargée(s)`)
  } catch (err: any) {
    addLog(`Erreur chargement connexions: ${err.message}`)
  }
})

useHead({
  title: 'Test Connexion SFTP Simple'
})
</script>

