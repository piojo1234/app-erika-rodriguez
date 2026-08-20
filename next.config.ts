import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "your-org", // PLACEHOLDER
  project: "your-project", // PLACEHOLDER

  // Only print logs for uploading source maps in CI
  silent: true,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  sourcemaps: {
    disable: true,
  },

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Prevent build failure if SENTRY_AUTH_TOKEN is missing (Vercel)
  // @ts-ignore - Options passed down to webpack plugin
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  // @ts-ignore
  errorHandler: (err: any) => {
    console.warn("Sentry CLI warning:", err.message);
  },


});
