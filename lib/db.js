import { neon, neonConfig } from '@neondatabase/serverless';
import { ProxyAgent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Desactivar caché de fetch de NextJS para todas las consultas SQL (solo fuera de la fase de compilación)
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

if (!isNextBuild) {
  neonConfig.fetchOptions = { cache: 'no-store' };
}

// Forzar la desactivación de caché de NextJS inyectando 'cache: no-store' en la función de fetch de Neon
if (process.env.HTTPS_PROXY) {
  const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
  setGlobalDispatcher(dispatcher);
  neonConfig.fetchFunction = (url, init) =>
    undiciFetch(url, { ...init, cache: isNextBuild ? undefined : 'no-store', dispatcher });
} else if (!isNextBuild) {
  neonConfig.fetchFunction = (url, init) =>
    fetch(url, { ...init, cache: 'no-store' });
}

const sql = neon(process.env.DATABASE_URL);
export default sql;
