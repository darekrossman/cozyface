"use client";

import { Send, Settings2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import workflow from "@/workflows/Nunchaku Flux Krea API.json";
import { getImages, type Prompt } from "../app/comfyui-client-browser";

interface Generation {
	id: string;
	prompt: string;
	images: string[];
	isLoading: boolean;
	error?: string;
}

export default function ImageGeneration() {
	const [generations, setGenerations] = useState<Generation[]>([]);
	const [promptText, setPromptText] = useState(
		"Portrait of a cyberpunk cyborg in a dystopian alley",
	);

	const batchSize = 4;

	const [guidance, setGuidance] = useState(2);
	const [steps, setSteps] = useState(28);

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
	const handleTextareaChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setPromptText(e.target.value);
			autoResizeTextarea();
		},
		[autoResizeTextarea],
	);

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
	const handleImageClick = useCallback(
		(generation: Generation, imageIndex: number) => {
			setSelectedGeneration(generation);
			setSelectedImageIndex(imageIndex);
			setDialogOpen(true);
		},
		[],
	);

	const generateImage = useCallback(async () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			setGlobalError("WebSocket is not connected. Please wait for connection.");
			return;
		}

		// Create a new generation with loading state
		const generationId = `gen_${Date.now()}_${Math.random().toString(36).substring(2)}`;
		const newGeneration: Generation = {
			id: generationId,
			prompt: promptText,
			images: [],
			isLoading: true,
		};

		// Prepend the new generation to the list
		setGenerations((prev) => [newGeneration, ...prev]);
		setGlobalError(null);

		const prompt: Prompt = workflow;
		prompt["151"].inputs.t5xxl = promptText;
		prompt["151"].inputs.guidance = guidance;
		prompt["143"].inputs.steps = steps;
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
	}, [promptText, guidance, steps]);

	return (
		<div className="p-5 max-w-4xl mx-auto">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					generateImage();
				}}
			>
				<div className="relative">
					<Textarea
						ref={textareaRef}
						className="min-h-14 resize-none pr-24 pl-4 py-4 w-full"
						value={promptText}
						onChange={handleTextareaChange}
					/>

					<div className="absolute right-2 top-2 flex items-center gap-1">
						<Button type="submit" variant="outline" className="h-10 w-10">
							<Send />
						</Button>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="h-10 w-10">
									<Settings2 />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="end"
								sideOffset={16}
								alignOffset={-8}
								onOpenAutoFocus={(e) => e.preventDefault()}
							>
								<div className="grid grid-cols-2 gap-2">
									<div className="grid w-full items-center gap-3">
										<Label htmlFor="guidance">Guidance</Label>
										<Input
											id="guidance"
											type="number"
											step="0.1"
											value={guidance}
											onChange={(e) => setGuidance(parseFloat(e.target.value))}
										/>
									</div>
									<div className="grid w-full items-center gap-3">
										<Label htmlFor="steps">Steps</Label>
										<Input
											id="steps"
											type="number"
											min="1"
											value={steps}
											onChange={(e) => setSteps(parseInt(e.target.value) || 1)}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{globalError && (
					<div className="mt-5 p-2.5 bg-red-50 text-red-600 rounded">
						Error: {globalError}
					</div>
				)}

				<div className="h-10" />

				{generations.length > 0 && (
					<div className="flex flex-col gap-8">
						{generations.map((generation) => (
							<div key={generation.id}>
								{generation.error && (
									<div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200 mb-4">
										Error: {generation.error}
									</div>
								)}

								<div className="flex flex-col gap-2">
									<div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
										{generation.isLoading
											? Array.from({ length: batchSize }).map((_, index) => (
													<div
														key={`${generation.id}-placeholder-${index}`}
														className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center animate-pulse"
													>
														{/* <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-gray-500 animate-spin" /> */}
													</div>
												))
											: // Show actual images
												generation.images.map((imageUrl, index) => (
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
															className="w-full h-auto aspect-square object-cover rounded-lg shadow-md hover:opacity-90 transition-opacity"
															onLoad={() => {
																// Clean up object URL after image loads
																// URL.revokeObjectURL(imageUrl);
															}}
														/>
													</button>
												))}
									</div>

									<div className="text-sm text-gray-500">
										{generation.prompt}
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Image viewer dialog */}
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
						<DialogHeader>
							<DialogTitle>Image View</DialogTitle>
							<DialogDescription>
								{selectedGeneration?.prompt}
							</DialogDescription>
						</DialogHeader>
						{selectedGeneration?.images[selectedImageIndex] && (
							<div className="flex justify-center items-center max-h-[70vh] overflow-hidden">
								<Image
									src={selectedGeneration.images[selectedImageIndex]}
									alt={`Generated image ${selectedImageIndex + 1} for: ${selectedGeneration.prompt}`}
									width={1024}
									height={1024}
									className="max-w-full max-h-full object-contain rounded-lg"
								/>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</form>
		</div>
	);
}
