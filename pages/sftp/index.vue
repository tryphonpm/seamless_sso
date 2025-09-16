<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Gestionnaire SFTP
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Gérez vos fichiers sur les serveurs distants
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/sftp/connections"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icon name="heroicons:cog-6-tooth" class="h-4 w-4 mr-2" />
              Connexions
            </NuxtLink>
            <button
              v-if="currentConnection"
              @click="disconnect"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Icon name="heroicons:x-circle" class="h-4 w-4 mr-2" />
              Déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- État de connexion -->
      <div class="mb-6">
        <div v-if="!currentConnection" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-yellow-400" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">
                Aucune connexion active
              </h3>
              <p class="mt-1 text-sm text-yellow-700">
                Veuillez vous connecter à un serveur SFTP pour commencer.
              </p>
              <div class="mt-4">
                <NuxtLink
                  to="/sftp/connections"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Gérer les connexions
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-400" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Connecté à {{ currentConnection.name }}
              </h3>
              <p class="mt-1 text-sm text-green-700">
                {{ currentConnection.host }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigateur de fichiers -->
      <div v-if="currentConnection" class="bg-white shadow rounded-lg">
        <SftpBrowser />
      </div>

      <!-- Section de connexion rapide -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="connection in availableConnections"
          :key="connection.id"
          class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          @click="connectToServer(connection.id)"
        >
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="heroicons:server" class="h-8 w-8 text-gray-400" />
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ connection.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ connection.host }}:{{ connection.port }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ connection.username }}
                </p>
              </div>
            </div>
            <div class="mt-4">
              <button
                :disabled="isLoading"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Icon v-if="isLoading" name="heroicons:arrow-path" class="animate-spin h-4 w-4 mr-2" />
                <Icon v-else name="heroicons:arrow-right-on-rectangle" class="h-4 w-4 mr-2" />
                {{ isLoading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Carte pour ajouter une nouvelle connexion -->
        <div class="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <NuxtLink to="/sftp/connections" class="block p-6 h-full">
            <div class="flex flex-col items-center justify-center h-full text-center">
              <Icon name="heroicons:plus" class="h-12 w-12 text-gray-400 mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Nouvelle connexion
              </h3>
              <p class="text-sm text-gray-500">
                Configurez une nouvelle connexion SFTP
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Toast pour les erreurs -->
    <div
      v-if="error"
      class="fixed bottom-4 right-4 max-w-sm w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50"
    >
      <div class="flex items-center">
        <Icon name="heroicons:x-circle" class="h-5 w-5 mr-2" />
        <span class="text-sm">{{ error }}</span>
        <button @click="error = null" class="ml-auto">
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Authentification gérée par le middleware global

// Composables
const { currentConnection, isLoading, error, connect, disconnect } = useSftp()
const { availableConnections, loadAvailableConnections } = useSftpConnections()

// Méthodes
const connectToServer = async (connectionId: string) => {
  try {
    await connect(connectionId)
  } catch (err) {
    console.error('Erreur de connexion:', err)
  }
}

// Initialisation
onMounted(() => {
  loadAvailableConnections()
})

// Meta
useHead({
  title: 'Gestionnaire SFTP',
  meta: [
    { name: 'description', content: 'Interface de gestion des fichiers SFTP' }
  ]
})
</script>