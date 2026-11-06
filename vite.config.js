import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
export default defineConfig({plugins:[{name:'temple-offline',generateBundle(_,bundle){const assets=Object.keys(bundle).filter(p=>!p.endsWith('.map'));const version=createHash('sha256').update(Object.values(bundle).map(b=>b.code||String(b.source)).join('')).digest('hex').slice(0,12);const files=['/','/offline.html','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png',...assets.map(p=>'/'+p)];this.emitFile({type:'asset',fileName:'sw.js',source:`const CACHE='temple-${version}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{const r=event.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname==='/sw.js')return;if(r.mode==='navigate'){event.respondWith(fetch(r).then(response=>{if(!response.ok)throw Error('offline');const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put('/',copy)));return response;}).catch(async()=>await caches.match('/')||await caches.match('/offline.html')));return;}if(FILES.includes(u.pathname))event.respondWith(caches.open(CACHE).then(async c=>await c.match(u.pathname,{ignoreVary:true})||fetch(r)));});`});}}]});

