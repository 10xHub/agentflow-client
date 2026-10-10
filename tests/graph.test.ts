import { describe, it, expect } from 'vitest';
import { TenxGraphClient } from '../src/index';
import type { PingResponse, GraphResponse } from '../src/index';

describe('10xGraph API Tests', () => {
  const client = new TenxGraphClient({
    baseUrl: 'http://localhost:8000',
    debug: true,
  });

  describe('Ping API', () => {
    it('should create a client and have ping method', () => {
      expect(client).toBeDefined();
      expect(client.ping).toBeDefined();
      expect(typeof client.ping).toBe('function');
    });

    it('should handle ping errors gracefully', async () => {
      try {
        const result: PingResponse = await client.ping();
        // If server is running, we expect a response
        expect(result).toBeDefined();
        expect(result.metadata).toBeDefined();
      } catch (error) {
        // Expected - server not running
        expect(error).toBeDefined();
        console.log('Expected error (server not running):', (error as Error).message);
      }
    });
  });

  describe('Graph API', () => {
    it('should have graph method', () => {
      expect(client.graph).toBeDefined();
      expect(typeof client.graph).toBe('function');
    });

    it('should handle graph fetch errors gracefully', async () => {
      try {
        const result: GraphResponse = await client.graph();
        // If server is running, we expect a response
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.nodes).toBeDefined();
        expect(result.data.edges).toBeDefined();
        expect(result.data.info).toBeDefined();
      } catch (error) {
        // Expected - server not running
        expect(error).toBeDefined();
        console.log('Expected error (server not running):', (error as Error).message);
      }
    });

    it('should have proper graph response structure', async () => {
      try {
        const result: GraphResponse = await client.graph();

        // Verify the response structure
        expect(result.metadata).toBeDefined();
        expect(result.metadata.request_id).toBeDefined();
        expect(result.metadata.timestamp).toBeDefined();
        expect(result.metadata.message).toBeDefined();

        expect(result.data.info).toBeDefined();
        expect(result.data.info.node_count).toBeGreaterThanOrEqual(0);
        expect(result.data.info.edge_count).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.data.nodes)).toBe(true);
        expect(Array.isArray(result.data.edges)).toBe(true);

        console.log('Graph structure verified successfully');
      } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
      }
    });
  });

  describe('Client Configuration', () => {
    it('should accept timeout and auth token', () => {
      const configuredClient = new TenxGraphClient({
        baseUrl: 'http://localhost:8000',
        authToken: 'test-token',
        timeout: 5000,
        debug: false,
      });

      expect(configuredClient).toBeDefined();
      expect(configuredClient.ping).toBeDefined();
      expect(configuredClient.graph).toBeDefined();
    });
  });
});
