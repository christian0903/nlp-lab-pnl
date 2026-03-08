# Guide de déploiement sur o2switch

## Prérequis
- Accès à votre hébergement o2switch (cPanel)
- Node.js installé localement (v18+)
- Le projet cloné depuis GitHub

## Étape 1 : Cloner le projet

```bash
git clone https://github.com/VOTRE_UTILISATEUR/VOTRE_REPO.git
cd VOTRE_REPO
```

## Étape 2 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://qsfbvvgupfsmnbhjtrcp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZmJ2dmd1cGZzbW5iaGp0cmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDY0NzksImV4cCI6MjA4ODU4MjQ3OX0.sGib9l1aZNnwi23W2knLlAhBHwsPnjYWYRIK-mV5A2Q
```

> Ces clés sont publiques (anon key) et peuvent être incluses dans le build front-end en toute sécurité.

## Étape 3 : Build du projet

```bash
npm install
npm run build
```

Cela génère un dossier `dist/` contenant tous les fichiers statiques.

## Étape 4 : Upload sur o2switch

### Via le gestionnaire de fichiers cPanel :
1. Connectez-vous à votre cPanel o2switch
2. Ouvrez le **Gestionnaire de fichiers**
3. Naviguez vers le dossier de votre domaine (ex: `public_html/` ou un sous-domaine)
4. **Supprimez** les fichiers existants (sauf `.htaccess` si vous en avez un personnalisé)
5. **Uploadez** tout le contenu du dossier `dist/` (pas le dossier lui-même, son contenu)
6. Uploadez le fichier `.htaccess` fourni

### Via FTP (FileZilla, etc.) :
1. Connectez-vous en FTP avec vos identifiants o2switch
2. Naviguez vers le dossier du domaine
3. Uploadez le contenu de `dist/` + le `.htaccess`

## Étape 5 : Vérifier

1. Accédez à votre domaine dans le navigateur
2. Testez la navigation (les routes React doivent fonctionner)
3. Testez la connexion / inscription
4. Vérifiez que les données se chargent correctement

## Structure des fichiers sur o2switch

```
public_html/
├── .htaccess          ← Réécriture des URLs pour SPA React
├── index.html         ← Point d'entrée
├── assets/            ← JS, CSS, images compilés
├── favicon.ico
├── placeholder.svg
└── robots.txt
```

## Mise à jour du site

À chaque modification :
1. `git pull` (ou modifier dans Lovable → push automatique GitHub)
2. `npm run build`
3. Re-uploader le contenu de `dist/` sur o2switch

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche | Vérifiez que `.htaccess` est bien uploadé |
| 404 sur les routes | Le `.htaccess` manque ou n'est pas actif |
| Erreurs de connexion DB | Vérifiez les variables `VITE_SUPABASE_*` dans `.env` avant le build |
| Images/assets manquants | Vérifiez que tout le contenu de `dist/` a été uploadé |
| CORS errors | La base Lovable Cloud accepte les requêtes de tout domaine |

## SSL / HTTPS

o2switch fournit un certificat SSL gratuit via Let's Encrypt.
Activez-le dans cPanel → **SSL/TLS Status** si ce n'est pas déjà fait.
