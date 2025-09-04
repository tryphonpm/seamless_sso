# 🌐 Guide détaillé - Déploiement IIS pour SSO Transparent

## 📋 Vue d'ensemble

Ce guide détaille le déploiement complet sur IIS (Internet Information Services) pour activer l'authentification Windows transparente avec votre application Nuxt SSO.

---

## 🔧 Étape 3 : Déploiement IIS (Détaillé)

### 3.1 Prérequis serveur Windows

#### Vérification des composants IIS requis
```powershell
# Vérifier si IIS est installé
Get-WindowsFeature -Name IIS-* | Where-Object {$_.InstallState -eq "Installed"}

# Installer les composants manquants si nécessaire
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
```

#### Installation Node.js et iisnode
```powershell
# 1. Télécharger et installer Node.js LTS
# https://nodejs.org/en/download/

# 2. Installer iisnode
# https://github.com/Azure/iisnode/releases
# Télécharger iisnode-full-v0.2.26-x64.msi

# 3. Vérifier l'installation
node --version
npm --version
```

### 3.2 Configuration du compte de service

#### Création du compte de service AD
```powershell
# Sur le contrôleur de domaine
# Créer un compte de service dédié
New-ADUser -Name "svc-sso-app" -UserPrincipalName "svc-sso-app@votre-domaine.com" -AccountPassword (ConvertTo-SecureString "MotDePasseComplexe123!" -AsPlainText -Force) -Enabled $true -Description "Service account pour application SSO"

# Définir le mot de passe pour ne pas expirer
Set-ADUser -Identity "svc-sso-app" -PasswordNeverExpires $true

# Ajouter aux groupes nécessaires
Add-ADGroupMember -Identity "Domain Users" -Members "svc-sso-app"
```

#### Configuration des SPN (Service Principal Names)
```cmd
# Sur le serveur ou DC, exécuter en tant qu'administrateur

# Vérifier les SPN existants
setspn -L svc-sso-app

# Supprimer les SPN existants si nécessaire
setspn -D HTTP/votre-app.votre-domaine.com DOMAINE\svc-sso-app

# Créer les nouveaux SPN
setspn -A HTTP/votre-app.votre-domaine.com DOMAINE\svc-sso-app
setspn -A HTTP/votre-app DOMAINE\svc-sso-app

# Si vous utilisez un port spécifique (ex: 8080)
setspn -A HTTP/votre-app.votre-domaine.com:8080 DOMAINE\svc-sso-app

# Vérifier que les SPN sont bien créés
setspn -L svc-sso-app
```

### 3.3 Création et configuration du site IIS

#### Étape 1 : Création du site via IIS Manager
```powershell
# Ouvrir IIS Manager
inetmgr

# Ou via PowerShell
Import-Module WebAdministration

# Créer le site
New-Website -Name "SSO-App" -Port 443 -HostHeader "votre-app.votre-domaine.com" -PhysicalPath "C:\inetpub\wwwroot\sso-app" -Protocol https

# Ou pour HTTP (développement uniquement)
New-Website -Name "SSO-App" -Port 80 -HostHeader "votre-app.votre-domaine.com" -PhysicalPath "C:\inetpub\wwwroot\sso-app"
```

#### Étape 2 : Configuration des permissions du dossier
```powershell
# Créer le dossier de l'application
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\sso-app" -Force

# Donner les permissions à IIS_IUSRS
icacls "C:\inetpub\wwwroot\sso-app" /grant "IIS_IUSRS:(OI)(CI)M"

# Donner les permissions au compte de service
icacls "C:\inetpub\wwwroot\sso-app" /grant "DOMAINE\svc-sso-app:(OI)(CI)M"

# Permissions pour le pool d'applications
icacls "C:\inetpub\wwwroot\sso-app" /grant "IIS AppPool\SSO-App:(OI)(CI)M"
```

