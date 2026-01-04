const vegaliteFence = /```vegalite\s*([\s\S]*?)```/i;
const jsonFence = /```json\s*([\s\S]*?)```/i;

const stripCodeFences = (text: string) =>
  text.replace(/```[\s\S]*?```/g, '').trim();

const isValidSpec = (spec: Record<string, unknown>) => {
  if (!spec || typeof spec !== 'object') return false;
  if (!('mark' in spec) && !('layer' in spec)) return false;
  if (!('encoding' in spec)) return false;
  return true;
};

export function extractVegaLiteSpec(text: string) {
  const match = text.match(vegaliteFence) || text.match(jsonFence);
  if (!match) {
    return { cleanedText: text.trim(), spec: null };
  }

  const raw = match[1].trim();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const spec = isValidSpec(parsed) ? parsed : null;
    return {
      cleanedText: stripCodeFences(text),
      spec,
    };
  } catch {
    return { cleanedText: stripCodeFences(text), spec: null };
  }
}
