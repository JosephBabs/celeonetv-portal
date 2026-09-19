const translations = new Map<string, string>();

export function phoneLanguage(languages: readonly string[]): string {
  return (languages.find(value => /^[a-z]{2,3}(?:[-_]|$)/i.test(value)) || 'en').split(/[-_]/)[0].toLowerCase();
}

/** Translate text nodes only, preserving paragraphs, links and editor formatting. */
export async function translatePost(title: string, html: string, target: string, signal: AbortSignal) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.textContent?.trim() && !node.parentElement?.closest('code,pre')) nodes.push(node);
  }
  const translate=(text:string)=>translateText(text,target,signal);
  const translatedTitle = title.trim() ? await translate(title) : title;
  let index = 0;
  async function process() {
    while (index < nodes.length) {
      const node = nodes[index++];
      const text = node.textContent || '';
      const translated = await translate(text.trim());
      node.textContent = (text.match(/^\s*/)?.[0] || '') + translated + (text.match(/\s*$/)?.[0] || '');
    }
  }
  await Promise.all([process(), process()]);
  return {title: translatedTitle, html: document.body.innerHTML};
}

export async function translateText(text: string, target: string, signal: AbortSignal): Promise<string> {
    const key = `${target}:${text}`;
    if (translations.has(key)) return translations.get(key)!;
    // Keep each request below the server limit without truncating long posts.
    const chunks = text.match(/[\s\S]{1,5000}/gu) || [];
    const output: string[] = [];
    for (const chunk of chunks) {
      const response = await fetch('/api/translate', {method: 'POST', signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: chunk, source: 'auto', target})});
      if (!response.ok) throw new Error('Translation unavailable');
      const result = await response.json();
      if (typeof result.translatedText !== 'string' || !result.translatedText.trim()) throw new Error('Translation unavailable');
      output.push(result.translatedText);
    }
    const value = output.join('');
    if (translations.size >= 100) translations.delete(translations.keys().next().value!);
    translations.set(key, value);
    return value;
  }
