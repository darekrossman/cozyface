export interface GenerationParams {
	prompt: string;
	guidance: number;
	steps: number;
	aspectRatio: string;
	outputFormat: string;
	batchSize: number;
}

export interface Generation extends GenerationParams {
	id: string;
	images: { id: string; url: string }[];
	isLoading: boolean;
	error?: string;
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
}
