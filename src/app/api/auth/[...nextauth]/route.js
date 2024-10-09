import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/drive.readonly',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the access token and provider type in the token if it's returned from GitHub or Google
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider; // Store the provider (github or google)
      }
      return token;
    },
    async session({ session, token }) {
      // Add the access token and provider type to the session object
      session.accessToken = token.accessToken;
      session.provider = token.provider; // Include the provider type in the session
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/drive.readonly',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token; // This will store the GitHub or Google access token
        token.provider = account.provider; // Store the provider type (github or google)
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken; // Pass the accessToken to session
      session.provider = token.provider; // Pass the provider type (github or google) to session
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { handler as GET, handler as POST, authOptions };
