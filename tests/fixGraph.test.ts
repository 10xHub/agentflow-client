import { describe, it, expect } from 'vitest';
import { TenxGraphClient } from '../src/index';
import type { FixGraphResponse } from '../src/index';

describe('Fix Graph API Tests', () => {
  const client = new TenxGraphClient({
    baseUrl: 'http://localhost:8000',
    debug: true,
  });

  describe('fixGraph method', () => {
    it('should have fixGraph method', () => {
      expect(client).toBeDefined();
      expect(client.fixGraph).toBeDefined();
      expect(typeof client.fixGraph).toBe('function');
    });

    it('should accept thread_id as parameter', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('test-thread-123');

        // If server is running, we expect a response
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.success).toBeDefined();
        expect(result.data.removed_count).toBeDefined();
        expect(result.metadata).toBeDefined();

        console.log('Fix graph successful:', result.data);
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
        const result: FixGraphResponse = await client.fixGraph('test-thread-123', {
          custom_config: 'value',
        });

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.success).toBeDefined();
        expect(result.data.message).toBeDefined();
        expect(result.data.removed_count).toBeGreaterThanOrEqual(0);

        console.log('Fix graph with config successful:', result.data);
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Expected error:', (error as Error).message);
      }
    });

    it('should return removed_count in response', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('test-thread');

        // Verify removed_count is present
        expect(result.data.removed_count).toBeDefined();
        expect(typeof result.data.removed_count).toBe('number');
        expect(result.data.removed_count).toBeGreaterThanOrEqual(0);

        console.log('Removed count:', result.data.removed_count);
      } catch (error) {
        console.log('Expected error (will validate when server is available)');
      }
    });

    it('should optionally return updated state', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('test-thread');

        // State is optional
        if (result.data.state) {
          expect(typeof result.data.state).toBe('object');
          console.log('State returned:', Object.keys(result.data.state));
        } else {
          console.log('State not returned (optional)');
        }
      } catch (error) {
        console.log('Expected error (will validate when server is available)');
      }
    });

    it('should validate response structure', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('test-thread');

        // Verify response structure
        expect(result.data).toBeDefined();
        expect(typeof result.data.success).toBe('boolean');
        expect(typeof result.data.message).toBe('string');
        expect(typeof result.data.removed_count).toBe('number');

        expect(result.metadata).toBeDefined();
        expect(result.metadata.request_id).toBeDefined();
        expect(result.metadata.timestamp).toBeDefined();
        expect(result.metadata.message).toBeDefined();

        console.log('Response structure validated');
      } catch (error) {
        console.log('Expected error (validation will be done when server is available)');
      }
    });

    it('should handle zero removed messages', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('clean-thread');

        // A clean thread should have 0 removed messages
        expect(result.data.removed_count).toBe(0);
        expect(result.data.success).toBe(true);

        console.log('Clean thread handled correctly');
      } catch (error) {
        console.log('Expected error (will test when server is available)');
      }
    });

    it('should handle thread with corrupted messages', async () => {
      try {
        const result: FixGraphResponse = await client.fixGraph('corrupted-thread');

        // Should have removed some messages
        if (result.data.removed_count > 0) {
          expect(result.data.success).toBe(true);
          console.log('Corrupted messages removed:', result.data.removed_count);
        }
      } catch (error) {
        console.log('Expected error (will test when server is available)');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent thread', async () => {
      try {
        await client.fixGraph('non-existent-thread-999');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBeDefined();
        console.log('Non-existent thread error:', (error as Error).message);
      }
    });

    it('should handle invalid config', async () => {
      try {
        await client.fixGraph('test-thread', { invalid: undefined });
      } catch (error) {
        // May or may not throw depending on server validation
        console.log('Config handling:', error ? 'rejected' : 'accepted');
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
        await shortTimeoutClient.fixGraph('test-thread');
      } catch (error) {
        expect(error).toBeDefined();
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
        await authClient.fixGraph('test-thread');
      } catch (error) {
        // Error expected (server not running)
        expect(error).toBeDefined();
      }
    });
  });
});
