import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface StoreMemoryContext extends RequestContext {}

/**
 * Types of memories that can be stored
 */
export enum MemoryType {
    EPISODIC = "episodic",        // Conversation memories
    SEMANTIC = "semantic",         // Facts and knowledge
    PROCEDURAL = "procedural",     // How-to knowledge
    ENTITY = "entity",             // Entity-based memories
    RELATIONSHIP = "relationship", // Entity relationships
    CUSTOM = "custom",             // Custom memory types
    DECLARATIVE = "declarative"    // Explicit facts and events
}

export interface StoreMemoryRequest {
    config?: Record<string, any>;
    options?: Record<string, any>;
    content: string;
    memory_type: MemoryType;
    category: string;
    metadata?: Record<string, any>;
}

export interface StoreMemoryData {
    memory_id: string;
}

export interface StoreMemoryResponse {
    data: StoreMemoryData;
    metadata: ResponseMetadata;
}

export async function storeMemory(
    context: StoreMemoryContext,
    request: StoreMemoryRequest
): Promise<StoreMemoryResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Storing memory with type', request.memory_type);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/store/memories`;

        // Prepare request body
        const body = {
            config: request.config || {},
            options: request.options || {},
            content: request.content,
            memory_type: request.memory_type,
            category: request.category,
            metadata: request.metadata || {}
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: Store memory failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Store memory request failed', '/v1/memory', 'POST');
            throw error;
        }

        const data: StoreMemoryResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Memory stored successfully', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Store memory failed:', error);
        }
        throw error;
    }
}
