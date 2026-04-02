import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface StateSchemaContext extends RequestContext {}

/**
 * JSON Schema definition for a field in AgentState
 * Contains type information, description, validation rules, and default values
 */
export interface FieldSchema {
    type?: string | string[];
    description?: string;
    default?: any;
    items?: any;
    properties?: Record<string, FieldSchema>;
    required?: string[];
    enum?: any[];
    $ref?: string;
    $defs?: Record<string, any>;
    anyOf?: any[];
    allOf?: any[];
    oneOf?: any[];
    [key: string]: any;
}

/**
 * Complete JSON Schema for AgentState
 * Describes all available fields, their types, constraints, and meanings
 */
export interface AgentStateSchema {
    title?: string;
    description?: string;
    type?: string;
    properties: Record<string, FieldSchema>;
    required?: string[];
    $defs?: Record<string, any>;
    [key: string]: any;
}

/**
 * Response containing the complete AgentState schema
 * Users can use this to:
 * - Understand field types and structure
 * - Build dynamic forms or validation
 * - Know what fields are available and required
 * - See field descriptions and constraints
 */
export interface StateSchemaResponse {
    data: AgentStateSchema;
    metadata: ResponseMetadata;
}

export async function stateSchema(context: StateSchemaContext): Promise<StateSchemaResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Fetching state schema from', context.baseUrl);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/graph:StateSchema`, {
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
            console.warn(`AgentFlowClient: State schema fetch failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'State schema fetch failed', '/v1/state_schema', 'GET');
            throw error;
        }

        const data: StateSchemaResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: State schema fetch successful', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: State schema fetch failed:', error);
        }

        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: State schema fetch timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        console.error('AgentFlowClient: State schema fetch failed:', error);
        throw error;
    }
}
