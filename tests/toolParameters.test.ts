import { describe, expect, it } from 'vitest';
import { normalizeToolParameters, ToolExecutor } from '../src/tools';

describe('ToolParameter optionality', () => {
  it('fills omitted object-schema fields', () => {
    expect(
      normalizeToolParameters({
        type: 'object',
        properties: { last_chars: { type: 'integer' } },
      })
    ).toEqual({
      type: 'object',
      properties: { last_chars: { type: 'integer' } },
      required: [],
    });
  });

  it('creates an empty object schema when parameters are omitted', () => {
    expect(normalizeToolParameters()).toEqual({
      type: 'object',
      properties: {},
      required: [],
    });
  });

  it('preserves extra JSON Schema keywords', () => {
    expect(
      normalizeToolParameters({
        type: 'object',
        additionalProperties: false,
      })
    ).toEqual({
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });

  it('lets ToolExecutor register a handler without schema metadata', () => {
    const executor = new ToolExecutor();
    executor.registerTool({
      name: 'read_problems',
      handler: async () => [],
    });

    expect(executor.all_tools()[0].function).toEqual({
      name: 'read_problems',
      description: 'Execute read_problems',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    });
  });
});
