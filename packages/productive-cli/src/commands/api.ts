import { readFileSync } from "node:fs";
import { getConfig } from "../config.js";
import { OutputFormatter, createSpinner } from "../output.js";
import { colors } from "../utils/colors.js";
import type { OutputFormat } from "../types.js";
import { runCommand, exitWithValidationError } from "../error-handler.js";
import { ConfigError, ValidationError, ApiError } from "../errors.js";

function parseFieldValue(value: string): unknown {
  // Handle special values
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;

  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Handle file input (starts with @)
  if (value.startsWith("@")) {
    const filename = value.slice(1);
    if (filename === "-") {
      // Read from stdin - not implemented in this context
      throw new ValidationError("Reading from stdin is not supported yet", "field");
    }
    try {
      const content = readFileSync(filename, "utf-8");
      // Try to parse as JSON first
      try {
        return JSON.parse(content);
      } catch {
        // Return as string if not valid JSON
        return content.trim();
      }
    } catch {
      throw new ValidationError(`Failed to read file: ${filename}`, "field", value);
    }
  }

  // Return as string
  return value;
}

function parseFields(fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const equalIndex = field.indexOf("=");
    if (equalIndex === -1) {
      throw ValidationError.invalid("field", field, "expected key=value format");
    }

    const key = field.slice(0, equalIndex);
    const value = field.slice(equalIndex + 1);

    result[key] = parseFieldValue(value);
  }

  return result;
}

function parseRawFields(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const field of fields) {
    const equalIndex = field.indexOf("=");
    if (equalIndex === -1) {
      throw ValidationError.invalid("raw-field", field, "expected key=value format");
    }

    const key = field.slice(0, equalIndex);
    const value = field.slice(equalIndex + 1);

    result[key] = value;
  }

  return result;
}

export function showApiHelp(): void {
  console.log(`
${colors.bold("productive api")} - Make authenticated API requests

${colors.bold("USAGE:")}
  productive api <endpoint> [options]

${colors.bold("DESCRIPTION:")}
  Makes an authenticated HTTP request to the Productive API and prints the response.
  The endpoint argument should be a path to a Productive API v2 endpoint.

  API documentation: https://developer.productive.io/

${colors.bold("ARGUMENTS:")}
  <endpoint>          API endpoint path (e.g., /projects, /time_entries)

${colors.bold("OPTIONS:")}
  -X, --method <method>       HTTP method (GET, POST, PATCH, DELETE, PUT)
                              Default: GET (or POST if fields are provided)
  -F, --field <key=value>     Add parameter with type conversion (repeatable)
  -f, --raw-field <key=value> Add string parameter (repeatable)
  -H, --header <header>       Add custom header (repeatable)
  --input <file>              Read request body from file (use - for stdin)
  --paginate                  Fetch all pages of results
  --format <fmt>              Output format: json, human (default: json)
  --no-color                  Disable colored output
  --include                   Include response headers in output

${colors.bold("FIELD FLAGS:")}
  --field performs magic type conversion:
    - 'true', 'false', 'null' → converted to JSON types
    - Numbers → converted to integers or floats
    - '@filename' → reads value from file
    - '@-' → reads value from stdin
    - Other values → kept as strings

  --raw-field always treats values as strings (no conversion)

${colors.bold("HTTP METHODS:")}
  Default behavior:
  - GET: when no fields are provided
  - POST: when fields are provided

  Override with --method or -X flag

${colors.bold("PAGINATION:")}
  Use --paginate to automatically fetch all pages of results.
  The command will follow the pagination links until all data is retrieved.

${colors.bold("EXAMPLES:")}
  # Simple GET request
  productive api /projects

  # GET with query parameters
  productive api /projects --field 'filter[archived]=false'

  # POST request with fields (auto-detected as POST)
  productive api /time_entries \\
    --field person_id=12345 \\
    --field service_id=67890 \\
    --field date=2024-01-15 \\
    --field time=480 \\
    --raw-field note="Development work"

  # PATCH request
  productive api /time_entries/123456 \\
    --method PATCH \\
    --field time=240

  # DELETE request
  productive api /time_entries/123456 --method DELETE

  # Request with custom headers
  productive api /projects \\
    --header "X-Custom-Header: value"

  # Fetch all pages
  productive api /time_entries --paginate

  # Read body from file
  productive api /time_entries \\
    --method POST \\
    --input body.json

  # Complex nested JSON from file
  productive api /tasks \\
    --method POST \\
    --field '@body.json'

${colors.bold("RESPONSE FORMAT:")}
  By default, outputs raw JSON from the API.
  Use --format human for human-readable output.
  Use --include to show response headers.

${colors.bold("AUTHENTICATION:")}
  Authentication is handled automatically using configured credentials.
  Set credentials via:
    - CLI flags: --token, --org-id
    - Environment: PRODUCTIVE_API_TOKEN, PRODUCTIVE_ORG_ID
    - Config: productive config set apiToken <token>
`);
}

