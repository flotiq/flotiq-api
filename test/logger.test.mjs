import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const logger = require('../src/logger.js');
const levelSymbol = Symbol.for('level');

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

describe('logger', () => {
  it('uses info level and a single console transport', () => {
    expect(logger.level).toBe('info');
    expect(logger.transports).toHaveLength(1);
    expect(logger.transports[0].name).toBe('console');
  });

  it('formats log lines with timestamp, level and message', () => {
    const transformed = logger.format.transform({
      level: 'info',
      [levelSymbol]: 'info',
      message: 'hello world',
    });

    expect(stripAnsi(transformed[Symbol.for('message')])).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\]:\s+hello world$/
    );
  });
});