#### Étape 3 : Configuration du pool d'applications
```powershell
# Créer un nouveau pool d'applications
New-WebAppPool -Name "SSO-App"

# Configurer le pool
Set-ItemProperty -Path "IIS:\AppPools\SSO-App" -Name "processModel.identityType" -Value "SpecificUser"
Set-ItemProperty -Path "IIS:\AppPools\SSO-App" -Name "processModel.userName" -Value "DOMAINE\svc-sso-app"
Set-ItemProperty -Path "IIS:\AppPools\SSO-App" -Name "processModel.password" -Value "MotDePasseComplexe123!"

# Configurer les paramètres avancés
Set-ItemProperty -Path "IIS:\AppPools\SSO-App" -Name "processModel.loadUserProfile" -Value $true
Set-ItemProperty -Path "IIS:\AppPools\SSO-App" -Name "processModel.logonType" -Value "LogonAsService"

# Associer le site au pool
Set-ItemProperty -Path "IIS:\Sites\SSO-App" -Name "applicationPool" -Value "SSO-App"
```

### 3.4 Configuration de l'authentification Windows

#### Via IIS Manager (Interface graphique)
1. **Ouvrir IIS Manager**
2. **Sélectionner votre site** "SSO-App"
3. **Double-cliquer sur "Authentification"**
4. **Configurer les méthodes** :
   - **Anonymous Authentication** : `Enabled` (pour les ressources publiques)
   - **Windows Authentication** : `Enabled`
5. **Clic droit sur Windows Authentication** → **Propriétés**
6. **Onglet Providers** :
   - Supprimer tous les fournisseurs existants
   - Ajouter `Negotiate` (en premier)
   - Ajouter `NTLM` (en second)
7. **Onglet Advanced Settings** :
   - Cocher `Enable Kernel-mode authentication`
   - `Use App Pool Credentials` : `True`

#### Via PowerShell (Script automatisé)
```powershell
# Configuration de l'authentification
Set-WebConfiguration -Filter "/system.webServer/security/authentication/anonymousAuthentication" -Value @{enabled="true"} -PSPath "IIS:" -Location "SSO-App"

Set-WebConfiguration -Filter "/system.webServer/security/authentication/windowsAuthentication" -Value @{enabled="true"} -PSPath "IIS:" -Location "SSO-App"

# Configuration des fournisseurs Windows Auth
Set-WebConfiguration -Filter "/system.webServer/security/authentication/windowsAuthentication/providers" -Value @{Collection=@(@{value="Negotiate"},@{value="NTLM"})} -PSPath "IIS:" -Location "SSO-App"

# Activer le mode kernel
Set-WebConfiguration -Filter "/system.webServer/security/authentication/windowsAuthentication" -Value @{useKernelMode="true"} -PSPath "IIS:" -Location "SSO-App"

# Utiliser les credentials du pool d'applications
Set-WebConfiguration -Filter "/system.webServer/security/authentication/windowsAuthentication" -Value @{useAppPoolCredentials="true"} -PSPath "IIS:" -Location "SSO-App"
```

### 3.5 Déploiement de l'application

#### Build et préparation
```bash
# Dans votre projet Nuxt
npm run build

# Le dossier .output contient votre application buildée
```

#### Copie des fichiers
```powershell
# Copier les fichiers buildés
xcopy /E /I /Y ".output\*" "C:\inetpub\wwwroot\sso-app\"

# Copier le web.config
copy "web.config" "C:\inetpub\wwwroot\sso-app\web.config"

# Copier le fichier de configuration (si nécessaire)
copy ".env" "C:\inetpub\wwwroot\sso-app\.env"
```

#### Structure finale attendue
```
C:\inetpub\wwwroot\sso-app\
├── server/
│   ├── index.mjs
│   └── chunks/
├── public/
│   ├── _nuxt/
│   └── assets/
├── web.config
├── .env
└── package.json
```

### 3.6 Configuration SSL/TLS (Recommandé)

#### Installation du certificat
```powershell
# Importer un certificat depuis un fichier .pfx
Import-PfxCertificate -FilePath "C:\certificates\votre-app.pfx" -CertStoreLocation Cert:\LocalMachine\My -Password (ConvertTo-SecureString "MotDePasseCert" -AsPlainText -Force)

# Ou générer un certificat auto-signé (développement uniquement)
New-SelfSignedCertificate -DnsName "votre-app.votre-domaine.com" -CertStoreLocation "cert:\LocalMachine\My"
```

