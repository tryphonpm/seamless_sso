export default defineNuxtRouteMiddleware((to, from) => {
  // Routes qui nécessitent une authentification
  const protectedRoutes = ['/dashboard', '/admin', '/profile', '/protected']
  
  // Routes publiques (redirection si déjà connecté)
  const publicRoutes = ['/auth/login', '/login']
  
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))
  
  if (process.client) {
    const { user, isAuthenticated } = useAuth()
    const token = useCookie('auth-token')
    
    // Utiliser l'état du composable plutôt que juste le cookie
    const isUserAuthenticated = isAuthenticated.value || !!token.value
    
    if (isProtectedRoute && !isUserAuthenticated) {
      return navigateTo('/auth/login')
    }
    
    // Ne pas rediriger automatiquement depuis les pages publiques si l'utilisateur vient de se connecter
    // Laisser le composable useAuth gérer la redirection après login
    if (isPublicRoute && isUserAuthenticated && from?.path !== '/auth/login') {
      return navigateTo('/dashboard', { replace: true })
    }
  }
})
