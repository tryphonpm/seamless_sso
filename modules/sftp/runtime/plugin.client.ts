// Plugin client SFTP
export default defineNuxtPlugin(() => {
  // Initialisation côté client pour le module SFTP
  console.log('🔌 Plugin client SFTP initialisé')

  // Ajouter des utilitaires globaux si nécessaire
  return {
    provide: {
      sftp: {
        // Utilitaire pour formater la taille des fichiers
        formatFileSize: (bytes: number): string => {
          if (bytes === 0) return '0 B'
          
          const k = 1024
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        },

        // Utilitaire pour formater les dates
        formatDate: (date: Date | string): string => {
          const d = typeof date === 'string' ? new Date(date) : date
          return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        },

        // Utilitaire pour obtenir l'icône d'un fichier selon son extension
        getFileIcon: (filename: string, isDirectory: boolean): string => {
          if (isDirectory) return '📁'
          
          const extension = filename.split('.').pop()?.toLowerCase()
          
          const iconMap: Record<string, string> = {
            // Images
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
            // Documents
            pdf: '📄', doc: '📝', docx: '📝', txt: '📝', rtf: '📝',
            // Feuilles de calcul
            xls: '📊', xlsx: '📊', csv: '📊',
            // Présentations
            ppt: '📊', pptx: '📊',
            // Archives
            zip: '🗜️', rar: '🗜️', tar: '🗜️', gz: '🗜️', '7z': '🗜️',
            // Code
            js: '📜', ts: '📜', html: '📜', css: '📜', php: '📜', py: '📜',
            // Vidéo
            mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥',
            // Audio
            mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵'
          }
          
          return iconMap[extension || ''] || '📄'
        },

        // Utilitaire pour valider les noms de fichiers
        isValidFilename: (filename: string): boolean => {
          // Caractères interdits dans les noms de fichiers
          const invalidChars = /[<>:"/\\|?*]/
          return !invalidChars.test(filename) && filename.trim().length > 0
        }
      }
    }
  }
})