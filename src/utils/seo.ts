export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

/**
 * Serializes structured data for an inline script without allowing a JSON string
 * to terminate the script element. JSON.parse still reconstructs the original value.
 */
export function serializeJsonLd(value: JsonLd): string {
  return JSON.stringify(value).replaceAll("<", String.raw`\u003c`);
}
