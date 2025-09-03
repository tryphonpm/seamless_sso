import { JwtService } from '../utils/jwt'

export default defineNitroPlugin(async (nitroApp) => {
  // Middleware pour vérifier l'authentification sur les routes protégées
  nitroApp.hooks.hook('request', async (event) => {
    const url = getRouterParam(event, '_') || event.node.req.url || ''
    
    // Routes qui nécessitent une authentification
    const protectedRoutes = ['/api/protected', '/dashboard', '/admin']
    
    // Routes publiques (pas besoin d'authentification)
    const publicRoutes = ['/api/auth', '/auth', '/login', '/', '/public']
    
    // Vérifier si la route est protégée
    const isProtectedRoute = protectedRoutes.some(route => url.startsWith(route))
    const isPublicRoute = publicRoutes.some(route => url.startsWith(route))
    
    if (isProtectedRoute && !isPublicRoute) {
      try {
        const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')
        
        if (!token) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Token d\'authentification requis'
          })
        }
        
        const config = useRuntimeConfig()
        const jwtService = new JwtService(config.jwtSecret)
        
        // Vérifier le token
        const payload = jwtService.verifyToken(token)
        
        // Ajouter les informations utilisateur au contexte
        event.context.user = payload
        
      } catch (error: any) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Token invalide ou expiré'
        })
      }
    }
  })
})
