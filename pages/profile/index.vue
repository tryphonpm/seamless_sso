<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                Profile
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
        <div class="px-4 py-6 sm:px-0">
          <!-- Informations utilisateur -->
          <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Informations du profil
              </h2>
              
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Nom complet</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ fullName }}</dd>
                </div>
                
                <div>
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ email }}</dd>
                </div>
                
                <div v-if="department">
                  <dt class="text-sm font-medium text-gray-500">Département</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ department }}</dd>
                </div>
                
                <div v-if="title">
                  <dt class="text-sm font-medium text-gray-500">Poste</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ title }}</dd>
                </div>
                
                <div v-if="phone">
                  <dt class="text-sm font-medium text-gray-500">Téléphone</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ phone }}</dd>
                </div>
                
                <div>
                  <dt class="text-sm font-medium text-gray-500">Nom d'utilisateur</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ user?.username }}</dd>
                </div>
              </dl>
            </div>
          </div>
  
          <!-- Groupes et permissions -->
          <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Groupes et permissions
              </h2>
              
              <div class="mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="isAdmin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'">
                  {{ isAdmin ? 'Administrateur' : 'Utilisateur standard' }}
                </span>
              </div>
              
              <div class="mt-4">
                <h3 class="text-sm font-medium text-gray-500 mb-2">Groupes Active Directory</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="group in groups"
                    :key="group"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ group }}
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Actions rapides -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Actions rapides
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
        </div>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  // Le middleware global auth.global.ts gère déjà la protection de cette route
  
  const { user, logout, fetchUser } = useAuth()
  const { 
    fullName, 
    displayName, 
    email, 
    department, 
    title, 
    phone, 
    initials, 
    isAdmin, 
    groups 
  } = useAuthUser()
  
  const isRefreshing = ref(false)
  
  const refreshUserInfo = async () => {
    isRefreshing.value = true
    try {
      await fetchUser()
    } finally {
      isRefreshing.value = false
    }
  }
  
  useHead({
    title: 'Tableau de bord - Application SSO'
  })
  </script>
  