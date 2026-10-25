export type PublicPost = Record<string, unknown> & { id: string; media?: Array<Record<string, unknown>> };
export function postText(post: PublicPost): string {return String(post.content || post.body || post.text || post.description || '');}
export function postImages(post: PublicPost): string[] {
 const media = Array.isArray(post.media) ? post.media : [];
 const isImage = (value: unknown) => typeof value === 'string' && /^https?:\/\//i.test(value);
 const mediaImages = media.filter(m => {
  const type = String(m.type || m.mime || '').toLowerCase();
  const url = String(m.url || m.uri || m.path || '');
  return type.startsWith('image') || /\.(jpe?g|png|webp|gif)(?:[?#]|$)/i.test(url);
 });
 const imageUrl = (item: unknown): unknown => typeof item === 'string' ? item : item && typeof item === 'object' ? ((item as Record<string, unknown>).url || (item as Record<string, unknown>).uri || (item as Record<string, unknown>).src || (item as Record<string, unknown>).path) : undefined;
 const arrays = ['images', 'imageUrls', 'photos', 'attachments'].flatMap(key => Array.isArray(post[key]) ? (post[key] as unknown[]).map(imageUrl) : []);
 const candidates = [
  ...arrays,
  ...mediaImages.map(m => m.previewUrl || m.smallUrl || m.thumbnailUrl || m.url || m.uri || m.path),
  ...media.map(m => m.thumbnailUrl || m.posterUrl || m.poster),
  ...(postVideo(post) ? [post.thumbnailUrl, post.posterUrl, post.videoShareImage] : []),
  post.shareImage, post.shareImageUrl, post.previewUrl, post.smallUrl, post.thumbnailUrl,
  post.posterUrl, post.imageUrl, post.image, post.coverUrl, post.coverImageUrl,
 ];
 return [...new Set(candidates.filter(isImage) as string[])];
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
