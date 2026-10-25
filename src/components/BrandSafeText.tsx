const BRAND_PATTERN = /^(?:(?:c[e\u00e8]l[e\u00e8]\s*one|celeone)(?:\s*tv)?)$/i;
const BRAND_SPLIT_PATTERN = /((?:c[e\u00e8]l[e\u00e8]\s*one|celeone)(?:\s*tv)?)/gi;

export default function BrandSafeText({ text }: { text: string }) {
  return <>{text.split(BRAND_SPLIT_PATTERN).map((part, index) => BRAND_PATTERN.test(part) ? <span key={`${index}-${part}`} translate="no">{part}</span> : part)}</>;
}