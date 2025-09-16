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
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            @change="handleFileUpload"
          />
          <button
            @click="triggerFileUpload"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Icon name="heroicons:arrow-up-tray" class="h-4 w-4 mr-1" />
            Upload
          </button>
          <button
            @click="showCreateFolderPrompt"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Icon name="heroicons:folder-plus" class="h-4 w-4 mr-1" />
            Nouveau dossier
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

    <!-- Barre de recherche -->
    <div v-if="files.length > 0" class="px-4 py-3 sm:px-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex-1 max-w-lg">
          <div class="relative">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Rechercher des fichiers..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div class="ml-4 flex items-center space-x-2">
          <select
            v-model="sortBy"
            class="block pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md"
          >
            <option value="name">Nom</option>
            <option value="size">Taille</option>
            <option value="date">Date</option>
          </select>
          <button
            @click="sortAscending = !sortAscending"
            class="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Icon 
              :name="sortAscending ? 'heroicons:bars-arrow-up' : 'heroicons:bars-arrow-down'" 
              class="h-4 w-4" 
            />
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
                @click="showRenamePrompt(file)"
                class="p-1 text-gray-400 hover:text-yellow-600"
                title="Renommer"
              >
                <Icon name="heroicons:pencil" class="h-4 w-4" />
              </button>
              <button
                @click="confirmDelete(file)"
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          {{ searchTerm ? 'Aucun fichier trouvé' : 'Dossier vide' }}
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchTerm ? 'Essayez avec des termes différents' : 'Ce dossier ne contient aucun fichier' }}
        </p>
      </div>

      <div v-if="isLoading" class="px-4 py-12 text-center">
        <Icon name="heroicons:arrow-path" class="animate-spin mx-auto h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>

    <!-- Barre de progression upload -->
    <div v-if="uploadProgress > 0" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-900">Upload en cours...</span>
        <span class="text-sm text-gray-500">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: uploadProgress + '%' }"
        ></div>
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
  uploadProgress,
  listFiles,
  navigateUp,
  navigateToDirectory,
  downloadFile,
  deleteFile,
  uploadFiles,
  createDirectory,
  renameFile
} = useSftp()

const { formatFileSize, formatDate, getFileIcon } = useNuxtApp().$sftp

// Refs
const fileInput = ref<HTMLInputElement>()
const searchTerm = ref('')
const sortBy = ref<'name' | 'size' | 'date'>('name')
const sortAscending = ref(true)

// Computed
const pathSegments = computed(() => {
  return currentPath.value.split('/').filter(segment => segment !== '')
})

const displayedFiles = computed(() => {
  let filteredFiles = files.value

  // Filtrer par terme de recherche
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase()
    filteredFiles = filteredFiles.filter(file => 
      file.name.toLowerCase().includes(term)
    )
  }

  // Trier
  const sorted = [...filteredFiles].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'date':
        comparison = a.modifyTime.getTime() - b.modifyTime.getTime()
        break
    }
    
    return sortAscending.value ? comparison : -comparison
  })

  // Toujours mettre les dossiers en premier
  return sorted.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'directory') return 1
    return 0
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

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    try {
      await uploadFiles(target.files)
      target.value = '' // Reset input
    } catch (error) {
      console.error('Erreur upload:', error)
    }
  }
}

const showCreateFolderPrompt = async () => {
  const folderName = prompt('Nom du nouveau dossier:')
  if (folderName && folderName.trim()) {
    try {
      await createDirectory(folderName.trim())
    } catch (error) {
      console.error('Erreur création dossier:', error)
    }
  }
}

const showRenamePrompt = async (file: any) => {
  const newName = prompt('Nouveau nom:', file.name)
  if (newName && newName.trim() && newName !== file.name) {
    try {
      await renameFile(file.name, newName.trim())
    } catch (error) {
      console.error('Erreur renommage:', error)
    }
  }
}

const confirmDelete = async (file: any) => {
  const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)
  if (confirmed) {
    try {
      await deleteFile(file.path)
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }
}
</script>
