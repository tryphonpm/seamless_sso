import { WindowsAuthService } from '../../utils/windows-auth'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Vérifier si l'authentification Windows est activée
    if (!config.windowsAuthEnabled) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Authentification Windows désactivée'
      })
    }

    const authHeader = getHeader(event, 'authorization')
    const userAgent = getHeader(event, 'user-agent') || ''
    const clientIP = getClientIP(event) || ''
    
    console.log(`🔍 Tentative auth Windows - IP: ${clientIP}, UA: ${userAgent.substring(0, 50)}...`)
    
    // Vérifier si le client est sur un réseau de confiance
    const trustedNetworks = config.ssoAd?.windowsAuth?.trustedNetworks || []
    if (!WindowsAuthService.isInternalNetwork(clientIP, trustedNetworks)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Accès refusé depuis ce réseau'
      })
    }

    // Vérifier si le navigateur supporte l'authentification intégrée
    const supportedBrowsers = ['Trident', 'Edge', 'Chrome', 'Firefox']
    const browserSupported = supportedBrowsers.some(browser => 
      userAgent.toLowerCase().includes(browser.toLowerCase())
    )

    if (!browserSupported) {
      console.log(`⚠️ Navigateur non supporté: ${userAgent}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Navigateur non supporté pour l\'authentification Windows'
      })
    }

    if (!authHeader) {
      // Première requête - demander l'authentification
      console.log('🔐 Demande d\'authentification Windows...')
      
      setResponseHeader(event, 'WWW-Authenticate', 'Negotiate')
      setResponseHeader(event, 'WWW-Authenticate', 'NTLM')
      
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentification Windows requise'
      })
    }

    const windowsAuthService = new WindowsAuthService(config)
    let result: any

    if (authHeader.startsWith('Negotiate ')) {
      // Token Kerberos
      console.log('🎫 Traitement token Kerberos...')
      const ticket = authHeader.substring(10)
      result = await windowsAuthService.validateKerberosTicket(ticket)
      
    } else if (authHeader.startsWith('NTLM ')) {
      // Token NTLM
      console.log('🔐 Traitement token NTLM...')
      const token = authHeader.substring(5)
      result = await windowsAuthService.authenticateWithNTLM(token)
      
    } else {
      console.log(`❌ Type d'auth non supporté: ${authHeader.substring(0, 20)}...`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Type d\'authentification non supporté'
      })
    }

    if (!result.success) {
      console.log(`❌ Échec authentification: ${result.error}`)
      
      // Si fallback activé, rediriger vers formulaire
      const fallbackEnabled = config.ssoAd?.windowsAuth?.fallbackToForm !== false
      
      if (fallbackEnabled && !getQuery(event).no_fallback) {
        return await sendRedirect(event, '/auth/login?reason=windows_auth_failed', 302)
      }
      
      throw createError({
        statusCode: 401,
        statusMessage: result.error || 'Échec de l\'authentification Windows'
      })
    }

    console.log(`✅ Authentification Windows réussie: ${result.user.username}`)

    // Définir le cookie JWT
    const cookieOptions = {
      httpOnly: true,
      secure: config.public.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 8 * 60 * 60, // 8 heures
      domain: config.public.domain ? `.${config.public.domain}` : undefined
    }

    setCookie(event, 'auth-token', result.token!, cookieOptions)

    // Log de l'authentification réussie
    console.log(`📊 Auth Windows réussie - User: ${result.user.username}, Method: ${result.authMethod}, Groups: ${result.user.groups?.length || 0}`)

    return {
      success: true,
      user: result.user,
      authMethod: result.authMethod,
      message: 'Authentification Windows réussie',
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('❌ Erreur authentification Windows:', error)
    
    // En cas d'erreur, vérifier si on doit faire un fallback
    if (error.statusCode === 401 || error.statusCode === 400) {
      const fallbackEnabled = useRuntimeConfig().ssoAd?.windowsAuth?.fallbackToForm !== false
      
      if (fallbackEnabled && !getQuery(event).no_fallback) {
        console.log('🔄 Fallback vers formulaire de connexion')
        return await sendRedirect(event, '/auth/login?reason=windows_auth_failed', 302)
      }
    }
    
    throw error
  }
})