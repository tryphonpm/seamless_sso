<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test API SFTP</h1>
    
    <div class="mb-6">
      <button 
        @click="testConnectionsAPI"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
      >
        Tester /api/sftp/connections
      </button>
      
      <button 
        @click="testAuthAPI"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Tester /api/auth/me
      </button>
    </div>

    <div v-if="results.length > 0" class="space-y-4">
      <div 
        v-for="(result, index) in results" 
        :key="index"
        class="p-4 border rounded"
        :class="result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
      >
        <h3 class="font-semibold mb-2">{{ result.title }}</h3>
        <pre class="text-sm overflow-x-auto">{{ result.data }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pas de middleware pour cette page de test
definePageMeta({
  middleware: []
})

const results = ref<Array<{title: string, success: boolean, data: any}>>([])

const testConnectionsAPI = async () => {
  try {
    const response = await $fetch('/api/sftp/connections')
    results.value.unshift({
      title: '✅ GET /api/sftp/connections',
      success: true,
      data: JSON.stringify(response, null, 2)
    })
  } catch (error: any) {
    results.value.unshift({
      title: '❌ GET /api/sftp/connections',
      success: false,
      data: error.toString()
    })
  }
}

const testAuthAPI = async () => {
  try {
    const response = await $fetch('/api/auth/me')
    results.value.unshift({
      title: '✅ GET /api/auth/me',
      success: true,
      data: JSON.stringify(response, null, 2)
    })
  } catch (error: any) {
    results.value.unshift({
      title: '❌ GET /api/auth/me',
      success: false,
      data: error.toString()
    })
  }
}

useHead({
  title: 'Test API SFTP'
})
</script>
