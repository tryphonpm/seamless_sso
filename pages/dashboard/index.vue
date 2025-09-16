<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              Tableau de bord
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 text-sm font-semibold">{{ initials }}</span>
              </div>
              <div class="text-sm">
                <div class="font-medium text-gray-900">{{ displayName }}</div>
                <div class="text-gray-500">{{ email }}</div>
              </div>
            </div>
            
            <button
              @click="logout"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenu principal -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
<!-- Actions rapides -->
<div class="bg-white overflow-hidden shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <h2 class="text-lg font-medium text-gray-900 mb-4">
      GDI
    </h2>
    
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        to="/profile"
        class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span class="mt-2 block text-sm font-medium text-gray-900">
          Modifier le profil
        </span>
      </NuxtLink>
      
      <NuxtLink
        v-if="isAdmin"
        to="/admin"
        class="relative block w-full rounded-lg border-2 border-dashed border-red-300 p-6 text-center hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <span class="mt-2 block text-sm font-medium text-red-900">
          Administration
        </span>
      </NuxtLink>
      
      <button
        @click="refreshUserInfo"
        :disabled="isRefreshing"
        class="relative block w-full rounded-lg border-2 border-dashed border-green-300 p-6 text-center hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
      >
        <span class="mt-2 block text-sm font-medium text-green-900">
          {{ isRefreshing ? 'Actualisation...' : 'Actualiser les infos' }}
        </span>
      </button>
    </div>
  </div>
</div>
<div class="bg-white overflow-hidden shadow rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <h2 class="text-lg font-medium text-gray-900 mb-4">
      CONNEXIONS SFTP
    </h2>
    
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        to="/sftp/status"
        class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span class="mt-2 block text-sm font-medium text-gray-900">
          STATUS
        </span>
      </NuxtLink>
      <NuxtLink
      to="/sftp/simple"
      class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <span class="mt-2 block text-sm font-medium text-gray-900">
        SIMPLE
      </span>
    </NuxtLink>
    <NuxtLink
    to="/sftp/api-test"
    class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <span class="mt-2 block text-sm font-medium text-gray-900">
      API-TEST
    </span>
  </NuxtLink>
  <NuxtLink
  to="/sftp/test"
  class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <span class="mt-2 block text-sm font-medium text-gray-900">
    TEST
  </span>
</NuxtLink>

<NuxtLink
to="/sftp/debug"
class="relative block w-full rounded-lg border-2 border-dashed border-red-300 p-6 text-center hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
>
<span class="mt-2 block text-sm font-medium text-red-900">
  DEBUG
</span>
</NuxtLink>
      <NuxtLink
        to="/sftp/download-test"
        class="relative block w-full rounded-lg border-2 border-dashed border-red-300 p-6 text-center hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <span class="mt-2 block text-sm font-medium text-red-900">
          DOWNLOAD-TEST
        </span>
      </NuxtLink>
      

    </div>
  </div>
</div>


</main>
  </div>
</template>

<script setup lang="ts">
// Le middleware global auth.global.ts gère déjà la protection de cette route

const { logout } = useAuth()
const { displayName, email, initials } = useAuthUser()

useHead({
  title: 'Tableau de bord - Application SSO'
})
</script>
