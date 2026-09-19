export type PublicPost = Record<string, unknown> & { id: string; media?: Array<Record<string, unknown>> };
export function postText(post: PublicPost): string {return String(post.content || post.body || post.text || post.description || '');}
export function postImages(post: PublicPost): string[] {
 const media = Array.isArray(post.media) ? post.media : [];
 const urls = media.filter(m => !String(m.type || m.mime || '').startsWith('video')).map(m => m.previewUrl || m.smallUrl || m.thumbnailUrl || m.url || m.uri);
 const images = Array.isArray(post.images) ? post.images.map(i => typeof i === 'string' ? i : (i as Record<string, unknown>)?.url) : [];
 return [...new Set([...(postVideo(post)?[post.thumbnailUrl || post.posterUrl]:[]), ...urls, ...images, ...media.map(m=>m.thumbnailUrl || m.posterUrl || m.poster), post.previewUrl || post.smallUrl || post.thumbnailUrl || post.posterUrl || post.imageUrl || post.image || post.shareImage].filter((x): x is string => typeof x === 'string' && /^https?:\/\//i.test(x)))];
}
export function bootstrapPost(id: string, kind = 'posts'): PublicPost | null {
 try {const p=JSON.parse(document.getElementById('celeone-post-data')?.textContent || 'null');return p?.requestedId===id && (p.kind || 'posts')===kind ? p.post : null;} catch {return null;}
}
/** Rebuild allowed markup in a fresh document: no scripts, handlers, styles or embedded frames. */
export function safePostHtml(raw: string): string {
 const parsed = new DOMParser().parseFromString(raw, 'text/html');
 const output = document.createElement('div');
 const allowed = new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','UL','OL','LI','BLOCKQUOTE','PRE','CODE','H1','H2','H3','H4','SPAN','A']);
 const blocked = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','TEMPLATE']);
 const copy = (node: Node, parent: Node) => {
  if (node.nodeType===Node.TEXT_NODE) {parent.appendChild(document.createTextNode(node.textContent || ''));return;}
  if (!(node instanceof Element) || blocked.has(node.tagName)) return;
  if (!allowed.has(node.tagName)) {node.childNodes.forEach(child => copy(child,parent));return;}
  const el=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='A') {const href=node.getAttribute('href') || '';if(/^(https?:|mailto:)/i.test(href)){el.setAttribute('href',href);el.setAttribute('rel','noopener noreferrer');el.setAttribute('target','_blank');}}
  node.childNodes.forEach(child=>copy(child,el));parent.appendChild(el);
 };
 parsed.body.childNodes.forEach(node=>copy(node,output));return output.innerHTML;
}

export function postVideo(post: PublicPost): string | undefined {
 const media=Array.isArray(post.media)?post.media:[];
 const video=media.find(m=>String(m.type||m.mime||'').startsWith('video') || /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(String(m.url || m.uri || '')));
 const url=post.videoUrl || video?.url || video?.uri;
 return typeof url==='string' && /^https?:\/\//i.test(url)?url:undefined;
}
