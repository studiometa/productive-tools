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

import { createServer, type Server } from 'node:http';
import { toNodeListener } from 'h3';
import { createHttpApp } from './http.js';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';

/**
 * Start the HTTP server
 */
export function startHttpServer(
  port: number = DEFAULT_PORT,
  host: string = DEFAULT_HOST
): Promise<Server> {
  return new Promise((resolve) => {
    const app = createHttpApp();
    const server = createServer(toNodeListener(app));

    server.listen(port, host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      console.log(`Productive MCP server running at http://${displayHost}:${port}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  POST http://${displayHost}:${port}/mcp - MCP JSON-RPC endpoint`);
      console.log(`  GET  http://${displayHost}:${port}/health - Health check`);
      console.log('');
      console.log('Authentication:');
      console.log('  Pass Bearer token in Authorization header');
      console.log('  Token format: base64(organizationId:apiToken:userId)');
      console.log('');
      console.log('Generate token:');
      console.log('  echo -n "ORG_ID:API_TOKEN:USER_ID" | base64');
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
