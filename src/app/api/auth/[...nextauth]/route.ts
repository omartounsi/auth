import NextAuth, { User, AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

// --- Type extensions ---
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
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Initial sign in
      if (user) {
        const customUser = user as any;
        token.accessToken = customUser.accessToken;
        token.refreshToken = customUser.refreshToken;
        token.accessTokenExpires = customUser.accessTokenExpires;
        token.refreshTokenExpires = customUser.refreshTokenExpires;
        token.id = user.id;
        token.email = user.email || "";
        return token;
      }

      //check if previous token has expired
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      //else run refresh function
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
      return {
        ...token,
        accessToken: token.refreshToken,
        refreshToken: null,
        accessTokenExpires: Date.now() + 300 * 1000,
        error: undefined,
      };
    }

    // PHASE 2: Refresh token is null AND access token expires in ≤5 seconds
    if (
      token.refreshToken === null &&
      token.accessToken &&
      token.accessTokenExpires
    ) {
      const timeUntilExpiry = token.accessTokenExpires - Date.now();

      // 5 second timer
      if (timeUntilExpiry <= 5000) {
        console.log(
          `access token expires in ${Math.round(
            timeUntilExpiry / 1000
          )}s, calling  /refresh `
        );

        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("failed to refresh token");
        }

        const refreshed = await res.json();
        console.log("tokens refreshed");

        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          accessTokenExpires: Date.now() + refreshed.access_token_expire * 1000,
          refreshTokenExpires:
            Date.now() + refreshed.refresh_token_expire * 1000,
          error: undefined,
        };
      } else {
        // Access token still has more than 5 seconds left, don't refresh yet
        console.log(
          `access token expires in ${Math.round(
            timeUntilExpiry / 1000
          )}s, waiting for 5s threshold`
        );
        return token; // Return unchanged token
      }
    }

    // No valid tokens available
    throw new Error("No valid tokens available for refresh");
  } catch (error) {
    console.error(" Cascade refresh failed:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
