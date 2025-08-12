"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { type GenerationResult, useFluxStream } from "@/hooks/use-flux-stream";
import type { Generation, GenerationParams, GenerationRequestParams } from "@/lib/types";

interface ImageGenContextType {
	genParams: GenerationParams;
	results: Record<string, GenerationResult>;
	generationMap: Record<string, Generation>;
	setGenParams: Dispatch<SetStateAction<GenerationParams>>;
	generateImage: (params: GenerationParams) => void;
	cancelGeneration: () => void;
}

const ImageGenContext = createContext<ImageGenContextType | undefined>(undefined);

interface ImageGenProviderProps {
	children: ReactNode;
	endpoint?: string;
}

export function ImageGenProvider({ children }: ImageGenProviderProps) {
	const {
		start,
		results,
		cancel: cancelGeneration,
	} = useFluxStream(
		"https://darekrossman--flux-endpoint-streaming-fluxservice-infere-c484ad.modal.run",
	);
	const [generationMap, setGenerationMap] = useState<Record<string, Generation>>({});

	const [genParams, setGenParams] = useState<GenerationParams>({
		prompt: "",
		guidance: 2,
		steps: 28,
		aspectRatio: "1:1",
		outputFormat: "WEBP",
		batchSize: 4,
	});

	useEffect(() => {
		// Update generationMap when results change
		setGenerationMap((prev) => {
			const updated = { ...prev };

			Object.entries(results).forEach(([generationId, result]) => {
				const generation = updated[generationId];
				if (!generation) return;

				// If generation is loading and we have preview images, update with preview
				if (generation.isLoading && result.preview && result.preview.length > 0) {
					generation.images = result.preview;
				}

				// If we have final URLs, update with URLs and set loading to false
				if (result.urls && result.urls.length > 0) {
					generation.images = result.urls;
					generation.isLoading = false;
				}

				// If there's an error, set loading to false and store the error
				if (result.error) {
					generation.isLoading = false;
					generation.error = result.error;
				}
			});

			return updated;
		});
	}, [results]);

	const generateImage = async (generation: GenerationParams) => {
		const prompt_id = crypto.randomUUID();
		const newGeneration: Generation = {
			id: prompt_id,
			prompt: generation.prompt,
			steps: generation.steps,
			guidance: generation.guidance,
			aspectRatio: "1:1",
			images: [],
			isLoading: true,
			outputFormat: generation.outputFormat,
			batchSize: generation.batchSize,
		};

		setGenerationMap((prev) => ({ ...prev, [prompt_id]: newGeneration }));
		setGenParams((prev) => ({ ...prev, prompt: "" }));

		const requestBody: GenerationRequestParams = {
			prompt: generation.prompt,
			negative_prompt: "",
			true_cfg_scale: 1,
			height: 1024,
			width: 1024,
			steps: generation.steps,
			guidance_scale: generation.guidance,
			output_quality: 100,
			num_images: generation.batchSize,
			output_format: generation.outputFormat,
		};

		start({ generationId: prompt_id, batchSize: generation.batchSize, payload: requestBody });
	};

	// Handle keyboard events for form submission
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Check for cmd+enter (Mac) or ctrl+enter (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				// Only submit if there's prompt text
				if (genParams.prompt.trim()) {
					generateImage(genParams);
				}
			}
		},
		[genParams, generateImage],
	);

	// Global keyboard event handler for cmd+enter / ctrl+enter
	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	const contextValue: ImageGenContextType = {
		genParams,
		setGenParams,
		generationMap,
		generateImage,
		cancelGeneration,
		results,
	};

	return <ImageGenContext.Provider value={contextValue}>{children}</ImageGenContext.Provider>;
}

export function useImageGen() {
	const context = useContext(ImageGenContext);
	if (context === undefined) {
		throw new Error("useImageGen must be used within an ImageGenProvider");
	}
	return context;
}
