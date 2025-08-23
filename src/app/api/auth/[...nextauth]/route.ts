import NextAuth, { User, AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

// --- type workaround ---
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string | null;
    user: {
      id: string;
      email: string;
      name?: string;
    };
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    refreshTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string | null;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    id?: string;
    email?: string;
    error?: string;
  }
}

// --- CONFIG ---
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "omar@gmail.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            return {
              id: String(data.user?.id),
              email: data.user?.email,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              accessTokenExpires: Date.now() + data.access_token_expire * 1000,
              refreshTokenExpires:
                Date.now() + data.refresh_token_expire * 1000,
            };
          }

          console.error("Login failed:", data);
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email);
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.refreshTokenExpires = user.refreshTokenExpires;
        token.id = user.id;
        token.email = user.email || "";
        return token;
      }

      //check if previous token has expired OR is about to expire (30s buffer)
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 30000
      ) {
        return token;
      }

      //else run refresh function (token expired or expires within 30s)
      return handleRefresh(token);
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.error) {
        // sign out if there's an error
        throw new Error(token.error);
      }

      if (session.user) {
        session.user.id = token.id || "";
        session.user.email = token.email || "";
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

async function handleRefresh(token: JWT) {
  try {
    if (token.refreshToken) {
      // copy refresh token to access use remaining time from refresh token
      const refreshExpiry =
        token.refreshTokenExpires || Date.now() + 180 * 1000; //or 3mins

      if (refreshExpiry <= Date.now()) {
        throw new Error("tokens expired");
      }

      return {
        ...token,
        accessToken: token.refreshToken,
        refreshToken: null,
        accessTokenExpires: refreshExpiry,
        error: undefined,
      };
    }

    if (
      token.refreshToken === null &&
      token.accessToken &&
      token.accessTokenExpires
    ) {
      const timeUntilExpiry = token.accessTokenExpires - Date.now();

      // 30 second buffer and check if token is still valid for refresh
      if (timeUntilExpiry <= 30000) {
        console.log(
          `access token expires in ${Math.round(timeUntilExpiry / 1000)}s, `
        );

        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/refresh", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to refresh token");
        }

        const refreshed = await res.json();
        console.log("API response:", refreshed);

        const authData = refreshed.data.authorisation;

        return {
          ...token,
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          accessTokenExpires: Date.now() + authData.access_token_expire * 1000,
          refreshTokenExpires:
            Date.now() + authData.refresh_token_expire * 1000,
          error: undefined,
        };
      } else {
        return token;
      }
    }

    throw new Error("no valid tokens available for refresh");
  } catch (error) {
    console.error("Refresh failed:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
