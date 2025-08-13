import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cb050eb71520b45524e4357f7a5701dc.r2.cloudflarestorage.com",
			},
		],
	},
};

export default nextConfig;
