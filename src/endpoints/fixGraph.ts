import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface FixGraphContext extends RequestContext {}

export interface FixGraphRequest {
    thread_id: string;
    config?: Record<string, any>;
}

export interface FixGraphResponse {
    data: {
        success: boolean;
        message: string;
        removed_count: number;
        state?: Record<string, any>;
    };
    metadata: ResponseMetadata;
}

/**
 * Fix graph state by removing messages with empty tool calls
 * 
 * This is useful for cleaning up incomplete tool call messages that may have 
 * failed or been interrupted during execution.
 * 
 * @param context - Request context with baseUrl, auth, timeout
 * @param request - Fix request with thread_id and optional config
 * @returns Promise<FixGraphResponse> with fix operation result
 */
export async function fixGraph(
    context: FixGraphContext,
    request: FixGraphRequest
): Promise<FixGraphResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Fixing graph state for thread:', request.thread_id);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/graph/fix`, {
            method: 'POST',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            body: JSON.stringify(request),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: Fix graph failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Fix graph state failed', '/v1/graph/fix', 'POST');
            throw error;
        }

        const data: FixGraphResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Graph state fixed successfully', {
                removed_count: data.data.removed_count,
                success: data.data.success
            });
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Fix graph failed:', error);
        }

        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Fix graph timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        console.error('AgentFlowClient: Fix graph failed:', error);
        throw error;
    }
}