export async function handleApiCommand(
  args: string[],
  options: Record<string, string | boolean>,
): Promise<void> {
  const [endpoint] = args;

  const format = (options.format || "json") as OutputFormat;
  const formatter = new OutputFormatter(format, options["no-color"] === true);

  if (!endpoint) {
    exitWithValidationError("endpoint", "productive api <endpoint>", formatter);
  }

  // Validate endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  await runCommand(async () => {
    // Get configuration
    const config = getConfig(options);

    if (!config.apiToken) {
      throw ConfigError.missingToken();
    }

    if (!config.organizationId) {
      throw ConfigError.missingOrganizationId();
    }

    const baseUrl = config.baseUrl || "https://api.productive.io/api/v2";

    // Parse fields
    const fields: string[] = [];
    const rawFields: string[] = [];

    // Handle both singular and array forms
    if (options.field) {
      if (Array.isArray(options.field)) {
        fields.push(...options.field);
      } else {
        fields.push(String(options.field));
      }
    }
    if (options.F) {
      if (Array.isArray(options.F)) {
        fields.push(...options.F);
      } else {
        fields.push(String(options.F));
      }
    }

    if (options["raw-field"]) {
      if (Array.isArray(options["raw-field"])) {
        rawFields.push(...options["raw-field"]);
      } else {
        rawFields.push(String(options["raw-field"]));
      }
    }
    if (options.f) {
      if (Array.isArray(options.f)) {
        rawFields.push(...options.f);
      } else {
        rawFields.push(String(options.f));
      }
    }

    const parsedFields = parseFields(fields);
    const parsedRawFields = parseRawFields(rawFields);
    const allFields = { ...parsedFields, ...parsedRawFields };

    // Determine method
    let method = (options.method || options.X || "").toString().toUpperCase();
    if (!method) {
      method =
        fields.length > 0 || rawFields.length > 0 || options.input
          ? "POST"
          : "GET";
    }

    // Build request
    let body: unknown = undefined;
    let queryParams: Record<string, string> = {};

    if (options.input) {
      // Read body from file
      const inputFile = String(options.input);
      const content =
        inputFile === "-"
          ? "" // stdin not implemented yet
          : readFileSync(inputFile, "utf-8");

      try {
        body = JSON.parse(content);
      } catch {
        throw ValidationError.invalid("input", inputFile, "must contain valid JSON");
      }

      // If we have fields with --input, they become query parameters
      if (Object.keys(allFields).length > 0) {
        queryParams = Object.fromEntries(
          Object.entries(allFields).map(([k, v]) => [k, String(v)]),
        );
      }
    } else if (method === "GET") {
      // For GET, fields become query parameters
      queryParams = Object.fromEntries(
        Object.entries(allFields).map(([k, v]) => [k, String(v)]),
      );
    } else {
      // For POST/PATCH/PUT, fields become body
      body = allFields;
    }

    // Handle pagination
    const paginate = options.paginate === true;

    if (paginate && method !== "GET") {
      throw ValidationError.invalid("paginate", true, "only supported for GET requests");
    }

    const spinner = createSpinner(`${method} ${normalizedEndpoint}...`, format);
    spinner.start();

    // Make request(s)
    let allData: unknown[] = [];
    let currentUrl = `${baseUrl}${normalizedEndpoint}`;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      const url = new URL(currentUrl);

      // Add query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      // Custom headers
      const headers: Record<string, string> = {
        "Content-Type": "application/vnd.api+json",
        "X-Auth-Token": config.apiToken,
        "X-Organization-Id": config.organizationId,
      };

      // Add custom headers from options
      if (options.header) {
        const customHeaders = Array.isArray(options.header)
          ? options.header
          : [String(options.header)];

        for (const header of customHeaders) {
          const colonIndex = header.indexOf(":");
          if (colonIndex === -1) {
            throw ValidationError.invalid("header", header, 'expected "Key: Value" format');
          }
          const key = header.slice(0, colonIndex).trim();
          const value = header.slice(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
      if (options.H) {
        const customHeaders = Array.isArray(options.H)
          ? options.H
          : [String(options.H)];
        for (const header of customHeaders) {
          const colonIndex = header.indexOf(":");
          if (colonIndex === -1) {
            throw ValidationError.invalid("header", header, 'expected "Key: Value" format');
          }
          const key = header.slice(0, colonIndex).trim();
          const value = header.slice(colonIndex + 1).trim();
          headers[key] = value;
        }
      }

      const response = await globalThis.fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        spinner.fail();

        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.errors?.[0]?.detail || errorMessage;
        } catch {
          // Use default error message
        }

        throw ApiError.fromResponse(response.status, errorMessage, url.pathname, errorText);
      }

      const data = (await response.json()) as Record<string, unknown>;
      pageCount++;

      if (paginate) {
        // Extract data array and accumulate
        if (data.data && Array.isArray(data.data)) {
          allData.push(...data.data);
        } else {
          allData.push(data);
        }

        // Check for next page
        const links = data.links as Record<string, unknown> | undefined;
        const nextLink = links?.next;
        if (nextLink && typeof nextLink === "string") {
          currentUrl = nextLink;
          spinner.setText(
            `${method} ${normalizedEndpoint}... (page ${pageCount + 1})`,
          );
        } else {
          hasMore = false;
        }
      } else {
        spinner.succeed();

        // Output response
        if (options.include) {
          console.log(colors.dim("Response Headers:"));
          response.headers.forEach((value, key) => {
            console.log(colors.dim(`  ${key}: ${value}`));
          });
          console.log();
        }

        formatter.output(data);
        return;
      }
    }

    spinner.succeed(
      `Fetched ${allData.length} items across ${pageCount} pages`,
    );

    // Output all paginated data
    formatter.output({
      data: allData,
      meta: {
        total_pages: pageCount,
        total_items: allData.length,
      },
    });
  }, formatter);
}
