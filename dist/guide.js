import {aiAvailable,askAI,copy} from './guide-ai.js';
import {language} from './languages.js';
import {names,overviews,facts,discoverySources} from './locale-content.js';
import {answer,newSession,ui,quizItems} from './guide-engine.js';
const $=id=>document.getElementById(id),panel=$('space-guide'),log=$('guide-messages'),suggestions=$('guide-suggestions');
let aiEnabled=false,history=[],pending=null,version=0;
let previousFocus,session=newSession(),replyLanguage=language,lastRandom=-1,lastQuiz=-1;
panel.setAttribute('data-no-translate','');$('guide-toggle').setAttribute('data-no-translate','');const followups=document.createElement('div');followups.id='guide-followups';suggestions.before(followups);
function message(text,role='bot',source,lang=replyLanguage){const t=ui[lang],row=document.createElement('div');row.className='guide-message '+role;row.lang=lang==='zh'?'zh-Hans':lang;const label=document.createElement('small');label.textContent=role==='bot'?t.guide:t.you;const body=document.createElement('p');body.textContent=text;row.append(label,body);if(source){const link=document.createElement('a');link.href=source;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t.source;row.append(link);}log.append(row);while(log.children.length>70)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;return row;}
function paint(){const t=ui[language];$('guide-toggle').textContent='✧ '+t.ask;$('guide-title').textContent='✧ '+t.guide;$('guide-title').nextElementSibling.textContent=language==='my'?'သင်၏ အာကာသလေ့လာရေးအဖော်':language==='zh'?'你的太空探索伙伴':'Your space learning companion';$('guide-random').textContent=t.random;$('guide-quiz').textContent=t.quiz;$('guide-clear').textContent=t.clear;$('guide-clear').setAttribute('aria-label',t.clear);$('guide-input').placeholder=t.placeholder;$('guide-input').setAttribute('aria-label',t.placeholder);$('guide-form').querySelector('label').textContent=t.placeholder;panel.querySelector('.guide-disclaimer').textContent=copy[language][aiEnabled?'ready':'offline'];$('guide-close').setAttribute('aria-label',language==='my'?'လမ်းညွှန်ပိတ်ရန်':language==='zh'?'关闭向导':'Close guide');$('guide-form').querySelector('button').textContent='↑';$('guide-form').querySelector('button').setAttribute('aria-label',t.ask);}
// Use a selector rather than an ID for the send button.
function suggestionsFor(topic){suggestions.replaceChildren();followups.replaceChildren();const t=ui[replyLanguage];if(topic!==null&&topic!==undefined){for(const action of ['more','simple','another']){const b=document.createElement('button');b.type='button';b.textContent=t[action];b.onclick=()=>ask(t[action],action);followups.append(b);}facts(replyLanguage).slice(topic*3,topic*3+3).forEach(f=>{const b=document.createElement('button');b.textContent=f[0];b.type='button';b.onclick=()=>ask(f[0]);suggestions.append(b);});}else{for(const i of [3,9,10,8]){const b=document.createElement('button');b.type='button';b.textContent=names[replyLanguage][i];b.onclick=()=>ask(t.about+names[replyLanguage][i]);suggestions.append(b);}}}
function cancelRequest(){version++;pending?.abort();pending=null;panel.removeAttribute('aria-busy');}
async function ask(input,intent=null){
 const text=input.trim().slice(0,500);if(!text||pending)return;
 const local=answer(text,session,replyLanguage,intent);replyLanguage=local.lang;
 message(text,'user',null,replyLanguage);$('guide-input').value='';
 if(!aiEnabled){message(local.answer,'bot',local.source);suggestionsFor(local.topic);return;}
 const turn=version,controller=new AbortController();pending=controller;panel.setAttribute('aria-busy','true');
 const waiting=message(copy[replyLanguage].thinking);const timer=setTimeout(()=>controller.abort(),30000);
 try{const response=await askAI(text,history,replyLanguage,controller.signal);if(turn!==version)return;waiting.remove();message(response);history.push({role:'user',content:text},{role:'assistant',content:response});history=history.slice(-6);suggestionsFor(local.topic);if(local.topic===null){for(const action of ['more','simple','another']){const b=document.createElement('button');b.type='button';b.textContent=ui[replyLanguage][action];b.onclick=()=>ask(ui[replyLanguage][action],action);followups.append(b);}}}
 catch{if(turn!==version)return;waiting.remove();message(copy[replyLanguage].fallback+'\n\n'+local.answer,'bot',local.source);suggestionsFor(local.topic);}
 finally{clearTimeout(timer);if(turn===version){pending=null;panel.removeAttribute('aria-busy');}}
}
function randomIndex(length,last){let index=Math.floor(Math.random()*(length-(last>=0?1:0)));if(last>=0&&index>=last)index++;return index;}
function welcome(){replyLanguage=language;message(aiEnabled?copy[language].welcome:ui[language].welcome);suggestionsFor(null);}
function open(){previousFocus=document.activeElement;panel.hidden=false;$('guide-toggle').setAttribute('aria-expanded','true');$('guide-input').focus();}
function close(){panel.hidden=true;$('guide-toggle').setAttribute('aria-expanded','false');(previousFocus||$('guide-toggle')).focus();}
$('guide-toggle').onclick=()=>panel.hidden?open():close();$('guide-close').onclick=close;panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});$('guide-form').addEventListener('submit',e=>{e.preventDefault();ask($('guide-input').value);});
$('guide-random').onclick=()=>{lastRandom=randomIndex(36,lastRandom);ask(facts(replyLanguage)[lastRandom][0]);};
$('guide-clear').onclick=()=>{cancelRequest();history=[];log.replaceChildren();session=newSession();welcome();};
$('guide-quiz').onclick=()=>{if(pending)return;history=[];lastQuiz=randomIndex(quizItems.length,lastQuiz);const quiz=quizItems[lastQuiz],lang=replyLanguage,t=ui[lang],row=message(quiz.q[lang]),buttons=document.createElement('div');buttons.className='quiz-answers';quiz.choices.forEach((topic,i)=>{const b=document.createElement('button');b.type='button';b.textContent=names[lang][topic];b.onclick=()=>{buttons.querySelectorAll('button').forEach(x=>x.disabled=true);b.classList.add(i===quiz.correct?'correct':'incorrect');buttons.children[quiz.correct].classList.add('correct');message(names[lang][topic],'user',null,lang);message((i===quiz.correct?t.correct:t.wrong+names[lang][quiz.choices[quiz.correct]])+'\n\n'+overviews[lang][quiz.topic],'bot',discoverySources[quiz.topic],lang);session.topic=quiz.topic;session.fact=null;session.seen.clear();suggestionsFor(quiz.topic);};buttons.append(b);});row.append(buttons);log.scrollTop=log.scrollHeight;};
window.addEventListener('orbit-language-change',()=>{cancelRequest();history=[];paint();log.replaceChildren();session=newSession();welcome();});paint();welcome();

aiAvailable().then(available=>{aiEnabled=available;paint();if(available){log.replaceChildren();session=newSession();welcome();}});
