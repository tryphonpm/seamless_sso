import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  firstName: string
  lastName: string
  department?: string
  title?: string
  phone?: string
  groups: string[]
}

export interface LoginCredentials {
  username: string
  password: string
}

const user = ref<AuthUser | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)
  const token = useCookie('auth-token')

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<{
        success: boolean
        user: AuthUser
        token: string
      }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (data.success) {
        user.value = data.user
        // Ne pas définir le token côté client car il est géré par le cookie httpOnly
        
        // Attendre un tick pour que l'état soit synchronisé
        await nextTick()
        
        // Rediriger vers la page d'accueil avec remplacement de l'historique
        await navigateTo('/dashboard', { replace: true, external: false })
      }
    } catch (err: any) {
      console.error('Erreur de connexion détaillée:', err)
      
      // Gestion des différents types d'erreurs
      if (err.statusCode === 401) {
        error.value = 'Identifiants invalides'
      } else if (err.statusCode === 500) {
        error.value = err.data?.message || 'Erreur du serveur'
      } else if (err.name === 'FetchError') {
        error.value = 'Impossible de contacter le serveur'
      } else {
        error.value = err.data?.message || err.message || 'Erreur de connexion'
      }
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      isLoading.value = true
      
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      user.value = null
      token.value = null
      
      // Rediriger vers la page de connexion
      await navigateTo('/auth/login')
    } catch (err: any) {
      console.error('Erreur lors de la déconnexion:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchUser = async () => {
    try {
      // Essayer de récupérer l'utilisateur même sans token côté client
      // car le cookie httpOnly sera envoyé automatiquement avec la requête
      const data = await $fetch<{
        success: boolean
        user: AuthUser
      }>('/api/auth/me')

      if (data.success) {
        user.value = data.user
        return data.user
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération du profil:', err)
      // Nettoyer l'état utilisateur
      user.value = null
      if (process.client) {
        // Côté client, ne pas toucher au token car il est httpOnly
        console.log('Utilisateur non authentifié')
      }
    }
    
    return null
  }

  const refreshToken = async () => {
    try {
      const data = await $fetch<{
        success: boolean
        token: string
      }>('/api/auth/refresh', {
        method: 'POST'
      })

      if (data.success) {
        token.value = data.token
        return true
      }
    } catch (err: any) {
      console.error('Erreur lors du rafraîchissement du token:', err)
      user.value = null
      token.value = null
    }
    
    return false
  }

  const checkPermission = (requiredGroups: string[]) => {
    if (!user.value || !user.value.groups) {
      return false
    }
    
    return requiredGroups.some(group => 
      user.value!.groups.some(userGroup => 
        userGroup.toLowerCase().includes(group.toLowerCase())
      )
    )
  }

  const hasRole = (role: string) => {
    if (!user.value || !user.value.groups) {
      return false
    }
    
    return user.value.groups.some(group => 
      group.toLowerCase().includes(role.toLowerCase())
    )
  }

  const initAuth = async () => {
    // Toujours essayer de récupérer l'utilisateur côté client
    // car le cookie httpOnly sera envoyé automatiquement
    if (process.client && !user.value) {
      await fetchUser()
    }
  }

  // Auto-initialisation côté client
  if (process.client && !user.value) {
    initAuth()
  }

  return {
    // État
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Actions
    login,
    logout,
    fetchUser,
    refreshToken,
    checkPermission,
    hasRole,
    initAuth
  }
}
