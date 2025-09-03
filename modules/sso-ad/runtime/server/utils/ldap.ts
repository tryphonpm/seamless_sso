import ldap from 'ldapjs'
import type { Client } from 'ldapjs'

export interface LdapUser {
  dn: string
  cn: string
  sn: string
  givenName: string
  mail: string
  sAMAccountName: string
  memberOf: string[]
  department?: string
  title?: string
  telephoneNumber?: string
}

export class LdapService {
  private client: Client | null = null
  private config: {
    url: string
    baseDN: string
    username: string
    password: string
  }

  constructor(config: { url: string; baseDN: string; username: string; password: string }) {
    this.config = config
  }

  private async connect(): Promise<Client> {
    if (this.client) {
      return this.client
    }

    this.client = ldap.createClient({
      url: this.config.url,
      timeout: 5000,
      connectTimeout: 10000,
      reconnect: true
    })

    return new Promise((resolve, reject) => {
      this.client!.bind(this.config.username, this.config.password, (err) => {
        if (err) {
          console.error('Erreur de connexion LDAP:', err)
          reject(new Error(`Erreur de connexion LDAP: ${err.message}`))
        } else {
          console.log('Connexion LDAP établie avec succès')
          resolve(this.client!)
        }
      })
    })
  }

  async authenticate(username: string, password: string): Promise<LdapUser | null> {
    try {
      const client = await this.connect()
      
      // Rechercher l'utilisateur
      const user = await this.findUser(username)
      if (!user) {
        throw new Error('Utilisateur non trouvé')
      }

      // Tenter l'authentification avec le DN complet
      const authClient = ldap.createClient({
        url: this.config.url,
        timeout: 5000,
        connectTimeout: 10000
      })

      return new Promise((resolve, reject) => {
        authClient.bind(user.dn, password, (err) => {
          authClient.unbind()
          
          if (err) {
            console.error('Échec de l\'authentification pour:', username, err.message)
            reject(new Error('Nom d\'utilisateur ou mot de passe incorrect'))
          } else {
            console.log('Authentification réussie pour:', username)
            resolve(user)
          }
        })
      })
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error)
      throw error
    }
  }

  async findUser(username: string): Promise<LdapUser | null> {
    try {
      const client = await this.connect()

      const searchOptions = {
        filter: `(|(sAMAccountName=${username})(mail=${username}))`,
        scope: 'sub' as const,
        attributes: [
          'dn', 'cn', 'sn', 'givenName', 'mail', 'sAMAccountName',
          'memberOf', 'department', 'title', 'telephoneNumber'
        ]
      }

      return new Promise((resolve, reject) => {
        client.search(this.config.baseDN, searchOptions, (err, res) => {
          if (err) {
            reject(err)
            return
          }

          let user: LdapUser | null = null

          res.on('searchEntry', (entry) => {
            const attributes = entry.attributes
            user = {
              dn: entry.dn.toString(),
              cn: this.getAttributeValue(attributes, 'cn') || '',
              sn: this.getAttributeValue(attributes, 'sn') || '',
              givenName: this.getAttributeValue(attributes, 'givenName') || '',
              mail: this.getAttributeValue(attributes, 'mail') || '',
              sAMAccountName: this.getAttributeValue(attributes, 'sAMAccountName') || '',
              memberOf: this.getAttributeValues(attributes, 'memberOf') || [],
              department: this.getAttributeValue(attributes, 'department'),
              title: this.getAttributeValue(attributes, 'title'),
              telephoneNumber: this.getAttributeValue(attributes, 'telephoneNumber')
            }
          })

          res.on('error', (err) => {
            reject(err)
          })

          res.on('end', () => {
            resolve(user)
          })
        })
      })
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateur:', error)
      throw error
    }
  }

  async getUserGroups(username: string): Promise<string[]> {
    const user = await this.findUser(username)
    if (!user) {
      return []
    }

    return user.memberOf.map(group => {
      // Extraire le nom du groupe du DN
      const match = group.match(/^CN=([^,]+)/)
      return match ? match[1] : group
    })
  }

  private getAttributeValue(attributes: any[], name: string): string | undefined {
    const attr = attributes.find(a => a.type === name)
    return attr && attr.values && attr.values.length > 0 ? attr.values[0] : undefined
  }

  private getAttributeValues(attributes: any[], name: string): string[] | undefined {
    const attr = attributes.find(a => a.type === name)
    return attr && attr.values ? attr.values : undefined
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.unbind()
      this.client = null
    }
  }
}
