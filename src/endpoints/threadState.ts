import { ResponseMetadata } from './metadata.js';
import { AgentState } from '../agent.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface ThreadStateContext extends RequestContext {}

export interface ThreadStateData {
    state: AgentState;
}

export interface ThreadStateResponse {
    data: ThreadStateData;
    metadata: ResponseMetadata;
}

export async function threadState(
    context: ThreadStateContext,
    threadId: number
): Promise<ThreadStateResponse> {
    try {
        if (context.debug) {
            console.debug(`AgentFlowClient: Fetching thread state for thread ${threadId}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/threads/${threadId}/state`, {
            method: 'GET',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: Thread state fetch failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Thread state fetch failed', '/v1/threads/{thread_id}/state', 'GET');
            throw error;
        }

        const data: ThreadStateResponse = await response.json();

        if (context.debug) {
            console.info(`AgentFlowClient: Thread state fetched successfully for thread ${threadId}`, data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Thread state fetch timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        if (context.debug) {
            console.debug(`AgentFlowClient: Thread state fetch failed:`, error);
        }

        throw error;
    }
}
