# PATRIMONIA

**La vision intelligente du patrimoine.**

PATRIMONIA est une plateforme de gestion de patrimoine destinée aux cabinets de
conseil. Elle centralise la situation patrimoniale d'un client et la transforme
en informations exploitables : répartition, risques, opportunités, objectifs et
actions à mener.

Le fil conducteur du produit est le suivant :

```
DONNÉES → ANALYSE → RISQUES → OPPORTUNITÉS → ACTION DU CONSEILLER
```

---

## ⚠️ Nature des données

Ce projet est une **démonstration à finalité pédagogique**. Trois catégories de
données coexistent et ne sont jamais mélangées :

| Catégorie | Contenu | Signalement dans l'interface |
| --- | --- | --- |
| **Données clients** | Identités, revenus, patrimoines, biens, crédits, objectifs, documents, rendez-vous, messages | **Entièrement fictives.** Aucune personne réelle. |
| **Données de marché** | Cours, historiques, indices, ratios, actualités | **Réelles** lorsqu'un fournisseur est joignable. Pastille verte « Données réelles ». |
| **Données simulées** | Cours de repli quand aucun fournisseur ne répond, actualités de maquette, historiques de patrimoine reconstitués | Pastille orange « Données de marché simulées (DEMO) ». |

Une donnée simulée n'est **jamais** présentée comme une donnée réelle :
l'origine voyage avec la donnée depuis le service jusqu'au composant qui
l'affiche, via le type `MarketResponse<T>`.

De la même façon, les analyses produites par PATRIMONIA INTELLIGENCE et les
simulations fiscales sont présentées comme des **aides à l'analyse à visée
pédagogique**, jamais comme un conseil en investissement réglementé.

---

## Installation

Prérequis : **Node.js 20 ou supérieur** et npm.

```bash
git clone <url-du-depot>
cd patrimonia-v2
npm install
cp .env.example .env.local   # facultatif : l'application démarre sans configuration
npm run dev
```

L'application est disponible sur <http://localhost:3000>.

---

## Comptes de test

En mode démonstration, quatre profils sont proposés directement sur l'écran de
connexion. Le mot de passe est commun : **`patrimonia`**.

| Adresse | Rôle | Ce que le compte permet de voir |
| --- | --- | --- |
| `thomas@horizon.demo` | Conseiller | Portefeuille de clients, analyses, alertes, CRM, rapports |
| `admin@horizon.demo` | Administrateur | Pilotage du cabinet, utilisateurs, branding, journal d'audit |
| `jean.dupont@exemple.demo` | Client | Espace client simplifié : patrimoine, investissements, documents |
| `advisor@meridien.demo` | Conseiller (2ᵉ cabinet) | Permet de vérifier le cloisonnement entre cabinets |

Ces comptes n'existent que dans le jeu de démonstration et ne donnent accès à
aucune donnée réelle.

---

## Variables d'environnement

Toutes les variables sont décrites dans [`.env.example`](.env.example). Aucune
n'est obligatoire : sans configuration, PATRIMONIA tourne en mode démonstration.

| Variable | Portée | Rôle |
| --- | --- | --- |
| `AUTH_SECRET` | Serveur | Signature des sessions de démonstration. **Obligatoire en production.** |
| `NEXT_PUBLIC_APP_URL` | Client | URL publique, utilisée pour les liens QR |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Active le mode Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Clé anonyme publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur | Amorçage de la base uniquement. **Jamais exposée au navigateur.** |
| `MARKET_DATA_PROVIDER` | Serveur | `auto`, `yahoo`, `fmp` ou `mock` |
| `FMP_API_KEY` | Serveur | Clé Financial Modeling Prep, facultative |
| `MARKET_DATA_CACHE_TTL` | Serveur | Durée de vie du cache de marché, en secondes |

**Règle de sécurité :** seules les variables préfixées `NEXT_PUBLIC_` sont
lisibles par le navigateur. Les clés d'API financières et la clé de service
Supabase ne sont lues que par du code serveur (`services/market/*`,
`lib/env.ts`), jamais importé depuis un composant client.

