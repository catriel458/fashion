import { neon, neonConfig } from '@neondatabase/serverless';
import { ProxyAgent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

if (process.env.HTTPS_PROXY) {
  const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
  // Configurar el dispatcher global de undici
  setGlobalDispatcher(dispatcher);
  // Configurar explícitamente neon para que use undici con el proxy
  neonConfig.fetchFunction = (url, init) =>
    undiciFetch(url, { ...init, dispatcher });
}

const sql = neon(process.env.DATABASE_URL);
export default sql;
