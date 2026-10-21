(()=>{
const header=document.getElementById('site-header'),toggle=document.getElementById('nav-toggle'),nav=document.getElementById('site-navigation'),solar=document.getElementById('solar-menu-toggle'),submenu=document.getElementById('solar-submenu');if(!header||!toggle||!nav)return;
const small=matchMedia('(max-width:1250px)');header.classList.add('nav-ready');
function setSolar(open,focus=false){if(!solar)return;solar.setAttribute('aria-expanded',String(open));submenu.hidden=!open;if(focus)solar.focus()}
function setOpen(open,focus=false){header.classList.toggle('nav-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.lastElementChild.textContent=open?'×':'☰';if(!open)setSolar(false);if(focus)toggle.focus()}
toggle.addEventListener('click',()=>setOpen(!header.classList.contains('nav-open')));
solar?.addEventListener('click',()=>setSolar(submenu.hidden));
nav.addEventListener('click',e=>{const item=e.target.closest('a,button');if(!item||item===solar)return;setSolar(false);if(small.matches)setOpen(false,item.tagName==='BUTTON')});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(submenu&&!submenu.hidden){e.preventDefault();setSolar(false,true)}else if(header.classList.contains('nav-open')){e.preventDefault();setOpen(false,true)}});
document.addEventListener('click',e=>{if(!e.target.closest('.solar-nav'))setSolar(false);if(!header.contains(e.target)&&header.classList.contains('nav-open'))setOpen(false)});
header.addEventListener('focusout',()=>{setTimeout(()=>{if(!header.querySelector('.solar-nav')?.contains(document.activeElement))setSolar(false)},0)});
small.addEventListener('change',()=>setOpen(false));
})();
