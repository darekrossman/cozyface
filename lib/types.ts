export interface GenerationParams {
	prompt: string;
	guidance: number;
	steps: number;
	aspectRatio: string;
	outputFormat: string;
	batchSize: number;
	imageUrl?: string;
	seed?: number;
	referenceScale?: number;
	promptEmbedScale?: number;
	pooledPromptEmbedScale?: number;
}

export interface Generation extends GenerationParams {
	id: string;
	userId: string;
	images: { id: string; url: string }[];
	isLoading: boolean;
	error?: string;
	createdAt: string;
	updatedAt?: string;
	stepsCompleted: number;
}

export interface GenerationRequestParams {
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
	image_url?: string;
	seed?: number;
	reference_scale?: number;
	prompt_embed_scale?: number;
	pooled_prompt_embed_scale?: number;
}
