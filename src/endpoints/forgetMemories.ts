import { ResponseMetadata } from './metadata.js';
import { MemoryType } from './storeMemory.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface ForgetMemoriesContext extends RequestContext {}

export interface ForgetMemoriesRequest {
    config?: Record<string, any>;
    options?: Record<string, any>;
    memory_type?: MemoryType;
    category?: string;
    filters?: Record<string, any>;
}

export interface ForgetMemoriesData {
    success: boolean;
    data: Record<string, any>;
}

export interface ForgetMemoriesResponse {
    data: ForgetMemoriesData;
    metadata: ResponseMetadata;
}

export async function forgetMemories(
    context: ForgetMemoriesContext,
    request: ForgetMemoriesRequest
): Promise<ForgetMemoriesResponse> {
    try {
        const url = `${context.baseUrl}/v1/store/memories/forget`;

        // Prepare request body - only include optional fields if provided
        const body: Record<string, any> = {};
        
        if (request.config) {
            body.config = request.config;
        }
        if (request.options) {
            body.options = request.options;
        }
        if (request.memory_type) {
            body.memory_type = request.memory_type;
        }
        if (request.category) {
            body.category = request.category;
        }
        if (request.filters) {
            body.filters = request.filters;
        }

        if (context.debug) {
            console.log('[DEBUG] Forget memories request:', body);
        }

        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;

        if (context.timeout > 0) {
            timeoutId = setTimeout(() => controller.abort(), context.timeout);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            body: JSON.stringify(body),
            ...(context.timeout > 0 && { signal: controller.signal })
        });

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            throw new Error(`Forget memories failed: ${response.status} ${response.statusText}`);
        }

        const data: ForgetMemoriesResponse = await response.json();

        if (context.debug) {
            console.log('[DEBUG] Forget memories response:', data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            throw error;
        }
        throw error;
    }
}
