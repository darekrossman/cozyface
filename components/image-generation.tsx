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
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ImageGeneration() {
	const [images, setImages] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [promptText, setPromptText] = useState(
		"Portrait of a cyberpunk cyborg in a dystopian alley",
	);
	const [guidance, setGuidance] = useState(2);
	const [steps, setSteps] = useState(28);
	const [connected, setConnected] = useState(false);

	const wsRef = useRef<WebSocket | null>(null);
	const clientIdRef = useRef("comfyui-browser-demo");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastExecutionRef = useRef<number>(0);
	const pendingCallRef = useRef(false);

	const throttleTime = 500;

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
				setConnected(true);
				setError(null);
			};

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				setError("WebSocket connection failed. Make sure ComfyUI is running.");
				setConnected(false);
			};

			ws.onclose = () => {
				console.log("WebSocket disconnected");
				setConnected(false);
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
			setError("WebSocket is not connected. Please wait for connection.");
			return;
		}

		setLoading(true);
		setError(null);
		// setImages([]);

		const prompt: Prompt = workflow;
		prompt["151"].inputs.t5xxl = promptText;
		prompt["151"].inputs.guidance = guidance;
		prompt["143"].inputs.steps = steps;
		prompt["143"].inputs.seed = Math.floor(Math.random() * 1000000000000000);

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
			setImages(imageUrls);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, [promptText, guidance, steps]);

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
			<form>
				<div className="relative">
					<Textarea
						ref={textareaRef}
						className="min-h-14 resize-none pr-24 pl-4 py-4 w-full"
						value={promptText}
						onChange={handleTextareaChange}
					/>

					<div className="absolute right-2 top-2 flex items-center gap-1">
						<Button
							type="submit"
							onClick={generateImage}
							disabled={loading}
							variant="outline"
							className="h-10 w108"
						>
							{!loading ? <Send /> : <Loader2Icon className="animate-spin" />}
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

				{error && (
					<div
						style={{
							marginTop: "20px",
							padding: "10px",
							backgroundColor: "#fee",
							color: "#c00",
							borderRadius: "5px",
						}}
					>
						Error: {error}
					</div>
				)}

				{images.length > 0 && (
					<div style={{ marginTop: "20px" }}>
						<h2>Generated Images:</h2>
						<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
							{images.map((imageUrl, index) => (
								<Image
									key={imageUrl}
									src={imageUrl}
									alt={`Generated image ${index + 1}`}
									width={1024}
									height={1024}
									style={{
										maxWidth: "100%",
										borderRadius: "8px",
										boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
									}}
									onLoad={() => {
										// Clean up object URL after image loads
										URL.revokeObjectURL(imageUrl);
									}}
								/>
							))}
						</div>
					</div>
				)}
			</form>
		</div>
	);
}
