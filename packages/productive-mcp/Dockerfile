# Productive MCP Server - HTTP Transport
# 
# Build from the repository root:
#   docker build -t productive-mcp-server -f packages/productive-mcp/Dockerfile .
#
# Or from the package directory with published packages:
#   docker build -t productive-mcp-server .

FROM node:20-alpine

WORKDIR /app

# Install the package globally from npm
RUN npm install -g @studiometa/productive-mcp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the HTTP server
CMD ["productive-mcp-server"]
