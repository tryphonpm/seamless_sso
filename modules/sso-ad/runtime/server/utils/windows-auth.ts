import { createHash } from 'crypto'
import { LdapService } from './ldap'
import { JwtService } from './jwt'

export interface WindowsAuthResult {
  success: boolean
  user?: any
  token?: string
  error?: string
  authMethod?: string
}

export interface WindowsUserInfo {
  username: string
  domain?: string
  workstation?: string
}

export class WindowsAuthService {
  private ldapService: LdapService
  private jwtService: JwtService
  private domain: string

  constructor(config: any) {
    this.ldapService = new LdapService({
      url: config.adUrl,
      baseDN: config.adBaseDn,
      username: config.adUsername,
      password: config.adPassword
    })
    this.jwtService = new JwtService(config.jwtSecret)
    this.domain = config.adDomain || 'WORKGROUP'
  }

  /**
   * Authentification avec token NTLM
   */
  async authenticateWithNTLM(ntlmToken: string): Promise<WindowsAuthResult> {
    try {
      console.log('🔐 Tentative d\'authentification NTLM...')
      
      // Décoder le token NTLM
      const userInfo = this.parseNTLMType3(ntlmToken)
      
      if (!userInfo.username) {
        return { 
          success: false, 
          error: 'Impossible d\'extraire le nom d\'utilisateur du token NTLM',
          authMethod: 'ntlm'
        }
      }

      console.log(`👤 Utilisateur extrait: ${userInfo.username}@${userInfo.domain || this.domain}`)

      // Récupérer les informations utilisateur depuis AD
      const adUser = await this.ldapService.findUser(userInfo.username)
      
      if (!adUser) {
        return { 
          success: false, 
          error: `Utilisateur ${userInfo.username} non trouvé dans Active Directory`,
          authMethod: 'ntlm'
        }
      }

      // Récupérer les groupes
      const groups = await this.ldapService.getUserGroups(userInfo.username)
      console.log(`👥 Groupes trouvés: ${groups.length}`)

      // Générer le token JWT
      const jwtToken = this.jwtService.generateToken({
        userId: adUser.sAMAccountName,
        username: adUser.sAMAccountName,
        email: adUser.mail,
        domain: userInfo.domain || this.domain,
        groups: groups,
        authMethod: 'windows-ntlm',
        loginTime: new Date().toISOString()
      })

      await this.ldapService.disconnect()

      const user = {
        id: adUser.sAMAccountName,
        username: adUser.sAMAccountName,
        email: adUser.mail,
        name: adUser.cn,
        firstName: adUser.givenName,
        lastName: adUser.sn,
        department: adUser.department,
        title: adUser.title,
        phone: adUser.telephoneNumber,
        groups: groups,
        domain: userInfo.domain || this.domain
      }

      console.log(`✅ Authentification NTLM réussie pour ${user.username}`)

      return {
        success: true,
        user,
        token: jwtToken,
        authMethod: 'windows-ntlm'
      }

    } catch (error: any) {
      console.error('❌ Erreur authentification NTLM:', error)
      return { 
        success: false, 
        error: error.message,
        authMethod: 'ntlm'
      }
    }
  }

  /**
   * Validation d'un ticket Kerberos
   */
  async validateKerberosTicket(ticket: string): Promise<WindowsAuthResult> {
    try {
      console.log('🎫 Tentative de validation ticket Kerberos...')
      
      // TODO: Implémenter la validation Kerberos complète
      // En production, utiliser une bibliothèque comme 'node-krb5' ou 'kerberos'
      
      // Pour l'instant, essayer d'extraire des informations basiques
      const userInfo = this.extractKerberosInfo(ticket)
      
      if (!userInfo.username) {
        return { 
          success: false, 
          error: 'Impossible d\'extraire les informations du ticket Kerberos',
          authMethod: 'kerberos'
        }
      }

      // Même logique que NTLM pour récupérer l'utilisateur AD
      const adUser = await this.ldapService.findUser(userInfo.username)
      
      if (!adUser) {
        return { 
          success: false, 
          error: `Utilisateur ${userInfo.username} non trouvé dans AD`,
          authMethod: 'kerberos'
        }
      }

      const groups = await this.ldapService.getUserGroups(userInfo.username)
      
      const jwtToken = this.jwtService.generateToken({
        userId: adUser.sAMAccountName,
        username: adUser.sAMAccountName,
        email: adUser.mail,
        domain: userInfo.domain || this.domain,
        groups: groups,
        authMethod: 'windows-kerberos',
        loginTime: new Date().toISOString()
      })

      await this.ldapService.disconnect()

      console.log(`✅ Authentification Kerberos réussie pour ${userInfo.username}`)

      return {
        success: true,
        user: {
          id: adUser.sAMAccountName,
          username: adUser.sAMAccountName,
          email: adUser.mail,
          name: adUser.cn,
          firstName: adUser.givenName,
          lastName: adUser.sn,
          department: adUser.department,
          title: adUser.title,
          groups: groups,
          domain: userInfo.domain || this.domain
        },
        token: jwtToken,
        authMethod: 'windows-kerberos'
      }
      
    } catch (error: any) {
      console.error('❌ Erreur validation Kerberos:', error)
      return { 
        success: false, 
        error: `Validation Kerberos échouée: ${error.message}`,
        authMethod: 'kerberos'
      }
    }
  }

