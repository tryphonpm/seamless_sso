import passport from 'passport'
import { Strategy as SamlStrategy } from 'passport-saml'
import { JwtService } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    if (!config.public.samlEnabled) {
      throw createError({
        statusCode: 404,
        statusMessage: 'SAML non configuré'
      })
    }

    const body = await readBody(event)
    
    // Configuration de la stratégie SAML
    const samlStrategy = new SamlStrategy(
      {
        entryPoint: config.samlEntryPoint,
        issuer: config.samlIssuer,
        callbackUrl: config.samlCallbackUrl,
        cert: config.samlCert,
        validateInResponseTo: false,
        disableRequestedAuthnContext: true
      },
      (profile: any, done: any) => {
        return done(null, profile)
      }
    )

    // Traiter la réponse SAML
    const profile = await new Promise<any>((resolve, reject) => {
      samlStrategy._verify(body, (err: any, user: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(user)
        }
      })
    })

    if (!profile) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentification SAML échouée'
      })
    }

    // Extraire les informations utilisateur du profil SAML
    const user = {
      id: profile.nameID || profile.NameID,
      username: profile.nameID || profile.NameID,
      email: profile.email || profile.EmailAddress || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      name: profile.displayName || profile.DisplayName || profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/displayname'],
      firstName: profile.givenName || profile.GivenName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
      lastName: profile.surname || profile.Surname || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
      groups: profile.groups || profile.Groups || profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] || []
    }

    // Générer le token JWT
    const jwtService = new JwtService(config.jwtSecret)
    const token = jwtService.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      groups: Array.isArray(user.groups) ? user.groups : [user.groups].filter(Boolean)
    })

    // Définir le cookie de session
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: config.public.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 heures
    })

    return {
      success: true,
      user,
      token
    }

  } catch (error: any) {
    console.error('Erreur callback SAML:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur lors du traitement de la réponse SAML'
    })
  }
})
