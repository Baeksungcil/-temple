"""Render the project's MIDI melodies into browser-compatible organ WAV files."""
from pathlib import Path
import array, bisect, json, math, struct, wave

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'MP3'/'Hymn'
OUTPUT=ROOT/'public'/'music'/'hymns'
OUTPUT.mkdir(exist_ok=True)
RATE=22050
TITLES=['나 같은 죄인 살리신','거룩 거룩 거룩 전능하신 주님','죄짐 맡은 우리 구주','기쁘다 구주 오셨네','고요한 밤 거룩한 밤','시온성과 같은 교회','내 평생에 가는 길','내 주를 가까이 하게 함은','내 맘의 주여 소망 되소서','내 주는 강한 성이요']

def parse_midi(data):
    if data[:4]!=b'MThd': raise ValueError('Missing MIDI header')
    header_size=struct.unpack_from('>I',data,4)[0]
    _,tracks,division=struct.unpack_from('>HHH',data,8)
    if division&0x8000: raise ValueError('SMPTE timing is not supported')
    offset=8+header_size; notes=[]; tempos=[(0,500000)]
    for _ in range(tracks):
        if data[offset:offset+4]!=b'MTrk': raise ValueError('Missing track')
        size=struct.unpack_from('>I',data,offset+4)[0]; chunk=data[offset+8:offset+8+size];offset+=8+size
        pos=0; tick=0; running=None; playing={}
        def variable():
            nonlocal pos
            value=0
            while True:
                b=chunk[pos];pos+=1;value=(value<<7)|(b&127)
                if b<128: return value
        while pos<len(chunk):
            tick+=variable();status=chunk[pos]
            if status>=128:pos+=1
            elif running is not None:status=running
            else:raise ValueError('Invalid running status')
            if status==255:
                kind=chunk[pos];pos+=1;size=variable();payload=chunk[pos:pos+size];pos+=size
                if kind==81:tempos.append((tick,int.from_bytes(payload,'big')))
                if kind==47:break
                continue
            if status in (240,247):pos+=variable();continue
            running=status;kind=status&240;channel=status&15
            count=1 if kind in (192,208) else 2
            values=chunk[pos:pos+count];pos+=count
            if kind not in (128,144):continue
            key=(channel,values[0]);velocity=values[1]
            if kind==144 and velocity:
                playing[key]=(tick,velocity)
            elif key in playing:
                start,vel=playing.pop(key);notes.append((start,tick,key[1],vel))
        for (_,pitch),(start,vel) in playing.items():notes.append((start,tick,pitch,vel))
    # Build a tick-to-seconds map, honoring tempo changes.
    changes=dict(tempos); ticks=sorted(changes); seconds=[0.0]
    for i in range(1,len(ticks)):seconds.append(seconds[-1]+(ticks[i]-ticks[i-1])*changes[ticks[i-1]]/division/1e6)
    def clock(tick):
        i=bisect.bisect_right(ticks,tick)-1
        return seconds[i]+(tick-ticks[i])*changes[ticks[i]]/division/1e6
    return [(clock(start),clock(end),pitch,vel) for start,end,pitch,vel in notes]

manifest=[]
for index,source in enumerate(sorted(SOURCE.glob('*.mid'))):
    notes=parse_midi(source.read_bytes())
    assert notes,source
    duration=max(n[1] for n in notes)+1.1
    samples=array.array('f',[0])*math.ceil(duration*RATE)
    for start,end,pitch,velocity in notes:
        frequency=440*2**((pitch-69)/12);length=max(.04,end-start);count=round((length+.18)*RATE);base=round(start*RATE)
        amplitude=.3*velocity/127
        for i in range(count):
            t=i/RATE;attack=min(1,t/.025);release=min(1,max(0,(length+.18-t)/.18))
            phase=2*math.pi*frequency*t
            tone=(math.sin(phase)+.24*math.sin(2*phase)+.1*math.sin(3*phase))/1.34
            if base+i<len(samples):samples[base+i]+=amplitude*tone*attack*release
    peak=max(abs(v) for v in samples);gain=min(1,.82/max(peak,.001))
    pcm=array.array('h',(round(max(-1,min(1,v*gain))*32767) for v in samples))
    filename=source.stem+'.wav'
    with wave.open(str(OUTPUT/filename),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(pcm.tobytes())
    manifest.append({'title':TITLES[index],'src':'/music/hymns/'+filename,'duration':round(duration,2),'source':source.name})
    print(source.name,round(duration,1),'seconds',flush=True)
(ROOT/'src'/'hymns.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
