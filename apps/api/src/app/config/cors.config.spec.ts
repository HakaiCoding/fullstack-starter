import { buildCorsConfig, parseCorsAllowedOrigins } from './cors.config';

describe('cors.config', () => {
  describe('parseCorsAllowedOrigins', () => {
    it('parses a single origin', () => {
      expect(parseCorsAllowedOrigins('http://localhost:4200')).toEqual([
        'http://localhost:4200',
      ]);
    });

    it('normalizes and dedupes multiple origins', () => {
      expect(
        parseCorsAllowedOrigins(
          ' https://example.com/path , http://localhost:4200/ , https://example.com ',
        ),
      ).toEqual(['https://example.com', 'http://localhost:4200']);
    });

    it('throws for malformed origins', () => {
      expect(() => parseCorsAllowedOrigins('not-a-url')).toThrow(
        /Expected a valid http\/https origin/,
      );
    });

    it('throws for non-http protocols', () => {
      expect(() => parseCorsAllowedOrigins('ftp://example.com')).toThrow(
        /Only http and https origins are supported/,
      );
    });
  });

  describe('buildCorsConfig', () => {
    it('sets credentials to true and parses allowlist', () => {
      expect(
        buildCorsConfig({
          API_CORS_ALLOWED_ORIGINS: 'http://localhost:4200,https://example.com',
        }),
      ).toEqual({
        allowedOrigins: ['http://localhost:4200', 'https://example.com'],
        credentials: true,
      });
    });
  });
});
