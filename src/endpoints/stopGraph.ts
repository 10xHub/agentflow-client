import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface StopGraphContext extends RequestContext {}

export interface StopGraphRequest {
    thread_id: string;
    config?: Record<string, any>;
}

export interface StopGraphResponse {
    data: {
        success: boolean;
        message: string;
        thread_id: string;
        stopped_at?: string;
    };
    metadata: ResponseMetadata;
}

/**
 * Stop a running graph execution for a specific thread
 * 
 * @param context - Request context with baseUrl, auth, timeout
 * @param request - Stop request with thread_id and optional config
 * @returns Promise<StopGraphResponse> with stop operation result
 */
export async function stopGraph(
    context: StopGraphContext,
    request: StopGraphRequest
): Promise<StopGraphResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Stopping graph execution for thread:', request.thread_id);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/graph/stop`, {
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
            console.warn(`AgentFlowClient: Stop graph failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Stop graph execution failed', '/v1/graph/stop', 'POST');
            throw error;
        }

        const data: StopGraphResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Graph execution stopped successfully', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Stop graph failed:', error);
        }

        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Stop graph timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        console.error('AgentFlowClient: Stop graph failed:', error);
        throw error;
    }
}
