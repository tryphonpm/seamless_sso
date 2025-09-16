<template>
  <div class="bg-white shadow rounded-lg">
    <!-- Barre d'outils -->
    <div class="px-4 py-3 sm:px-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <!-- Chemin actuel -->
        <div class="flex items-center space-x-2">
          <Icon name="heroicons:folder" class="h-5 w-5 text-gray-400" />
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li>
                <button
                  @click="navigateToPath('/')"
                  class="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  /
                </button>
              </li>
              <li v-for="(segment, index) in pathSegments" :key="index" class="flex items-center">
                <Icon name="heroicons:chevron-right" class="h-3 w-3 text-gray-400 mx-2" />
                <button
                  @click="navigateToSegment(index)"
                  class="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {{ segment }}
                </button>
              </li>
            </ol>
          </nav>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <button
            @click="showUploadModal = true"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Icon name="heroicons:arrow-up-tray" class="h-4 w-4 mr-1" />
            Upload
          </button>
          <button
            @click="refreshFiles"
            :disabled="isLoading"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Icon 
              name="heroicons:arrow-path" 
              :class="isLoading ? 'animate-spin' : ''"
              class="h-4 w-4 mr-1" 
            />
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des fichiers -->
    <div class="overflow-hidden">
      <ul v-if="displayedFiles.length > 0" class="divide-y divide-gray-200">
        <!-- Bouton retour si pas à la racine -->
        <li v-if="currentPath !== '/'" class="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" @click="navigateUp">
          <div class="flex items-center">
            <Icon name="heroicons:arrow-up" class="h-5 w-5 text-gray-400 mr-3" />
            <span class="text-sm font-medium text-gray-900">.. (Dossier parent)</span>
          </div>
        </li>

        <li
          v-for="file in displayedFiles"
          :key="file.path"
          class="px-4 py-4 sm:px-6 hover:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center min-w-0 flex-1">
              <div class="flex-shrink-0 mr-3">
                <span class="text-2xl">{{ getFileIcon(file.name, file.type === 'directory') }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <button
                  v-if="file.type === 'directory'"
                  @click="navigateToDirectory(file.name)"
                  class="text-left"
                >
                  <p class="text-sm font-medium text-blue-600 hover:text-blue-800 truncate">
                    {{ file.name }}
                  </p>
                </button>
                <p v-else class="text-sm font-medium text-gray-900 truncate">
                  {{ file.name }}
                </p>
                <div class="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                  <span v-if="file.type === 'file'">{{ formatFileSize(file.size) }}</span>
                  <span>{{ formatDate(file.modifyTime) }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button
                v-if="file.type === 'file'"
                @click="downloadFile(file.path, file.name)"
                class="p-1 text-gray-400 hover:text-blue-600"
                title="Télécharger"
              >
                <Icon name="heroicons:arrow-down-tray" class="h-4 w-4" />
              </button>
              <button
                @click="deleteFile(file.path)"
                class="p-1 text-gray-400 hover:text-red-600"
                title="Supprimer"
              >
                <Icon name="heroicons:trash" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-else-if="!isLoading" class="px-4 py-12 text-center">
        <Icon name="heroicons:document" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Dossier vide</h3>
        <p class="mt-1 text-sm text-gray-500">Ce dossier ne contient aucun fichier</p>
      </div>

      <div v-if="isLoading" class="px-4 py-12 text-center">
        <Icon name="heroicons:arrow-path" class="animate-spin mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Composables
const { 
  currentPath, 
  files, 
  isLoading,
  listFiles,
  navigateUp,
  navigateToDirectory,
  downloadFile,
  deleteFile
} = useSftp()

const { formatFileSize, formatDate, getFileIcon } = useNuxtApp().$sftp

// Computed
const pathSegments = computed(() => {
  return currentPath.value.split('/').filter(segment => segment !== '')
})

const displayedFiles = computed(() => {
  return [...files.value].sort((a, b) => {
    // Dossiers en premier
    if (a.type === 'directory' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'directory') return 1
    return a.name.localeCompare(b.name)
  })
})

// Méthodes
const navigateToPath = async (path: string) => {
  await listFiles(path)
}

const navigateToSegment = async (index: number) => {
  const segments = pathSegments.value.slice(0, index + 1)
  const path = '/' + segments.join('/')
  await navigateToPath(path)
}

const refreshFiles = async () => {
  await listFiles(currentPath.value)
}
</script>