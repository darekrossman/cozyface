# ComfyUI TypeScript Client

This directory contains TypeScript implementations of a ComfyUI WebSocket client, converted from the original Python example.

## Files

1. **`comfyui-client.ts`** - Node.js version using the `ws` package for WebSocket support
2. **`comfyui-client-browser.ts`** - Browser-compatible version using native WebSocket API
3. **`components/ComfyUIDemo.tsx`** - React component demonstrating usage in a Next.js app

## Installation

First, install the required dependencies:

```bash
npm install
```

This will install:
- `ws` - WebSocket client for Node.js
- `uuid` - UUID generation
- `node-fetch` - Fetch API for Node.js
- TypeScript type definitions

## Usage

### Browser Version (Recommended for Next.js)

```typescript
import { queuePrompt, getImages, type Prompt } from './comfyui-client-browser';

// Create your prompt object
const prompt: Prompt = {
  // ... your ComfyUI workflow nodes
};

// Connect to WebSocket and get images
const ws = new WebSocket('ws://127.0.0.1:8188/ws?clientId=' + crypto.randomUUID());
ws.onopen = async () => {
  const images = await getImages(ws, prompt);
  ws.close();
  // Process images (they're returned as Blobs)
};
```

### Node.js Version

```typescript
import { queuePrompt, getImages, type Prompt } from './comfyui-client';

// Usage is similar but images are returned as Buffers instead of Blobs
```

### React Component Example

See `components/ComfyUIDemo.tsx` for a complete example of using the client in a React component with:
- User input for prompts
- Seed control
- Loading states
- Error handling
- Image display

## Prerequisites

1. ComfyUI must be running locally on `http://127.0.0.1:8188`
2. The `SaveImageWebsocket` custom node must be installed in ComfyUI
3. The checkpoint file `v1-5-pruned-emaonly.safetensors` should be available

## CORS Issues

If you're running the browser version and encounter CORS issues, you may need to:
1. Configure ComfyUI to allow CORS from your Next.js development server
2. Or use a proxy in your Next.js config

## Differences from Python Version

- TypeScript uses `Buffer` (Node.js) or `Blob` (browser) instead of Python bytes
- UUID generation uses `uuid` package or `crypto.randomUUID()`
- WebSocket handling uses event-based API instead of blocking calls
- Async/await patterns replace Python's synchronous approach
- Type safety with TypeScript interfaces

## Example Workflow

The included example workflow generates a 512x512 image using:
- Stable Diffusion 1.5 checkpoint
- Euler sampler with 20 steps
- CFG scale of 8
- Custom positive and negative prompts