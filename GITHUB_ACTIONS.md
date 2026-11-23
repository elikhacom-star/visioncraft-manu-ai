# Déploiement automatique avec GitHub Actions

Le workflow `.github/workflows/deploy.yml` déploie automatiquement le frontend sur Cloudflare Pages à chaque push sur `main`. Il redéploie également le Worker vidéo lorsqu’un fichier du dossier `backend/worker/` change ou lorsqu’il est lancé manuellement.

## 1. Créer le dépôt GitHub

Créer un dépôt privé nommé par exemple `visioncraft-ai`, puis pousser le contenu du projet :

```bash
git init
git branch -M main
git add .
git commit -m "Initial VisionCraft secure deployment"
git remote add origin https://github.com/TON_COMPTE/visioncraft-ai.git
git push -u origin main
```

Ne jamais ajouter de fichier `.env` contenant un secret. Le fichier `.env.example` est prévu pour être versionné.

## 2. Créer un token Cloudflare pour GitHub Actions

Dans Cloudflare : **My Profile → API Tokens → Create Token**.

Utiliser un token personnalisé limité au compte qui héberge le projet avec au minimum :

- Account → Cloudflare Pages → Edit ;
- Account → Workers Scripts → Edit ;
- Account → D1 → Edit, si le workflow doit aussi gérer D1 à l’avenir.

Le token n’est utilisé que par GitHub Actions et n’est jamais intégré au frontend.

## 3. Ajouter les secrets GitHub

Dans le dépôt : **Settings → Secrets and variables → Actions → New repository secret**.

Ajouter :

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

`CLOUDFLARE_ACCOUNT_ID` est l’identifiant du compte Cloudflare, pas un mot de passe.

## 4. Ajouter les variables GitHub

Dans **Settings → Secrets and variables → Actions → Variables**, ajouter :

```text
VIDEO_API_URL=https://URL_DU_WORKER.workers.dev
```

Si l’application Base44 est conservée, ajouter aussi les variables publiques nécessaires :

```text
BASE44_APP_ID=...
BASE44_APP_BASE_URL=...
```

Ces deux variables sont publiques côté frontend. Elles ne doivent pas contenir de secret.

## 5. Créer le projet Pages une seule fois

Avant le premier workflow, créer le projet Pages avec Wrangler ou le tableau de bord :

```bash
npx wrangler pages project create visioncraft-ai
```

Ensuite, chaque push sur `main` lancera :

```text
npm ci
npm run build
wrangler pages deploy dist --project-name visioncraft-ai --branch main
```

L’URL restera :

```text
https://visioncraft-ai.pages.dev
```

## 6. Secrets du Worker

Les secrets Replicate et Resend restent enregistrés dans Cloudflare. Ils ne doivent pas être ajoutés dans GitHub Actions :

```bash
npx wrangler secret put REPLICATE_API_TOKEN
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put EMAIL_HASH_SECRET
```

Le workflow redéploie le Worker, mais ne supprime pas ces secrets.

## 7. Déclencher un déploiement

Déploiement automatique :

```bash
git add .
git commit -m "Update VisionCraft"
git push origin main
```

Déploiement manuel : **GitHub → Actions → Deploy VisionCraft → Run workflow**.

Le workflow utilise une concurrence de production : un nouveau déploiement annule un ancien déploiement encore en attente afin d’éviter les versions concurrentes.
