export default defineNuxtRouteMiddleware(async () => {
  const { user, checkPermission } = await useAuth()
  
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentification requise'
    })
  }
  
  // Vérifier si l'utilisateur a les droits d'administration
  const hasAdminAccess = checkPermission(['Administrators', 'Domain Admins', 'Admin'])
  
  if (!hasAdminAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès non autorisé - Droits administrateur requis'
    })
  }
})
