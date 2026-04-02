import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    MediaRef,
    TextBlock,
    ImageBlock,
    AudioBlock,
    VideoBlock,
    DocumentBlock,
    Message
} from '../src/message';

// ---------------------------------------------------------------------------
// Sprint 5.3: Message multimodal helpers
// ---------------------------------------------------------------------------
describe('Message Multimodal Helpers', () => {
    describe('Message.withImage', () => {
        it('should create message with text and image URL', () => {
            const msg = Message.withImage('Describe this', 'https://example.com/photo.jpg');
            expect(msg.role).toBe('user');
            expect(msg.content).toHaveLength(2);
            expect(msg.content[0].type).toBe('text');
            expect((msg.content[0] as TextBlock).text).toBe('Describe this');
            expect(msg.content[1].type).toBe('image');
            expect((msg.content[1] as ImageBlock).media.kind).toBe('url');
            expect((msg.content[1] as ImageBlock).media.url).toBe('https://example.com/photo.jpg');
        });

        it('should accept custom role', () => {
            const msg = Message.withImage('Img', 'https://example.com/img.jpg', 'assistant');
            expect(msg.role).toBe('assistant');
        });

        it('should work with data URL (base64)', () => {
            const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
            const msg = Message.withImage('Analyze', dataUrl);
            expect((msg.content[1] as ImageBlock).media.url).toBe(dataUrl);
        });
    });

    describe('Message.withFile', () => {
        it('should create message with text and document for PDF', () => {
            const msg = Message.withFile('Summarize', 'file-abc', 'application/pdf');
            expect(msg.content).toHaveLength(2);
            expect(msg.content[0].type).toBe('text');
            expect(msg.content[1].type).toBe('document');
            expect((msg.content[1] as DocumentBlock).media.kind).toBe('file_id');
            expect((msg.content[1] as DocumentBlock).media.file_id).toBe('file-abc');
        });

        it('should create ImageBlock for image file', () => {
            const msg = Message.withFile('Look', 'file-img', 'image/jpeg');
            expect(msg.content[1].type).toBe('image');
            expect((msg.content[1] as ImageBlock).media.file_id).toBe('file-img');
        });

        it('should create AudioBlock for audio file', () => {
            const msg = Message.withFile('Listen', 'file-audio', 'audio/wav');
            expect(msg.content[1].type).toBe('audio');
            expect((msg.content[1] as AudioBlock).media.file_id).toBe('file-audio');
        });

        it('should create VideoBlock for video file', () => {
            const msg = Message.withFile('Watch', 'file-video', 'video/mp4');
            expect(msg.content[1].type).toBe('video');
            expect((msg.content[1] as VideoBlock).media.file_id).toBe('file-video');
        });

        it('should default to DocumentBlock for unknown mime', () => {
            const msg = Message.withFile('Read', 'file-bin');
            expect(msg.content[1].type).toBe('document');
        });
    });

    describe('Message.multimodal', () => {
        it('should create message with arbitrary blocks', () => {
            const blocks = [
                new TextBlock('Look at these'),
                new ImageBlock(new MediaRef('url', 'https://a.com/1.jpg')),
                new ImageBlock(new MediaRef('url', 'https://a.com/2.jpg')),
            ];
            const msg = Message.multimodal(blocks);
            expect(msg.role).toBe('user');
            expect(msg.content).toHaveLength(3);
            expect(msg.content[0].type).toBe('text');
            expect(msg.content[1].type).toBe('image');
            expect(msg.content[2].type).toBe('image');
        });

        it('should accept custom role', () => {
            const msg = Message.multimodal([new TextBlock('test')], 'system');
            expect(msg.role).toBe('system');
        });
    });
});