---

## Configuration Supabase

Le mode démonstration ne nécessite rien. Pour brancher une vraie base :

1. **Créer un projet** sur [supabase.com](https://supabase.com).
2. **Appliquer les migrations** dans l'éditeur SQL, dans cet ordre :
   - `supabase/migrations/0001_schema.sql` — tables, index, contraintes
   - `supabase/migrations/0002_rls.sql` — Row Level Security, fonctions de
     contexte et politiques de stockage
3. **Renseigner** `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans `.env.local`.
4. **Amorcer les données de démonstration** (facultatif) :

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase
   ```

   Le script crée le cabinet, les comptes d'authentification, les clients
   fictifs et l'ensemble de leurs données patrimoniales.

Au redémarrage, l'application bascule automatiquement : l'authentification passe
par Supabase Auth, les données sont lues dans PostgreSQL et les documents
déposés vont dans le bucket privé `client-documents`.

### Isolation entre cabinets

Chaque table métier porte un `firm_id`. L'isolation repose sur deux barrières
indépendantes :

1. **Row Level Security**, dans la base. Les politiques s'appuient sur des
   fonctions `security definer` (`current_firm_id()`, `current_role_name()`,
   `current_client_id()`) qui relisent la ligne `profiles` de l'utilisateur
   connecté. Le rôle n'est donc jamais lu depuis les métadonnées modifiables
   côté client.
2. **Le contexte d'accès applicatif** (`services/db/access.ts`), résolu côté
   serveur à partir de la session, qui filtre toutes les requêtes et refuse les
   écritures hors périmètre.

Une session ne contient qu'un identifiant utilisateur signé : ni rôle, ni
cabinet. Ces informations sont rechargées à chaque requête.

---

## Configuration des données financières

L'accès aux données de marché passe exclusivement par `MarketDataService`
(`services/market/index.ts`). Aucun composant React n'appelle directement une
API externe.

```
MarketDataService
├── FinancialModelingPrepProvider   (si FMP_API_KEY)   → données réelles
├── YahooFinanceProvider            (sans clé)         → données réelles
└── MockMarketDataProvider          (repli)            → données simulées DEMO
```

Le service essaie les fournisseurs réels dans l'ordre configuré. Au premier
succès, la réponse est mise en cache et marquée `origin: 'live'`. Si tous
échouent, le fournisseur de démonstration prend le relais et la réponse est
marquée `origin: 'mock'` : l'interface affiche alors la mention DEMO.

Ajouter un fournisseur revient à implémenter l'interface `MarketDataProvider`
et à l'enregistrer dans `getMarketDataService()`.

Méthodes exposées : `getQuote`, `getQuotes`, `getHistoricalPrices`,
`getCompanyProfile`, `getFinancials`, `getNews`, `getIndexData`,
`getMacroIndicators`, `getFxToEur`.

Les graphiques de cours couvrent huit plages, de la journée à dix ans, et
permettent de comparer un support à un indice de référence. Les deux séries
sont alors ramenées en base 100 au début de la période, de sorte que la lecture
porte sur les trajectoires et non sur les niveaux de cours.

---

## Mode démonstration

Sans Supabase, PATRIMONIA utilise un entrepôt mémoire
(`services/db/demoStore.ts`) amorcé au démarrage avec :

- 2 cabinets, 7 comptes utilisateurs, 15 clients fictifs
- 71 lignes d'investissement, dont 69 sur des instruments réellement cotés
- 20 biens immobiliers, 16 crédits, 29 objectifs
- 50 alertes : celles produites par le moteur d'analyse, plus des alertes de
  cabinet et des alertes administratives
- 119 interactions CRM, 34 rendez-vous passés et à venir, 15 conversations,
  35 messages et 47 documents

Les mutations faites depuis l'interface (traitement d'une alerte, ajout d'une
note, dépôt d'un document, envoi d'un message) sont appliquées et persistent
pendant la durée d'exécution du serveur. Un redémarrage réamorce le jeu.

