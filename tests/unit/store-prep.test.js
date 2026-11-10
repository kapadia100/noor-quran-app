import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {PNG} from 'pngjs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const png=(p)=>PNG.sync.read(readFileSync(new URL('../../'+p,import.meta.url)));

describe('store-prep config',()=>{
 it('iOS declares why Quran Live and Qaida Live need the microphone',()=>{
  const plist=read('ios/App/App/Info.plist');
  expect(plist).toMatch(/<key>NSMicrophoneUsageDescription<\/key>\s*<string>[^<]*Quran Live[^<]*Qaida Live[^<]*<\/string>/);
  expect(plist).not.toMatch(/NSCameraUsageDescription|NSContactsUsageDescription/)});
 it('Android asks only for the audio permissions the live tutors need',()=>{
  const xml=read('android/app/src/main/AndroidManifest.xml');
  expect(xml).toContain('android.permission.RECORD_AUDIO');
  expect(xml).toContain('android.permission.MODIFY_AUDIO_SETTINGS');
  for(const extra of ['CAMERA','READ_CONTACTS','READ_SMS','RECORD_AUDIO_BACKGROUND','ACCESS_BACKGROUND_LOCATION','READ_PHONE_STATE'])expect(xml).not.toContain(extra)});
 it('the adhan file is a Copy Bundle Resource on iOS and matches the Android raw file',()=>{
  const proj=read('ios/App/App.xcodeproj/project.pbxproj');
  expect(proj).toMatch(/adhan\.wav in Resources/);
  expect(proj).toMatch(/path = adhan\.wav;/);
  const web=readFileSync(new URL('../../public/adhan.wav',import.meta.url));
  const android=readFileSync(new URL('../../android/app/src/main/res/raw/adhan.wav',import.meta.url));
  const ios=readFileSync(new URL('../../ios/App/App/adhan.wav',import.meta.url));
  expect(Buffer.compare(web,android)).toBe(0);
  expect(Buffer.compare(web,ios)).toBe(0)});
 it('tajweed surah files are in the service-worker shell and the cache name moved past v99',()=>{
  const sw=read('public/sw.js');
  expect(sw).toMatch(/const C='qsafar-v100'/);
  expect(sw).not.toMatch(/qsafar-v99/);
  expect(sw).toMatch(/offline\/tj\/\$\{i\+1\}\.json/);
  expect(sw).toMatch(/\{length:114\}/);
  const n=(sw.match(/offline\/tj\//g)||[]).length;
  expect(n).toBeGreaterThan(0)});
 it('FAQ, license and listing text match the app',()=>{
  const faq=read('src/features.js');
  expect(faq).toContain('Urdu Kanz ul Iman');
  expect(faq).toContain('Speech models for the Live tutors need a first download (about 19 MB)');
  expect(faq).toContain('Search, recitation audio, and hadith audio still need the network');
  expect(faq).toContain('All rights reserved, Aamir Kapadia');
  expect(faq).toContain('privacy.html');
  expect(faq).not.toContain('mushaf pages are bundled');
  const license=read('LICENSE');
  expect(license).toMatch(/All rights reserved/);
  expect(license).toMatch(/Aamir Kapadia/);
  expect(license).not.toMatch(/\bMIT\b|\bApache\b|GNU General Public/);
  const store=read('docs/APP_DETAILS.md');
  expect(store).toContain('17 reciters');
  expect(store).toContain('Six hadith books');
  expect(store).toContain('GoatCounter');
  expect(store).not.toMatch(/30\+ (famous )?reciters/);
  expect(store).not.toMatch(/Ibn Majah and more/);
  expect(store).not.toMatch(/no tracking/);
  expect(store).toContain('https://kapadia100.github.io/noor-quran-app/privacy.html')});
 it('native icons and splash use the current Quran Safar artwork, not the old star or the Capacitor mark',()=>{
  const brand=png('public/icon-512.png');
  const corner=(im,x,y)=>{const i=(y*im.width+x)*4;return [im.data[i],im.data[i+1],im.data[i+2]]};
  const bg=corner(brand,2,2);
  const close=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<=12);
  const ios=png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  expect([ios.width,ios.height]).toEqual([1024,1024]);
  let opaque=true;for(let i=3;i<ios.data.length;i+=4000)if(ios.data[i]!==255)opaque=false;expect(opaque).toBe(true);
  expect(close(corner(ios,8,8),bg)).toBe(true);
  const launcher=png('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
  expect([launcher.width,launcher.height]).toEqual([192,192]);
  expect(close(corner(launcher,2,2),bg)).toBe(true);
  const fg=png('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png');
  expect([fg.width,fg.height]).toEqual([432,432]);
  const splash=png('android/app/src/main/res/drawable/splash.png');
  expect([splash.width,splash.height]).toEqual([480,320]);
  const sc=corner(splash,2,2);
  // brand teal field, not the old white Capacitor splash
  expect(sc[0]).toBeLessThan(40);expect(sc[1]).toBeGreaterThan(sc[0]);expect(sc[2]).toBeGreaterThan(sc[0]);
  const mid=corner(splash,Math.floor(splash.width/2),Math.floor(splash.height/2));
  expect(mid).not.toEqual(sc);
  const iosSplash=png('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png');
  expect([iosSplash.width,iosSplash.height]).toEqual([2732,2732]);
  expect(corner(iosSplash,4,4)[0]).toBeLessThan(40);
  const play=png('icons/play-icon-512.png');
  expect([play.width,play.height]).toEqual([512,512]);
  const store=png('icons/ios-icon-1024.png');
  expect([store.width,store.height]).toEqual([1024,1024])});
});
