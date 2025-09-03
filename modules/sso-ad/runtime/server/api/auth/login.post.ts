import { LdapService } from '../../utils/ldap'
import { JwtService } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event)

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nom d\'utilisateur et mot de passe requis'
      })
    }

    const config = useRuntimeConfig()
    
    // Initialiser les services
    const ldapService = new LdapService({
      url: config.adUrl,
      baseDN: config.adBaseDn,
      username: config.adUsername,
      password: config.adPassword
    })

    const jwtService = new JwtService(config.jwtSecret)

    // Authentifier l'utilisateur via LDAP
    const user = await ldapService.authenticate(username, password)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Identifiants invalides'
      })
    }

    // Récupérer les groupes de l'utilisateur
    const groups = await ldapService.getUserGroups(user.sAMAccountName)

    // Générer le token JWT
    const token = jwtService.generateToken({
      userId: user.sAMAccountName,
      username: user.sAMAccountName,
      email: user.mail,
      groups: groups
    })

    // Définir le cookie de session
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: config.public.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 heures
    })

    // Nettoyer les ressources LDAP
    await ldapService.disconnect()

    return {
      success: true,
      user: {
        id: user.sAMAccountName,
        username: user.sAMAccountName,
        email: user.mail,
        name: user.cn,
        firstName: user.givenName,
        lastName: user.sn,
        department: user.department,
        title: user.title,
        phone: user.telephoneNumber,
        groups: groups
      },
      token
    }

  } catch (error: any) {
    console.error('Erreur de connexion:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur interne du serveur'
    })
  }
})