Les documents du jeu de démonstration sont décrits mais sans fichier associé, et
signalés par un badge DEMO. Les documents que vous déposez sont réellement
stockés et téléchargeables.

---

## Architecture

```
app/
├── (app)/                 Espace cabinet : conseiller et administrateur
│   ├── dashboard/         Tableau de bord orienté action
│   ├── clients/           Liste, fiche 360, fiche investissement
│   ├── alertes/           File d'alertes avec traitement et commentaires
│   ├── marches/           Indices, supports détenus, macro, actualités
│   ├── simulateur/        Simulateur patrimonial trois scénarios
│   ├── fiscalite/         Simulations fiscales pédagogiques
│   ├── crm/ calendrier/   Tâches, interactions, agenda
│   ├── messages/ documents/
│   └── admin/             Cabinet, utilisateurs, branding, audit
├── (client)/espace-client/ Espace client simplifié
├── api/                   Routes serveur : marché, documents, rapport PDF
├── connexion/ qr/ hors-connexion/
components/
├── ui/                    Bibliothèque de composants (18 primitives)
├── layout/                AppShell, sidebar, navigation mobile, thème, PWA
├── charts/                Graphiques Recharts encapsulés
├── clients/ alerts/ crm/ calendar/ messaging/ markets/ simulator/ tax/ admin/
├── intelligence/          Cartes d'analyse, score de cohérence
lib/
├── auth/                  Jeton de session, garde de routes, permissions
├── patrimony/             Valorisation, consolidation, dettes, objectifs
├── intelligence/          Moteur de règles, score, analyse d'investissement
├── tax/                   Barèmes fiscaux pédagogiques
├── supabase/ qr/ utils/ env.ts
services/
├── db/                    Contrat de dépôt, implémentations démo et Supabase
├── market/                MarketDataService et ses fournisseurs
├── report/                Générateur de rapport PDF
└── portfolio.ts           Assemblage de la vue 360 d'un client
types/                     Modèle de domaine TypeScript
data/demo/                 Jeu de démonstration fictif
supabase/migrations/       Schéma PostgreSQL et Row Level Security
tests/                     Tests des fonctions critiques
```

### Principes retenus

- **Une seule porte d'entrée par domaine.** Les données passent par
  `Repository`, le marché par `MarketDataService`, l'analyse par
  `analyzeClient` et `computeCoherenceScore`.
- **Le serveur décide.** Rôle, cabinet et périmètre client sont résolus à
  chaque requête à partir de la session, jamais reçus du navigateur.
- **L'origine de la donnée voyage avec la donnée.** `MarketResponse<T>` et
  `priceOrigin` remontent jusqu'au composant qui affiche la pastille.
- **Pas de faux boutons.** Chaque action visible fonctionne, ou porte une
  mention DEMO expliquant sa limite.

---

## PATRIMONIA INTELLIGENCE

Le module d'analyse (`lib/intelligence/`) applique quinze règles aux données du
client et produit des éléments typés : **risque**, **opportunité**,
**information** ou **action**.

Il détecte notamment la concentration par classe d'actifs et par ligne, une
diversification insuffisante, une trésorerie importante non investie, une
épargne de précaution trop faible, un écart entre l'exposition réelle et le
profil déclaré, un horizon court associé à une forte exposition marché, une
charge de remboursement élevée, une exposition crypto significative, un profil
non actualisé, des objectifs hors trajectoire, un rendement locatif faible et
une évolution inhabituelle du patrimoine.

Chaque élément porte un constat chiffré, une explication du mécanisme, une piste
d'analyse et les chiffres qui ont déclenché la règle, afin que le conseiller
puisse vérifier le raisonnement.

### Score de cohérence

Le score sur 100 n'est jamais affiché seul. Il résulte de sept facteurs
pondérés — diversification, objectifs, liquidités, risque, horizon,
concentration, endettement — chacun accompagné de sa note, de la mesure qui la
produit et d'une phrase expliquant le résultat.

---

## Sécurité

- Authentification par Supabase Auth, ou par session signée HMAC-SHA256 en mode
  démonstration. Le cookie est `HttpOnly`, `SameSite=Lax`, `Secure` en
  production, et expire au bout de douze heures.
