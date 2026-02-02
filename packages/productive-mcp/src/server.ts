#!/usr/bin/env node

/**
 * Productive MCP Server - HTTP Transport
 *
 * This is the remote HTTP server mode for Claude Desktop custom connectors.
 * Credentials are passed via Bearer token in the Authorization header.
 *
 * Token format: base64(organizationId:apiToken) or base64(organizationId:apiToken:userId)
 *
 * Generate your token:
 *   echo -n "YOUR_ORG_ID:YOUR_API_TOKEN:YOUR_USER_ID" | base64
 *
 * Usage:
 *   productive-mcp-server
 *   PORT=3000 productive-mcp-server
 *
 * Claude Desktop custom connector config:
 *   Name: Productive
 *   URL: https://productive.mcp.ikko.dev
 *   (No OAuth needed - uses Bearer token)
 */

import { toNodeListener } from 'h3';
import { createServer, type Server } from 'node:http';

import { createHttpApp } from './http.js';
import { VERSION } from './version.js';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';

/**
 * Start the HTTP server
 */
export function startHttpServer(
  port: number = DEFAULT_PORT,
  host: string = DEFAULT_HOST,
): Promise<Server> {
  return new Promise((resolve) => {
    const app = createHttpApp();
    const server = createServer(toNodeListener(app));

    server.listen(port, host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      console.log(`Productive MCP server v${VERSION}`);
      console.log(`Node.js ${process.version}`);
      console.log('');
      console.log(`Running at http://${displayHost}:${port}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  POST http://${displayHost}:${port}/mcp - MCP JSON-RPC endpoint`);
      console.log(`  GET  http://${displayHost}:${port}/health - Health check`);
      console.log('');
      console.log('OAuth 2.0 (MCP auth spec compliant):');
      console.log(`  GET  http://${displayHost}:${port}/.well-known/oauth-authorization-server`);
      console.log(`  POST http://${displayHost}:${port}/register - Dynamic Client Registration`);
      console.log(`  GET  http://${displayHost}:${port}/authorize - Authorization endpoint`);
      console.log(`  POST http://${displayHost}:${port}/token - Token endpoint`);
      console.log('');
      console.log('Authentication:');
      console.log('  Option 1: OAuth flow (Claude Desktop will handle this automatically)');
      console.log('  Option 2: Bearer token in Authorization header');
      console.log('            Token format: base64(organizationId:apiToken:userId)');
      console.log('');
      if (!process.env.OAUTH_SECRET) {
        console.log('⚠️  WARNING: OAUTH_SECRET not set. Set it in production!');
        console.log('   export OAUTH_SECRET="your-random-secret-here"');
        console.log('');
      }
      resolve(server);
    });
  });
}

// Start server when run directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('/productive-mcp-server') ||
  process.argv[1]?.endsWith('\\productive-mcp-server');

if (isMainModule) {
  const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
  const host = process.env.HOST || DEFAULT_HOST;

  startHttpServer(port, host).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
