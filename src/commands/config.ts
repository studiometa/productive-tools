import { getConfig, setConfig, clearConfig, validateConfig } from '../config.js';
import { OutputFormatter } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

export function showConfigHelp(subcommand?: string): void {
  if (subcommand === 'set') {
    console.log(`
${colors.bold('productive config set')} - Set a configuration value

${colors.bold('USAGE:')}
  productive config set <key> <value>

${colors.bold('ARGUMENTS:')}
  <key>               Configuration key (required)
  <value>             Configuration value (required)

${colors.bold('VALID KEYS:')}
  apiToken            Productive API token
  organizationId      Your organization ID
  userId              Your user ID
  baseUrl             API base URL (optional, has default)

${colors.bold('EXAMPLES:')}
  productive config set apiToken YOUR_API_TOKEN
  productive config set organizationId 12345
  productive config set userId 67890
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive config get')} - Get configuration value(s)

${colors.bold('USAGE:')}
  productive config get [key]

${colors.bold('ARGUMENTS:')}
  [key]               Configuration key (optional, shows all if omitted)

${colors.bold('OPTIONS:')}
  --no-mask           Show full API token (not masked)
  -f, --format <fmt>  Output format: json, human

${colors.bold('VALID KEYS:')}
  apiToken            Productive API token
  organizationId      Your organization ID
  userId              Your user ID
  baseUrl             API base URL

${colors.bold('EXAMPLES:')}
  productive config get
  productive config get apiToken
  productive config get --format json
  productive config get apiToken --no-mask
`);
  } else if (subcommand === 'validate') {
    console.log(`
${colors.bold('productive config validate')} - Validate configuration

${colors.bold('USAGE:')}
  productive config validate

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('DESCRIPTION:')}
  Checks if required configuration values are set:
  - apiToken
  - organizationId

${colors.bold('EXAMPLES:')}
  productive config validate
  productive config validate --format json
`);
  } else if (subcommand === 'clear') {
    console.log(`
${colors.bold('productive config clear')} - Clear all configuration

${colors.bold('USAGE:')}
  productive config clear

${colors.bold('DESCRIPTION:')}
  Removes all stored configuration values from the config file.

${colors.bold('EXAMPLES:')}
  productive config clear
`);
  } else {
    console.log(`
${colors.bold('productive config')} - Manage CLI configuration

${colors.bold('USAGE:')}
  productive config <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  set <key> <val>     Set a configuration value
  get [key]           Get configuration value(s)
  validate            Validate configuration
  clear               Clear all configuration

${colors.bold('CONFIGURATION KEYS:')}
  apiToken            Productive API token
  organizationId      Your organization ID
  userId              Your user ID
  baseUrl             API base URL (optional)

${colors.bold('CONFIG FILE LOCATION:')}
  Linux:   ~/.config/productive-cli/config.json
  macOS:   ~/Library/Application Support/productive-cli/config.json
  Windows: %APPDATA%\\productive-cli\\config.json

${colors.bold('EXAMPLES:')}
  productive config set apiToken YOUR_TOKEN
  productive config get
  productive config validate

Run ${colors.cyan('productive config <subcommand> --help')} for subcommand details.
`);
  }
}

export function handleConfigCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): void {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  switch (subcommand) {
    case 'set':
      configSet(args, formatter);
      break;
    case 'get':
      configGet(args, options, formatter);
      break;
    case 'validate':
      configValidate(formatter);
      break;
    case 'clear':
      configClear(formatter);
      break;
    default:
      formatter.error(`Unknown config subcommand: ${subcommand}`);
      process.exit(1);
  }
}

function configSet(args: string[], formatter: OutputFormatter): void {
  const [key, value] = args;

  if (!key || !value) {
    formatter.error('Usage: productive config set <key> <value>');
    process.exit(1);
  }

  if (!['apiToken', 'organizationId', 'userId', 'baseUrl'].includes(key)) {
    formatter.error(`Invalid configuration key: ${key}`, {
      validKeys: ['apiToken', 'organizationId', 'userId', 'baseUrl'],
    });
    process.exit(1);
  }

  setConfig(key as 'apiToken' | 'organizationId' | 'userId' | 'baseUrl', value);
  formatter.success(`Configuration updated: ${key}`);
}

function configGet(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): void {
  const [key] = args;
  const currentConfig = getConfig();
  const noMask = options['no-mask'] === true;

  if (key) {
    if (!['apiToken', 'organizationId', 'userId', 'baseUrl'].includes(key)) {
      formatter.error(`Invalid configuration key: ${key}`);
      process.exit(1);
    }

    const value = currentConfig[key as keyof typeof currentConfig];

    if (formatter['format'] === 'json') {
      formatter.output({
        key,
        value: key === 'apiToken' && !noMask ? maskToken(value || '') : value,
        set: !!value,
      });
    } else {
      if (value) {
        const displayValue = key === 'apiToken' && !noMask ? maskToken(value) : value;
        console.log(`${key}: ${displayValue}`);
      } else {
        formatter.warning(`${key} is not set`);
      }
    }
  } else {
    if (formatter['format'] === 'json') {
      formatter.output({
        apiToken: noMask ? currentConfig.apiToken : maskToken(currentConfig.apiToken || ''),
        organizationId: currentConfig.organizationId,
        userId: currentConfig.userId,
        baseUrl: currentConfig.baseUrl,
      });
    } else {
      console.log(colors.bold('Current configuration:'));
      console.log('  apiToken:', currentConfig.apiToken ? maskToken(currentConfig.apiToken) : colors.yellow('not set'));
      console.log('  organizationId:', currentConfig.organizationId || colors.yellow('not set'));
      console.log('  userId:', currentConfig.userId || colors.yellow('not set'));
      console.log('  baseUrl:', currentConfig.baseUrl || colors.yellow('not set'));
    }
  }
}

function configValidate(formatter: OutputFormatter): void {
  const validation = validateConfig();

  if (formatter['format'] === 'json') {
    formatter.output({
      valid: validation.valid,
      missing: validation.missing,
    });
    process.exit(validation.valid ? 0 : 1);
  } else {
    if (validation.valid) {
      formatter.success('Configuration is valid');
    } else {
      formatter.error('Configuration is incomplete');
      console.log('Missing required fields:');
      validation.missing.forEach((field) => {
        console.log(`  - ${field}`);
      });
      process.exit(1);
    }
  }
}

function configClear(formatter: OutputFormatter): void {
  clearConfig();
  formatter.success('Configuration cleared');
}

function maskToken(token: string): string {
  if (!token || token.length <= 8) return '***';
  return token.substring(0, 4) + '...' + token.substring(token.length - 4);
}
