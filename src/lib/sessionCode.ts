const CODE_PREFIX = "TL";
const CODE_MIN = 1000;
const CODE_MAX = 9999;

export function generateSessionCode(existingCodes: Iterable<string> = []): string {
  const used = new Set(Array.from(existingCodes).map(normalizeSessionCode));

  for (let attempts = 0; attempts < 100; attempts += 1) {
    const numeric = Math.floor(Math.random() * (CODE_MAX - CODE_MIN + 1)) + CODE_MIN;
    const code = `${CODE_PREFIX}-${numeric}`;
    if (!used.has(code)) {
      return code;
    }
  }

  throw new Error("세션 코드를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

export function normalizeSessionCode(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d{4}$/.test(cleaned)) {
    return `${CODE_PREFIX}-${cleaned}`;
  }

  if (/^TL\d{4}$/.test(cleaned)) {
    return `${CODE_PREFIX}-${cleaned.slice(2)}`;
  }

  return cleaned;
}

export function isValidSessionCode(value: string): boolean {
  return /^TL-\d{4}$/.test(normalizeSessionCode(value));
}