  /**
   * Parser un token NTLM Type 3 (simplified)
   */
  private parseNTLMType3(token: string): WindowsUserInfo {
    try {
      const buffer = Buffer.from(token, 'base64')
      
      // Vérifier la signature NTLM
      const signature = buffer.slice(0, 8)
      if (signature.toString() !== 'NTLMSSP\0') {
        throw new Error('Signature NTLM invalide')
      }

      // Vérifier le type de message (doit être 3)
      const messageType = buffer.readUInt32LE(8)
      if (messageType !== 3) {
        throw new Error(`Type de message NTLM incorrect: ${messageType}`)
      }

      // Extraire les informations de l'utilisateur
      // Structure NTLM Type 3 simplifiée
      const domainLength = buffer.readUInt16LE(28)
      const domainOffset = buffer.readUInt32LE(32)
      const userLength = buffer.readUInt16LE(36)
      const userOffset = buffer.readUInt32LE(40)
      const workstationLength = buffer.readUInt16LE(44)
      const workstationOffset = buffer.readUInt32LE(48)

      let username = ''
      let domain = ''
      let workstation = ''

      try {
        if (userLength > 0 && userOffset < buffer.length) {
          username = buffer.slice(userOffset, userOffset + userLength).toString('utf16le')
        }
        
        if (domainLength > 0 && domainOffset < buffer.length) {
          domain = buffer.slice(domainOffset, domainOffset + domainLength).toString('utf16le')
        }
        
        if (workstationLength > 0 && workstationOffset < buffer.length) {
          workstation = buffer.slice(workstationOffset, workstationOffset + workstationLength).toString('utf16le')
        }
      } catch (parseError) {
        console.warn('⚠️ Erreur parsing détaillé NTLM, utilisation fallback')
      }

      console.log(`📋 NTLM parsed: user=${username}, domain=${domain}, workstation=${workstation}`)

      return { username, domain, workstation }

    } catch (error: any) {
      console.error('❌ Erreur parsing NTLM:', error)
      
      // Fallback : essayer d'extraire depuis d'autres sources
      return this.fallbackNTLMParsing(token)
    }
  }

  /**
   * Fallback parsing NTLM si la méthode principale échoue
   */
  private fallbackNTLMParsing(token: string): WindowsUserInfo {
    try {
      // Méthode alternative : chercher des patterns dans le token
      const buffer = Buffer.from(token, 'base64')
      const tokenStr = buffer.toString('binary')
      
      // Chercher des patterns de nom d'utilisateur (très basique)
      const matches = tokenStr.match(/[\x20-\x7E]{3,20}/g)
      
      if (matches && matches.length > 0) {
        // Prendre la première chaîne qui ressemble à un nom d'utilisateur
        const potentialUsername = matches.find(match => 
          /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(match) && match.length >= 3
        )
        
        if (potentialUsername) {
          console.log(`🔍 Fallback NTLM: username trouvé = ${potentialUsername}`)
          return { username: potentialUsername }
        }
      }
      
      return { username: '' }
      
    } catch (error) {
      console.error('❌ Fallback NTLM parsing échoué:', error)
      return { username: '' }
    }
  }

  /**
   * Extraire des informations d'un ticket Kerberos (simplified)
   */
  private extractKerberosInfo(ticket: string): WindowsUserInfo {
    try {
      // TODO: Implémentation complète du parsing Kerberos
      // Pour l'instant, retourner une structure vide
      console.log('⚠️ Parsing Kerberos non encore implémenté')
      
      return { username: '' }
      
    } catch (error) {
      console.error('❌ Erreur extraction Kerberos:', error)
      return { username: '' }
    }
  }

  /**
   * Vérifier si une IP est dans un réseau de confiance
   */
  static isInternalNetwork(clientIP: string, trustedNetworks: string[] = []): boolean {
    if (!clientIP) return false
    
    // Réseaux privés par défaut
    const defaultInternalNetworks = [
      '10.0.0.0/8',
      '172.16.0.0/12', 
      '192.168.0.0/16',
      '127.0.0.0/8'
    ]
    
    const networksToCheck = [...defaultInternalNetworks, ...trustedNetworks]
    
    for (const network of networksToCheck) {
      if (this.isIPInNetwork(clientIP, network)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Vérifier si une IP est dans un réseau CIDR
   */
  private static isIPInNetwork(ip: string, network: string): boolean {
    try {
      const [networkAddr, prefixLength] = network.split('/')
      const prefix = parseInt(prefixLength, 10)
      
      const ipNum = this.ipToNumber(ip)
      const networkNum = this.ipToNumber(networkAddr)
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0
      
      return (ipNum & mask) === (networkNum & mask)
      
    } catch (error) {
      console.error(`❌ Erreur vérification réseau ${ip} in ${network}:`, error)
      return false
    }
  }

  /**
   * Convertir une IP en nombre
   */
  private static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }
}

