type LocalizeFn = (
  messageParts: TemplateStringsArray,
  ...expressions: readonly unknown[]
) => string;

function stripMetadata(part: string): string {
  if (part.charAt(0) !== ':') {
    return part;
  }
  let index = 1;
  while (index < part.length) {
    if (part.charAt(index) === '\\') {
      index += 2;
      continue;
    }
    if (part.charAt(index) === ':') {
      return part.slice(index + 1);
    }
    index += 1;
  }
  return part;
}

const localize: LocalizeFn = (messageParts, ...expressions) => {
  let result = stripMetadata(messageParts[0]);
  for (let index = 0; index < expressions.length; index += 1) {
    result += String(expressions[index]) + messageParts[index + 1];
  }
  return result;
};

(globalThis as unknown as { $localize?: LocalizeFn }).$localize ??= localize;

function cssEscape(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

const globalWithCss = globalThis as unknown as { CSS?: { escape?: (value: string) => string } };
globalWithCss.CSS ??= { escape: cssEscape };
globalWithCss.CSS.escape ??= cssEscape;
