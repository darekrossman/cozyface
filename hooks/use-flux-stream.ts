import { useRef, useState } from "react";
import { updateGeneration } from "@/actions/generations";
import type { GenerationRequestParams } from "@/lib/types";

export interface GenerationResult {
  preview: { id: string; url: string }[];
  urls: { id: string; url: string }[];
  error: string | null;
}

export function useFluxStream({ endpoint }: { endpoint: string }) {
  const [results, setResults] = useState<Record<string, GenerationResult>>({});
  const controllerRef = useRef<AbortController | null>(null);

  const start = async ({ payload }: { payload: GenerationRequestParams }) => {
    controllerRef.current = new AbortController();

    if (!endpoint) {
      throw new Error("endpoint is not set");
    }

    console.log("payload", payload);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(JSON.stringify(result));
      }

      if (!res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const imageIds = Array.from({ length: payload.num_images }).map((_) => crypto.randomUUID());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

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

          if (dataLines.length === 0) {
            continue;
          }

          const msg: {
            type: string;
            images: string[];
            urls: string[];
            message: string;
            step?: number;
          } = JSON.parse(dataLines.join("\n"));

          if (msg.type === "intermediate") {
            updateGeneration(payload.id, {
              images: msg.images.map((img, idx) => ({ id: imageIds[idx], url: img })),
              stepsCompleted: msg.step ?? 0,
            });
          }

          if (msg.type === "complete") {
            updateGeneration(payload.id, {
              images: msg.urls.map((url, idx) => ({ id: imageIds[idx], url })),
              stepsCompleted: payload.steps,
              isLoading: false,
            });
          }

          if (msg.type === "error") {
            updateGeneration(payload.id, {
              error: msg.message,
              isLoading: false,
            });
          }
        }
      }
    } catch (error) {
      updateGeneration(payload.id, {
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
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
