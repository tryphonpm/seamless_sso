export default defineNuxtRouteMiddleware((to) => {
  const { $auth } = useNuxtApp()
  
  // Routes qui nécessitent une authentification
  const protectedRoutes = ['/dashboard', '/admin', '/profile', '/protected']
  
  // Routes publiques (redirection si déjà connecté)
  const publicRoutes = ['/auth/login', '/login']
  
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))
  
  if (process.client) {
    const token = useCookie('auth-token')
    const isAuthenticated = !!token.value
    
    if (isProtectedRoute && !isAuthenticated) {
      return navigateTo('/auth/login')
    }
    
    if (isPublicRoute && isAuthenticated) {
      return navigateTo('/dashboard')
    }
  }
})
