"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { createGeneration } from "@/actions/generations";
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
  imageUrls: string[] | undefined;
  setImageUrls: Dispatch<SetStateAction<string[] | undefined>>;
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
    guidance: 2.5,
    cfg: 1,
    steps: 28,
    aspectRatio: "1:1",
    outputFormat: "WEBP",
    batchSize: 4,
    referenceScale: 0.02,
    promptEmbedScale: 1.0,
    pooledPromptEmbedScale: 1.0,
  });

  const [imageUrls, setImageUrls] = useState<string[] | undefined>(undefined);

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
    // create unique id for generation
    const prompt_id = crypto.randomUUID();

    const seed = generation.seed;
    const referenceScale = generation.referenceScale;
    const guidance = generation.guidance;
    const cfg = generation.cfg;
    const promptEmbedScale = generation.promptEmbedScale;
    const pooledPromptEmbedScale = generation.pooledPromptEmbedScale;

    // create new generation object
    const newGeneration: Generation = {
      id: prompt_id,
      userId: user.id,
      prompt: generation.prompt,
      width: imageSizes[generation.aspectRatio as keyof typeof imageSizes][0],
      height: imageSizes[generation.aspectRatio as keyof typeof imageSizes][1],
      steps: generation.steps,
      aspectRatio: generation.aspectRatio,
      imageUrls: generation.imageUrls || imageUrls,
      images: [],
      isLoading: true,
      outputFormat: generation.outputFormat,
      batchSize: generation.batchSize,
      stepsCompleted: 0,
      guidance: guidance,
      cfg: cfg,
      seed: seed,
      referenceScale: referenceScale,
      promptEmbedScale: promptEmbedScale,
      pooledPromptEmbedScale: pooledPromptEmbedScale,
      createdAt: new Date().toISOString(), // this is not sent to db, it just used for sorting optimistically
    };

    // optimistically update the generation map
    setGenerationMap((prev) => ({ ...prev, [prompt_id]: newGeneration }));

    // clear the prompt
    setGenParams((prev) => ({ ...prev, prompt: "" }));
    setImageUrls(undefined);

    // create generation in database
    await createGeneration(newGeneration);

    // create request body
    const payload: GenerationRequestParams = {
      id: prompt_id,
      prompt: newGeneration.prompt,
      negative_prompt: "",
      true_cfg_scale: newGeneration.cfg,
      width: newGeneration.width,
      height: newGeneration.height,
      steps: newGeneration.steps,
      guidance_scale: newGeneration.guidance,
      output_quality: 100,
      num_images: newGeneration.batchSize,
      output_format: newGeneration.outputFormat,
      image_urls: newGeneration.imageUrls || imageUrls,
      seed: newGeneration.seed,
      reference_scale: newGeneration.referenceScale,
      prompt_embed_scale: newGeneration.promptEmbedScale,
      pooled_prompt_embed_scale: newGeneration.pooledPromptEmbedScale,
    };

    // start the generation stream
    start({ payload });
  };

  const contextValue: ImageGenContextType = {
    user,
    genParams,
    setGenParams,
    imageUrls,
    setImageUrls,
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
