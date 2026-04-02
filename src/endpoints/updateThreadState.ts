import { ResponseMetadata } from './metadata.js';
import { AgentState } from '../agent.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface UpdateThreadStateContext extends RequestContext {}

export interface UpdateThreadStateRequest {
    config: Record<string, any>;
    state: AgentState;
}

export interface UpdateThreadStateData {
    state: AgentState;
}

export interface UpdateThreadStateResponse {
    data: UpdateThreadStateData;
    metadata: ResponseMetadata;
}

export async function updateThreadState(
    context: UpdateThreadStateContext,
    threadId: number,
    request: UpdateThreadStateRequest
): Promise<UpdateThreadStateResponse> {
    try {
        if (context.debug) {
            console.debug(`AgentFlowClient: Updating thread state for thread ${threadId}`);
            console.debug(`AgentFlowClient: Request payload:`, JSON.stringify(request, null, 2));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/threads/${threadId}/state`, {
            method: 'PUT',
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
            console.warn(`AgentFlowClient: Thread state update failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Thread state update failed', '/v1/threads/{thread_id}/state', 'PUT');
            throw error;
        }

        const data: UpdateThreadStateResponse = await response.json();

        if (context.debug) {
            console.info(`AgentFlowClient: Thread state updated successfully for thread ${threadId}`, data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Thread state update timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        if (context.debug) {
            console.debug(`AgentFlowClient: Thread state update failed:`, error);
        }

        throw error;
    }
}
