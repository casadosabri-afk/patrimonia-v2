/**
 * Utilitaire partagé par les lanceurs PATRIMONIA.
 *
 * Les scripts `lancer-patrimonia.sh`, `.command` et `.bat` délèguent ici tout
 * ce qui est pénible à écrire deux fois en shell et en batch : recherche d'un
 * port libre, génération du secret de session, attente du démarrage.
 *
 * Usage : node scripts/launcher.mjs <commande> [argument]
 *   check-node        vérifie la version de Node (code 1 si trop ancienne)
 *   port              affiche un port libre entre 3000 et 3024
 *   env <port>        crée ou met à jour .env.local ; affiche « rebuild »
 *                     lorsque l'adresse publique a changé
 *   wait <port>       attend que le serveur réponde (code 1 après 90 secondes)
 */
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { get } from 'node:http';

const MIN_NODE_MAJOR = 20;
const FIRST_PORT = 3000;
const LAST_PORT = 3024;
const WAIT_SECONDS = 90;

const [command, argument] = process.argv.slice(2);

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort() {
  for (let port = FIRST_PORT; port <= LAST_PORT; port += 1) {
    if (await isPortFree(port)) return port;
  }
  return null;
}

function respondsOk(port) {
  return new Promise((resolve) => {
    const request = get(`http://127.0.0.1:${port}/connexion`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Crée `.env.local` au premier lancement, ou réaligne l'adresse publique. */
function syncEnvFile(port) {
  const url = `http://localhost:${port}`;
  const line = `NEXT_PUBLIC_APP_URL=${url}`;

  if (!existsSync('.env.local')) {
    const secret = randomBytes(36).toString('base64url');
    writeFileSync(
      '.env.local',
      [
        '# Généré automatiquement par le lanceur PATRIMONIA. Ne pas publier.',
        `AUTH_SECRET=${secret}`,
        line,
        '',
      ].join('\n'),
    );
    // Première écriture : rien à reconstruire, la compilation suivra de toute façon.
    return 'created';
  }

  const lines = readFileSync('.env.local', 'utf8').split('\n');
  if (lines.some((entry) => entry.trim() === line)) return 'unchanged';

  const kept = lines.filter((entry) => !entry.startsWith('NEXT_PUBLIC_APP_URL='));
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();
  kept.push(line, '');
  writeFileSync('.env.local', kept.join('\n'));

  // L'adresse publique est figée à la compilation : il faut reconstruire.
  return 'rebuild';
}

switch (command) {
  case 'check-node': {
    const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
    if (!Number.isFinite(major) || major < MIN_NODE_MAJOR) process.exit(1);
    console.log(process.version);
    break;
  }

  case 'port': {
    const port = await findFreePort();
    if (port === null) process.exit(1);
    console.log(port);
    break;
  }

  case 'env': {
    const port = Number.parseInt(argument ?? '', 10);
    if (!Number.isFinite(port)) process.exit(1);
    console.log(syncEnvFile(port));
    break;
  }

  case 'wait': {
    const port = Number.parseInt(argument ?? '', 10);
    if (!Number.isFinite(port)) process.exit(1);
    for (let attempt = 0; attempt < WAIT_SECONDS; attempt += 1) {
      if (await respondsOk(port)) process.exit(0);
      await sleep(1000);
    }
    process.exit(1);
  }

  default:
    console.error('Commande inconnue. Attendu : check-node, port, env ou wait.');
    process.exit(1);
}
