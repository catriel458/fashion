import { neon, neonConfig } from '@neondatabase/serverless';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const sql = neon(process.env.DATABASE_URL);
export default sql;
