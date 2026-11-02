// One mini player for the Quran reader, Ruqyah and Qaida: prev | big gold play/pause | next, info, subtle close (= stop).
// Same markup + classes as the reader's #player (styled by `.qs-mp` / `#player` together in sakina.css).
import {pill} from './speed.js';
export const ICON={
 prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5.5" width="2.4" height="13" rx="1.2"/><path d="M18.2 6.3v11.4a1 1 0 0 1-1.55.83L8.6 13.1a1.3 1.3 0 0 1 0-2.2l8.05-5.43a1 1 0 0 1 1.55.83z"/></svg>',
 next:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="16.6" y="5.5" width="2.4" height="13" rx="1.2"/><path d="M5.8 6.3v11.4a1 1 0 0 0 1.55.83l8.05-5.43a1.3 1.3 0 0 0 0-2.2L7.35 5.47A1 1 0 0 0 5.8 6.3z"/></svg>',
 play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.6v12.8a1.1 1.1 0 0 0 1.68.93l10.05-6.4a1.1 1.1 0 0 0 0-1.86L10.18 4.67A1.1 1.1 0 0 0 8.5 5.6z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4"/><rect x="13.5" y="5" width="4" height="14" rx="1.4"/></svg>',
 close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'};
/** HTML for a mini player. ids: {root,prev,play,next,info,close}; l: labels {prev,next,play,pause,close}. */
export function miniHTML(ids,l,extra=''){return `<div id="${ids.root}" class="qs-mp" hidden><div class="pl-ctl"><button type="button" id="${ids.prev}" class="pl-b pl-s" aria-label="${l.prev}">${ICON.prev}</button><span class="pl-pw"><button type="button" id="${ids.play}" class="pl-b pl-p" aria-label="${l.pause}" data-k="pause">${ICON.pause}</button>${l.speed?pill(l.ur):''}</span><button type="button" id="${ids.next}" class="pl-b pl-s" aria-label="${l.next}">${ICON.next}</button></div><span id="${ids.info}" class="mp-info" aria-live="polite"></span><button type="button" id="${ids.close}" class="pl-x" aria-label="${l.close}">${ICON.close}</button>${extra}</div>`}
/** Sets the centre button to play or pause (only touches the DOM when it changes). */
export function setPlaying(btn,playing,l){if(!btn)return;const k=playing?'pause':'play';if(btn.dataset.k!==k){btn.dataset.k=k;btn.innerHTML=ICON[k]}btn.setAttribute('aria-label',playing?l.pause:l.play)}
