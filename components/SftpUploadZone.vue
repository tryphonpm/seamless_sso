<template>
  <div
    :class="[
      'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
      isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
    ]"
    @drop="handleDrop"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @dragenter.prevent
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />
    
    <div class="space-y-2">
      <Icon 
        name="heroicons:cloud-arrow-up" 
        class="mx-auto h-12 w-12 text-gray-400" 
      />
      <div>
        <p class="text-sm text-gray-600">
          <button
            @click="triggerFileSelect"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Cliquez pour sélectionner
          </button>
          ou glissez-déposez vos fichiers ici
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Taille maximale: {{ formatFileSize(maxFileSize) }}
        </p>
      </div>
    </div>

    <!-- Liste des fichiers sélectionnés -->
    <div v-if="selectedFiles.length > 0" class="mt-4 space-y-2">
      <div class="text-left border-t pt-4">
        <h4 class="text-sm font-medium text-gray-900 mb-2">
          Fichiers sélectionnés ({{ selectedFiles.length }})
        </h4>
        <div class="space-y-1">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
          >
            <div class="flex items-center space-x-2">
              <Icon name="heroicons:document" class="h-4 w-4 text-gray-400" />
              <span class="font-medium">{{ file.name }}</span>
              <span class="text-gray-500">({{ formatFileSize(file.size) }})</span>
            </div>
            <button
              @click="removeFile(index)"
              class="text-red-500 hover:text-red-700"
            >
              <Icon name="heroicons:x-mark" class="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end space-x-2">
          <button
            @click="clearFiles"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            @click="uploadFiles"
            :disabled="isUploading"
            class="px-3 py-2 text-sm border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Icon 
              v-if="isUploading" 
              name="heroicons:arrow-path" 
              class="animate-spin h-4 w-4 mr-1" 
            />
            {{ isUploading ? 'Upload...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Barre de progression -->
    <div v-if="uploadProgress > 0" class="mt-4">
      <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
        <span>Upload en cours...</span>
        <span>{{ uploadProgress }}%</span>
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
interface Props {
  maxFileSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 100 * 1024 * 1024 // 100MB par défaut
})

const emit = defineEmits<{
  uploaded: [files: File[]]
}>()

// Composables
const { uploadFiles: sftpUploadFiles, uploadProgress } = useSftp()
const { formatFileSize } = useNuxtApp().$sftp

// État local
const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)
const isUploading = ref(false)

// Méthodes
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
    target.value = '' // Reset input
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  const validFiles = files.filter(file => {
    if (file.size > props.maxFileSize) {
      alert(`Le fichier "${file.name}" est trop volumineux (max: ${formatFileSize(props.maxFileSize)})`)
      return false
    }
    return true
  })
  
  selectedFiles.value.push(...validFiles)
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
  selectedFiles.value = []
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    isUploading.value = true
    await sftpUploadFiles(selectedFiles.value)
    emit('uploaded', selectedFiles.value)
    clearFiles()
  } catch (error) {
    console.error('Erreur upload:', error)
  } finally {
    isUploading.value = false
  }
}
</script>
