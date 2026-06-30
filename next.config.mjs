/** @type {import('next').NextConfig} */

// GitHub Pages deploy config is gated behind GITHUB_PAGES so it only activates
// in the Pages CI build (.github/workflows/deploy.yml). Locally and on any other
// host this stays the empty default — which keeps this file safe to push back to
// Adri's upstream repo without changing his build. Project Pages serve under the
// repo subpath, so we need basePath/assetPrefix to match.
const isGhPages = process.env.GITHUB_PAGES === "true";
const repo = "smartco-ui";

const nextConfig = isGhPages
  ? {
      output: "export",
      basePath: `/${repo}`,
      assetPrefix: `/${repo}/`,
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {};

export default nextConfig;
