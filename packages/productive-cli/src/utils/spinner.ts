/**
 * Simple spinner implementation using native Node.js
 * Provides loading indicator without external dependencies
 */

import { WriteStream } from 'node:tty';
import { colors } from './colors.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  private frame = 0;
  private interval?: NodeJS.Timeout;
  private text: string;
  private stream: WriteStream;
  private enabled: boolean;

  constructor(text: string = 'Loading...') {
    this.text = text;
    this.stream = process.stderr as WriteStream;
    this.enabled = this.stream.isTTY && process.env.CI === undefined;
  }

  start(): this {
    if (!this.enabled) return this;

    this.frame = 0;
    this.render();
    
    this.interval = setInterval(() => {
      this.frame = (this.frame + 1) % SPINNER_FRAMES.length;
      this.render();
    }, 80);

    return this;
  }

  stop(): this {
    if (!this.enabled) return this;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    
    this.clear();
    return this;
  }

  succeed(text?: string): this {
    this.stop();
    if (this.enabled) {
      console.log(colors.green(`✓ ${text || this.text}`));
    }
    return this;
  }

  fail(text?: string): this {
    this.stop();
    if (this.enabled) {
      console.error(colors.red(`✗ ${text || this.text}`));
    }
    return this;
  }

  setText(text: string): this {
    this.text = text;
    if (this.enabled && this.interval) {
      this.render();
    }
    return this;
  }

  private render(): void {
    this.clear();
    const frame = SPINNER_FRAMES[this.frame];
    this.stream.write(colors.cyan(`${frame} ${this.text}`));
  }

  private clear(): void {
    if (this.stream.isTTY) {
      this.stream.clearLine(0);
      this.stream.cursorTo(0);
    }
  }
}

export function spinner(text?: string): Spinner {
  return new Spinner(text);
}
