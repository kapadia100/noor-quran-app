// Local notifications for the web/PWA build (the native build uses Capacitor LocalNotifications in prayer.js).
// Browsers have no shipped API to schedule a notification for a future time, so we combine every mechanism that exists:
//  1. Notification Triggers (showTrigger) — used only if the browser exposes it (no shipping browser does today).
//  2. In-app timers while the app is open/backgrounded (shown through the service worker so Android accepts them).
//  3. The plan is saved in IndexedDB; the service worker shows anything that became due whenever it wakes:
//     periodic background sync (installed Chrome/Edge on Android), app launch/resume, any network request, or a push.
const DB = 'qs-notify', ST = 'kv';
let dbp = null;
function idb() { return dbp ||= new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error) } }) }
export async function kvGet(k) { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction(ST).objectStore(ST).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) }) }
export async function kvSet(k, v) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(ST, 'readwrite'); t.objectStore(ST).put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error) }) }
export const supported = () => typeof window !== 'undefined' && 'Notification' in window;
export const permission = () => supported() ? Notification.permission : 'unsupported';
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
/** iPhone/iPad Safari tab: Web notifications exist only after "Add to Home Screen" (iOS 16.4+). */
export const needsHomeScreen = () => isIOS() && !standalone();
export const triggers = () => supported() && 'showTrigger' in Notification.prototype && typeof window.TimestampTrigger === 'function';
async function reg() { if (!('serviceWorker' in navigator)) return null; try { return (await Promise.race([navigator.serviceWorker.getRegistration(), new Promise(r => setTimeout(r, 1500))])) || null } catch { return null } }
const BASE = (import.meta.env && import.meta.env.BASE_URL) || './';
function opts(x, g) { return { body: x.body, tag: x.id, icon: BASE + 'icon-192.png', badge: BASE + 'favicon-32.png', lang: x.lang, dir: x.dir, timestamp: x.at, data: { url: x.url || BASE, g, id: x.id } } }
export async function show(title, o) { const r = await reg(); if (r) return r.showNotification(title, o); return new Notification(title, o) }
/** Ask for permission (call from a tap). Resolves 'granted' | 'denied' | 'default' | 'unsupported'. */
export async function ask() { if (!supported()) return 'unsupported'; if (Notification.permission !== 'default') return Notification.permission; try { return await Notification.requestPermission() } catch { return Notification.permission } }
let timers = {};
async function markShown(id) { const s = (await kvGet('shown').catch(() => null)) || {}; if (s[id]) return false; s[id] = Date.now(); for (const k in s) if (Date.now() - s[k] > 3 * 864e5) delete s[k]; await kvSet('shown', s).catch(() => {}); return true }
async function fire(x, g, onFire) { if (!(await markShown(x.id))) return; try { await show(x.title, opts(x, g)) } catch { /* ignore */ } onFire?.(x) }
/** Save + arm one group of notifications. items: [{id,at:Date|number,title,body,url?,lang?,dir?}] */
export async function arm(group, items, { onFire } = {}) {
  const now = Date.now(); const list = items.map(x => ({ ...x, at: +x.at })).filter(x => x.at > now - 6e4);
  const plans = (await kvGet('plans').catch(() => null)) || {}; plans[group] = list; await kvSet('plans', plans).catch(() => {});
  (timers[group] || []).forEach(clearTimeout); timers[group] = [];
  const r = await reg(); let mode = 'open';
  if (r && triggers()) {
    try { const old = await r.getNotifications({ includeTriggered: true }); old.filter(n => n.data?.g === group).forEach(n => n.close());
      for (const x of list) await r.showNotification(x.title, { ...opts(x, group), showTrigger: new window.TimestampTrigger(x.at) }); mode = 'trigger' } catch { mode = 'open' }
  }
  if (mode !== 'trigger') timers[group] = list.filter(x => x.at - now < 2 ** 31 - 1).map(x => setTimeout(() => fire(x, group, onFire), Math.max(0, x.at - now)));
  let bg = false;
  if (r && 'periodicSync' in r) { try { const st = await navigator.permissions.query({ name: 'periodic-background-sync' }); if (st.state === 'granted') { await r.periodicSync.register('qs-notify', { minInterval: 36e5 }); bg = true } } catch { /* not installed */ } }
  navigator.serviceWorker?.controller?.postMessage({ type: 'qs-check' });
  return { ok: true, count: list.length, mode, bg };
}
export async function clear(group) { return arm(group, []) }
/** Ask the service worker to show anything that became due while the app was closed. */
export function wake() { try { navigator.serviceWorker?.controller?.postMessage({ type: 'qs-check' }) } catch { /* ignore */ } }
export async function test(ur) { const t = ur ? 'قرآن سفر — آزمائشی اطلاع' : 'Quran Safar — test notification'; const b = ur ? 'اطلاعات کام کر رہی ہیں ✓' : 'Notifications are working ✓'; await show(t, { body: b, tag: 'qs-test', icon: BASE + 'icon-192.png', lang: ur ? 'ur' : 'en', dir: ur ? 'rtl' : 'ltr', data: { url: BASE } }) }
