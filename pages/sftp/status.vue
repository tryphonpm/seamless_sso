<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Status SFTP - Aucun middleware</h1>
    
    <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded">
      <h2 class="text-lg font-semibold text-green-800 mb-2">✅ Page accessible</h2>
      <p class="text-green-700">Cette page s'affiche sans middleware d'authentification.</p>
    </div>

    <!-- Informations de base -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Informations de base</h2>
      <div class="space-y-2 text-sm">
        <p><strong>Route:</strong> {{ $route.path }}</p>
        <p><strong>Timestamp:</strong> {{ timestamp }}</p>
        <p><strong>Process client:</strong> {{ isClient ? 'Oui' : 'Non' }}</p>
        <p><strong>Process server:</strong> {{ isServer ? 'Oui' : 'Non' }}</p>
      </div>
    </div>

    <!-- Test des cookies côté client uniquement -->
    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Cookies (Client uniquement)</h2>
      <ClientOnly>
        <div id="cookie-info">
          <p class="text-sm">Chargement des informations de cookies...</p>
        </div>
        <template #fallback>
          <p class="text-gray-500 text-sm">Rendu côté serveur - cookies non disponibles</p>
        </template>
      </ClientOnly>
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
        to="/sftp/debug" 
        class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 inline-block"
      >
        Debug avec middleware
      </NuxtLink>
      <button 
        @click="testAuth"
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Tester Auth
      </button>
    </div>

    <!-- Résultats des tests -->
    <div v-if="testResults.length > 0" class="mt-6 p-4 bg-gray-50 rounded">
      <h3 class="font-semibold mb-2">Résultats des tests</h3>
      <div class="space-y-1 text-sm">
        <p v-for="(result, index) in testResults" :key="index">
          {{ result }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Aucun middleware - page accessible à tous
definePageMeta({
  middleware: [] // Désactiver explicitement tous les middlewares
})

// État local
const timestamp = new Date().toISOString()
const testResults = ref<string[]>([])

// Détection côté client/serveur de manière sécurisée
const isClient = ref(false)
const isServer = ref(true)

// Test de l'authentification côté client
const testAuth = () => {
  testResults.value = []
  
  if (isClient.value) {
    try {
      // Tester les cookies
      const authToken = useCookie('auth-token')
      testResults.value.push(`Cookie auth-token: ${authToken.value ? 'Présent' : 'Absent'}`)
      
      // Tester le localStorage
      const localData = localStorage.getItem('auth-user')
      testResults.value.push(`LocalStorage auth-user: ${localData ? 'Présent' : 'Absent'}`)
      
      // Tester les composables
      try {
        const { isAuthenticated } = useAuth()
        testResults.value.push(`Composable useAuth: ${isAuthenticated.value ? 'Authentifié' : 'Non authentifié'}`)
      } catch (error) {
        testResults.value.push(`Erreur useAuth: ${error.message}`)
      }
      
    } catch (error) {
      testResults.value.push(`Erreur générale: ${error.message}`)
    }
  } else {
    testResults.value.push('Test disponible uniquement côté client')
  }
}

// Mettre à jour les infos côté client
onMounted(() => {
  isClient.value = true
  isServer.value = false
  
  const cookieInfo = document.getElementById('cookie-info')
  if (cookieInfo) {
    const authToken = useCookie('auth-token')
    cookieInfo.innerHTML = `
      <div class="space-y-1 text-sm">
        <p><strong>auth-token:</strong> ${authToken.value ? 'Présent (' + authToken.value.substring(0, 20) + '...)' : 'Absent'}</p>
        <p><strong>Document cookies:</strong> ${document.cookie ? 'Présents' : 'Aucun'}</p>
        <p><strong>Nombre de cookies:</strong> ${document.cookie.split(';').length}</p>
      </div>
    `
  }
})

// Meta
useHead({
  title: 'Status SFTP - Sans middleware'
})
</script>
