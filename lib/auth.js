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
      }
      // Permite actualizar campos del token desde el cliente con update()
      if (trigger === 'update' && session) {
        if (session.avatar_url !== undefined) token.avatar_url = session.avatar_url;
        if (session.username  !== undefined) token.username   = session.username;
        if (session.email     !== undefined) token.email      = session.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id         = token.id;
      session.user.username   = token.username;
      session.user.role       = token.role;
      session.user.avatar_url = token.avatar_url;
      session.user.store_id   = token.store_id;
      session.user.store_slug = token.store_slug;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
