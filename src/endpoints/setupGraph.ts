import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface SetupGraphContext extends RequestContext {}

export interface RemoteTool {
    node_name: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
}

export interface SetupGraphRequest {
    tools: RemoteTool[];
}

export interface SetupGraphResponse {
    data: {
        success: boolean;
        message: string;
        registered_tools?: number;
    };
    metadata: ResponseMetadata;
}

/**
 * Setup remote tools on the server for graph execution
 * 
 * This sends tool definitions to the backend so they can be registered
 * and used during graph execution.
 * 
 * @param context - Request context with baseUrl, auth, timeout
 * @param request - Setup request with list of remote tools
 * @returns Promise<SetupGraphResponse> with setup operation result
 */
export async function setupGraph(
    context: SetupGraphContext,
    request: SetupGraphRequest
): Promise<SetupGraphResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Setting up graph with tools:', request.tools.length);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/graph/setup`, {
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
            console.warn(`AgentFlowClient: Setup graph failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Setup graph tools failed', '/v1/graph/setup', 'POST');
            throw error;
        }

        const data: SetupGraphResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Graph setup successful', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Setup graph failed:', error);
        }

        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Setup graph timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        console.error('AgentFlowClient: Setup graph failed:', error);
        throw error;
    }
}
