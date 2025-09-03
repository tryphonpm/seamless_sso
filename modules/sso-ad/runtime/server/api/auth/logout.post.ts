export default defineEventHandler(async (event) => {
  try {
    // Supprimer le cookie d'authentification
    deleteCookie(event, 'auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return {
      success: true,
      message: 'Déconnexion réussie'
    }

  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la déconnexion'
    })
  }
})
