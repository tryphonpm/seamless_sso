# 🌐 Guide détaillé - Configuration des navigateurs pour SSO Transparent

## 📋 Vue d'ensemble

Ce guide détaille la configuration de tous les navigateurs pour activer l'authentification Windows transparente (SSO) avec votre application.

---

## 🖥️ Étape 4 : Configuration navigateurs (Détaillé)

### 4.1 Internet Explorer (IE) - Configuration complète

#### Configuration manuelle utilisateur
1. **Ouvrir Internet Explorer**
2. **Menu Outils** → **Options Internet** (ou Alt + T, puis O)
3. **Onglet Sécurité**

#### Zones de sécurité
1. **Sélectionner "Sites de confiance"**
2. **Cliquer sur "Sites..."**
3. **Ajouter votre site** :
   ```
   https://votre-app.votre-domaine.com
   https://*.votre-domaine.com
   ```
4. **Décocher** "Exiger une vérification de serveur (https:)" si nécessaire
5. **Cliquer "Ajouter"** puis **"Fermer"**

#### Paramètres de sécurité personnalisés
1. **Avec "Sites de confiance" sélectionné**, cliquer **"Niveau personnalisé..."**
2. **Faire défiler jusqu'à "Connexion utilisateur"**
3. **Sélectionner** :
   - ✅ **"Connexion automatique avec nom d'utilisateur et mot de passe actuels"**
   - ✅ **"Demander le nom d'utilisateur et le mot de passe"** (fallback)
4. **Cliquer "OK"** puis **"Oui"** pour confirmer

#### Configuration via registre Windows (déploiement GPO)
```reg
Windows Registry Editor Version 5.00

; Configuration pour Sites de confiance
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\votre-domaine.com]
@=dword:00000002

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\votre-domaine.com\votre-app]
"https"=dword:00000002

; Authentification automatique pour zone de confiance (zone 2)
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Zones\2]
"1A00"=dword:00000000
```

### 4.2 Microsoft Edge (Legacy et Chromium) - Configuration détaillée

#### Edge Legacy (EdgeHTML)
1. **Ouvrir Edge**
2. **Menu (...)** → **Paramètres**
3. **Paramètres avancés**
4. **Afficher les paramètres avancés**
5. **Sous "Sécurité"** : configurer les zones comme IE

#### Edge Chromium (Moderne)
**Configuration manuelle** :
1. **Ouvrir Edge**
2. **Menu (...)** → **Paramètres**
3. **Système et performances** (dans la barre latérale)
4. **Ouvrir votre ordinateur avec Microsoft Edge** : Activé

**Configuration via ligne de commande** :
```cmd
# Lancer Edge avec les paramètres d'authentification
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --auth-server-whitelist="*.votre-domaine.com" --auth-negotiate-delegate-whitelist="*.votre-domaine.com"
```

**Configuration via GPO (Recommandée pour entreprise)** :
```reg
; Configuration Edge via registre
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge]
"AuthServerWhitelist"="*.votre-domaine.com,votre-app.votre-domaine.com"
"AuthNegotiateDelegateWhitelist"="*.votre-domaine.com"
"AuthSchemes"="basic,digest,ntlm,negotiate"
```

### 4.3 Google Chrome - Configuration complète

#### Configuration via ligne de commande
```cmd
# Méthode 1 : Arguments de lancement
"C:\Program Files\Google\Chrome\Application\chrome.exe" --auth-server-whitelist="*.votre-domaine.com" --auth-negotiate-delegate-whitelist="*.votre-domaine.com" --enable-auth-negotiate-port

# Méthode 2 : Avec port spécifique
"C:\Program Files\Google\Chrome\Application\chrome.exe" --auth-server-whitelist="votre-app.votre-domaine.com:443" --auth-negotiate-delegate-whitelist="votre-app.votre-domaine.com:443"
```

