import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: string
  username: string
  email: string
  groups: string[]
  iat?: number
  exp?: number
}

export class JwtService {
  private secret: string
  private expiresIn: string

  constructor(secret: string, expiresIn: string = '24h') {
    this.secret = secret
    this.expiresIn = expiresIn
  }

  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
        issuer: 'nuxt-sso-ad',
        audience: 'nuxt-app'
      })
    } catch (error) {
      console.error('Erreur lors de la génération du token JWT:', error)
      throw new Error('Impossible de générer le token d\'authentification')
    }
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'nuxt-sso-ad',
        audience: 'nuxt-app'
      }) as JwtPayload

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expiré')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token invalide')
      } else {
        console.error('Erreur lors de la vérification du token:', error)
        throw new Error('Erreur de vérification du token')
      }
    }
  }

  refreshToken(token: string): string {
    try {
      const decoded = this.verifyToken(token)
      
      // Créer un nouveau token avec les mêmes données
      const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        groups: decoded.groups
      }

      return this.generateToken(newPayload)
    } catch (error) {
      throw new Error('Impossible de rafraîchir le token')
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload
      return decoded
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error)
      return null
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) {
        return true
      }

      const currentTime = Math.floor(Date.now() / 1000)
      return decoded.exp < currentTime
    } catch (error) {
      return true
    }
  }
}
