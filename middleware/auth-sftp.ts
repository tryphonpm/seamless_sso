// Middleware spécifique pour les routes SFTP
export default defineNuxtRouteMiddleware(async (to) => {
  // Vérifier si c'est une route SFTP
  if (!to.path.startsWith('/sftp')) {
    return
  }

  console.log('Middleware SFTP: Vérification de l\'accès à', to.path)

  // Pages de debug et status accessibles sans authentification
  if (to.path === '/sftp/debug' || to.path === '/sftp/status') {
    console.log('Middleware SFTP: Accès debug/status autorisé sans vérification')
    return
  }
  
  if (process.client) {
    console.log('Middleware SFTP: Vérification côté client')
    try {
      const { user, fetchUser, isAuthenticated } = useAuth()
      
      // Si pas d'utilisateur, essayer de le récupérer
      if (!user.value) {
        console.log('Middleware SFTP: Tentative de récupération utilisateur')
        const fetchedUser = await fetchUser()
        if (!fetchedUser) {
          console.log('Middleware SFTP: Pas d\'utilisateur, redirection vers login')
          return navigateTo('/auth/login')
        }
      }
      
      if (!isAuthenticated.value) {
        console.log('Middleware SFTP: Non authentifié, redirection vers login')
        return navigateTo('/auth/login')
      }
      
      console.log('Middleware SFTP: Utilisateur authentifié, accès autorisé')
    } catch (error) {
      console.error('Erreur middleware SFTP:', error)
      return navigateTo('/auth/login')
    }
  } else {
    console.log('Middleware SFTP: Côté serveur - vérification différée')
  }
})