#### Configuration via registre Windows (GPO)
```reg
Windows Registry Editor Version 5.00

; Configuration Chrome pour l'authentification Windows
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome]
"AuthServerWhitelist"="*.votre-domaine.com,votre-app.votre-domaine.com"
"AuthNegotiateDelegateWhitelist"="*.votre-domaine.com,votre-app.votre-domaine.com"
"AuthSchemes"="basic,digest,ntlm,negotiate,kerberos"
"DisableAuthNegotiateCnameLookup"=dword:00000001
"EnableAuthNegotiatePort"=dword:00000001
"AuthAndroidNegotiateAccountType"=""

; Configuration pour utilisateur actuel
[HKEY_CURRENT_USER\SOFTWARE\Policies\Google\Chrome]
"AuthServerWhitelist"="*.votre-domaine.com,votre-app.votre-domaine.com"
"AuthNegotiateDelegateWhitelist"="*.votre-domaine.com,votre-app.votre-domaine.com"
```

#### Configuration via fichier de politique Chrome
Créer le fichier `chrome_policy.json` :
```json
{
  "AuthServerWhitelist": "*.votre-domaine.com,votre-app.votre-domaine.com",
  "AuthNegotiateDelegateWhitelist": "*.votre-domaine.com,votre-app.votre-domaine.com",
  "AuthSchemes": "basic,digest,ntlm,negotiate",
  "DisableAuthNegotiateCnameLookup": true,
  "EnableAuthNegotiatePort": true
}
```

#### Script PowerShell pour configuration Chrome
```powershell
# Script de configuration automatique Chrome
$chromePolicyPath = "HKLM:\SOFTWARE\Policies\Google\Chrome"

# Créer la clé si elle n'existe pas
if (!(Test-Path $chromePolicyPath)) {
    New-Item -Path $chromePolicyPath -Force
}

# Configurer les paramètres d'authentification
Set-ItemProperty -Path $chromePolicyPath -Name "AuthServerWhitelist" -Value "*.votre-domaine.com,votre-app.votre-domaine.com"
Set-ItemProperty -Path $chromePolicyPath -Name "AuthNegotiateDelegateWhitelist" -Value "*.votre-domaine.com,votre-app.votre-domaine.com"
Set-ItemProperty -Path $chromePolicyPath -Name "AuthSchemes" -Value "basic,digest,ntlm,negotiate"
Set-ItemProperty -Path $chromePolicyPath -Name "DisableAuthNegotiateCnameLookup" -Value 1 -Type DWord
Set-ItemProperty -Path $chromePolicyPath -Name "EnableAuthNegotiatePort" -Value 1 -Type DWord

Write-Host "Configuration Chrome terminée. Redémarrer Chrome pour appliquer les changements."
```

### 4.4 Mozilla Firefox - Configuration détaillée

#### Configuration manuelle via about:config
1. **Ouvrir Firefox**
2. **Taper dans la barre d'adresse** : `about:config`
3. **Accepter l'avertissement**
4. **Rechercher et modifier les préférences suivantes** :

```javascript
// Préférences à modifier dans about:config
network.negotiate-auth.trusted-uris = .votre-domaine.com,votre-app.votre-domaine.com
network.negotiate-auth.delegation-uris = .votre-domaine.com,votre-app.votre-domaine.com
network.automatic-ntlm-auth.trusted-uris = .votre-domaine.com,votre-app.votre-domaine.com
network.negotiate-auth.allow-proxies = true
network.negotiate-auth.allow-non-fqdn = true
security.tls.insecure_fallback_hosts = votre-app.votre-domaine.com
```

#### Configuration via fichier user.js
Créer le fichier `user.js` dans le profil Firefox :
```javascript
// Configuration automatique Firefox pour SSO
user_pref("network.negotiate-auth.trusted-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.negotiate-auth.delegation-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.automatic-ntlm-auth.trusted-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.negotiate-auth.allow-proxies", true);
user_pref("network.negotiate-auth.allow-non-fqdn", true);
user_pref("network.negotiate-auth.gsslib", "");
user_pref("network.negotiate-auth.using-native-gsslib", true);
```

