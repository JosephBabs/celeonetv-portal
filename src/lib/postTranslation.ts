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

export const POST_LANGUAGES = [
 ['en','English'],['fr','Fran\u00e7ais'],['es','Espa\u00f1ol'],['pt','Portugu\u00eas'],
 ['de','Deutsch'],['it','Italiano'],['nl','Nederlands'],['yo','Yor\u00f9b\u00e1'],
 ['ig','Igbo'],['ha','Hausa'],['sw','Kiswahili'],['ar','\u0627\u0644\u0639\u0631\u0628\u064a\u0629'],
 ['zh','\u4e2d\u6587'],['hi','\u0939\u093f\u0928\u094d\u0926\u0940'],['ru','\u0420\u0443\u0441\u0441\u043a\u0438\u0439'],['ja','\u65e5\u672c\u8a9e'],
 ['ko','\ud55c\uad6d\uc5b4'],['tr','T\u00fcrk\u00e7e'],['id','Bahasa Indonesia'],['vi','Ti\u1ebfng Vi\u1ec7t']
] as const;

async function requestJson(url: string, init: RequestInit, signal: AbortSignal) {
 const controller=new AbortController();
 const cancel=()=>controller.abort();
 signal.addEventListener('abort',cancel,{once:true});
 if(signal.aborted)controller.abort();
 const timer=setTimeout(cancel,12000);
 try {
  const response=await fetch(url,{...init,signal:controller.signal});
  if(!response.ok)throw new Error('Translation unavailable');
  return await response.json();
 } finally {clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}

export async function translateText(text: string, target: string, signal: AbortSignal): Promise<string> {
 if(signal.aborted)throw new DOMException('Aborted','AbortError');
 const key=`${target}:${text}`;
 if(translations.has(key))return translations.get(key)!;
 const chunks:string[]=[];
 // Preserve authored line breaks and keep encoded Google query URLs small.
 for(const line of text.split(/(\r?\n)/)) {
  let chunk='';let bytes=0;
  for(const char of line){const size=encodeURIComponent(char).length;if(bytes+size>4500){chunks.push(chunk);chunk='';bytes=0;}chunk+=char;bytes+=size;}
  if(chunk)chunks.push(chunk);
 }
 const output:string[]=[];
 for(const chunk of chunks){
  if(!chunk.trim()){output.push(chunk);continue;}
  let translated='';
  try {
   const query=new URLSearchParams({client:'gtx',sl:'auto',tl:target,dt:'t',q:chunk});
   const body=await requestJson(`https://translate.googleapis.com/translate_a/single?${query}`,{},signal);
   translated=Array.isArray(body?.[0])?body[0].map((part:unknown[])=>Array.isArray(part)&&typeof part[0]==='string'?part[0]:'').join(''):'';
   if(!translated.trim() || translated.length>Math.max(80,chunk.length*4))throw new Error('Translation unavailable');
  } catch(error){
   if(signal.aborted)throw error;
   // The existing server endpoint only supports these selectable languages.
   if(!['en','fr','es','yo'].includes(target))throw new Error('Translation unavailable');
   const result=await requestJson('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:chunk,source:'auto',target})},signal);
   translated=typeof result.translatedText==='string'?result.translatedText:'';
   if(!translated.trim())throw new Error('Translation unavailable');
  }
  output.push(translated);
 }
 const value=output.join('');
 if(translations.size>=100)translations.delete(translations.keys().next().value!);
 translations.set(key,value);
 return value;
}
