<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test Simple SFTP</h1>
    
    <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded">
      <h2 class="text-lg font-semibold text-green-800 mb-2">✅ Page accessible</h2>
      <p class="text-green-700">Cette page s'affiche sans problème d'hydratation.</p>
    </div>

    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Informations statiques</h2>
      <div class="space-y-2 text-sm">
        <p><strong>Route:</strong> /sftp/simple</p>
        <p><strong>Middleware:</strong> Aucun</p>
        <p><strong>Status:</strong> Fonctionnel</p>
      </div>
    </div>

    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Test d'authentification</h2>
      <button 
        @click="runAuthTest"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Tester l'authentification
      </button>
      
      <div v-if="authTestResult" class="p-3 bg-gray-50 rounded text-sm">
        <pre>{{ authTestResult }}</pre>
      </div>
    </div>

    <div class="space-x-4">
      <NuxtLink 
        to="/dashboard" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink 
        to="/sftp/status" 
        class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 inline-block"
      >
        Status avancé
      </NuxtLink>
      <NuxtLink 
        to="/sftp" 
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
      >
        SFTP Principal
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Aucun middleware
definePageMeta({
  middleware: []
})

const authTestResult = ref('')

const runAuthTest = async () => {
  authTestResult.value = 'Test en cours...'
  
  try {
    // Test 1: Appel direct à l'API
    const response = await $fetch('/api/auth/me')
    authTestResult.value = `✅ API /api/auth/me : ${JSON.stringify(response, null, 2)}`
  } catch (error: any) {
    authTestResult.value = `❌ Erreur API : ${error.message || error.toString()}`
  }
}

// Meta
useHead({
  title: 'Test Simple SFTP'
})
</script>