#### Configuration via GPO Firefox (Firefox ESR)
```reg
; Configuration Firefox via registre
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Mozilla\Firefox]
"Authentication"="{\"SPNEGO\":[\"https://votre-app.votre-domaine.com\",\"https://*.votre-domaine.com\"],\"Delegated\":[\"https://votre-app.votre-domaine.com\",\"https://*.votre-domaine.com\"],\"NTLM\":[\"https://votre-app.votre-domaine.com\",\"https://*.votre-domaine.com\"]}"
```

#### Script PowerShell pour configuration Firefox
```powershell
# Configuration automatique Firefox
$firefoxProfiles = Get-ChildItem "$env:APPDATA\Mozilla\Firefox\Profiles" -Directory

foreach ($profile in $firefoxProfiles) {
    $userJsPath = Join-Path $profile.FullName "user.js"
    
    $config = @"
// Configuration SSO automatique
user_pref("network.negotiate-auth.trusted-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.negotiate-auth.delegation-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.automatic-ntlm-auth.trusted-uris", ".votre-domaine.com,votre-app.votre-domaine.com");
user_pref("network.negotiate-auth.allow-proxies", true);
user_pref("network.negotiate-auth.allow-non-fqdn", true);
"@
    
    Add-Content -Path $userJsPath -Value $config
    Write-Host "Configuration ajoutée au profil: $($profile.Name)"
}
```

### 4.5 Safari (macOS) - Configuration pour environnement mixte

#### Configuration système macOS
```bash
# Configuration via Terminal
defaults write com.apple.Safari AuthenticationServerWhitelist -array "*.votre-domaine.com" "votre-app.votre-domaine.com"

# Activer l'authentification Kerberos
sudo dsconfigad -enableSSO
```

### 4.6 Déploiement via GPO (Group Policy Objects)

#### Création d'une GPO pour navigateurs
1. **Ouvrir Group Policy Management Console**
2. **Créer une nouvelle GPO** : "SSO-Browser-Config"
3. **Éditer la GPO**

#### Configuration IE/Edge via GPO
```
Computer Configuration → Policies → Administrative Templates → Windows Components → Internet Explorer → Internet Control Panel → Security Page → Trusted Sites Zone

- Logon options: Enable "Automatic logon with current user name and password"
- Sites to Zone Assignment List: Enable
  - Value name: https://votre-app.votre-domaine.com
  - Value: 2
```

#### Configuration Chrome via GPO
```
Computer Configuration → Policies → Administrative Templates → Google Chrome

- Configure authentication server allowlist: Enable
  - Value: *.votre-domaine.com,votre-app.votre-domaine.com

- Configure Kerberos delegation server allowlist: Enable  
  - Value: *.votre-domaine.com,votre-app.votre-domaine.com
```

#### Script PowerShell pour déploiement GPO
```powershell
# Script de déploiement automatique des configurations navigateurs
param(
    [string]$Domain = "votre-domaine.com",
    [string]$AppUrl = "votre-app.votre-domaine.com"
)

# Configuration Internet Explorer
$ieZonePath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\$Domain"
New-Item -Path $ieZonePath -Force
Set-ItemProperty -Path $ieZonePath -Name "https" -Value 2

# Configuration Chrome
$chromePath = "HKLM:\SOFTWARE\Policies\Google\Chrome"
New-Item -Path $chromePath -Force
Set-ItemProperty -Path $chromePath -Name "AuthServerWhitelist" -Value "*.$Domain,$AppUrl"
Set-ItemProperty -Path $chromePath -Name "AuthNegotiateDelegateWhitelist" -Value "*.$Domain,$AppUrl"

# Configuration Edge
$edgePath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
New-Item -Path $edgePath -Force
Set-ItemProperty -Path $edgePath -Name "AuthServerWhitelist" -Value "*.$Domain,$AppUrl"
Set-ItemProperty -Path $edgePath -Name "AuthNegotiateDelegateWhitelist" -Value "*.$Domain,$AppUrl"

Write-Host "Configuration navigateurs déployée avec succès!"
```

### 4.7 Tests de validation navigateur

