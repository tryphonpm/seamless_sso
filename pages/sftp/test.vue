<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test SFTP Module</h1>
    
    <ClientOnly>
      <!-- Test d'authentification -->
      <div class="mb-6 p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Test Authentification</h2>
        <p>Utilisateur connecté: <span class="font-mono">{{ user?.username || 'Non connecté' }}</span></p>
        <p>Authentifié: <span class="font-mono">{{ isAuthenticated ? 'Oui' : 'Non' }}</span></p>
      </div>

      <!-- Test des composables SFTP -->
      <div class="mb-6 p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Test Composables SFTP</h2>
        <div class="space-y-2">
          <p>Connexion courante: <span class="font-mono">{{ currentConnection?.name || 'Aucune' }}</span></p>
          <p>Chemin courant: <span class="font-mono">{{ currentPath }}</span></p>
          <p>Nombre de fichiers: <span class="font-mono">{{ files.length }}</span></p>
          <p>En chargement: <span class="font-mono">{{ isLoading ? 'Oui' : 'Non' }}</span></p>
          <p v-if="error" class="text-red-600">Erreur: {{ error }}</p>
        </div>
      </div>

      <!-- Test des connexions disponibles -->
      <div class="mb-6 p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Connexions Disponibles</h2>
        <div v-if="availableConnections.length > 0">
          <div v-for="conn in availableConnections" :key="conn.id" class="mb-2 p-2 bg-gray-50 rounded">
            <p><strong>{{ conn.name }}</strong> ({{ conn.host }}:{{ conn.port }})</p>
            <p class="text-sm text-gray-600">Utilisateur: {{ conn.username }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500">Aucune connexion configurée</p>
      </div>

      <!-- Actions de test -->
      <div class="space-x-4">
        <button 
          @click="loadConnections"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Recharger connexions
        </button>
        <NuxtLink 
          to="/sftp" 
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
        >
          Aller à SFTP
        </NuxtLink>
      </div>
      
      <template #fallback>
        <div class="text-center py-8">
          <p class="text-gray-500">Chargement des composables...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Test des composables
let user, isAuthenticated, currentConnection, currentPath, files, isLoading, error, availableConnections, loadAvailableConnections

try {
  // Test useAuth
  const authComposable = useAuth()
  user = authComposable.user
  isAuthenticated = authComposable.isAuthenticated
  
  // Test useSftp
  const sftpComposable = useSftp()
  currentConnection = sftpComposable.currentConnection
  currentPath = sftpComposable.currentPath
  files = sftpComposable.files
  isLoading = sftpComposable.isLoading
  error = sftpComposable.error
  
  // Test useSftpConnections
  const connectionsComposable = useSftpConnections()
  availableConnections = connectionsComposable.availableConnections
  loadAvailableConnections = connectionsComposable.loadAvailableConnections
  
} catch (err) {
  console.error('Erreur lors du chargement des composables:', err)
  error = ref('Erreur de chargement des composables: ' + err.message)
}

// Méthodes
const loadConnections = () => {
  try {
    if (loadAvailableConnections) {
      loadAvailableConnections()
    }
  } catch (err) {
    console.error('Erreur lors du chargement des connexions:', err)
  }
}

// Initialisation
onMounted(() => {
  console.log('Page de test SFTP montée')
  loadConnections()
})

// Middleware spécifique SFTP
definePageMeta({
  middleware: 'auth-sftp'
})

// Meta
useHead({
  title: 'Test SFTP Module'
})
</script>
