<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connexion
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Connectez-vous avec votre compte Active Directory
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Nom d'utilisateur</label>
            <input
              id="username"
              v-model="credentials.username"
              name="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Nom d'utilisateur ou email"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Mot de passe</label>
            <input
              id="password"
              v-model="credentials.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Mot de passe"
            />
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Erreur de connexion
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !credentials.username || !credentials.password"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Connexion en cours...</span>
            <span v-else>Se connecter</span>
          </button>
        </div>

        <div v-if="$config?.public?.samlEnabled" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">Ou</span>
            </div>
          </div>

          <div class="mt-6">
            <a
              href="/auth/saml"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Connexion SSO (SAML)
            </a>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/"
            class="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            Retour à l'accueil
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const { login, isLoading, error } = useAuth()
const { $config } = useNuxtApp()

const credentials = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  try {
    console.log('Tentative de connexion avec:', credentials.value.username)
    await login(credentials.value)
    console.log('Connexion réussie!')
  } catch (err) {
    console.error('Erreur dans handleLogin:', err)
    // L'erreur est déjà gérée dans le composable useAuth
  }
}

useHead({
  title: 'Connexion - Application SSO'
})
</script>
