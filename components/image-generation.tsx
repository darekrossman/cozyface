"use client";

import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { RotateCcw, Send, Settings2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import workflow from "@/workflows/Nunchaku Flux Krea API.json";
import { getImages, type Prompt } from "../app/comfyui-client-browser";
import { Badge } from "./ui/badge";

interface Generation {
	id: string;
	prompt: string;
	steps: number;
	guidance: number;
	sampler: string;
	scheduler: string;
	images: string[];
	isLoading: boolean;
	error?: string;
}

const samplers = [
	"euler",
	"euler_cfg_pp",
	"euler_ancestral",
	"euler_ancestral_cfg_pp",
	"heun",
	"heunpp2",
	"dpm_2",
	"dpm_2_ancestral",
	"lms",
	"dpm_fast",
	"dpm_adaptive",
	"dpmpp_2s_ancestral",
	"dpmpp_2s_ancestral_cfg_pp",
	"dpmpp_sde",
	"dpmpp_sde_gpu",
	"dpmpp_2m",
	"dpmpp_2m_cfg_pp",
	"dpmpp_2m_sde",
	"dpmpp_2m_sde_gpu",
	"dpmpp_3m_sde",
	"dpmpp_3m_sde_gpu",
	"ddpm",
	"lcm",
	"ipndm",
	"ipndm_v",
	"deis",
	"res_multistep",
	"res_multistep_cfg_pp",
	"res_multistep_ancestral",
	"res_multistep_ancestral_cfg_pp",
	"gradient_estimation",
	"gradient_estimation_cfg_pp",
	"er_sde",
	"seeds_2",
	"seeds_3",
	"sa_solver",
	"sa_solver_pece",
	"ddim",
	"uni_pc",
	"uni_pc_bh2",
	"legacy_rk",
	"rk",
	"rk_beta",
	"deis_3m_ode",
	"deis_2m_ode",
	"deis_3m",
	"deis_2m",
	"res_6s_ode",
	"res_5s_ode",
	"res_3s_ode",
	"res_2s_ode",
	"res_3m_ode",
	"res_2m_ode",
	"res_6s",
	"res_5s",
	"res_3s",
	"res_2s",
	"res_3m",
	"res_2m",
];

const schedulers = [
	"simple",
	"sgm_uniform",
	"karras",
	"exponential",
	"ddim_uniform",
	"beta",
	"normal",
	"linear_quadratic",
	"kl_optimal",
	"bong_tangent",
	"beta57",
];

export default function ImageGeneration() {
	const [generations, setGenerations] = useState<Generation[]>([]);

	const batchSize = 4;

	const [genParams, setGenParams] = useState({
		prompt:
			"A grotesque, dystopian collage, deconstructed and fragmented human forms.",
		guidance: 2,
		steps: 28,
		sampler: "dpmpp_2m",
		scheduler: "beta",
	});

	const [globalError, setGlobalError] = useState<string | null>(null);

	// Dialog state for image viewer
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGeneration, setSelectedGeneration] =
		useState<Generation | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);

	const wsRef = useRef<WebSocket | null>(null);
	const clientIdRef = useRef("comfyui-browser-demo");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-resize textarea function
	const autoResizeTextarea = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, []);

	// Handle textarea change with auto-resize
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setGenParams({ ...genParams, prompt: e.target.value });
		autoResizeTextarea();
	};

	// Auto-resize textarea on mount
	useEffect(() => {
		autoResizeTextarea();
	}, [autoResizeTextarea]);

	// Initialize WebSocket connection
	useEffect(() => {
		const initWebSocket = () => {
			const serverAddress = process.env.NEXT_PUBLIC_COMFYUI_SERVER_ADDRESS;
			const ws = new WebSocket(
				`ws://${serverAddress}/ws?clientId=${clientIdRef.current}`,
			);

			ws.onopen = () => {
				console.log("WebSocket connected");
				setGlobalError(null);
			};

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				setGlobalError(
					"WebSocket connection failed. Make sure ComfyUI is running.",
				);
			};

			ws.onclose = () => {
				console.log("WebSocket disconnected");
				// Attempt to reconnect after 3 seconds
				setTimeout(() => {
					if (wsRef.current?.readyState === WebSocket.CLOSED) {
						initWebSocket();
					}
				}, 3000);
			};

			wsRef.current = ws;
		};

		initWebSocket();

		// Cleanup on unmount
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
			if (throttleTimeoutRef.current) {
				clearTimeout(throttleTimeoutRef.current);
				throttleTimeoutRef.current = null;
			}
		};
	}, []);

	// Handle image click to open dialog
	const handleImageClick = (generation: Generation, imageIndex: number) => {
		setSelectedGeneration(generation);
		setSelectedImageIndex(imageIndex);
		setDialogOpen(true);
	};

	const generateImage = async () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			setGlobalError("WebSocket is not connected. Please wait for connection.");
			return;
		}

		// Create a new generation with loading state
		const generationId = `gen_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		const newGeneration: Generation = {
			id: generationId,
			prompt: genParams.prompt,
			steps: genParams.steps,
			guidance: genParams.guidance,
			sampler: genParams.sampler,
			scheduler: genParams.scheduler,
			images: [],
			isLoading: true,
		};

		// Prepend the new generation to the list
		setGenerations((prev) => [newGeneration, ...prev]);
		setGlobalError(null);

		const prompt: Prompt = workflow;

		prompt["151"].inputs.t5xxl = newGeneration.prompt;
		prompt["151"].inputs.guidance = newGeneration.guidance;

		prompt["143"].inputs.steps = newGeneration.steps;
		prompt["143"].inputs.sampler_name = newGeneration.sampler;
		prompt["143"].inputs.scheduler = newGeneration.scheduler;

		prompt["143"].inputs.seed = Math.floor(Math.random() * 1000000000000000);
		prompt["51"].inputs.batch_size = batchSize;

		try {
			const imageResults = await getImages(
				wsRef.current,
				prompt,
				clientIdRef.current,
			);

			const imageUrls: string[] = [];
			for (const nodeId in imageResults) {
				for (const imageBlob of imageResults[nodeId]) {
					const imageUrl = URL.createObjectURL(imageBlob);
					imageUrls.push(imageUrl);
				}
			}

			// Update the specific generation with the results
			setGenerations((prev) =>
				prev.map((gen) =>
					gen.id === generationId
						? { ...gen, images: imageUrls, isLoading: false }
						: gen,
				),
			);
		} catch (err) {
			// Update the specific generation with error
			setGenerations((prev) =>
				prev.map((gen) =>
					gen.id === generationId
						? {
								...gen,
								isLoading: false,
								error: err instanceof Error ? err.message : "An error occurred",
							}
						: gen,
				),
			);
		}
	};

	return (
		<div className="w-full relative">
			<div className="grid grid-cols-12 gap-4 h-auto sticky px-6 py-4 top-0 z-50">
				<div className="col-span-9">
					<form
						className="w-full"
						onSubmit={(e) => {
							e.preventDefault();
							generateImage();
						}}
					>
						<div className="relative">
							<Textarea
								ref={textareaRef}
								className="min-h-14 resize-none pr-24 pl-4 py-4 w-full dark:bg-card"
								value={genParams.prompt}
								onChange={handleTextareaChange}
							/>

							<div className="absolute right-2 top-2 flex items-center gap-1">
								<Button type="submit" variant="ghost" className="h-10 w-10">
									<Send />
								</Button>

								<Popover>
									<PopoverTrigger asChild>
										<Button variant="ghost" className="h-10 w-10">
											<Settings2 />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										align="end"
										sideOffset={16}
										alignOffset={-8}
										onOpenAutoFocus={(e) => e.preventDefault()}
									>
										<div className="grid grid-cols-2 gap-4">
											<div className="grid w-full items-center gap-1">
												<Label htmlFor="guidance" className="text-xs">
													Guidance
												</Label>
												<Input
													id="guidance"
													type="number"
													step="0.1"
													value={genParams.guidance}
													onChange={(e) =>
														setGenParams({
															...genParams,
															guidance: parseFloat(e.target.value),
														})
													}
												/>
											</div>
											<div className="grid w-full items-center gap-1">
												<Label htmlFor="steps" className="text-xs">
													Steps
												</Label>
												<Input
													id="steps"
													type="number"
													min="1"
													value={genParams.steps}
													onChange={(e) =>
														setGenParams({
															...genParams,
															steps: parseInt(e.target.value) || 1,
														})
													}
												/>
											</div>

											<div className="grid w-full items-center gap-1 col-span-2">
												<Label htmlFor="sampler" className="text-xs">
													Sampler
												</Label>
												<Select
													value={genParams.sampler}
													onValueChange={(value) =>
														setGenParams({ ...genParams, sampler: value })
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select sampler" />
													</SelectTrigger>
													<SelectContent>
														{samplers.map((sampler) => (
															<SelectItem key={sampler} value={sampler}>
																{sampler}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="grid w-full items-center gap-1 col-span-2">
												<Label htmlFor="scheduler" className="text-xs">
													Scheduler
												</Label>
												<Select
													value={genParams.scheduler}
													onValueChange={(value) =>
														setGenParams({ ...genParams, scheduler: value })
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select scheduler" />
													</SelectTrigger>
													<SelectContent>
														{schedulers.map((scheduler) => (
															<SelectItem key={scheduler} value={scheduler}>
																{scheduler}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					</form>
				</div>
				<div className="col-span-3">
					<div className="bg-card h-14 p-4 rounded-sm">
						<h2 className="text-sm font-medium">Settings</h2>
					</div>
				</div>
			</div>

			{globalError && (
				<div className="mt-5 p-2.5 bg-red-50 text-red-600 rounded">
					Error: {globalError}
				</div>
			)}

			<div className="h-10" />

			<div className="pl-2 pr-8">
				{generations.length > 0 && (
					<div className="flex flex-col gap-6">
						{generations.map((generation) => (
							<div key={generation.id}>
								{generation.error && (
									<div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200 mb-4">
										Error: {generation.error}
									</div>
								)}

								<div className="grid grid-cols-16 gap-6">
									<div className="grid gap-2 grid-cols-2 lg:grid-cols-4 col-span-11">
										{generation.isLoading
											? Array.from({ length: batchSize }).map((_, index) => (
													<div
														key={`${generation.id}-placeholder-${index}`}
														className="w-full aspect-square bg-input rounded-sm flex items-center justify-center animate-pulse"
													/>
												))
											: generation.images.map((imageUrl, index) => (
													<button
														key={`${generation.id}-${index}`}
														type="button"
														className="cursor-pointer border-0 p-0 bg-transparent"
														onClick={() => handleImageClick(generation, index)}
														aria-label={`View generated image ${index + 1} in larger size`}
													>
														<Image
															src={imageUrl}
															alt={`Generated image ${index + 1} for: ${generation.prompt}`}
															width={1024}
															height={1024}
															className="w-full h-auto aspect-square object-cover rounded-sm shadow-md hover:opacity-90 transition-opacity"
															onLoad={() => {
																// Clean up object URL after image loads
																// URL.revokeObjectURL(imageUrl);
															}}
														/>
													</button>
												))}
									</div>

									<div className="flex flex-col justify-between gap-6 col-span-5">
										<div className="flex flex-col gap-2">
											<div className="text-xs text-gray-300 leading-5 text-pretty">
												{generation.prompt}
											</div>
											<div className="flex gap-1">
												<Badge variant="secondary" className="opacity-40">
													{generation.sampler} / {generation.scheduler}
												</Badge>
												<Badge variant="secondary" className="opacity-40">
													Steps: {generation.steps}
												</Badge>
												<Badge variant="secondary" className="opacity-40">
													Guidance: {generation.guidance}
												</Badge>
											</div>
										</div>

										<div className="ml-[-8px]">
											<Button
												variant="ghost"
												size="xs"
												className="text-muted-foreground"
											>
												<RotateCcw strokeWidth={1} className="size-[14px]" />
												Rerun
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Image viewer dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="lg:max-w-5xl max-h-[100dvh] overflow-hidden">
					<DialogHeader>
						<VisuallyHidden asChild>
							<DialogTitle>Image View</DialogTitle>
						</VisuallyHidden>
						<VisuallyHidden asChild>
							<DialogDescription>
								{selectedGeneration?.prompt}
							</DialogDescription>
						</VisuallyHidden>
					</DialogHeader>
					{selectedGeneration?.images[selectedImageIndex] && (
						<div className="flex justify-center items-center max-h-[100dvh] overflow-hidden">
							<Image
								src={selectedGeneration.images[selectedImageIndex]}
								alt={`Generated image ${selectedImageIndex + 1} for: ${selectedGeneration.prompt}`}
								width={1024}
								height={1024}
								className="max-w-full max-h-full object-contain rounded-sm"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