- Le jeton de session ne contient qu'un identifiant utilisateur et une date
  d'émission. Rôle et cabinet sont rechargés côté serveur.
- Toutes les entrées de formulaire et tous les paramètres d'API sont validés
  par Zod avant traitement.
- Row Level Security activée sur l'ensemble des tables métier, plus un filtrage
  applicatif indépendant.
- Journal d'audit : utilisateur, action, objet concerné et horodatage, en
  lecture seule depuis l'application.
- Les accès par QR code reposent sur un jeton opaque aléatoire, à usage unique
  et à durée de vie courte. Le QR ne contient aucune donnée personnelle et
  n'accorde aucun droit par lui-même.
- Le service worker ne met en cache que les ressources statiques : aucune
  réponse contenant des données client n'est conservée sur l'appareil.
- En-têtes de sécurité appliqués à toutes les réponses : `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

---

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement sur le port 3000 |
| `npm run build` | Build de production, avec vérification TypeScript |
| `npm start` | Démarre le build de production |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm test` | Suite de tests Vitest |
| `npm run test:watch` | Tests en mode surveillance |
| `npm run seed:supabase` | Amorce une base Supabase avec le jeu de démonstration |
| `node scripts/generate-icons.mjs` | Régénère les icônes PNG de la PWA |

---

## Tests

La suite couvre les fonctions critiques : 91 tests répartis en 7 fichiers.

- `auth.test.ts` — signature, altération et expiration des jetons de session
- `permissions.test.ts` — matrice des droits par rôle
- `tenant-isolation.test.ts` — cloisonnement entre cabinets, périmètre client,
  confidentialité des alertes et des documents, gestion des objectifs, usage
  unique des jetons QR
- `patrimony.test.ts` — valorisation, conversion de devises, consolidation,
  endettement, rendement locatif, historique
- `intelligence.test.ts` — déclenchement des règles, structure et bornes du
  score de cohérence, analyse d'une ligne d'investissement
- `simulator.test.ts` — capitalisation, trois scénarios, projection d'objectifs
- `market-and-tax.test.ts` — déterminisme du fournisseur de démonstration,
  barèmes fiscaux

```bash
npm test
npm run typecheck
npm run build
```

---

## Progressive Web App

L'application est installable sur mobile depuis Safari ou Chrome.

- `public/manifest.webmanifest` — nom, couleurs, raccourcis, icônes
- `public/sw.js` — service worker, cache des ressources statiques uniquement,
  page de repli hors connexion
- `public/icons/` — icônes 192, 512, maskable et Apple Touch, générées par
  `scripts/generate-icons.mjs`

Le bandeau d'installation n'apparaît que si le navigateur déclare
l'application installable.

---

## Déploiement

### Vercel

1. Importer le dépôt dans Vercel. Le framework Next.js est détecté
   automatiquement.
2. Renseigner les variables d'environnement du projet, au minimum `AUTH_SECRET`
   et `NEXT_PUBLIC_APP_URL`.
3. Déployer. La commande de build est `npm run build`.

### Autre hébergeur Node

```bash
npm ci
npm run build
npm start          # écoute sur le port 3000, configurable par PORT
```

Points de vigilance en production : définir `AUTH_SECRET`, servir le site en
HTTPS pour que le cookie de session soit émis avec l'attribut `Secure`, et
renseigner `NEXT_PUBLIC_APP_URL` pour que les liens QR pointent vers le bon
domaine.

---

## Limites connues

- Le mode démonstration conserve les données en mémoire : elles sont réamorcées
  à chaque redémarrage du serveur.
- Les barèmes fiscaux sont saisis à des fins pédagogiques et doivent être
  vérifiés auprès des sources officielles avant toute exploitation.
- Les historiques de patrimoine sont reconstitués à partir de la situation
  actuelle : ils ne proviennent d'aucun relevé.
- Les fournisseurs de données de marché publics peuvent limiter le débit des
  requêtes ; le cache mémoire de 120 secondes atténue cet effet.
