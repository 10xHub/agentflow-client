import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';
import { MemoryResult } from './searchMemory.js';

export interface ListMemoriesContext extends RequestContext {}

export interface ListMemoriesRequest {
    config?: Record<string, any>;
    options?: Record<string, any>;
    limit?: number;
}

export interface ListMemoriesData {
    memories: MemoryResult[];
}

export interface ListMemoriesResponse {
    data: ListMemoriesData;
    metadata: ResponseMetadata;
}

export async function listMemories(
    context: ListMemoriesContext,
    request: ListMemoriesRequest
): Promise<ListMemoriesResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Fetching list of memories', {
                limit: request.limit
            });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/store/memories/list`;

        // Prepare request body
        const body = {
            config: request.config || {},
            options: request.options || {},
            limit: request.limit || 100
        };

        if (context.debug) {
            console.debug('AgentFlowClient: List memories request payload:', JSON.stringify(body, null, 2));
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: List memories failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'List memories request failed', '/v1/memory', 'GET');
            throw error;
        }

        const data: ListMemoriesResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Memories list fetched successfully', {
                count: data.data.memories.length,
                limit: request.limit
            });
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: List memories timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }
        if (context.debug) {
            console.debug('AgentFlowClient: List memories failed:', error);
        }
        throw error;
    }
}
