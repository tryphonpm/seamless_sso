export default defineNuxtRouteMiddleware((to, from) => {
  // Routes qui nécessitent une authentification
  const protectedRoutes = ['/dashboard', '/admin', '/profile', '/protected']
  
  // Routes publiques (redirection si déjà connecté)
  const publicRoutes = ['/auth/login', '/login']
  
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))
  
  console.log(`Middleware global: ${to.path} - Protected: ${isProtectedRoute}, Public: ${isPublicRoute}`)
  
  // Laisser les routes SFTP être gérées par leur propre middleware
  if (to.path.startsWith('/sftp')) {
    console.log('Middleware global: Route SFTP, délégation au middleware spécifique')
    return
  }
  
  if (process.client) {
    console.log('Middleware global: Côté client')
    try {
      const { user, isAuthenticated } = useAuth()
      const isUserAuthenticated = isAuthenticated.value
      console.log(`Middleware global: Client - Authentifié? ${isUserAuthenticated}`)
      
      if (isProtectedRoute && !isUserAuthenticated) {
        console.log('Middleware global: Redirection vers login (client)')
        return navigateTo('/auth/login')
      }
      
      if (isPublicRoute && isUserAuthenticated && from?.path !== '/auth/login') {
        console.log('Middleware global: Redirection vers dashboard (client)')
        return navigateTo('/dashboard', { replace: true })
      }
    } catch (error) {
      console.warn('Erreur useAuth dans middleware:', error)
      console.log('Middleware global: Erreur composable, accès autorisé temporairement')
    }
  } else {
    console.log('Middleware global: Côté serveur - pas de vérification pour éviter l\'hydratation')
  }
})
