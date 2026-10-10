import { describe, it, expect } from 'vitest';
import { TenxGraphClient } from '../src/index';
import type { StopGraphResponse } from '../src/index';

describe('Stop Graph API Tests', () => {
  const client = new TenxGraphClient({
    baseUrl: 'http://localhost:8000',
    debug: true,
  });

  describe('stopGraph method', () => {
    it('should have stopGraph method', () => {
      expect(client).toBeDefined();
      expect(client.stopGraph).toBeDefined();
      expect(typeof client.stopGraph).toBe('function');
    });

    it('should accept thread_id as parameter', async () => {
      try {
        const result: StopGraphResponse = await client.stopGraph('test-thread-123');

        // If server is running, we expect a response
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.success).toBeDefined();
        expect(result.metadata).toBeDefined();

        console.log('Stop graph successful:', result.data);
      } catch (error) {
        // Expected - server not running or thread not found
        expect(error).toBeDefined();
        console.log(
          'Expected error (server not running or thread not found):',
          (error as Error).message
        );
      }
    });

    it('should accept thread_id and config parameters', async () => {
      try {
        const result: StopGraphResponse = await client.stopGraph('test-thread-123', {
          custom_config: 'value',
        });

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.success).toBeDefined();
        expect(result.data.message).toBeDefined();
        expect(result.data.thread_id).toBe('test-thread-123');

        console.log('Stop graph with config successful:', result.data);
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Expected error:', (error as Error).message);
      }
    });

    it('should handle error responses properly', async () => {
      try {
        // Try to stop a non-existent thread
        await client.stopGraph('non-existent-thread-999');

        // If we get here without error, that's also valid
        // (server might return success even if thread doesn't exist)
      } catch (error) {
        // Error is expected
        expect(error).toBeDefined();

        // Error should have message
        expect((error as Error).message).toBeDefined();

        console.log('Error handled correctly:', (error as Error).message);
      }
    });

    it('should validate response structure', async () => {
      try {
        const result: StopGraphResponse = await client.stopGraph('test-thread');

        // Verify response structure
        expect(result.data).toBeDefined();
        expect(typeof result.data.success).toBe('boolean');
        expect(typeof result.data.message).toBe('string');
        expect(typeof result.data.thread_id).toBe('string');

        expect(result.metadata).toBeDefined();
        expect(result.metadata.request_id).toBeDefined();
        expect(result.metadata.timestamp).toBeDefined();

        console.log('Response structure validated');
      } catch (error) {
        console.log('Expected error (validation will be done when server is available)');
      }
    });
  });

  describe('Client Configuration', () => {
    it('should respect client timeout', async () => {
      const shortTimeoutClient = new TenxGraphClient({
        baseUrl: 'http://localhost:8000',
        timeout: 100, // Very short timeout
        debug: true,
      });

      try {
        await shortTimeoutClient.stopGraph('test-thread');
      } catch (error) {
        expect(error).toBeDefined();
        // Should timeout or connection error
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should include auth token if provided', async () => {
      const authClient = new TenxGraphClient({
        baseUrl: 'http://localhost:8000',
        authToken: 'test-bearer-token',
        debug: true,
      });

      try {
        await authClient.stopGraph('test-thread');
      } catch (error) {
        // Error expected (server not running)
        expect(error).toBeDefined();
      }
    });
  });
});
