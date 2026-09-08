# AlbumReviewers (Vinylbox)

Application web dans l'esprit de [Letterboxd](https://letterboxd.com), mais pour les albums de musique : parcourir les nouveautés, marquer les albums écoutés, garder une liste "à écouter", noter et critiquer les albums, et noter chaque morceau individuellement.

Stack : **Next.js 16** (App Router, Server Actions) + **Supabase** (Postgres, Auth, Row Level Security).

## Fonctionnalités (v1 / test)

- Authentification par email/mot de passe (Supabase Auth)
- Fil d'accueil : nouveaux albums + avis récents de la communauté
- Fiche album : note moyenne, critique par utilisateur, notation morceau par morceau
- Journal d'écoute ("diary") : chaque écoute est horodatée, un album peut être ré-écouté plusieurs fois
- Liste "à écouter" (watchlist / backlog)
- Page profil publique par utilisateur (`/profile/[username]`)
- Page artiste listant sa discographie

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un nouveau projet (gratuit).
2. Dans **Project Settings → API**, récupère l'**URL du projet** et la clé **anon public**.
3. Crée le schéma en base — deux options équivalentes, choisis-en une :

   **Option A — SQL Editor (le plus simple)**

   Ouvre **SQL Editor**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et exécute-le.

   **Option B — Prisma (pratique si tu veux ensuite faire évoluer le schéma avec `prisma db push`)**

   Prisma ne sert ici qu'à gérer les *tables* — l'app continue de lire/écrire via le client Supabase-js pour que les policies RLS s'appliquent (voir [Notes techniques](#notes-techniques)).

   ```bash
   cp prisma/.env.example prisma/.env   # puis renseigne DATABASE_URL
   npm run db:push                       # crée les tables depuis prisma/schema.prisma
   npm run db:seed                       # RLS, triggers, et données de démo (prisma/rls-and-seed.sql)
   ```

   `db push` ne fonctionne que sur une base **vierge** (pas encore de table `profiles`). Une fois le schéma appliqué une première fois (par l'une ou l'autre option), ne relance pas `db push` dessus : `profiles.id` référence `auth.users`, un schéma que Prisma ne gère pas, et `db push` refuserait de continuer sans qu'on lui déclare `auth` comme schéma géré — ce qu'il ne faut **surtout pas** faire, ça l'amènerait à vouloir gérer (et supprimer) les tables internes de Supabase Auth.

   Les deux options créent exactement le même schéma :
   - les tables (`profiles`, `artists`, `albums`, `tracks`, `album_ratings`, `track_ratings`, `listens`, `watchlist`)
   - les policies RLS (lecture publique du catalogue et des notes, écriture réservée au propriétaire)
   - un trigger qui crée automatiquement un `profile` à l'inscription
   - quelques artistes/albums/morceaux d'exemple pour ne pas démarrer avec une base vide

4. (Optionnel, pratique en test) Dans **Authentication → Providers → Email**, désactive "Confirm email" pour pouvoir se connecter immédiatement après l'inscription sans vérifier sa boîte mail.

## 2. Configurer l'app

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec l'URL et la clé anon récupérées à l'étape précédente.

## 3. Lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Ajouter des albums au catalogue

Pour cette v1, le catalogue (artistes/albums/morceaux) se gère directement depuis **Supabase → Table Editor** (ou par SQL) : les tables `artists`, `albums` et `tracks` sont en lecture publique mais leur écriture n'est pas ouverte aux utilisateurs de l'app. C'est volontaire pour une v1 de test — une interface d'ajout d'albums pourra être ajoutée ensuite.

