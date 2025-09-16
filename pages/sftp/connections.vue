<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Connexions SFTP
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Gérez vos connexions aux serveurs SFTP
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/sftp"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icon name="heroicons:arrow-left" class="h-4 w-4 mr-2" />
              Retour
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="heroicons:server" class="h-8 w-8 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Connexions configurées
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ availableConnections.length }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="heroicons:check-circle" class="h-8 w-8 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Connexions actives
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ getActiveConnectionsCount() }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon name="heroicons:clock" class="h-8 w-8 text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Dernière connexion
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ lastConnectionTime }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des connexions -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Connexions disponibles
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            Liste de toutes les connexions SFTP configurées
          </p>
        </div>

        <ul v-if="availableConnections.length > 0" class="divide-y divide-gray-200">
          <li
            v-for="connection in availableConnections"
            :key="connection.id"
            class="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="flex items-center justify-center h-10 w-10 rounded-full"
                       :class="connection.connected ? 'bg-green-100' : 'bg-gray-100'">
                    <Icon 
                      name="heroicons:server" 
                      class="h-6 w-6"
                      :class="connection.connected ? 'text-green-600' : 'text-gray-400'"
                    />
                  </div>
                </div>
                <div class="ml-4">
                  <div class="flex items-center">
                    <h4 class="text-sm font-medium text-gray-900">
                      {{ connection.name }}
                    </h4>
                    <span
                      v-if="connection.connected"
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      Connecté
                    </span>
                  </div>
                  <div class="mt-1 text-sm text-gray-500">
                    <p>{{ connection.host }}:{{ connection.port }}</p>
                    <p>Utilisateur: {{ connection.username }}</p>
                    <p v-if="connection.lastConnected" class="text-xs">
                      Dernière connexion: {{ formatDate(connection.lastConnected) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="testConnection(connection.id)"
                  :disabled="isLoading"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Icon 
                    :name="isLoading ? 'heroicons:arrow-path' : 'heroicons:signal'" 
                    :class="isLoading ? 'animate-spin' : ''"
                    class="h-4 w-4 mr-1" 
                  />
                  Tester
                </button>

                <button
                  v-if="!connection.connected"
                  @click="connectTo(connection.id)"
                  :disabled="isLoading"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4 mr-1" />
                  Connecter
                </button>

                <button
                  v-else
                  @click="disconnectFrom(connection.id)"
                  :disabled="isLoading"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Icon name="heroicons:x-circle" class="h-4 w-4 mr-1" />
                  Déconnecter
                </button>
              </div>
            </div>
          </li>
        </ul>

        <div v-else class="px-4 py-12 text-center">
          <Icon name="heroicons:server" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            Aucune connexion configurée
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            Les connexions SFTP sont configurées dans le fichier de configuration de l'application.
          </p>
        </div>
      </div>

      <!-- Instructions de configuration -->
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
        <div class="flex">
          <Icon name="heroicons:information-circle" class="h-5 w-5 text-blue-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">
              Configuration des connexions
            </h3>
            <div class="mt-2 text-sm text-blue-700">
              <p class="mb-2">
                Pour ajouter de nouvelles connexions SFTP, modifiez votre fichier <code class="bg-blue-100 px-1 rounded">nuxt.config.ts</code> :
              </p>
              <pre class="bg-blue-100 p-3 rounded text-xs overflow-x-auto"><code>export default defineNuxtConfig({
  sftp: {
    connections: {
      server1: {
        host: 'votre-serveur.com',
        port: 22,
        username: 'utilisateur',
        password: 'mot-de-passe',
        timeout: 30000
      }
    }
  }
})</code></pre>
              <p class="mt-2">
                Redémarrez l'application après avoir modifié la configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast pour les messages -->
    <div
      v-if="message"
      class="fixed bottom-4 right-4 max-w-sm w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50"
    >
      <div class="flex items-center">
        <Icon name="heroicons:check-circle" class="h-5 w-5 mr-2" />
        <span class="text-sm">{{ message }}</span>
        <button @click="message = null" class="ml-auto">
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
        </button>
      </div>
    </div>

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
const { connect, disconnect } = useSftp()
const { 
  availableConnections, 
  isLoading, 
  error, 
  loadAvailableConnections,
  testConnection,
  markAsConnected,
  markAsDisconnected,
  getActiveConnectionsCount
} = useSftpConnections()

// État local
const message = ref<string | null>(null)

// Computed
const lastConnectionTime = computed(() => {
  const connections = availableConnections.value.filter(conn => conn.lastConnected)
  if (connections.length === 0) return 'Jamais'
  
  const latest = connections.reduce((latest, conn) => {
    return conn.lastConnected! > latest.lastConnected! ? conn : latest
  })
  
  return formatDate(latest.lastConnected!)
})

// Méthodes
const connectTo = async (connectionId: string) => {
  try {
    await connect(connectionId)
    message.value = 'Connexion établie avec succès'
    setTimeout(() => message.value = null, 3000)
  } catch (err) {
    console.error('Erreur de connexion:', err)
  }
}

const disconnectFrom = async (connectionId: string) => {
  try {
    await disconnect()
    markAsDisconnected(connectionId)
    message.value = 'Déconnexion réussie'
    setTimeout(() => message.value = null, 3000)
  } catch (err) {
    console.error('Erreur de déconnexion:', err)
  }
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialisation
onMounted(() => {
  loadAvailableConnections()
})

// Meta
useHead({
  title: 'Connexions SFTP',
  meta: [
    { name: 'description', content: 'Gestion des connexions SFTP' }
  ]
})
</script>
