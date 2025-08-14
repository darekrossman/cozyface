"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useImagePreloader } from "@/hooks/use-image-preloader";
import { useImageGen } from "./image-gen-provider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function ImageDetail({ closeButton }: { closeButton?: React.ReactNode }) {
	const { id: imageIdParam } = useParams();
	const router = useRouter();
	const { generateImage, setGenParams, generationMap } = useImageGen();
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevWheelDeltaY = useRef<number>(0);

	const [id, setOptimisticId] = useState(imageIdParam);

	// Use the image preloader hook to preload images around the current one
	useImagePreloader(
		generationMap,
		typeof id === "string" ? id : null,
		5, // Preload 5 images before and after
	);

	const generation = Object.values(generationMap).find((gen) =>
		gen.images.some((img) => img.id === id),
	);

	console.log(generation);

	const currentImage = generation?.images.find((image) => image.id === id);

	// Get sorted generations (newest first) and their images
	const sortedGenerations = Object.values(generationMap)
		.filter((gen) => gen.images.length > 0)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	// Find current generation index and image index
	const currentGenerationIndex = generation
		? sortedGenerations.findIndex((gen) => gen.id === generation.id)
		: -1;
	const currentImageIndex = generation ? generation.images.findIndex((img) => img.id === id) : -1;

	const navigateToImage = useCallback(
		(imageId: string) => {
			setOptimisticId(imageId);
			window.history.replaceState(null, "", `/image/${imageId}`);
		},
		[router, setOptimisticId],
	);

	const handleNavigation = useCallback(
		(direction: "next" | "previous") => {
			if (!generation || currentGenerationIndex === -1 || currentImageIndex === -1) {
				return;
			}

			if (direction === "previous") {
				// Try to navigate to previous image in current generation
				if (currentImageIndex < generation.images.length - 1) {
					const nextImage = generation.images[currentImageIndex + 1];
					navigateToImage(nextImage.id);
				} else {
					// Navigate to first image of previous generation
					if (currentGenerationIndex < sortedGenerations.length - 1) {
						const prevGeneration = sortedGenerations[currentGenerationIndex + 1];
						if (prevGeneration.images.length > 0) {
							navigateToImage(prevGeneration.images[0].id);
						}
					}
				}
			} else {
				// Try to navigate to next image in current generation
				if (currentImageIndex > 0) {
					const previousImage = generation.images[currentImageIndex - 1];
					navigateToImage(previousImage.id);
				} else {
					// Navigate to last image of next generation
					if (currentGenerationIndex > 0) {
						const nextGeneration = sortedGenerations[currentGenerationIndex - 1];
						if (nextGeneration?.images.length > 0) {
							const lastImageIndex = nextGeneration.images.length - 1;
							navigateToImage(nextGeneration.images[lastImageIndex].id);
						}
					}
				}
			}
		},
		[generation, currentGenerationIndex, currentImageIndex, sortedGenerations, navigateToImage],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Only handle arrow keys when not typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key) {
				case "ArrowRight":
				case "ArrowDown":
					e.preventDefault();
					handleNavigation("previous");
					break;
				case "ArrowLeft":
				case "ArrowUp":
					e.preventDefault();
					handleNavigation("next");
					break;
			}
		},
		[handleNavigation],
	);

	const handleScroll = useCallback(
		(e: WheelEvent) => {
			const prevDY = prevWheelDeltaY.current || 0;
			const dy = prevDY + Math.abs(e.deltaY);

			if (dy > 30) {
				prevWheelDeltaY.current = 0;
				if (e.deltaY > 0) {
					handleNavigation("previous");
				} else {
					handleNavigation("next");
				}
			} else {
				prevWheelDeltaY.current = dy;
			}
		},
		[handleNavigation],
	);

	useEffect(() => {
		scrollRef.current?.addEventListener("wheel", handleScroll);

		return () => scrollRef.current?.removeEventListener("wheel", handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	if (!generation) {
		return null;
	}

	return (
		<div
			ref={scrollRef}
			className="grid grid-cols-24 w-full h-dvh overflow-y-hidden"
			style={{ "--aspect-ratio": generation.aspectRatio.replace(":", "/") } as React.CSSProperties}
		>
			<div className=" relative col-span-16 pt-[calc(var(--header-height)+1rem)] px-6 pb-12 content-center justify-center min-h-0 bg-background/94 backdrop-blur-lg border-x">
				<div className="absolute top-[calc(var(--header-height)+1rem)] right-6 z-2">
					{closeButton}
				</div>
				<div className={`relative w-auto max-h-full aspect-[var(--aspect-ratio)] mx-auto`}>
					{currentImage && (
						<Image
							src={currentImage.url}
							alt="Image"
							fill
							className="rounded-sm"
							unoptimized={true}
						/>
					)}
				</div>
			</div>

			<div className="col-span-8 pt-[var(--header-height)] px-6 bg-background">
				<div className="flex flex-col gap-2 pt-4">
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