#### Script de test automatisé
```powershell
# Test de validation SSO par navigateur
param(
    [string]$TestUrl = "https://votre-app.votre-domaine.com/api/auth/windows-auth"
)

function Test-BrowserSSO {
    param([string]$Browser, [string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseDefaultCredentials -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Browser : SSO fonctionne" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Browser : Échec ($($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Browser : Erreur - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test avec différents navigateurs
$results = @{}
$results["Internet Explorer"] = Test-BrowserSSO -Browser "IE" -Url $TestUrl
$results["Chrome"] = Test-BrowserSSO -Browser "Chrome" -Url $TestUrl
$results["Firefox"] = Test-BrowserSSO -Browser "Firefox" -Url $TestUrl
$results["Edge"] = Test-BrowserSSO -Browser "Edge" -Url $TestUrl

# Résumé
Write-Host "`n📊 Résumé des tests SSO:" -ForegroundColor Yellow
$results.GetEnumerator() | ForEach-Object {
    $status = if ($_.Value) { "✅ OK" } else { "❌ ÉCHEC" }
    Write-Host "$($_.Key): $status"
}
```

#### Test manuel par navigateur
```html
<!-- Page de test HTML à déployer -->
<!DOCTYPE html>
<html>
<head>
    <title>Test SSO Transparent</title>
