// Middleware de sécurité SFTP
export default defineNuxtRouteMiddleware((to) => {
  // Vérifier l'authentification
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentification requise pour accéder au SFTP'
    })
  }

  // Vérifier les permissions SFTP si nécessaire
  const { user } = useAuth()
  const config = useRuntimeConfig()
  
  // Exemple de vérification de rôle (à adapter selon vos besoins)
  if (config.public.sftpRequireAdmin && user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permissions administrateur requises pour accéder au SFTP'
    })
  }
})