import type { Source } from '../types/chat';
import type { ResponseSources, InternalSource, WebSource } from '../types/aiResponse';

export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

const mapInternalType = (type?: Source['type']): InternalSource['type'] | null => {
  switch (type) {
    case 'beroe':
      return 'beroe';
    case 'dnd':
      return 'dun_bradstreet';
    case 'ecovadis':
      return 'ecovadis';
    case 'internal_data':
      return 'internal_data';
    case 'supplier_data':
      return 'supplier_data';
    case 'report':
    case 'analysis':
    case 'data':
    case 'news':
      return 'internal_data';
    default:
      return null;
  }
};

export const buildResponseSources = (sources: Source[] = []): ResponseSources => {
  const web: WebSource[] = [];
  const internal: InternalSource[] = [];
  const seenWeb = new Set<string>();
  const seenInternal = new Set<string>();

  for (const source of sources) {
    if (source.url) {
      const normalized = normalizeUrl(source.url);
      if (seenWeb.has(normalized)) continue;
      seenWeb.add(normalized);
      const domain = extractDomain(source.url);
      web.push({
        name: source.name || domain,
        url: source.url,
        domain,
        date: source.date,
      });
      continue;
    }

    if (!source.name) continue;
    const internalType = mapInternalType(source.type);
    if (!internalType) continue;

    const key = `${internalType}:${source.name}`.toLowerCase();
    if (seenInternal.has(key)) continue;
    seenInternal.add(key);
    internal.push({
      name: source.name,
      type: internalType,
    });
  }

  return {
    web,
    internal,
    totalWebCount: web.length,
    totalInternalCount: internal.length,
  };
};
