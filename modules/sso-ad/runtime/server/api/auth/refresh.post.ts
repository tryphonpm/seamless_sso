import { JwtService } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token d\'authentification manquant'
      })
    }

    const config = useRuntimeConfig()
    const jwtService = new JwtService(config.jwtSecret)

    // Rafraîchir le token
    const newToken = jwtService.refreshToken(token)

    // Mettre à jour le cookie
    setCookie(event, 'auth-token', newToken, {
      httpOnly: true,
      secure: config.public.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 heures
    })

    return {
      success: true,
      token: newToken,
      message: 'Token rafraîchi avec succès'
    }

  } catch (error: any) {
    console.error('Erreur lors du rafraîchissement du token:', error)
    
    // Supprimer le cookie invalide
    deleteCookie(event, 'auth-token')
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Impossible de rafraîchir le token'
    })
  }
})
