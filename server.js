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

const db = openDatabase(path.join(config.dataDir, 'wedding.db'), { now: config.now });
const app = createApp({ config, content, contentProblems: problems, db });

const server = http.createServer(app.handler);
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;

server.listen(config.port, config.host, () => {
  console.log(`\n  ${content.couple.first} & ${content.couple.second} is running at ${config.publicUrl}`);
  console.log(`  Admin: ${config.publicUrl}/admin`);
  if (config.generatedPassword) {
    console.log(`  No ADMIN_PASSWORD set. Temporary password for this run: ${config.adminPassword}`);
  }
  console.log('');
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
