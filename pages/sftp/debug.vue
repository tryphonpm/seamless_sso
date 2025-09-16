<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Debug SFTP - Informations de base</h1>
    
    <!-- Informations sur les cookies -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Cookies</h2>
      <p>Token d'authentification: <span class="font-mono">{{ authToken ? 'Présent' : 'Absent' }}</span></p>
      <p v-if="authToken" class="text-xs text-gray-600 break-all">Token: {{ authToken }}</p>
    </div>

    <!-- Informations sur la route -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Route</h2>
      <p>Route courante: <span class="font-mono">{{ $route.path }}</span></p>
      <p>Nom de la route: <span class="font-mono">{{ $route.name }}</span></p>
      <p>Paramètres: <span class="font-mono">{{ JSON.stringify($route.params) }}</span></p>
    </div>

    <!-- Configuration du module -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Configuration</h2>
      <p>SFTP activé: <span class="font-mono">{{ config.public?.sftpEnabled ? 'Oui' : 'Non' }}</span></p>
      <p>Nom de l'app: <span class="font-mono">{{ config.public?.appName || 'Non défini' }}</span></p>
    </div>

    <!-- Test des modules -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Modules disponibles</h2>
      <div class="space-y-2">
        <p>Module SSO: <span class="font-mono text-green-600">✓ Disponible</span></p>
        <p>Module SFTP: <span class="font-mono" :class="sftpModuleAvailable ? 'text-green-600' : 'text-red-600'">
          {{ sftpModuleAvailable ? '✓ Disponible' : '✗ Non disponible' }}
        </span></p>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-x-4">
      <NuxtLink 
        to="/dashboard" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink 
        to="/sftp" 
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
      >
        SFTP Principal
      </NuxtLink>
      <NuxtLink 
        to="/sftp/test" 
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block"
      >
        Test Composables
      </NuxtLink>
    </div>

    <!-- Informations techniques -->
    <div class="mt-8 p-4 bg-gray-100 rounded text-xs">
      <h3 class="font-semibold mb-2">Informations techniques</h3>
      <p>Process.client: {{ isClient ? 'true' : 'false' }}</p>
      <p>Process.server: {{ isServer ? 'true' : 'false' }}</p>
      <p>Timestamp: {{ new Date().toISOString() }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Configuration runtime
const config = useRuntimeConfig()

// Cookie d'authentification
const authToken = useCookie('auth-token')

// Test de disponibilité du module SFTP
const sftpModuleAvailable = ref(false)

// Détection côté client/serveur de manière sécurisée
const isClient = ref(false)
const isServer = ref(true)

onMounted(() => {
  isClient.value = true
  isServer.value = false
  
  // Tester si les composables SFTP sont disponibles
  try {
    // Ne pas appeler les composables, juste tester s'ils existent
    sftpModuleAvailable.value = typeof useSftp === 'function' && typeof useSftpConnections === 'function'
  } catch (error) {
    console.error('Erreur lors du test des composables SFTP:', error)
    sftpModuleAvailable.value = false
  }
})

// Middleware spécifique SFTP
definePageMeta({
  middleware: 'auth-sftp'
})

// Meta
useHead({
  title: 'Debug SFTP',
  meta: [
    { name: 'description', content: 'Page de debug pour le module SFTP' }
  ]
})
</script>
