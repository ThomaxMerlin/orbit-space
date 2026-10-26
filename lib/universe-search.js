import {resolveTopic,relatedQuestions,topicReference} from '../dist/space-topics.js';
import {names} from '../dist/locale-content.js';
import {answer,newSession} from '../dist/guide-engine.js';
const stop=/\b(why|what|how|is|are|do|does|the|a|an|can|you|tell|me|about|please|explain|of|in|it|that|they|them|their|its)\b/gi;
const follow=/^(explain more|explain simply|another fact|tell me more|why|ပိုမိုရှင်းပြပါ|ရိုးရိုးရှင်းပြပါ|နောက်အချက်တစ်ခု|详细解释|简单解释|另一条知识)[?？.! ]*$/i;
export function searchQuery(question,history,language){
 const previous=history.filter(t=>t.role==='user'&&!follow.test(t.content)).at(-1)?.content;
 const query=follow.test(question)&&previous?previous:question;
 const session=newSession();const match=answer(query,session,language);
 const resolved=resolveTopic(question,history);const another=/another fact|နောက်အချက်|另一条/i.test(question);const choice=resolved.topic?.questions[language][history.filter(t=>t.role==='user'&&/another fact|နောက်အချက်|另一条/i.test(t.content)).length%3];const expanded=another&&choice?choice:resolved.follow&&resolved.topic?resolved.topic.term+' '+(follow.test(question)?'':question):query;
 const clean=expanded.replace(/https?:\/\/\S+/g,'').replace(/["'<>:{}|\\]/g,' ').replace(/[?!？。]/g,' ').trim();
 return {query:(language==='en'?clean.replace(stop,' ').replace(/\s+/g,' ').trim():clean).slice(0,160),topic:match.topic,canonical:resolved.topic?.term||(match.topic!==null?names.en[match.topic]:null),catalog:resolved.topic};
}
export async function searchUniverse(question,history,language,fetcher=fetch){
 const {query,topic,canonical,catalog}=searchQuery(question,history,language);if(!query)return {sources:[],status:'empty'};
 async function lookup(lang,term){
  const url=new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:term,gsrnamespace:'0',gsrlimit:'3',prop:'extracts',exintro:'1',explaintext:'1',exchars:'1000',exlimit:'3'});
  const response=await fetcher(url.toString(),{headers:{'User-Agent':'OrbitSpaceGuide/1.0 (https://orbit-space.pages.dev/)','Accept':'application/json'},signal:AbortSignal.timeout(6000),redirect:'manual'});
  if(!response.ok)throw new Error('Wikipedia HTTP '+response.status);const data=await response.json();if(data.error)throw new Error('Wikipedia HTTP '+response.status);
  return (data.query?.pages||[]).sort((a,b)=>(a.index||0)-(b.index||0)).filter(p=>typeof p.extract==='string'&&p.extract.trim()&&typeof p.title==='string'&&!/\([^)]*(?:short story|novel|film|song|album|band|video game|disambiguation)[^)]*\)/i.test(p.title)).map(p=>({title:p.title.slice(0,160),excerpt:p.extract.slice(0,1200),url:`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replaceAll(' ','_'))}`,language:lang,provider:'Wikipedia contributors'}));
 }
 async function nasaLookup(){
  const term=canonical||query;
  const url=new URL('https://images-api.nasa.gov/search');url.search=new URLSearchParams({q:term,media_type:'image',page_size:'3'});
  const response=await fetcher(url.toString(),{signal:AbortSignal.timeout(6000),redirect:'manual'});if(!response.ok)throw new Error('NASA HTTP '+response.status);
  const data=await response.json();return (data.collection?.items||[]).slice(0,3).map(item=>item.data?.[0]).filter(d=>d&&typeof d.description==='string'&&typeof d.nasa_id==='string').map(d=>({title:String(d.title||d.nasa_id).slice(0,160),excerpt:d.description.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').slice(0,1200),url:'https://images.nasa.gov/details/'+encodeURIComponent(d.nasa_id),language:'en',provider:'NASA Image and Video Library'}));
 }
 // Fetch both providers in parallel; at most one additional canonical lookup.
 const results=await Promise.allSettled([lookup(language,query),nasaLookup()]);
 let wiki=results[0].status==='fulfilled'?results[0].value:[],nasa=results[1].status==='fulfilled'?results[1].value:[];
 if(!wiki.length&&canonical&&canonical!==query){try{wiki=await lookup('en',canonical);}catch{}}
 const sources=[],seen=new Set();
 const candidates=[...(catalog?[topicReference(catalog,language)]:[]),...wiki.slice(0,1),...nasa.slice(0,1),...wiki.slice(1),...nasa.slice(1)];
 for(const item of candidates){if(!seen.has(item.url)){sources.push(item);seen.add(item.url);}if(sources.length===3)break;}
 return {sources,status:sources.length?'found':results.some(r=>r.status==='rejected')?'unavailable':'empty',referenceOnly:!!catalog&&!wiki.length&&!nasa.length,related:relatedQuestions(question,history,language)};
}
