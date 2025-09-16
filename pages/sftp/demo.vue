<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Démonstration SFTP
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Exemple d'utilisation du module SFTP
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/sftp"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Icon name="heroicons:arrow-left" class="h-4 w-4 mr-2" />
              Retour SFTP
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="py-8">
      <SftpExample />
    </div>
  </div>
</template>

<script setup lang="ts">
// Authentification gérée par le middleware global

// Meta
useHead({
  title: 'Démonstration SFTP',
  meta: [
    { name: 'description', content: 'Exemple d\'utilisation du module SFTP' }
  ]
})
</script>
