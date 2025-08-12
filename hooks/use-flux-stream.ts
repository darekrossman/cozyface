import { useRef, useState } from "react";
import type { GenerationRequestParams } from "@/lib/types";

export interface GenerationResult {
	preview: { id: string; url: string }[];
	urls: { id: string; url: string }[];
	error: string | null;
}

export function useFluxStream() {
	const [results, setResults] = useState<Record<string, GenerationResult>>({});
	const controllerRef = useRef<AbortController | null>(null);

	const start = async ({
		generationId,
		batchSize,
		payload,
	}: {
		generationId: string;
		batchSize: number;
		payload: GenerationRequestParams;
	}) => {
		controllerRef.current = new AbortController();

		// Initialize result for this generationId
		setResults((prev) => ({
			...prev,
			[generationId]: {
				preview: [],
				urls: [],
				error: null,
			},
		}));

		if (!process.env.NEXT_PUBLIC_IMAGE_ENDPOINT) {
			throw new Error("NEXT_PUBLIC_IMAGE_ENDPOINT is not set");
		}

		try {
			const res = await fetch(process.env.NEXT_PUBLIC_IMAGE_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				signal: controllerRef.current.signal,
			});
			if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				let idx: number = 0;
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				while ((idx = buffer.indexOf("\n\n")) !== -1) {
					const chunk = buffer.slice(0, idx);
					buffer = buffer.slice(idx + 2);
					const dataLines = chunk
						.split("\n")
						.filter((l) => l.startsWith("data: "))
						.map((l) => l.slice(6));
					if (dataLines.length === 0) continue;
					const msg: { type: string; images: string[]; urls: string[]; message: string } =
						JSON.parse(dataLines.join("\n"));

					const imageIds = Array.from({ length: batchSize }).map((_) => crypto.randomUUID());

					// Update results for this specific generationId
					setResults((prev) => ({
						...prev,
						[generationId]: {
							...prev[generationId],
							...(msg.type === "intermediate" && {
								preview: msg.images.map((img, idx) => ({ id: imageIds[idx], url: img })),
							}),
							...(msg.type === "complete" && {
								urls: msg.urls.map((url, idx) => ({ id: imageIds[idx], url })),
							}),
							...(msg.type === "error" && { error: msg.message }),
						},
					}));
				}
			}
		} catch (error) {
			// Handle errors for this generationId
			setResults((prev) => ({
				...prev,
				[generationId]: {
					...prev[generationId],
					error: error instanceof Error ? error.message : "Unknown error",
				},
			}));
		}
	};

	const cancel = () => controllerRef.current?.abort();

	// Helper function to get results for a specific generationId
	const getResult = (generationId: string): GenerationResult => {
		return results[generationId] || { preview: [], urls: [], error: null };
	};

	// Helper function to clear results for a specific generationId
	const clearResult = (generationId: string) => {
		setResults((prev) => {
			const newResults = { ...prev };
			delete newResults[generationId];
			return newResults;
		});
	};

	return {
		start,
		cancel,
		results,
		getResult,
		clearResult,
	};
}
