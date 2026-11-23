# Backend sécurisé VisionCraft / Replicate

Le frontend React reste statique. Ce Worker Cloudflare protège le token Replicate, vérifie l’adresse e-mail, réserve le quota quotidien et interroge Replicate pour le statut de la vidéo.

## 1. Préparer Cloudflare

```bash
cd backend/worker
npm install -D wrangler
npx wrangler login
npx wrangler d1 create visioncraft-video
```

Copier l’identifiant retourné dans `wrangler.toml`, à la place de `REPLACE_WITH_D1_DATABASE_ID`, puis créer les tables :

```bash
npx wrangler d1 execute visioncraft-video --remote --file=schema.sql
```

## 2. Ajouter les secrets

```bash
npx wrangler secret put REPLICATE_API_TOKEN
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put EMAIL_HASH_SECRET
```

`EMAIL_FROM` doit être une adresse autorisée par le fournisseur e-mail, par exemple `VisionCraft <noreply@elikacces.ovh>`.

## 3. Déployer

```bash
npx wrangler deploy
```

Créer ensuite `api.elikacces.ovh` comme domaine personnalisé du Worker dans Cloudflare. Ne pas placer le token Replicate dans le projet React.

## 4. Configurer le frontend

Créer `.env.production` à la racine du projet :

```env
VITE_VIDEO_API_URL=https://api.elikacces.ovh
```

Puis construire :

```bash
npm install
npm run build
```

Téléverser le contenu de `dist/` dans `/www` sur OVH. Le mode proxy est activé uniquement quand `VITE_VIDEO_API_URL` est défini ; sinon les chemins Base44 existants restent utilisés.

## Modèles Replicate

Les noms de modèles sont configurables dans `wrangler.toml`. Le modèle image-vers-vidéo Wan utilisé par défaut est facturé par seconde. Vérifier son schéma d’entrée dans l’onglet API Replicate avant la mise en production. Si le modèle texte-vers-vidéo exige une version précise, remplacer `REPLICATE_T2V_MODEL` par son identifiant de version complet.

## Limites de sécurité

- quota par adresse e-mail vérifiée : 1 génération par 24 h ;
- durée côté serveur plafonnée à 5 secondes ;
- idempotence via `X-Idempotency-Key` ;
- token Replicate conservé dans les secrets Worker ;
- session dans un cookie `HttpOnly`, `Secure`, `SameSite=None` ;
- origine CORS limitée à `FRONTEND_ORIGIN`.

Le Worker utilise Resend pour l’envoi des codes. Pour un site public, ajoutez aussi Turnstile devant les routes d’inscription et de génération.
