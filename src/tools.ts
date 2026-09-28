import { Message, RemoteToolCallBlock, ToolResultBlock } from './message.js';

// TOOL HANDLER
export interface ToolHandler {
  (args: any): Promise<any>;
}

/**
 * JSON Schema describing a tool's arguments.
 *
 * `properties` and `required` are optional, matching JSON Schema itself: a tool
 * whose arguments are all optional needs neither, and a tool that takes no
 * arguments can be declared as `{ type: 'object' }`. Additional JSON Schema
 * keywords (`additionalProperties`, `$defs`, ...) are passed through untouched.
 */
export interface ToolParameter {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Fill in the JSON Schema defaults a tool declaration may leave out, so the
 * wire format sent to the server is always a complete object schema.
 */
export function normalizeToolParameters(parameters?: ToolParameter): ToolParameter {
  const source: Partial<ToolParameter> = parameters ?? {};
  const { type, properties, required, ...rest } = source;

  return {
    ...rest,
    type: type ?? 'object',
    properties: properties ?? {},
    required: required ?? [],
  };
}

export interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: ToolParameter;
  };
}

// Tool Registration - what users provide when registering tools
export interface ToolRegistration {
  node?: string;
  name: string;
  description?: string;
  parameters?: ToolParameter;
  handler: ToolHandler;
}

// Internal tool definition (extends handler)
export interface ToolDefinition extends ToolHandler {
  name: string;
  description?: string;
  parameters?: ToolParameter;
  node?: string;
}

export class ToolExecutor {
  private tools: Map<string, ToolDefinition>;
  private toolsByNode: Map<string, Map<string, ToolDefinition>>;

  constructor(tools: ToolDefinition[] = []) {
    this.tools = new Map<string, ToolDefinition>();
    this.toolsByNode = new Map<string, Map<string, ToolDefinition>>();

    for (const func of tools) {
      this.tools.set(func.name, func);

      // Also organize by node if specified
      if (func.node) {
        if (!this.toolsByNode.has(func.node)) {
          this.toolsByNode.set(func.node, new Map());
        }
        this.toolsByNode.get(func.node)!.set(func.name, func);
      }
    }
  }

  /**
   * Register a new tool
   */
  registerTool(registration: ToolRegistration): void {
    // Create a proper ToolDefinition by wrapping the handler
    const toolDef: ToolDefinition = async (args: any) => {
      return registration.handler(args);
    };

    // Use Object.defineProperty to add properties to the function
    Object.defineProperty(toolDef, 'name', {
      value: registration.name,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(toolDef, 'description', {
      value: registration.description,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(toolDef, 'parameters', {
      value: registration.parameters,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(toolDef, 'node', {
      value: registration.node,
      writable: true,
      configurable: true,
    });

    this.tools.set(registration.name, toolDef);

    // Organize by node
    if (registration.node) {
      if (!this.toolsByNode.has(registration.node)) {
        this.toolsByNode.set(registration.node, new Map());
      }
      this.toolsByNode.get(registration.node)!.set(registration.name, toolDef);
    }
  }

  /**
   * Get tools for a specific node
   */
  getToolsForNode(node: string): ToolDefinition[] {
    const nodeTools = this.toolsByNode.get(node);
    return nodeTools ? Array.from(nodeTools.values()) : [];
  }

  /**
   * Get all tools in OpenAI-compatible format
   */
  all_tools(): Tool[] {
    const openaiTools: Tool[] = [];

    for (const [name, func] of this.tools) {
      const tool: Tool = {
        type: 'function',
        function: {
          name: name,
          description: func.description || `Execute ${name}`,
          parameters: normalizeToolParameters(func.parameters),
        },
      };
      openaiTools.push(tool);
    }

    return openaiTools;
  }

  /**
   * Extract and execute all tool calls from the response
   * Returns an array of tool result messages
   */
  async executeToolCalls(messages: Message[]): Promise<Message[]> {
    const toolCalls: RemoteToolCallBlock[] = [];

    // Extract all remote_tool_call blocks from messages
    for (const msg of messages) {
      if (msg.content) {
        for (const block of msg.content) {
          if (block.type === 'remote_tool_call') {
            toolCalls.push(block as RemoteToolCallBlock);
          }
        }
      }
    }

    const results: Message[] = [];

    // Execute each tool call
    for (const call of toolCalls) {
      const toolName = call.name;

      if (this.tools.has(toolName)) {
        const tool = this.tools.get(toolName)!;

        try {
          // Execute the tool
          const result = await tool(call.args);

          // Create a tool result message
          const toolResultBlock = new ToolResultBlock({
            call_id: call.id,
            output: result,
            status: 'completed',
            is_error: false,
          });

          results.push(Message.tool_message([toolResultBlock]));
        } catch (error) {
          // Handle errors
          const errorMessage = error instanceof Error ? error.message : String(error);

          const toolResultBlock = new ToolResultBlock({
            call_id: call.id,
            output: { error: errorMessage },
            status: 'failed',
            is_error: true,
          });

          results.push(Message.tool_message([toolResultBlock]));
        }
      } else {
        // Tool not found error
        const toolResultBlock = new ToolResultBlock({
          call_id: call.id,
          output: { error: `Tool '${toolName}' not found` },
          status: 'failed',
          is_error: true,
        });

        results.push(Message.tool_message([toolResultBlock]));
      }
    }

    return results;
  }
}