`cover_url` accepte n'importe quelle URL d'image publique (pas de configuration de domaine nécessaire, l'app affiche les images en `<img>` classique).

### Import en masse depuis iTunes

[`scripts/import-itunes.mjs`](scripts/import-itunes.mjs) remplit le catalogue à partir de l'API iTunes Search (publique, sans clé) pour une liste d'artistes définie en haut du fichier. Il se connecte directement à Postgres via `DATABASE_URL` (donc en dehors des policies RLS, comme Prisma) pour pouvoir écrire dans `artists`/`albums`/`tracks`.

```bash
npm run import:itunes            # tous les artistes de la liste
IMPORT_LIMIT=3 npm run import:itunes   # seulement les 3 premiers, pour tester
```

Idempotent : artistes et albums sont recherchés par nom avant insertion, donc relancer le script ne duplique rien. Édite la liste `ARTISTS` dans le script pour l'adapter à tes goûts.

[`scripts/import-year-end-charts.mjs`](scripts/import-year-end-charts.mjs) importe le top 20 des albums les plus vendus/streamés de chaque année 2016-2025, d'après les classements annuels officiels de l'**Official UK Charts Company** (`officialcharts.com`) — la donnée est codée en dur dans [scripts/year-end-charts-data.mjs](scripts/year-end-charts-data.mjs) (pas d'API de charts historiques gratuite disponible). Chaque entrée est recherchée sur iTunes en deux temps (recherche restreinte à l'artiste puis correspondance de titre) pour éviter d'associer le mauvais artiste à un titre générique ; une correspondance jugée peu fiable est **ignorée plutôt qu'insérée à tort** (affiché avec `?` dans les logs).

```bash
npm run import:charts             # les 10 années
YEARS=2023,2024 npm run import:charts   # seulement certaines années, pour tester
```

[`scripts/import-musicbrainz.mjs`](scripts/import-musicbrainz.mjs) importe les albums studio (+ tracklists) de la même liste d'artistes que `import-itunes.mjs` (partagée via [scripts/artists-list.mjs](scripts/artists-list.mjs)), mais depuis **MusicBrainz** plutôt que l'iTunes Store — un catalogue plus complet et plus ouvert (certains albums bien connus, comme *Brat* de Charli xcx, n'existent tout simplement pas dans l'index de recherche iTunes). Les pochettes viennent de la Cover Art Archive. À exécuter en complément d'`import-itunes.mjs`, pas à sa place — les deux dédupliquent proprement sur la même base.

```bash
npm run import:musicbrainz                        # tous les artistes de la liste
IMPORT_LIMIT=3 npm run import:musicbrainz          # les 3 premiers, pour tester
ONLY="Kanye West,Phoenix" npm run import:musicbrainz  # artistes précis, pour corriger/relancer un cas isolé
```

MusicBrainz étant collaboratif, ses données ne sont pas toujours parfaites : le script filtre déjà les faux positifs évidents (types secondaires Live/Compilation/Remix..., entrées sans date de sortie), mais une recherche d'artiste peut encore, rarement, remonter un groupe hommage ou un homonyme au lieu du bon artiste — repère-le à un nom d'artiste inattendu dans les logs (`+ Nom Inattendu — Titre`) et relance ce cas précis avec `ONLY=`.

L'API impose ~1 requête/seconde ; la connexion vers `musicbrainz.org` s'est montrée occasionnellement instable pendant les tests (le script réessaie automatiquement, mais un import complet peut prendre 15-25 minutes).

## Structure du projet

```
src/
  app/                    routes (App Router)
    albums/[id]/           fiche album + server actions (noter, écouter, watchlist)
    artists/[id]/          page artiste
    diary/                 journal d'écoute de l'utilisateur connecté
    watchlist/              liste "à écouter"
    profile/[username]/     profil public
    login/ signup/          authentification
  components/              composants UI partagés (étoiles, cartes album, navbar...)
  lib/
    supabase/               clients Supabase (browser / server / proxy) + types générés à la main
    actions/auth.ts         server actions d'authentification
    format.ts               helpers de formatage
  proxy.ts                  rafraîchit la session Supabase à chaque requête (proxy.js de Next 16)
supabase/
  schema.sql                schéma complet + RLS + données de test (option A, tout-en-un)
prisma/
  schema.prisma              tables uniquement, en Prisma (option B)
  rls-and-seed.sql           RLS + triggers + données de test pour l'option B (ce que Prisma ne sait pas déclarer)
scripts/
  import-itunes.mjs          import en masse du catalogue depuis l'API iTunes
```

## Notes techniques

- Ce projet utilise **Next.js 16**, où `middleware.ts` a été renommé `proxy.ts` — voir [`src/proxy.ts`](src/proxy.ts).
- Les mutations (noter, ajouter une écoute, gérer la watchlist) passent par des **Server Actions**, protégées côté serveur par la session Supabase et par les policies RLS de Postgres (défense en profondeur).
- Notes en demi-étoiles de 0,5 à 5, aussi bien pour les albums que pour les morceaux.
- **Prisma ne gère que le schéma**, pas l'accès aux données à l'exécution : Prisma Client se connecte à Postgres avec un accès direct (utilisateur `postgres`), donc il **contourne RLS**. L'app garde donc `@supabase/supabase-js` (clé `anon`) pour toutes ses requêtes, afin que les policies RLS restent la seule barrière d'autorisation. Si tu modifies `prisma/schema.prisma` plus tard, pense à répercuter le changement dans [`src/lib/supabase/types.ts`](src/lib/supabase/types.ts) (types manuscrits, au même format que `npx supabase gen types typescript`).
