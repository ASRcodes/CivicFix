/** Recursively removes keys starting with "$" or containing "." (NoSQL operator injection). */
export function stripDangerousKeys(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => stripDangerousKeys(v, depth + 1));
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete value[key];
    } else {
      value[key] = stripDangerousKeys(value[key], depth + 1);
    }
  }
  return value;
}