</head>
<body>
    <h1>Test d'authentification SSO</h1>
    <button onclick="testSSO()">Tester SSO</button>
    <div id="result"></div>
    
    <script>
    async function testSSO() {
        try {
            const response = await fetch('/api/auth/windows-auth', {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            document.getElementById('result').innerHTML = 
                '<h2>Résultat:</h2>' +
                '<p>Status: ' + response.status + '</p>' +
                '<p>Utilisateur: ' + (data.user ? data.user.username : 'Non connecté') + '</p>' +
                '<p>Méthode: ' + (data.authMethod || 'N/A') + '</p>';
        } catch (error) {
            document.getElementById('result').innerHTML = 
                '<h2>Erreur:</h2><p>' + error.message + '</p>';
        }
    }
    </script>
</body>
</html>
```

### 4.8 Dépannage navigateurs

#### Problèmes courants et solutions

**Chrome : "ERR_INVALID_AUTH_CREDENTIALS"**
```powershell
# Vérifier la configuration Chrome
Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Google\Chrome" -Name "AuthServerWhitelist"

# Redémarrer Chrome complètement
Get-Process chrome | Stop-Process -Force
```

**Firefox : Demande constante de credentials**
```javascript
// Vérifier les préférences dans about:config
// Si network.negotiate-auth.trusted-uris est vide, le configurer manuellement
```

**IE/Edge : Erreur 401 persistante**
```powershell
# Réinitialiser les zones de sécurité IE
Remove-Item "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\Zones\*" -Recurse -Force
```

#### Outils de diagnostic
```powershell
# Diagnostic réseau et authentification
# 1. Test de résolution DNS
nslookup votre-app.votre-domaine.com

# 2. Test de connectivité
Test-NetConnection -ComputerName votre-app.votre-domaine.com -Port 443

# 3. Test d'authentification Kerberos
klist tickets

# 4. Vérification des SPN
setspn -Q HTTP/votre-app.votre-domaine.com
```

### 4.9 Script de déploiement automatique complet

```powershell
# Script de configuration automatique tous navigateurs
# deploy-browser-sso.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$AppUrl,
    
    [switch]$CurrentUser,
    [switch]$AllUsers
)

function Set-IEConfiguration {
    param($Domain, $AppUrl, $Scope)
    
    $basePath = if ($Scope -eq "Machine") { "HKLM:" } else { "HKCU:" }
    $zonePath = "$basePath\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\ZoneMap\Domains\$Domain"
    
    New-Item -Path $zonePath -Force | Out-Null
    Set-ItemProperty -Path $zonePath -Name "https" -Value 2
    
    Write-Host "✅ Internet Explorer configuré ($Scope)"
}

function Set-ChromeConfiguration {
    param($Domain, $AppUrl, $Scope)
    
    $basePath = if ($Scope -eq "Machine") { "HKLM:" } else { "HKCU:" }
    $chromePath = "$basePath\SOFTWARE\Policies\Google\Chrome"
    
    New-Item -Path $chromePath -Force | Out-Null
    Set-ItemProperty -Path $chromePath -Name "AuthServerWhitelist" -Value "*.$Domain,$AppUrl"
    Set-ItemProperty -Path $chromePath -Name "AuthNegotiateDelegateWhitelist" -Value "*.$Domain,$AppUrl"
    Set-ItemProperty -Path $chromePath -Name "AuthSchemes" -Value "basic,digest,ntlm,negotiate"
    
    Write-Host "✅ Chrome configuré ($Scope)"
}

function Set-EdgeConfiguration {
    param($Domain, $AppUrl, $Scope)
    
    $basePath = if ($Scope -eq "Machine") { "HKLM:" } else { "HKCU:" }
    $edgePath = "$basePath\SOFTWARE\Policies\Microsoft\Edge"
    
    New-Item -Path $edgePath -Force | Out-Null
    Set-ItemProperty -Path $edgePath -Name "AuthServerWhitelist" -Value "*.$Domain,$AppUrl"
    Set-ItemProperty -Path $edgePath -Name "AuthNegotiateDelegateWhitelist" -Value "*.$Domain,$AppUrl"
    
    Write-Host "✅ Edge configuré ($Scope)"
}

function Set-FirefoxConfiguration {
    param($Domain, $AppUrl)
    
    $firefoxProfiles = Get-ChildItem "$env:APPDATA\Mozilla\Firefox\Profiles" -Directory -ErrorAction SilentlyContinue
    
    if ($firefoxProfiles) {
        foreach ($profile in $firefoxProfiles) {
            $userJsPath = Join-Path $profile.FullName "user.js"
            
            $config = @"
user_pref("network.negotiate-auth.trusted-uris", ".$Domain,$AppUrl");
user_pref("network.negotiate-auth.delegation-uris", ".$Domain,$AppUrl");
user_pref("network.automatic-ntlm-auth.trusted-uris", ".$Domain,$AppUrl");
user_pref("network.negotiate-auth.allow-proxies", true);
"@
            
            Add-Content -Path $userJsPath -Value $config
        }
        Write-Host "✅ Firefox configuré"
    } else {
        Write-Host "⚠️ Firefox non installé ou aucun profil trouvé"
    }
}

# Exécution principale
Write-Host "🚀 Configuration SSO navigateurs pour $AppUrl" -ForegroundColor Yellow

if ($AllUsers) {
    Set-IEConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "Machine"
    Set-ChromeConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "Machine"
    Set-EdgeConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "Machine"
    Write-Host "✅ Configuration machine (tous les utilisateurs) terminée"
}

if ($CurrentUser) {
    Set-IEConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "User"
    Set-ChromeConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "User"
    Set-EdgeConfiguration -Domain $Domain -AppUrl $AppUrl -Scope "User"
    Set-FirefoxConfiguration -Domain $Domain -AppUrl $AppUrl
    Write-Host "✅ Configuration utilisateur actuel terminée"
}

Write-Host "🎉 Configuration terminée! Redémarrez les navigateurs pour appliquer les changements." -ForegroundColor Green
```

#### Utilisation du script
```powershell
# Configuration pour tous les utilisateurs (nécessite admin)
.\deploy-browser-sso.ps1 -Domain "votre-domaine.com" -AppUrl "votre-app.votre-domaine.com" -AllUsers

# Configuration pour l'utilisateur actuel
.\deploy-browser-sso.ps1 -Domain "votre-domaine.com" -AppUrl "votre-app.votre-domaine.com" -CurrentUser
```

---

## ✅ Checklist de configuration navigateurs

- [ ] **Internet Explorer** : Sites de confiance + authentification auto
- [ ] **Edge Legacy** : Configuration zones comme IE
- [ ] **Edge Chromium** : GPO ou registre configuré
- [ ] **Chrome** : AuthServerWhitelist configuré
- [ ] **Firefox** : Préférences network.negotiate-auth configurées
- [ ] **GPO** : Politique de groupe déployée (si applicable)
- [ ] **Tests** : Validation SSO sur chaque navigateur
- [ ] **Documentation** : Procédures utilisateur créées

La configuration des navigateurs est maintenant complète ! 🎉