#### Liaison HTTPS
```powershell
# Obtenir le thumbprint du certificat
Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object {$_.Subject -like "*votre-app*"}

# Créer la liaison HTTPS
New-WebBinding -Name "SSO-App" -Protocol https -Port 443 -HostHeader "votre-app.votre-domaine.com" -SslFlags 1

# Associer le certificat
$cert = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object {$_.Subject -like "*votre-app*"}
New-Item -Path "IIS:\SslBindings\0.0.0.0!443" -Value $cert
```

### 3.7 Tests et validation

#### Test de base du site
```powershell
# Test de connectivité locale
Invoke-WebRequest -Uri "http://localhost" -UseDefaultCredentials

# Test avec nom de domaine
Invoke-WebRequest -Uri "https://votre-app.votre-domaine.com" -UseDefaultCredentials
```

#### Vérification des logs IIS
```powershell
# Activer les logs détaillés
Set-WebConfiguration -Filter "/system.webServer/httpLogging" -Value @{dontLog="false"} -PSPath "IIS:" -Location "SSO-App"

# Localisation des logs
# C:\inetpub\logs\LogFiles\W3SVC[ID]\
```

#### Test de l'authentification Windows
```powershell
# Test avec credentials explicites
$cred = Get-Credential
Invoke-WebRequest -Uri "https://votre-app.votre-domaine.com/api/auth/windows-auth" -Credential $cred

# Test avec credentials par défaut (utilisateur actuel)
Invoke-WebRequest -Uri "https://votre-app.votre-domaine.com/api/auth/windows-auth" -UseDefaultCredentials
```

### 3.8 Monitoring et maintenance

#### Configuration des logs d'application
```xml
<!-- Dans web.config, section iisnode -->
<iisnode 
  loggingEnabled="true"
  logDirectory="logs"
  maxLogFileSizeInKB="128"
  maxTotalLogFileSizeInKB="1024"
  maxLogFiles="20" />
```

#### Script de surveillance
```powershell
# Script PowerShell pour surveiller l'application
# surveillance-sso.ps1

$siteName = "SSO-App"
$url = "https://votre-app.votre-domaine.com/api/health"

while ($true) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseDefaultCredentials -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host "$(Get-Date) - Site OK" -ForegroundColor Green
        } else {
            Write-Host "$(Get-Date) - Site ERROR: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "$(Get-Date) - Site DOWN: $($_.Exception.Message)" -ForegroundColor Red
        
        # Redémarrer le pool d'applications si nécessaire
        Restart-WebAppPool -Name $siteName
    }
    
    Start-Sleep -Seconds 300 # Vérifier toutes les 5 minutes
}
```

### 3.9 Dépannage courant IIS

#### Erreur 500.19 - Configuration invalide
```powershell
# Vérifier la syntaxe du web.config
Test-WebConfigFile -PSPath "IIS:\Sites\SSO-App"

# Vérifier les permissions sur web.config
icacls "C:\inetpub\wwwroot\sso-app\web.config"
```

#### Erreur 401.1 - Accès refusé
```powershell
# Vérifier la configuration de l'authentification
Get-WebConfiguration -Filter "/system.webServer/security/authentication/*" -PSPath "IIS:" -Location "SSO-App"

# Vérifier les SPN
setspn -L svc-sso-app
```

#### Erreur 502 - Bad Gateway
```powershell
# Vérifier le statut du pool d'applications
Get-WebAppPoolState -Name "SSO-App"

# Redémarrer le pool si nécessaire
Restart-WebAppPool -Name "SSO-App"

# Vérifier les logs Node.js
Get-Content "C:\inetpub\wwwroot\sso-app\logs\*.log" -Tail 50
```

---

## ✅ Checklist de déploiement IIS

- [ ] **Composants IIS** installés (Windows Auth, etc.)
- [ ] **Node.js et iisnode** installés
- [ ] **Compte de service** créé et configuré
- [ ] **SPN** créés et vérifiés
- [ ] **Site IIS** créé avec bon pool d'applications
- [ ] **Authentification Windows** activée et configurée
- [ ] **Permissions** dossier correctes
- [ ] **Application** déployée et web.config en place
- [ ] **Certificat SSL** installé et configuré
- [ ] **Tests** de connectivité réussis
- [ ] **Logs** activés et vérifiés

Le déploiement IIS est maintenant complet ! 🎉
