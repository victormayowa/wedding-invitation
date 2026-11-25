import http from 'node:http';
import path from 'node:path';
import { loadDotEnv, loadConfig } from './src/config.js';
import { loadContent } from './src/content.js';
import { openDatabase } from './src/db.js';
import { createApp } from './src/app.js';

loadDotEnv();
const config = loadConfig();

if (config.problems.length) {
  console.error(`\n  Settings need attention:\n${config.problems.map((p) => `   • ${p}`).join('\n')}\n`);
  if (config.production) process.exit(1);
}

const { content, problems } = await loadContent(process.env.CONTENT_FILE ? path.resolve(process.env.CONTENT_FILE) : undefined);
if (problems.length) {
  console.warn(`\n  content/wedding.js needs attention:\n${problems.map((p) => `   • ${p}`).join('\n')}\n`);
}

/** Opens the database, waiting up to ~30 s for Postgres to accept connections (e.g. a container still starting). */
async function connect() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await openDatabase({
        url: config.databaseUrl,
        ssl: config.databaseSsl,
        file: path.join(config.dataDir, 'wedding.db'),
        now: config.now,
      });
    } catch (err) {
      if (!config.databaseUrl || attempt >= 15) throw err;
      console.warn(`  Waiting for the database (${err.message})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
const db = await connect();
if (config.production && !config.databaseUrl) {
  console.warn('  DATABASE_URL is not set: guest data is kept in a SQLite file. Make sure DATA_DIR is on persistent storage.');
}
const app = createApp({ config, content, contentProblems: problems, db });

const server = http.createServer(app.handler);
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;

server.listen(config.port, config.host, () => {
  console.log(`\n  ${content.couple.first} & ${content.couple.second} is running at ${config.publicUrl}`);
  console.log(`  Admin: ${config.publicUrl}/admin`);
  console.log(`  Database: ${db.dialect === 'postgres' ? 'Postgres' : `SQLite (${path.join(config.dataDir, 'wedding.db')})`}`);
  if (config.generatedPassword) {
    console.log(`  No ADMIN_PASSWORD set. Temporary password for this run: ${config.adminPassword}`);
  }
  console.log('');
});

function shutdown() {
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
