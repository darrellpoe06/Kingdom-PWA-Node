import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// Initialize the message handler to connect the Web Worker to the main app thread
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
    handler.onmessage(msg);
};
