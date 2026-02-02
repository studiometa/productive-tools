/**
 * Simple argument parser using native Node.js
 * Parses process.argv into a structured format
 */

export interface ParsedArgs {
  command: string[];
  options: Record<string, string | boolean>;
  positional: string[];
}

export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];
  const command: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      // Long option: --key=value or --key value or --flag
      const equalIndex = arg.indexOf('=');
      if (equalIndex > -1) {
        const key = arg.slice(2, equalIndex);
        const value = arg.slice(equalIndex + 1);
        options[key] = value;
      } else {
        const key = arg.slice(2);
        const nextArg = argv[i + 1];

        if (nextArg && !nextArg.startsWith('-')) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short option: -k value or -abc (multiple flags)
      if (arg.length === 2) {
        const key = arg[1];
        const nextArg = argv[i + 1];

        if (nextArg && !nextArg.startsWith('-')) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      } else {
        // Multiple short flags: -abc -> -a -b -c
        for (let j = 1; j < arg.length; j++) {
          options[arg[j]] = true;
        }
      }
    } else {
      // Positional argument or command
      // First two non-option args are command and subcommand
      if (command.length < 2 && !arg.includes('/')) {
        command.push(arg);
      } else {
        positional.push(arg);
      }
    }
  }

  return { command, options, positional };
}

export function getOption(
  options: Record<string, string | boolean>,
  names: string[],
  defaultValue?: string,
): string | undefined {
  for (const name of names) {
    if (name in options) {
      const value = options[name];
      return typeof value === 'string' ? value : undefined;
    }
  }
  return defaultValue;
}

export function hasFlag(options: Record<string, string | boolean>, names: string[]): boolean {
  return names.some((name) => options[name] === true);
}
