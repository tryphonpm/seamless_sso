export default defineNuxtPlugin(async () => {
  const { initAuth } = useAuth()
  
  // Initialiser l'authentification au démarrage de l'application
  await initAuth()
  
  // Gestion du rafraîchissement automatique du token
  const token = useCookie('auth-token')
  
  if (token.value) {
    // Vérifier périodiquement si le token doit être rafraîchi
    const checkTokenExpiry = () => {
      if (!token.value) return
      
      try {
        const payload = JSON.parse(atob(token.value.split('.')[1]))
        const exp = payload.exp * 1000 // Convertir en millisecondes
        const now = Date.now()
        const timeUntilExpiry = exp - now
        
        // Rafraîchir le token 5 minutes avant expiration
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          const { refreshToken } = useAuth()
          refreshToken()
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error)
      }
    }
    
    // Vérifier toutes les minutes
    setInterval(checkTokenExpiry, 60 * 1000)
  }
})
