<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-red-600 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-white">
              Administration
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/dashboard"
              class="text-red-200 hover:text-white px-3 py-2 text-sm font-medium"
            >
              Tableau de bord
            </NuxtLink>
            
            <button
              @click="logout"
              class="text-red-200 hover:text-white px-3 py-2 text-sm font-medium"
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
        <!-- Alerte admin -->
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Zone d'administration
              </h3>
              <div class="mt-2 text-sm text-red-700">
                Vous êtes dans une zone réservée aux administrateurs. Toutes les actions sont enregistrées.
              </div>
            </div>
          </div>
        </div>

        <!-- Informations système -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Informations système
            </h2>
            
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Serveur AD</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ adConfig.url || 'Non configuré' }}</dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Base DN</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ adConfig.baseDN || 'Non configuré' }}</dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">SAML activé</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="$config.public.samlEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ $config.public.samlEnabled ? 'Oui' : 'Non' }}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Environnement</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="isDevelopment ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'">
                    {{ isDevelopment ? 'Développement' : 'Production' }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Actions administrateur -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Actions administrateur
            </h2>
            
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                @click="testLdapConnection"
                :disabled="isTestingLdap"
                class="relative block w-full rounded-lg border-2 border-dashed border-blue-300 p-6 text-center hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <span class="mt-2 block text-sm font-medium text-blue-900">
                  {{ isTestingLdap ? 'Test en cours...' : 'Tester connexion LDAP' }}
                </span>
              </button>
              
              <button
                @click="viewLogs"
                class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <span class="mt-2 block text-sm font-medium text-gray-900">
                  Consulter les logs
                </span>
              </button>
              
              <button
                @click="clearSessions"
                :disabled="isClearingSessions"
                class="relative block w-full rounded-lg border-2 border-dashed border-red-300 p-6 text-center hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <span class="mt-2 block text-sm font-medium text-red-900">
                  {{ isClearingSessions ? 'Nettoyage...' : 'Vider les sessions' }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Résultats des tests -->
        <div v-if="testResults" class="mt-6 bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Résultats des tests
            </h3>
            
            <pre class="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">{{ testResults }}</pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const { logout } = useAuth()
const { $config } = useNuxtApp()

const isTestingLdap = ref(false)
const isClearingSessions = ref(false)
const testResults = ref('')

const adConfig = {
  url: 'ldap://your-ad-server:389',
  baseDN: 'dc=votre-domaine,dc=com'
}

const isDevelopment = process.env.NODE_ENV === 'development'

const testLdapConnection = async () => {
  isTestingLdap.value = true
  testResults.value = ''
  
  try {
    // Simuler un test de connexion LDAP
    await new Promise(resolve => setTimeout(resolve, 2000))
    testResults.value = `Test de connexion LDAP réussi
Serveur: ${adConfig.url}
Base DN: ${adConfig.baseDN}
Statut: Connexion établie avec succès
Temps de réponse: 45ms`
  } catch (error) {
    testResults.value = `Erreur lors du test LDAP: ${error}`
  } finally {
    isTestingLdap.value = false
  }
}

const viewLogs = () => {
  testResults.value = `Logs système (dernières 10 entrées):
[2024-01-15 10:30:15] INFO: Connexion utilisateur réussie - john.doe@domain.com
[2024-01-15 10:28:45] INFO: Token JWT généré pour utilisateur: jane.smith
[2024-01-15 10:25:30] WARN: Tentative de connexion avec mot de passe incorrect - test.user
[2024-01-15 10:20:12] INFO: Rafraîchissement de token réussi - admin@domain.com
[2024-01-15 10:15:55] INFO: Déconnexion utilisateur - john.doe@domain.com
[2024-01-15 10:10:30] ERROR: Erreur de connexion LDAP - Timeout
[2024-01-15 10:05:20] INFO: Démarrage du service d'authentification
[2024-01-15 09:58:45] INFO: Configuration SAML chargée
[2024-01-15 09:55:12] INFO: Connexion à la base de données établie
[2024-01-15 09:50:00] INFO: Application démarrée en mode ${isDevelopment ? 'développement' : 'production'}`
}

const clearSessions = async () => {
  isClearingSessions.value = true
  
  try {
    // Simuler le nettoyage des sessions
    await new Promise(resolve => setTimeout(resolve, 1500))
    testResults.value = `Nettoyage des sessions terminé:
- Sessions actives supprimées: 12
- Tokens expirés nettoyés: 45
- Cache vidé: Oui
- Temps d'exécution: 1.2s`
  } catch (error) {
    testResults.value = `Erreur lors du nettoyage: ${error}`
  } finally {
    isClearingSessions.value = false
  }
}

useHead({
  title: 'Administration - Application SSO'
})
</script>
