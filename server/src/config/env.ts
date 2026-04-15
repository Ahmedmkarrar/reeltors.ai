import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(__dirname, '..', '..');
const repoRoot = resolve(serverRoot, '..');

// Load root .env files first (base values), then server/.env with override priority
config({ path: resolve(repoRoot, '.env'), override: false });
config({ path: resolve(repoRoot, '.env.local'), override: false });
config({ path: resolve(serverRoot, '.env'), override: true });
