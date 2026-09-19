import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { phoneLanguage, translatePost } from "../lib/postTranslation";
import { openShareInApp } from "../lib/deepLinks";
import { setPageMeta } from "../lib/seo";
import { useI18n } from "../lib/i18n";
import { bootstrapPost, postImages, postVideo, postText, safePostHtml, type PublicPost } from "../lib/publicPost";

export default function Post() {
 const params=useParams();const postId=params.postId || params.contentId || params.reelId || '';const kind=params.reelId?'reels':'posts';
 const { t }=useI18n();
 const [post,setPost]=useState<PublicPost|null>(()=>bootstrapPost(postId,kind));
 const [loading,setLoading]=useState(()=>!bootstrapPost(postId,kind));
 const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 const [loadedImages,setLoadedImages]=useState<Record<string, boolean>>({});
 useEffect(()=>{
  const embedded=bootstrapPost(postId,kind);setPost(embedded);setError('');setLoading(!embedded);
  if(embedded)return;
  const controller=new AbortController();
  void fetch(`/api/public/${kind}/${encodeURIComponent(postId)}`,{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error(response.status===404?'not_found':'unavailable');
   const json=await response.json();setPost(json.data);
  }).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[postId,kind,retry]);
 const [translated,setTranslated]=useState<{title:string;html:string}|null>(null);
 const [showOriginal,setShowOriginal]=useState(false);
 const [translating,setTranslating]=useState(false);
 const [translationFailed,setTranslationFailed]=useState(false);
 const target=phoneLanguage(navigator.languages?.length?navigator.languages:[navigator.language]);
 const originalTitle=String(post?.title || post?.shareTitle || 'Cele One');
 const images=useMemo(()=>post?postImages(post):[],[post]);
 const html=useMemo(()=>post?safePostHtml(postText(post)):'',[post]);
 useEffect(()=>{
  setTranslated(null);setShowOriginal(false);setTranslationFailed(false);
  if(!post)return;
  const controller=new AbortController();setTranslating(true);
  void translatePost(originalTitle,html,target,controller.signal).then(value=>{if(!controller.signal.aborted && (value.title!==originalTitle || value.html!==html))setTranslated(value);}).catch(()=>{if(!controller.signal.aborted)setTranslationFailed(true);}).finally(()=>{if(!controller.signal.aborted)setTranslating(false);});
  return ()=>controller.abort();
 },[post,originalTitle,html,target]);
 const displayTitle=translated&&!showOriginal?translated.title:originalTitle;
 const displayHtml=translated&&!showOriginal?safePostHtml(translated.html):html;
 useEffect(()=>{if(!post)return;const plain=new DOMParser().parseFromString(html,'text/html').body.textContent || '';setPageMeta({title:String(post.shareTitle || post.title || 'Cele One'),description:plain.slice(0,180),image:images[0] || 'https://celeonetv.com/logo.png'});},[post,html,images]);
 if(loading)return <div className="mx-auto max-w-3xl p-8" role="status">{t('common.loading','Loading...')}</div>;
 if(!post)return <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8"><h1>{error==='not_found'?t('post.not_found','Post not found'):t('post.load_error','This post could not be loaded.')}</h1>{error!=='not_found'&&<button onClick={()=>setRetry(n=>n+1)}>{t('common.retry','Try again')}</button>}</div>;
 return <main className="mx-auto max-w-3xl space-y-5">
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-4"><span className="font-bold text-teal-900">Cele One</span>{(kind==='posts'||Boolean(post.postId)) && <button onClick={()=>openShareInApp('post',String(post.postId || post.id))} className="rounded-xl bg-teal-700 px-4 py-3 font-bold text-white">{t('share.open_app','Open in app')}</button>}</div>
  <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
   <h1 className="mb-4 text-3xl font-bold">{displayTitle}</h1>
   <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600" aria-live="polite">{translating&&<span>{t('post.translating','Translating...')}</span>}{translationFailed&&<span>{t('post.translation_unavailable','Showing the original. Translation is unavailable.')}</span>}{translated&&<><span>{t('post.auto_translated','Automatically translated')} ({target})</span><button type="button" className="font-semibold text-teal-700 underline" onClick={()=>setShowOriginal(value=>!value)}>{showOriginal?t('post.see_translation','See translation'):t('post.see_original','See original')}</button></>}</div>
   <div className="celeone-post-body text-slate-800" style={{lineHeight:1.75,overflowWrap:'anywhere',whiteSpace:'pre-wrap'}} lang={translated&&!showOriginal?target:undefined} dangerouslySetInnerHTML={{__html:displayHtml}} />
   {postVideo(post) && <video className="mt-5 max-h-[80vh] w-full bg-black object-contain" controls playsInline preload="metadata" poster={images[0]} src={postVideo(post)} />}
   <div className="mt-5 space-y-3">{(postVideo(post)?[]:images).map((url,index)=><div key={url} className="relative min-h-32 overflow-hidden rounded-lg bg-slate-100">{!loadedImages[url]&&<div className="absolute inset-0 flex items-center justify-center" role="status"><span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" /></div>}<img src={url} alt={String(post.title || 'Post image')} loading={index===0?'eager':'lazy'} fetchPriority={index===0?'high':'auto'} decoding="async" className="relative h-auto w-full object-contain" onLoad={()=>setLoadedImages(prev=>({...prev,[url]:true}))} onError={()=>setLoadedImages(prev=>({...prev,[url]:true}))} /></div>)}</div>
  </article>
 </main>;
}
