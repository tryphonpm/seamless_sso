import { JwtService } from '../../utils/jwt'
import { LdapService } from '../../utils/ldap'

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

    // Vérifier et décoder le token
    const payload = jwtService.verifyToken(token)

    // Optionnel : récupérer les informations utilisateur actualisées depuis AD
    const ldapService = new LdapService({
      url: config.adUrl,
      baseDN: config.adBaseDn,
      username: config.adUsername,
      password: config.adPassword
    })

    const user = await ldapService.findUser(payload.username)
    await ldapService.disconnect()

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Utilisateur non trouvé'
      })
    }

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
        groups: payload.groups
      }
    }

  } catch (error: any) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error)
    
    throw createError({
      statusCode: error.statusCode || 401,
      statusMessage: error.message || 'Non autorisé'
    })
  }
})
