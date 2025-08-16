export interface GenerationParams {
  prompt: string;
  cfg: number;
  guidance: number;
  steps: number;
  aspectRatio: string;
  outputFormat: "PNG" | "JPG" | "WEBP";
  batchSize: number;
  imageUrls?: string[];
  seed?: number;
  referenceScale?: number;
  promptEmbedScale?: number;
  pooledPromptEmbedScale?: number;
}

export interface Generation extends GenerationParams {
  id: string;
  userId: string;
  width: number;
  height: number;
  images: { id: string; url: string }[];
  isLoading: boolean;
  error?: string;
  createdAt: string;
  updatedAt?: string;
  stepsCompleted: number;
}

export interface GenerationRequestParams {
  id: string;
  prompt: string;
  negative_prompt: string;
  true_cfg_scale: number;
  height: number;
  width: number;
  steps: number;
  guidance_scale: number;
  output_quality: number;
  num_images: number;
  output_format: string;
  image_urls?: string[];
  seed?: number;
  reference_scale?: number;
  prompt_embed_scale?: number;
  pooled_prompt_embed_scale?: number;
}
