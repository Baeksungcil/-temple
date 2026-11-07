import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGzip} from 'node:zlib';
const base=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.m4a':'audio/mp4','.png':'image/png','.hdr':'application/octet-stream','.webmanifest':'application/manifest+json'};
export async function createMobileGateway({port=8810,backendPort=8790}={}){
 const dist=path.join(base,'dist'),files=new Map();
 async function visit(dir,prefix=''){for(const entry of await fsp.readdir(dir,{withFileTypes:true})){const relative=prefix+'/'+entry.name;if(entry.isDirectory())await visit(path.join(dir,entry.name),relative);else if(types[path.extname(entry.name)])files.set(relative,path.join(dir,entry.name));}}
 await visit(dist);
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(pathname==='/__mobile_health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({service:'temple-mobile-preview',version:1}));return;}
  if(pathname==='/')pathname='/index.html';
  if(pathname.includes('\\')||pathname.includes('\0')||!files.has(pathname)){res.writeHead(404).end('Not found');return;}
  try{
   const filename=files.get(pathname),extension=path.extname(filename);res.setHeader('Content-Type',types[extension]);if(pathname==='/sw.js')res.setHeader('Service-Worker-Allowed','/');
   const stat=await fsp.stat(filename);res.setHeader('Accept-Ranges','bytes');if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416).end();return;}const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}res.writeHead(206,{'Content-Range':'bytes '+start+'-'+end+'/'+stat.size,'Content-Length':end-start+1});if(req.method==='HEAD')res.end();else fs.createReadStream(filename,{start,end}).pipe(res);return;}if(req.method==='HEAD'){res.setHeader('Content-Length',stat.size);res.end();return;}
   if(pathname==='/index.html'){let html=await fsp.readFile(filename,'utf8');html=html.replace('<head>','<head><script>globalThis.TEMPLE_PREVIEW_WS=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/world";</script>');res.end(html);return;}
   const stream=fs.createReadStream(filename);stream.on('error',()=>res.destroy());if(/\bgzip\b/.test(req.headers['accept-encoding']||'')&&['.js','.css','.svg','.hdr','.webmanifest','.html'].includes(extension)){res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');stream.pipe(createGzip()).pipe(res);}else stream.pipe(res);
  }catch{if(!res.headersSent)res.writeHead(500);res.end('Preview unavailable');}
 });
 server.on('upgrade',async(req,socket,head)=>{
  const allowed=new Set(['http://127.0.0.1:'+server.address().port,'http://localhost:'+server.address().port]);try{const config=JSON.parse(await fsp.readFile(path.join(base,'public-origin.json'),'utf8'));if(typeof config.origin==='string'&&/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(config.origin))allowed.add(config.origin);}catch{}
  if(req.url!=='/world'||!allowed.has(req.headers.origin)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  const upstream=net.connect(backendPort,'127.0.0.1');
  upstream.once('connect',()=>{const headers={...req.headers,host:'127.0.0.1:'+backendPort,origin:'http://127.0.0.1:5182'};let request='GET /world HTTP/1.1\r\n';for(const[key,value]of Object.entries(headers))if(value!==undefined)request+=key+': '+(Array.isArray(value)?value.join(', '):value)+'\r\n';upstream.write(request+'\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
  upstream.on('error',()=>{if(!socket.destroyed)socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');});socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());upstream.on('close',()=>socket.destroy());
 });
 const ready=new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server.address().port));});
 return{server,ready,close:()=>new Promise(r=>server.close(r))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const gateway=await createMobileGateway();console.log('Temple mobile gateway http://127.0.0.1:'+await gateway.ready); }