// ---------------------------------------------------------------------------
// Sprint 5.2: File upload endpoint types
// ---------------------------------------------------------------------------
describe('File Endpoint Types', () => {
    it('should import file endpoint types without error', async () => {
        const mod = await import('../src/endpoints/files');
        expect(mod.uploadFile).toBeDefined();
        expect(mod.getFile).toBeDefined();
        expect(mod.getFileInfo).toBeDefined();
        expect(mod.getFileAccessUrl).toBeDefined();
        expect(mod.getMultimodalConfig).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Sprint 5.2: Client file methods
// ---------------------------------------------------------------------------
describe('AgentFlowClient file methods', () => {
    it('should have uploadFile method', async () => {
        const { AgentFlowClient } = await import('../src/client');
        const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
        expect(typeof client.uploadFile).toBe('function');
    });

    it('should have getFile method', async () => {
        const { AgentFlowClient } = await import('../src/client');
        const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
        expect(typeof client.getFile).toBe('function');
    });

    it('should have getFileInfo method', async () => {
        const { AgentFlowClient } = await import('../src/client');
        const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
        expect(typeof client.getFileInfo).toBe('function');
    });

    it('should have getFileAccessUrl method', async () => {
        const { AgentFlowClient } = await import('../src/client');
        const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
        expect(typeof client.getFileAccessUrl).toBe('function');
    });

    it('should have getMultimodalConfig method', async () => {
        const { AgentFlowClient } = await import('../src/client');
        const client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
        expect(typeof client.getMultimodalConfig).toBe('function');
    });
});

// ---------------------------------------------------------------------------
// Upload with mocked fetch
// ---------------------------------------------------------------------------
describe('uploadFile with mocked fetch', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should call /v1/files/upload with FormData', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                data: {
                    file_id: 'abc123',
                    mime_type: 'image/png',
                    size_bytes: 1024,
                    filename: 'test.png',
                    extracted_text: null,
                    url: '/v1/files/abc123',
                    direct_url: 'https://signed.example.com/abc123',
                    direct_url_expires_at: 1712000000,
                },
            }),
        };
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse) as any;

        const { uploadFile } = await import('../src/endpoints/files');
        const result = await uploadFile(
            { baseUrl: 'http://localhost:8000', timeout: 5000, debug: false },
            new Blob(['fake image'], { type: 'image/png' })
        );

        expect(globalThis.fetch).toHaveBeenCalledOnce();
        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe('http://localhost:8000/v1/files/upload');
        expect(callArgs[1].method).toBe('POST');
        expect(result.data.file_id).toBe('abc123');
        expect(result.data.direct_url).toBe('https://signed.example.com/abc123');

        globalThis.fetch = originalFetch;
    });

    it('should include auth header when token provided', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ data: { file_id: 'x' } }),
        };
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse) as any;

        const { uploadFile } = await import('../src/endpoints/files');
        await uploadFile(
            { baseUrl: 'http://localhost', authToken: 'my-token', timeout: 5000, debug: false },
            new Blob(['data'])
        );

        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[1].headers.Authorization).toBe('Bearer my-token');

        globalThis.fetch = originalFetch;
    });

    it('should call /v1/files/{file_id}/url for access URL lookup', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                data: {
                    file_id: 'abc123',
                    url: 'https://signed.example.com/abc123',
                    expires_at: 1712000000,
                    mime_type: 'image/png',
                },
            }),
        };
        globalThis.fetch = vi.fn().mockResolvedValue(mockResponse) as any;

        const { getFileAccessUrl } = await import('../src/endpoints/files');
        const result = await getFileAccessUrl(
            { baseUrl: 'http://localhost:8000', timeout: 5000, debug: false },
            'abc123'
        );

        expect(globalThis.fetch).toHaveBeenCalledOnce();
        const callArgs = (globalThis.fetch as any).mock.calls[0];
        expect(callArgs[0]).toBe('http://localhost:8000/v1/files/abc123/url');
        expect(callArgs[1].method).toBe('GET');
        expect(result.data.url).toBe('https://signed.example.com/abc123');

        globalThis.fetch = originalFetch;
    });
});
