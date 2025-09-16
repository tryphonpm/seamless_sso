<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Debug Configuration SFTP</h1>
    
    <div class="mb-6">
      <button 
        @click="loadConfig"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Charger la configuration
      </button>
    </div>

    <div v-if="configData" class="space-y-6">
      <!-- Configuration publique -->
      <div class="p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Configuration publique</h2>
        <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{{ JSON.stringify(configData.public, null, 2) }}</pre>
      </div>

      <!-- API Connexions -->
      <div class="p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">API /api/sftp/connections</h2>
        <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{{ JSON.stringify(connectionsData, null, 2) }}</pre>
      </div>

      <!-- Variables d'environnement (côté client) -->
      <div class="p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Variables d'environnement détectées</h2>
        <div class="bg-gray-100 p-3 rounded text-sm">
          <p><strong>NODE_ENV:</strong> {{ envVars.NODE_ENV || 'non défini' }}</p>
          <p><strong>Mode développement:</strong> {{ envVars.isDev ? 'Oui' : 'Non' }}</p>
        </div>
      </div>

      <!-- Test direct de l'API -->
      <div class="p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Test connexion</h2>
        <div class="space-y-2">
          <button 
            @click="testConnect('server1')"
            class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
          >
            Tester server1
          </button>
          <button 
            @click="testConnect('rebex_test')"
            class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Tester rebex_test
          </button>
        </div>
        
        <div v-if="testResult" class="mt-4 p-3 rounded text-sm"
             :class="testResult.success ? 'bg-green-100' : 'bg-red-100'">
          <pre>{{ testResult.message }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pas de middleware
definePageMeta({
  middleware: []
})

const configData = ref(null)
const connectionsData = ref(null)
const testResult = ref<{success: boolean, message: string} | null>(null)

const envVars = {
  NODE_ENV: process.env.NODE_ENV,
  isDev: process.dev
}

const loadConfig = async () => {
  try {
    // Charger la configuration runtime
    const config = useRuntimeConfig()
    configData.value = {
      public: config.public
    }
    
    // Charger les connexions via l'API
    const connections = await $fetch('/api/sftp/connections')
    connectionsData.value = connections
    
  } catch (error: any) {
    console.error('Erreur chargement config:', error)
    testResult.value = {
      success: false,
      message: `Erreur: ${error.message}`
    }
  }
}

const testConnect = async (connectionId: string) => {
  try {
    testResult.value = null
    const response = await $fetch('/api/sftp/connect', {
      method: 'POST',
      body: { connectionId }
    })
    
    testResult.value = {
      success: true,
      message: `Connexion réussie: ${JSON.stringify(response, null, 2)}`
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: `Erreur de connexion: ${error.message || error.toString()}`
    }
  }
}

onMounted(() => {
  loadConfig()
})

useHead({
  title: 'Debug Configuration SFTP'
})
</script>
