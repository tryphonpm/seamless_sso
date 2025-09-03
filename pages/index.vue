<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Bienvenue sur l'application SSO
      </h1>
      <p class="mt-2 text-center text-sm text-gray-600">
        Authentification avec Active Directory
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="space-y-6">
          <div v-if="isAuthenticated" class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-green-600 text-xl font-semibold">{{ initials }}</span>
              </div>
              <h2 class="text-xl font-semibold text-gray-900">{{ displayName }}</h2>
              <p class="text-gray-600">{{ email }}</p>
              <p v-if="department" class="text-sm text-gray-500">{{ department }}</p>
            </div>
            
            <div class="space-y-3">
              <NuxtLink
                to="/dashboard"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Accéder au tableau de bord
              </NuxtLink>
              
              <button
                @click="logout"
                :disabled="isLoading"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <span v-if="isLoading">Déconnexion...</span>
                <span v-else>Se déconnecter</span>
              </button>
            </div>
          </div>

          <div v-else class="text-center">
            <p class="text-gray-600 mb-6">
              Connectez-vous avec votre compte Active Directory
            </p>
            
            <div class="space-y-3">
              <NuxtLink
                to="/auth/login"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Se connecter
              </NuxtLink>
              
              <NuxtLink
                v-if="$config.public.samlEnabled"
                to="/auth/saml"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Connexion SSO (SAML)
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, isLoading, logout } = useAuth()
const { displayName, email, department, initials } = useAuthUser()
const { $config } = useNuxtApp()

useHead({
  title: 'Accueil - Application SSO'
})
</script>
