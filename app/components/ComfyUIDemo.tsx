"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import workflow from "@/workflows/Nunchaku Flux Krea API.json";
import { getImages, type Prompt } from "../comfyui-client-browser";

export default function ComfyUIDemo() {
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
	const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastExecutionRef = useRef<number>(0);
	const pendingCallRef = useRef(false);

	const throttleTime = 500;

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
			<h1>Image Generator</h1>

			<div style={{ marginBottom: "20px" }}>
				<label>
					Prompt:
					<input
						type="text"
						value={promptText}
						onChange={(e) => setPromptText(e.target.value)}
						style={{
							width: "100%",
							padding: "8px",
							marginTop: "5px",
							fontSize: "16px",
						}}
					/>
				</label>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<label>
					Guidance: {guidance}
					<input
						type="range"
						min="0.1"
						max="20"
						step="0.1"
						value={guidance}
						onChange={(e) => setGuidance(parseFloat(e.target.value))}
						style={{
							width: "100%",
							marginTop: "5px",
						}}
					/>
				</label>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<label>
					Steps:
					<input
						type="number"
						min="1"
						max="60"
						value={steps}
						onChange={(e) => setSteps(parseInt(e.target.value) || 1)}
						style={{
							width: "100%",
							padding: "8px",
							marginTop: "5px",
							fontSize: "16px",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					/>
				</label>
			</div>

			<button
				type="button"
				onClick={generateImage}
				disabled={loading}
				style={{
					padding: "10px 20px",
					fontSize: "16px",
					backgroundColor: loading ? "#ccc" : "#0070f3",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: loading ? "not-allowed" : "pointer",
				}}
			>
				{loading ? "Generating..." : "Generate Image"}
			</button>

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
		</div>
	);
}
