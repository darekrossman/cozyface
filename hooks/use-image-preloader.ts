"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Generation } from "@/lib/types";

interface ImageWithGeneration {
	id: string;
	url: string;
	generationId: string;
}

/**
 * Custom hook to preload images around the currently selected image with dynamic range expansion
 * @param generationMap - Map of all generations
 * @param currentImageId - ID of the currently selected image
 * @param basePreloadRange - Base number of images to preload before and after (default: 5)
 */
export function useImagePreloader(
	generationMap: Record<string, Generation>,
	currentImageId: string | null,
	basePreloadRange = 5,
) {
	// Track the expanded preload range
	const [expandedRange, setExpandedRange] = useState({
		before: basePreloadRange,
		after: basePreloadRange,
	});
	const lastCurrentImageId = useRef<string | null>(null);
	const lastPreloadBoundaries = useRef<{
		firstPreloadedIndex: number;
		lastPreloadedIndex: number;
	} | null>(null);
	// Create a flat array of all images across all generations, sorted by creation date
	const allImages = useMemo(() => {
		const sortedGenerations = Object.values(generationMap)
			.filter((gen) => gen.images.length > 0)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		const images: ImageWithGeneration[] = [];

		// Add images from each generation in order
		for (const generation of sortedGenerations) {
			for (const image of generation.images) {
				images.push({
					id: image.id,
					url: image.url,
					generationId: generation.id,
				});
			}
		}

		return images;
	}, [generationMap]);

	// Check if we need to expand the preload range based on navigation
	useEffect(() => {
		if (!currentImageId || allImages.length === 0) {
			return;
		}

		const currentIndex = allImages.findIndex((img) => img.id === currentImageId);
		if (currentIndex === -1) {
			return;
		}

		// If this is a new image (user navigated), check if we need to expand or reset the range
		if (lastCurrentImageId.current !== currentImageId) {
			if (lastPreloadBoundaries.current) {
				const { firstPreloadedIndex, lastPreloadedIndex } = lastPreloadBoundaries.current;

				// Check if user reached the first preloaded image (need to expand backward)
				if (currentIndex === firstPreloadedIndex && firstPreloadedIndex > 0) {
					if (process.env.NODE_ENV === "development") {
						console.log("Expanding preload range backward");
					}
					setExpandedRange((prev) => ({
						...prev,
						before: prev.before + basePreloadRange,
					}));
				}
				// Check if user reached the last preloaded image (need to expand forward)
				else if (currentIndex === lastPreloadedIndex && lastPreloadedIndex < allImages.length - 1) {
					if (process.env.NODE_ENV === "development") {
						console.log("Expanding preload range forward");
					}
					setExpandedRange((prev) => ({
						...prev,
						after: prev.after + basePreloadRange,
					}));
				}
				// Check if user jumped to a completely different part (reset to base range)
				else if (currentIndex < firstPreloadedIndex - 1 || currentIndex > lastPreloadedIndex + 1) {
					if (process.env.NODE_ENV === "development") {
						console.log("Resetting preload range to base");
					}
					setExpandedRange({ before: basePreloadRange, after: basePreloadRange });
				}
			}
		}

		lastCurrentImageId.current = currentImageId;
	}, [currentImageId, allImages, basePreloadRange]);

	// Calculate current preload range and images to preload
	const imagesToPreload = useMemo(() => {
		if (!currentImageId || allImages.length === 0) {
			return [];
		}

		const currentIndex = allImages.findIndex((img) => img.id === currentImageId);
		if (currentIndex === -1) {
			return [];
		}

		// Calculate the actual preload range with expanded boundaries
		const startIndex = Math.max(0, currentIndex - expandedRange.before);
		const endIndex = Math.min(allImages.length - 1, currentIndex + expandedRange.after);

		// Store current boundaries for next navigation check
		lastPreloadBoundaries.current = {
			firstPreloadedIndex: startIndex,
			lastPreloadedIndex: endIndex,
		};

		const imagesToPreload: ImageWithGeneration[] = [];

		// Add images before current (excluding current image itself)
		for (let i = startIndex; i < currentIndex; i++) {
			imagesToPreload.push(allImages[i]);
		}

		// Add images after current (excluding current image itself)
		for (let i = currentIndex + 1; i <= endIndex; i++) {
			imagesToPreload.push(allImages[i]);
		}

		return imagesToPreload;
	}, [allImages, currentImageId, expandedRange]);

	// Preload the images
	useEffect(() => {
		if (imagesToPreload.length === 0) {
			return;
		}

		// Create image elements to trigger preloading
		const imageElements: HTMLImageElement[] = [];

		imagesToPreload.forEach((image) => {
			const img = new Image();
			img.src = image.url;

			// Optional: Add load/error handlers for debugging (only in development)
			if (process.env.NODE_ENV === "development") {
				img.onload = () => {
					// console.log(`Preloaded image: ${image.id}`);
				};

				img.onerror = () => {
					console.warn(`Failed to preload image: ${image.id}`);
				};
			}

			imageElements.push(img);
		});

		// Cleanup function
		return () => {
			imageElements.forEach((img) => {
				if (process.env.NODE_ENV === "development") {
					img.onload = null;
					img.onerror = null;
				}
			});
		};
	}, [imagesToPreload]);

	// Return useful information for debugging or other purposes
	return {
		allImages,
		imagesToPreload,
		currentImageIndex: allImages.findIndex((img) => img.id === currentImageId),
		totalImages: allImages.length,
		expandedRange,
		preloadBoundaries: lastPreloadBoundaries.current,
	};
}
