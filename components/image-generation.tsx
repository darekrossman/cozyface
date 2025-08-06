"use client";

import { Loader2Icon, Send, Settings2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import workflow from "@/workflows/Nunchaku Flux Krea API.json";
import { getImages, type Prompt } from "../app/comfyui-client-browser";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
	const [batchSize, setBatchSize] = useState(2);
	const [guidance, setGuidance] = useState(2);
	const [steps, setSteps] = useState(28);

	const [globalError, setGlobalError] = useState<string | null>(null);

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
	}, [promptText, guidance, steps, batchSize]);

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
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
								<div className="flex gap-2">
									<div className="grid w-full max-w-sm items-center gap-3 flex-1">
										<Label htmlFor="guidance">Guidance</Label>
										<Input
											id="guidance"
											value={guidance}
											onChange={(e) => setGuidance(parseFloat(e.target.value))}
										/>
									</div>
									<div className="grid w-full max-w-sm items-center gap-3 flex-1">
										<Label htmlFor="steps">Steps</Label>
										<Input
											id="steps"
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
					<div
						style={{
							marginTop: "20px",
							padding: "10px",
							backgroundColor: "#fee",
							color: "#c00",
							borderRadius: "5px",
						}}
					>
						Error: {globalError}
					</div>
				)}

				<div className="h-10" />

				{generations.length > 0 && (
					<div className="flex flex-col gap-4">
						{generations.map((generation) => (
							<Card key={generation.id} className="p-4">
								{generation.error && (
									<div
										style={{
											fontSize: "14px",
											color: "#dc2626",
											padding: "8px",
											backgroundColor: "#fef2f2",
											borderRadius: "4px",
											border: "1px solid #fecaca",
										}}
									>
										Error: {generation.error}
									</div>
								)}

								<div className="grid grid-cols-2 gap-4">
									{generation.isLoading
										? Array.from({ length: batchSize }).map((_, index) => (
												<div
													key={`${generation.id}-placeholder-${index}`}
													style={{
														width: "100%",
														aspectRatio: "1",
														backgroundColor: "#e5e7eb",
														borderRadius: "8px",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														animation:
															"pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
													}}
												>
													<div
														style={{
															width: "40px",
															height: "40px",
															borderRadius: "50%",
															border: "3px solid #f3f4f6",
															borderTopColor: "#6b7280",
															animation: "spin 1s linear infinite",
														}}
													/>
												</div>
											))
										: // Show actual images
											generation.images.map((imageUrl, index) => (
												<Image
													key={`${generation.id}-${index}`}
													src={imageUrl}
													alt={`Generated image ${index + 1} for: ${generation.prompt}`}
													width={1024}
													height={1024}
													style={{
														width: "100%",
														height: "auto",
														aspectRatio: "1",
														objectFit: "cover",
														borderRadius: "8px",
														boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
													}}
													onLoad={() => {
														// Clean up object URL after image loads
														// URL.revokeObjectURL(imageUrl);
													}}
												/>
											))}
								</div>
							</Card>
						))}
					</div>
				)}
			</form>
		</div>
	);
}
