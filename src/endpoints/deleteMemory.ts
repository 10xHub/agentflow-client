import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface DeleteMemoryContext extends RequestContext {}

export interface DeleteMemoryRequest {
    memoryId: string;
    config?: Record<string, any>;
    options?: Record<string, any>;
}

export interface DeleteMemoryData {
    success: boolean;
    data: string;
}

export interface DeleteMemoryResponse {
    data: DeleteMemoryData;
    metadata: ResponseMetadata;
}

export async function deleteMemory(
    context: DeleteMemoryContext,
    request: DeleteMemoryRequest
): Promise<DeleteMemoryResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Deleting memory with ID:', request.memoryId);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/store/memories/${request.memoryId}`;

        // Prepare request body
        const body = {
            config: request.config || {},
            options: request.options || {}
        };

        if (context.debug) {
            console.debug('AgentFlowClient: Delete request payload:', JSON.stringify(body, null, 2));
        }

        const response = await fetch(url, {
            method: 'DELETE',
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
            console.warn(`AgentFlowClient: Delete memory failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Delete memory request failed', '/v1/memory/{memory_id}', 'DELETE');
            throw error;
        }

        const data: DeleteMemoryResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Memory deleted successfully', {
                memory_id: request.memoryId,
                success: data.data.success
            });
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Delete memory timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }
        if (context.debug) {
            console.debug('AgentFlowClient: Delete memory failed:', error);
        }
        throw error;
    }
}
