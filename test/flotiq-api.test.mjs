import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlotiqApi from '../src/flotiq-api.js';

const mockMiddleware = {
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  request: vi.fn(),
};

beforeEach(() => {
  vi.restoreAllMocks();

  Object.values(mockMiddleware).forEach((mockFn) => {
    mockFn.mockReset();
  });
});

describe('FlotiqApi', () => {
  it('exposes default and named exports via package entrypoint', async () => {
    const entrypoint = await import('../src/index.js');

    expect(typeof entrypoint.default).toBe('function');
    expect(typeof entrypoint.getFlotiqApi).toBe('function');
  });

  it('configures axios middleware with API url, headers and timeout', () => {
    const api = new FlotiqApi('https://api.example.com/api', 'secret-token');

    expect(api.headers).toEqual({
      'Content-type': 'application/json;charset=utf-8',
      'X-Auth-Token': 'secret-token',
      'x-mode': 'preview',
    });
    expect(api.middleware.defaults).toMatchObject({
      baseURL: 'https://api.example.com/api',
      timeout: 60000,
      headers: api.headers,
    });
  });

  it('paginates fetchContentObjects and respects the requested limit', async () => {
    const api = new FlotiqApi('https://api.example.com/api', 'secret-token', {
      batchSizeRead: 2,
    });
    api.middleware = mockMiddleware;

    mockMiddleware.get
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }, { id: 2 }] },
      })
      .mockResolvedValueOnce({
        data: { data: [{ id: 3 }, { id: 4 }] },
      });

    const result = await api.fetchContentObjects(
      'article',
      1,
      3,
      { field: 'title', direction: 'desc' },
      { status: { type: 'equals', filter: 'published' } }
    );

    expect(mockMiddleware.get).toHaveBeenNthCalledWith(
      1,
      '/content/article?page=1&limit=2&hydrate=1&filters=%7B%22status%22%3A%7B%22type%22%3A%22equals%22%2C%22filter%22%3A%22published%22%7D%7D&order_by=title&order_direction=desc'
    );
    expect(mockMiddleware.get).toHaveBeenNthCalledWith(
      2,
      '/content/article?page=2&limit=2&hydrate=1&filters=%7B%22status%22%3A%7B%22type%22%3A%22equals%22%2C%22filter%22%3A%22published%22%7D%7D&order_by=title&order_direction=desc'
    );
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('returns cached media metadata without downloading the file again', async () => {
    const api = new FlotiqApi('https://api.example.com/api', 'secret-token');
    const cachedMedia = { id: 'media-1' };
    const axiosGet = vi.spyOn(axios, 'get');

    const result = await api.uploadMediaFromUrl(
      {
        fileName: 'logo.png',
        mime_type: 'image/png',
        url: 'https://cdn.example.com/logo.png',
      },
      {
        'logo.png': cachedMedia,
      }
    );

    expect(result).toBe(cachedMedia);
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it('downloads remote media and forwards multipart data to uploadMedia', async () => {
    const api = new FlotiqApi('https://api.example.com/api', 'secret-token');

    const axiosGet = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: Buffer.from('file-bytes'),
    });

    const uploadMedia = vi
      .spyOn(api, 'uploadMedia')
      .mockResolvedValue({ id: 'media-2' });

    const result = await api.uploadMediaFromUrl({
      fileName: 'photo.png',
      mime_type: 'image/png',
      url: 'https://cdn.example.com/photo with space.png',
    });

    expect(axiosGet).toHaveBeenCalledWith(
      'https://cdn.example.com/photo%20with%20space.png',
      { responseType: 'arraybuffer' }
    );
    expect(uploadMedia).toHaveBeenCalledTimes(1);
    expect(uploadMedia.mock.calls[0][0]._streams.join('')).toContain('name="type"');
    expect(uploadMedia.mock.calls[0][0]._streams.join('')).toContain('image');
    expect(result).toEqual({ id: 'media-2' });
  });

  it('caches getFlotiqApi instances by connection details and options', async () => {
    vi.resetModules();
    const { getFlotiqApi } = await import('../src/flotiq-api.js');

    const first = getFlotiqApi(
      'https://api.example.com/api',
      'secret-token',
      { batchSize: 25 }
    );
    const second = getFlotiqApi(
      'https://api.example.com/api',
      'secret-token',
      { batchSize: 25 }
    );
    const third = getFlotiqApi(
      'https://api.example.com/api',
      'secret-token',
      { batchSize: 50 }
    );

    expect(first).toBe(second);
    expect(third).not.toBe(first);
  });
});