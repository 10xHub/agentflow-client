import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface PingContext extends RequestContext {}

export interface PingResponse {
    data: string;
    metadata: ResponseMetadata;
}

export async function ping(context: PingContext): Promise<PingResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Pinging server at', context.baseUrl);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/ping`, {
            method: 'GET',
            headers: buildHeaders(context as RequestContext, {
                'Content-Type': 'application/json',
            }),
            ...getRequestCredentials(context as RequestContext),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: Ping failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Ping request failed', '/ping', 'GET');
            throw error;
        }

        const data: PingResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Ping successful', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Ping failed:', error);
        }

        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Ping timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        console.error('AgentFlowClient: Ping failed:', error);
        throw error;
    }
}