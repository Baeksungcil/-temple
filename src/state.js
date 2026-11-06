export function seoulHour(date = new Date()) { const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date); return Number(parts.find(p=>p.type==='hour').value)+Number(parts.find(p=>p.type==='minute').value)/60; }
export function daylight(hour) { return Math.max(0, Math.min(1, Math.sin((hour-6)/12*Math.PI)*1.3)); }
export function validGtm(id) { return /^GTM-[A-Z0-9]+$/.test(id || ''); }
export function safeRead(storage) { try{return storage.getItem('temple-consent-v1');}catch{return null;} }
