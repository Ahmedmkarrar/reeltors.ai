import { validateEnv } from '@/lib/env';

export async function register() {
  // only runs in the Node.js runtime (not edge), which is where all our API routes live
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv();
  }
}
