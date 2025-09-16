<template>
  <div class="min-h-screen bg-gray-100 py-6">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg p-6">
        <h1 class="text-xl font-semibold text-gray-900 mb-6">Test de connexion SFTP simple</h1>
        
        <!-- Connexion rapide au serveur de test -->
        <div class="mb-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Connexion rapide</h2>
          <button
            @click="connectToTestServer"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Icon v-if="isLoading" name="heroicons:arrow-path" class="animate-spin h-4 w-4 mr-2" />
            <Icon v-else name="heroicons:server" class="h-4 w-4 mr-2" />
            {{ isLoading ? 'Connexion...' : 'Se connecter au serveur de test' }}
          </button>
        </div>

        <!-- État de la connexion -->
        <div v-if="currentConnection" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div class="flex">
            <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-400" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Connecté à {{ currentConnection.name }}
              </h3>
              <p class="mt-1 text-sm text-green-700">
                {{ currentConnection.host }}
              </p>
            </div>
          </div>
        </div>

        <!-- Message d'erreur -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <Icon name="heroicons:x-circle" class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erreur de connexion</h3>
              <p class="mt-1 text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Navigateur de fichiers -->
        <div v-if="currentConnection">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Navigateur de fichiers</h2>
          <SftpBrowser />
        </div>

        <!-- Instructions -->
        <div v-else class="mt-8">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Instructions</h2>
          <div class="prose text-sm text-gray-600">
            <p>Cette page utilise un serveur SFTP de test public :</p>
            <ul>
              <li><strong>Serveur :</strong> test.rebex.net</li>
              <li><strong>Utilisateur :</strong> demo</li>
              <li><strong>Mot de passe :</strong> password</li>
            </ul>
            <p>Une fois connecté, vous pourrez :</p>
            <ul>
              <li>📁 Naviguer dans l'arborescence des fichiers</li>
              <li>⬇️ <strong>Télécharger des fichiers</strong> avec le bouton "Télécharger"</li>
              <li>⬆️ Uploader des fichiers</li>
              <li>📝 Renommer des fichiers et dossiers</li>
              <li>🗑️ Supprimer des fichiers et dossiers</li>
              <li>📂 Créer de nouveaux dossiers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Métadonnées de la page
definePageMeta({
  middleware: [] // Pas d'authentification pour le test
})

// Composables
const { 
  currentConnection, 
  isLoading, 
  error,
  connect
} = useSftp()

// Méthodes
const connectToTestServer = async () => {
  try {
    // Se connecter au serveur de test rebex
    await connect('rebex_test')
  } catch (err) {
    console.error('Erreur de connexion:', err)
  }
}
</script>