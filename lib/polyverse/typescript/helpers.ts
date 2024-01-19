/**
 * TypeScript type guard to allow narrowing of 'unknown' to Record<string, unknown>.
 * Should only be used when we are more sure that the propery exists than TypeScript.
 *
 * @param value Value whose value we wish to identify as a Record<string, unknown> or not
 * @returns {boolean} Whether the value is a Record<string, unknown> or not
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null
