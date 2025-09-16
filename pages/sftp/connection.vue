<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Gestion des connexions SFTP
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Configurez et gérez vos connexions aux serveurs SFTP
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
      <!-- Redirection vers la page connections -->
      <div class="bg-blue-50 border border-blue-200 rounded-md p-6">
        <div class="flex">
          <Icon name="heroicons:information-circle" class="h-5 w-5 text-blue-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">
              Page déplacée
            </h3>
            <div class="mt-2 text-sm text-blue-700">
              <p class="mb-2">
                La gestion des connexions SFTP a été déplacée vers une page dédiée.
              </p>
              <NuxtLink
                to="/sftp/connections"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Aller à la gestion des connexions
                <Icon name="heroicons:arrow-right" class="ml-2 h-4 w-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Authentification gérée par le middleware global

// Redirection automatique après 3 secondes
onMounted(() => {
  setTimeout(() => {
    navigateTo('/sftp/connections')
  }, 3000)
})

// Meta
useHead({
  title: 'Gestion des connexions SFTP',
  meta: [
    { name: 'description', content: 'Gestion des connexions SFTP' }
  ]
})
</script>