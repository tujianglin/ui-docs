export interface StoryMeta {
  title?: string;
  label?: string;
  group?: string;
  description?: string;
  groupOrder?: number;
  order?: number;
}

const pickStringAttr = (attrs: string, name: string) => {
  const direct = attrs.match(new RegExp(String.raw`\b${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`));
  const bound = attrs.match(new RegExp(String.raw`(?:\b(?:v-bind:|:))${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`));
  const match = direct || bound;
  return (match?.[1] ?? match?.[2] ?? '').trim() || undefined;
};

const pickNumberAttr = (attrs: string, name: string) => {
  const raw = pickStringAttr(attrs, name);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

export const parseStoryMetaFromVue = (source: string): StoryMeta => {
  const match = source.match(/<Story\b([\s\S]*?)>/);
  if (!match) return {};

  const attrs = match[1] || '';
  return {
    title: pickStringAttr(attrs, 'title'),
    label: pickStringAttr(attrs, 'label'),
    group: pickStringAttr(attrs, 'group'),
    description: pickStringAttr(attrs, 'description'),
    groupOrder: pickNumberAttr(attrs, 'groupOrder') ?? pickNumberAttr(attrs, 'group-order'),
    order: pickNumberAttr(attrs, 'order'),
  };
};
