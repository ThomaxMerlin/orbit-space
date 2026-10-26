import {names} from '../dist/locale-content.js';
import {answer,newSession} from '../dist/guide-engine.js';
const stop=/\b(why|what|how|is|are|do|does|the|a|an|can|you|tell|me|about|please|explain|of|in|it|that)\b/gi;
const follow=/^(explain more|explain simply|another fact|tell me more|why|ပိုမိုရှင်းပြပါ|ရိုးရိုးရှင်းပြပါ|နောက်အချက်တစ်ခု|详细解释|简单解释|另一条知识)[?？.! ]*$/i;
export function searchQuery(question,history,language){
 const previous=history.filter(t=>t.role==='user'&&!follow.test(t.content)).at(-1)?.content;
 const query=follow.test(question)&&previous?previous:question;
 const session=newSession();const match=answer(query,session,language);
 const clean=query.replace(/https?:\/\/\S+/g,'').replace(/["'<>:{}|\\]/g,' ').replace(/[?!？。]/g,' ').trim();
 return {query:(language==='en'?clean.replace(stop,' ').replace(/\s+/g,' ').trim():clean).slice(0,160),topic:match.topic};
}
export async function searchUniverse(question,history,language,fetcher=fetch){
 const {query,topic}=searchQuery(question,history,language);if(!query)return {sources:[],status:'empty'};
 async function lookup(lang,term){
  const url=new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:term,gsrnamespace:'0',gsrlimit:'3',prop:'extracts',exintro:'1',explaintext:'1',exchars:'1000',exlimit:'3'});
  const response=await fetcher(url.toString(),{headers:{'User-Agent':'OrbitSpaceGuide/1.0 (https://orbit-space.pages.dev/)','Accept':'application/json'},signal:AbortSignal.timeout(6000),redirect:'error'});
  if(!response.ok)throw new Error('Search unavailable');const data=await response.json();if(data.error)throw new Error('Search unavailable');
  return (data.query?.pages||[]).sort((a,b)=>(a.index||0)-(b.index||0)).filter(p=>typeof p.extract==='string'&&p.extract.trim()&&typeof p.title==='string').map(p=>({title:p.title.slice(0,160),excerpt:p.extract.slice(0,1200),url:`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replaceAll(' ','_'))}`,language:lang}));
 }
 try{let sources=await lookup(language,query);if(!sources.length&&topic!==null)sources=await lookup('en',names.en[topic]);return {sources,status:sources.length?'found':'empty'};}catch{return {sources:[],status:'unavailable'};}
}
