/**
 * Cross-platform secure credential storage
 *
 * - macOS: Uses Keychain via `security` CLI
 * - Linux: Uses libsecret via `secret-tool` CLI
 * - Fallback: Returns null (caller should use config file)
 */

import { execSync, spawnSync } from "node:child_process";

const SERVICE_NAME = "productive-cli";

type Platform = "darwin" | "linux" | "unsupported";

/**
 * Detect the current platform and available secret storage
 */
function detectPlatform(): Platform {
  if (process.platform === "darwin") {
    return "darwin";
  }

  if (process.platform === "linux") {
    // Check if secret-tool is available
    try {
      execSync("which secret-tool", { stdio: "ignore" });
      return "linux";
    } catch {
      return "unsupported";
    }
  }

  return "unsupported";
}

/**
 * Store a secret in macOS Keychain
 */
function setKeychainMacOS(key: string, value: string): boolean {
  try {
    // Delete existing entry first (ignore errors if it doesn't exist)
    spawnSync(
      "security",
      ["delete-generic-password", "-s", SERVICE_NAME, "-a", key],
      {
        stdio: "ignore",
      },
    );

    // Add the new password
    const result = spawnSync(
      "security",
      [
        "add-generic-password",
        "-s",
        SERVICE_NAME,
        "-a",
        key,
        "-w",
        value,
        "-U",
      ],
      { stdio: "ignore" },
    );

    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get a secret from macOS Keychain
 */
function getKeychainMacOS(key: string): string | null {
  try {
    const result = spawnSync(
      "security",
      ["find-generic-password", "-s", SERVICE_NAME, "-a", key, "-w"],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    );

    if (result.status === 0 && result.stdout) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete a secret from macOS Keychain
 */
function deleteKeychainMacOS(key: string): boolean {
  try {
    const result = spawnSync(
      "security",
      ["delete-generic-password", "-s", SERVICE_NAME, "-a", key],
      { stdio: "ignore" },
    );
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Store a secret using libsecret (Linux)
 */
function setKeychainLinux(key: string, value: string): boolean {
  try {
    // secret-tool reads password from stdin
    const result = spawnSync(
      "secret-tool",
      [
        "store",
        "--label",
        `${SERVICE_NAME} ${key}`,
        "service",
        SERVICE_NAME,
        "account",
        key,
      ],
      { input: value, encoding: "utf-8", stdio: ["pipe", "ignore", "ignore"] },
    );

    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get a secret using libsecret (Linux)
 */
function getKeychainLinux(key: string): string | null {
  try {
    const result = spawnSync(
      "secret-tool",
      ["lookup", "service", SERVICE_NAME, "account", key],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    );

    if (result.status === 0 && result.stdout) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete a secret using libsecret (Linux)
 */
function deleteKeychainLinux(key: string): boolean {
  try {
    const result = spawnSync(
      "secret-tool",
      ["clear", "service", SERVICE_NAME, "account", key],
      { stdio: "ignore" },
    );
    return result.status === 0;
  } catch {
    return false;
  }
}

// Cached platform detection
let cachedPlatform: Platform | null = null;

function getPlatform(): Platform {
  if (cachedPlatform === null) {
    cachedPlatform = detectPlatform();
  }
  return cachedPlatform;
}

/**
 * Reset the cached platform detection (for testing purposes)
 */
export function resetPlatformCache(): void {
  cachedPlatform = null;
}

/**
 * Check if secure storage is available on this platform
 */
export function isKeychainAvailable(): boolean {
  return getPlatform() !== "unsupported";
}

/**
 * Get the name of the secure storage backend
 */
export function getKeychainBackend(): string {
  const platform = getPlatform();
  switch (platform) {
    case "darwin":
      return "macOS Keychain";
    case "linux":
      return "libsecret (Secret Service)";
    default:
      return "none";
  }
}

/**
 * Store a secret in the system keychain
 * @returns true if successful, false otherwise
 */
export function setKeychainValue(key: string, value: string): boolean {
  const platform = getPlatform();

  switch (platform) {
    case "darwin":
      return setKeychainMacOS(key, value);
    case "linux":
      return setKeychainLinux(key, value);
    default:
      return false;
  }
}

/**
 * Get a secret from the system keychain
 * @returns the secret value, or null if not found or not supported
 */
export function getKeychainValue(key: string): string | null {
  const platform = getPlatform();

  switch (platform) {
    case "darwin":
      return getKeychainMacOS(key);
    case "linux":
      return getKeychainLinux(key);
    default:
      return null;
  }
}

/**
 * Delete a secret from the system keychain
 * @returns true if successful, false otherwise
 */
export function deleteKeychainValue(key: string): boolean {
  const platform = getPlatform();

  switch (platform) {
    case "darwin":
      return deleteKeychainMacOS(key);
    case "linux":
      return deleteKeychainLinux(key);
    default:
      return false;
  }
}

/**
 * List of config keys that should be stored securely
 */
export const SECURE_KEYS = ["apiToken"] as const;

/**
 * Check if a key should be stored securely
 */
export function isSecureKey(key: string): boolean {
  return (SECURE_KEYS as readonly string[]).includes(key);
}
