"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useImageGen } from "@/components/image-gen-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Generation } from "@/lib/types";

interface GenerationResultProps {
	generation: Generation;
}

export default function GenerationResult({ generation }: GenerationResultProps) {
	const { setGenParams, generateImage } = useImageGen();

	const [x, y] = generation.aspectRatio.split(" ")[0].split(":").map(Number);
	const isLandscape = x / y > 1;

	return (
		<div key={generation.id}>
			{generation.error && (
				<div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200 mb-4">
					Error: {generation.error}
				</div>
			)}

			<div className="grid grid-cols-16 gap-6">
				<div
					className={`grid gap-2 ${isLandscape ? "grid-cols-2" : "grid-cols-4"} col-span-11`}
					style={
						{
							"--aspect-ratio": generation.aspectRatio.split(" ")[0].replace(":", "/"),
						} as React.CSSProperties
					}
				>
					{generation.isLoading && generation.images.length === 0
						? Array.from({ length: generation.batchSize }).map((_, index) => (
								<Skeleton
									key={`${generation.id}-placeholder-${index}`}
									className={`w-full aspect-[var(--aspect-ratio)] rounded-sm`}
								/>
							))
						: generation.images.map(({ id, url }, index) => (
								<Link
									key={id}
									href={`/image/${id}`}
									className="flex cursor-pointer border-0 p-0 bg-transparent aspect-[var(--aspect-ratio)]"
									aria-label={`View generated image ${index + 1} in larger size`}
								>
									<Image
										src={url}
										alt={`Generated image ${index + 1} for: ${generation.prompt}`}
										width={1024}
										height={1024}
										sizes="(max-width: 768px) 50vw, 25vw"
										className={`w-full h-auto aspect-[var(--aspect-ratio)] object-cover rounded-sm shadow-md hover:opacity-90 transition-opacity`}
									/>
								</Link>
							))}
				</div>

				<div className="flex flex-col justify-between gap-6 col-span-5">
					<div className="flex flex-col gap-2">
						<button
							type="button"
							className="text-xs text-gray-300 leading-5 text-pretty text-left hover:opacity-70 cursor-pointer transition-opacity"
							onClick={() => setGenParams((prev) => ({ ...prev, prompt: generation.prompt }))}
						>
							{generation.prompt}
						</button>
						<div className="flex gap-1 flex-wrap">
							{/* <Badge variant="secondary" className="opacity-40">
								{generation.sampler} / {generation.scheduler}
							</Badge> */}
							<Badge variant="secondary" className="opacity-40">
								Steps: {generation.steps}
							</Badge>
							<Badge variant="secondary" className="opacity-40">
								CFG: {generation.guidance}
							</Badge>
							<Badge variant="secondary" className="opacity-40">
								AR: {generation.aspectRatio}
							</Badge>
						</div>
					</div>

					<div className="ml-[-8px]">
						<Button
							variant="ghost"
							size="xs"
							className="text-muted-foreground"
							onClick={() => generateImage(generation)}
						>
							<RotateCcw strokeWidth={1} className="size-[14px]" />
							Rerun
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
