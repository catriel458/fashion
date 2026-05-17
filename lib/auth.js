import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import sql from './db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const users = await sql`
          SELECT * FROM users WHERE email = ${credentials.email} AND active = true
        `;
        if (users.length === 0) return null;
        const user = users[0];
        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        let store_slug = null;
        if (user.store_id) {
          const stores = await sql`SELECT slug FROM stores WHERE id = ${user.store_id}`;
          if (stores.length > 0) store_slug = stores[0].slug;
        }

        return {
          id: String(user.id),
          email: user.email,
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url || null,
          store_id: user.store_id || null,
          store_slug,
          email_verified: user.email_verified || false,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          birth_date: user.birth_date || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.avatar_url = user.avatar_url;
        token.store_id = user.store_id;
        token.store_slug = user.store_slug;
        token.email_verified = user.email_verified;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.birth_date = user.birth_date;
      }
      if (trigger === 'update') {
        // Leer email_verified directo de DB (fuente de verdad)
        const users = await sql`SELECT email_verified FROM users WHERE id = ${token.id}`;
        if (users.length > 0) token.email_verified = users[0].email_verified;
        if (session?.avatar_url   !== undefined) token.avatar_url   = session.avatar_url;
        if (session?.username     !== undefined) token.username     = session.username;
        if (session?.email        !== undefined) token.email        = session.email;
        if (session?.first_name   !== undefined) token.first_name   = session.first_name;
        if (session?.last_name    !== undefined) token.last_name    = session.last_name;
        if (session?.birth_date   !== undefined) token.birth_date   = session.birth_date;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id            = token.id;
      session.user.username      = token.username;
      session.user.role          = token.role;
      session.user.avatar_url    = token.avatar_url;
      session.user.store_id      = token.store_id;
      session.user.store_slug    = token.store_slug;
      session.user.email_verified = token.email_verified;
      session.user.first_name    = token.first_name;
      session.user.last_name     = token.last_name;
      session.user.birth_date    = token.birth_date;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
