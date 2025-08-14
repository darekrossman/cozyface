"use client";

import type { User } from "@supabase/supabase-js";
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
import { createGeneration, updateGeneration } from "@/actions/generations";
import { type GenerationResult, useFluxStream } from "@/hooks/use-flux-stream";
import { imageSizes } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Generation, GenerationParams, GenerationRequestParams } from "@/lib/types";
import { keysToCamelCase } from "@/lib/utils";

interface ImageGenContextType {
	user: User;
	genParams: GenerationParams;
	results: Record<string, GenerationResult>;
	generationMap: Record<string, Generation>;
	setGenParams: Dispatch<SetStateAction<GenerationParams>>;
	generateImage: (params: GenerationParams) => void;
	cancelGeneration: () => void;
}

const ImageGenContext = createContext<ImageGenContextType | undefined>(undefined);

interface ImageGenProviderProps {
	user: User;
	userGenerations: Generation[];
	children: ReactNode;
}

export function ImageGenProvider({ user, children, userGenerations }: ImageGenProviderProps) {
	const {
		start,
		results,
		cancel: cancelGeneration,
	} = useFluxStream({
		endpoint: "https://darekrossman--flux-ip-adapter-fluxservice-inference-stream-dev.modal.run",
	});
	const [generationMap, setGenerationMap] = useState<Record<string, Generation>>({});
	const [genParams, setGenParams] = useState<GenerationParams>({
		prompt: "",
		guidance: 2,
		steps: 28,
		aspectRatio: "1:1",
		outputFormat: "WEBP",
		batchSize: 4,
		referenceScale: 0.02,
		promptEmbedScale: 1.0,
		pooledPromptEmbedScale: 1.0,
		imageUrl:
			"https://pub-bd5078e35a584a9aa20c6f636882775c.r2.dev/FLUX%201%20Text%20to%20Image.jpeg",
	});

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("generation_changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "generations",
				},
				(payload: any) => {
					if (payload.eventType === "UPDATE") {
						setGenerationMap((prev) => ({
							...prev,
							[payload.new.id]: {
								...prev[payload.new.id],
								...keysToCamelCase(payload.new),
							},
						}));
					}
					if (payload.eventType === "DELETE") {
						setGenerationMap((prev) => {
							const { [payload.old.id]: _, ...rest } = prev;
							return rest;
						});
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	useEffect(() => {
		setGenerationMap(
			userGenerations.reduce(
				(acc, generation) => {
					acc[generation.id] = generation;
					return acc;
				},
				{} as Record<string, Generation>,
			),
		);
	}, [userGenerations]);

	const generateImage = async (generation: GenerationParams) => {
		console.log("generation", generation);
		// create unique id for generation
		const prompt_id = crypto.randomUUID();

		// create new generation object
		const newGeneration: Generation = {
			id: prompt_id,
			userId: user.id,
			prompt: generation.prompt,
			steps: generation.steps,
			guidance: generation.guidance,
			aspectRatio: generation.aspectRatio,
			imageUrl: generation.imageUrl,
			images: [],
			isLoading: true,
			outputFormat: generation.outputFormat,
			batchSize: generation.batchSize,
			seed: generation.seed ?? Math.floor(Math.random() * 1000000),
			stepsCompleted: 0,
			referenceScale: generation.referenceScale,
			promptEmbedScale: generation.promptEmbedScale,
			pooledPromptEmbedScale: generation.pooledPromptEmbedScale,
			createdAt: new Date().toISOString(), // this is not sent to db, it just used for sorting optimistically
		};

		// optimistically update the generation map
		setGenerationMap((prev) => ({ ...prev, [prompt_id]: newGeneration }));

		// clear the prompt
		setGenParams((prev) => ({ ...prev, prompt: "" }));

		// create generation in database
		await createGeneration(newGeneration);

		// create request body
		const requestBody: GenerationRequestParams = {
			prompt: generation.prompt,
			negative_prompt: "",
			true_cfg_scale: 4,
			width: imageSizes[generation.aspectRatio as keyof typeof imageSizes][0],
			height: imageSizes[generation.aspectRatio as keyof typeof imageSizes][1],
			steps: generation.steps,
			guidance_scale: generation.guidance,
			output_quality: 100,
			num_images: generation.batchSize,
			output_format: generation.outputFormat,
			image_url: generation.imageUrl,
			seed: generation.seed,
			reference_scale: generation.referenceScale,
			prompt_embed_scale: generation.promptEmbedScale,
			pooled_prompt_embed_scale: generation.pooledPromptEmbedScale,
		};

		// start the generation stream
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
		user,
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
