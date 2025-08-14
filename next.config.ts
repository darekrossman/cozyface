import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "pub-bd5078e35a584a9aa20c6f636882775c.r2.dev",
			},
		],
	},
};

export default nextConfig;
