"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useImageGen } from "./image-gen-provider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function ImageDetail() {
	const { id } = useParams();
	const { generateImage, setGenParams, generationMap } = useImageGen();

	const generation = Object.values(generationMap).find((gen) =>
		gen.images.some((img) => img.id === id),
	);

	if (!generation) {
		return null;
	}

	const currentImage = generation.images.find((image) => image.id === id);

	return (
		<div
			className="grid grid-cols-24 w-full h-dvh"
			style={{ "--aspect-ratio": generation.aspectRatio.replace(":", "/") } as React.CSSProperties}
		>
			<div className="col-span-16 pt-[calc(var(--header-height)+1.5rem)] px-6 pb-12 content-center justify-center min-h-0 bg-background/94 backdrop-blur-lg border-x">
				<div className={`relative w-auto max-h-full aspect-[var(--aspect-ratio)] mx-auto`}>
					{currentImage && <Image src={currentImage.url} alt="Image" fill className="rounded-sm" />}
				</div>
			</div>

			<div className="col-span-8 pt-[var(--header-height)] px-6 bg-background">
				<div className="flex flex-col gap-2 pt-6">
					<button
						type="button"
						className="text-xs text-gray-300 leading-5 text-pretty text-left hover:opacity-70 cursor-pointer transition-opacity"
						onClick={() => setGenParams((prev) => ({ ...prev, prompt: generation.prompt }))}
					>
						{generation.prompt}
					</button>
					<div className="flex gap-1 flex-wrap">
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
	);
}
