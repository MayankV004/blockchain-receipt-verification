import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [admin()],   // Enables role field: "admin" | "user"
  session: {
    expiresIn: 60 * 60 * 24 * 7,       // 7 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});
