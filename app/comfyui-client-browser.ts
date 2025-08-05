const serverAddress = process.env.NEXT_PUBLIC_COMFYUI_SERVER_ADDRESS;

interface Prompt {
	[key: string]: {
		class_type: string;
		inputs: Record<string, any>;
		_meta?: {
			title: string;
		};
	};
}

interface QueuePromptResponse {
	prompt_id: string;
}

interface Message {
	type: string;
	data: {
		prompt_id?: string;
		node?: string | null;
	};
}

async function queuePrompt(
	prompt: Prompt,
	clientId: string,
): Promise<QueuePromptResponse> {
	const p = { prompt, client_id: clientId };
	const response = await fetch(`http://${serverAddress}/prompt`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(p),
	});
	return (await response.json()) as QueuePromptResponse;
}

async function getImage(
	filename: string,
	subfolder: string,
	folderType: string,
): Promise<Blob> {
	const params = new URLSearchParams({
		filename,
		subfolder,
		type: folderType,
	});
	const response = await fetch(`http://${serverAddress}/view?${params}`);
	return await response.blob();
}

async function getHistory(promptId: string): Promise<any> {
	const response = await fetch(`http://${serverAddress}/history/${promptId}`);
	return await response.json();
}

async function getImages(
	ws: WebSocket,
	prompt: Prompt,
	clientId: string,
): Promise<Record<string, Blob[]>> {
	const { prompt_id } = await queuePrompt(prompt, clientId);

	return new Promise((resolve, reject) => {
		try {
			const outputImages: Record<string, Blob[]> = {};
			let currentNode: string | undefined = "";

			ws.onmessage = async (event: MessageEvent) => {
				if (typeof event.data === "string") {
					const message: Message = JSON.parse(event.data);
					if (message.type === "executing") {
						const messageData = message.data;
						if (messageData.prompt_id && messageData.prompt_id === prompt_id) {
							if (messageData.node === null) {
								// Execution is done
								resolve(outputImages);
							} else {
								currentNode = messageData.node;
							}
						}
					}
				} else if (event.data instanceof Blob) {
					// Check if the current node is a SaveImageWebsocket node by looking at its _meta.title
					if (
						currentNode &&
						prompt[currentNode]?._meta?.title === "SaveImageWebsocket"
					) {
						const imagesOutput = outputImages[currentNode] || [];
						// Skip the first 8 bytes
						const slicedBlob = event.data.slice(8);
						imagesOutput.push(slicedBlob);
						outputImages[currentNode] = imagesOutput;
					}
				} else if (event.data instanceof ArrayBuffer) {
					// Check if the current node is a SaveImageWebsocket node by looking at its _meta.title
					if (
						currentNode &&
						prompt[currentNode]?._meta?.title === "SaveImageWebsocket"
					) {
						const imagesOutput = outputImages[currentNode] || [];
						// Skip the first 8 bytes and convert to Blob
						const slicedBuffer = event.data.slice(8);
						const blob = new Blob([slicedBuffer], { type: "image/png" });
						imagesOutput.push(blob);
						outputImages[currentNode] = imagesOutput;
					}
				}
			};

			ws.onerror = (error) => {
				reject(error);
			};
		} catch (error) {
			reject(error);
		}
	});
}

// Export functions for use in other modules
export {
	queuePrompt,
	getImage,
	getHistory,
	getImages,
	type Prompt,
	type QueuePromptResponse,
};
