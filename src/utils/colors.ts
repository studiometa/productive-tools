/**
 * ANSI color utilities using native Node.js
 * Provides terminal colors without external dependencies
 */

// ANSI escape codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Foreground colors
const FG_BLACK = '\x1b[30m';
const FG_RED = '\x1b[31m';
const FG_GREEN = '\x1b[32m';
const FG_YELLOW = '\x1b[33m';
const FG_BLUE = '\x1b[34m';
const FG_MAGENTA = '\x1b[35m';
const FG_CYAN = '\x1b[36m';
const FG_WHITE = '\x1b[37m';
const FG_GRAY = '\x1b[90m';

// Background colors
const BG_RED = '\x1b[41m';
const BG_GREEN = '\x1b[42m';
const BG_YELLOW = '\x1b[43m';

// Colors enabled by default, disabled by NO_COLOR env var
let colorEnabled = process.env.NO_COLOR === undefined;

export function setColorEnabled(enabled: boolean): void {
  colorEnabled = enabled;
}

export function isColorEnabled(): boolean {
  return colorEnabled;
}

function colorize(text: string, code: string): string {
  if (!colorEnabled) return text;
  return `${code}${text}${RESET}`;
}

export const colors = {
  reset: (text: string) => colorEnabled ? `${RESET}${text}` : text,
  bold: (text: string) => colorize(text, BOLD),
  dim: (text: string) => colorize(text, DIM),
  
  // Foreground colors
  black: (text: string) => colorize(text, FG_BLACK),
  red: (text: string) => colorize(text, FG_RED),
  green: (text: string) => colorize(text, FG_GREEN),
  yellow: (text: string) => colorize(text, FG_YELLOW),
  blue: (text: string) => colorize(text, FG_BLUE),
  magenta: (text: string) => colorize(text, FG_MAGENTA),
  cyan: (text: string) => colorize(text, FG_CYAN),
  white: (text: string) => colorize(text, FG_WHITE),
  gray: (text: string) => colorize(text, FG_GRAY),
  
  // Background colors
  bgRed: (text: string) => colorize(text, BG_RED),
  bgGreen: (text: string) => colorize(text, BG_GREEN),
  bgYellow: (text: string) => colorize(text, BG_YELLOW),
};

// Semantic helpers
export const log = {
  info: (message: string) => console.log(colors.blue(message)),
  success: (message: string) => console.log(colors.green(`✓ ${message}`)),
  warning: (message: string) => console.log(colors.yellow(`⚠ ${message}`)),
  error: (message: string) => console.error(colors.red(`✗ ${message}`)),
  dim: (message: string) => console.log(colors.dim(message)),
};
