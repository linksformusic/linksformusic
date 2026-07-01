import { randomUUID } from "node:crypto";

import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@linksformusic/database";
import { checkout, polar, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

type PolarPlugin =
  ReturnType<typeof checkout> | ReturnType<typeof portal> | ReturnType<typeof usage> | ReturnType<typeof webhooks>;

type PolarPlugins = [PolarPlugin, ...PolarPlugin[]];

const polarFeatures: PolarPlugins = [
  checkout({
    products: process.env.POLAR_PRO_PRODUCT_ID
      ? [
          {
            productId: process.env.POLAR_PRO_PRODUCT_ID,
            slug: "pro",
          },
        ]
      : [],
    successUrl: `${process.env.DASHBOARD_URL ?? "http://localhost:3001"}/billing?checkout_id={CHECKOUT_ID}`,
    authenticatedUsersOnly: true,
  }),
  portal(),
  usage(),
];

if (process.env.POLAR_WEBHOOK_SECRET) {
  polarFeatures.push(
    webhooks({
      secret: process.env.POLAR_WEBHOOK_SECRET,
    })
  );
}

export const auth = betterAuth({
  appName: "LinksForMusic",
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    process.env.WEB_URL ?? "http://localhost:3000",
    process.env.DASHBOARD_URL ?? "http://localhost:3001",
    process.env.API_URL ?? process.env.BETTER_AUTH_URL!,
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
      apikey: schema.authApiKey,
    },
  }),
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
  user: {
    modelName: "auth_user",
  },
  session: {
    modelName: "auth_session",
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    modelName: "auth_account",
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      allowDifferentEmails: false,
    },
  },
  verification: {
    modelName: "auth_verification",
  },
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
    crossSubDomainCookies: {
      enabled: Boolean(process.env.AUTH_COOKIE_DOMAIN),
      domain: process.env.AUTH_COOKIE_DOMAIN,
    },
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://"),
  },
  plugins: [
    apiKey({
      references: "user",
      apiKeyHeaders: ["authorization", "x-api-key"],
      defaultPrefix: "lfm_",
      enableMetadata: true,
      rateLimit: {
        enabled: true,
        timeWindow: 60 * 1000,
        maxRequests: 60,
      },
      schema: {
        apikey: {
          modelName: "auth_api_key",
        },
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: polarFeatures,
    }),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
