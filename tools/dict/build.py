# Builds per-word detail data (ayah counts + highlighted examples) for the dictionary from the Quranic Arabic Corpus
# morphology (lemma basis) aligned to the app's own Quran text. Never invents: every field is derived and audited.
import pickle,json,re,collections,sys
D='/workspace/dict/';APP='/workspace/quran-app/public/offline/'
top,occ,T,_,_=pickle.load(open(D+'ent.pkl','rb'));W,EN,UR=pickle.load(open(D+'base.pkl','rb'));A2=pickle.load(open(D+'app2.pkl','rb'))
AR={s:json.load(open(f'{APP}s/ar/{s}.json')) for s in range(1,115)}
ENT={s:json.load(open(f'{APP}s/en.sahih/{s}.json')) for s in range(1,115)}
URT={s:json.load(open(f'{APP}s/ur.jalandhry/{s}.json')) for s in range(1,115)}
MARK=re.compile(r'^[\u06D6-\u06ED]+$')
def words(s,a):
    toks=AR[s][a-1].split(' ');ix=[i for i,t in enumerate(toks) if not MARK.match(t)]
    nC=max(k[2] for k in W if k[:2]==(s,a)) if False else NW[(s,a)]
    return ix[len(ix)-nC:],toks  # the app's ayah 1 can carry the Bismillah in front: align from the end
# alignment: corpus word i (1-based) -> app token index
def tokidx(s,a,w):
    ix,toks=words(s,a)
    return ix[w-1] if w-1<len(ix) else None
def sk(x):return re.sub(r'[^\u0621-\u063a\u0641-\u064a]','',x).replace('ٱ','ا')
NW=collections.Counter(k[:2] for k in W)
d=json.load(open(APP+'x/dict.json'))
# Counting basis (stated in the UI): number of ayahs in which this word occurs, alone or joined with prefixes/suffixes,
# from the corpus lemma (lemma + root + word class); يَوْمَئِذٍ is its own entry. Recomputed straight from the text file.
def keys_of(segs):
    tg=lambda x:x[2].split('|');F=lambda x:dict(t.split(':',1) for t in tg(x) if ':' in t)
    if any(F(x).get('LEM')=='يَوْم' for x in segs) and any(sk(x[0])=='ئذ' for x in segs):return {('إِذ','يوم','N')}
    K=set()
    for x in segs:
        f=F(x)
        if 'LEM' in f:K.add((f['LEM'],f.get('ROOT'),x[1]))
        elif 'PRON' in tg(x) and 'SUFF' not in tg(x):  # independent pronoun (هُوَ…), not an attached suffix
           K.update(('PRON:'+t,None,'N') for t in tg(x) if re.match(r'^[123][MF]?[SDP]$',t))
        elif 'INL' in tg(x):K.add(('PRON:None',None,'P'))
    return K
Wd=collections.OrderedDict()
for line in open(D+'quran-morphology.txt',encoding='utf8'):
    p=line.rstrip('\n').split('\t')
    if len(p)<4:continue
    s_,a_,w_,_=map(int,p[0].split(':'));Wd.setdefault((s_,a_,w_),[]).append((p[1],p[2],p[3]))
M=collections.defaultdict(set)
for k,segs in Wd.items():
    for ky in keys_of(segs):M[ky].add(k)
bad=[];out=[];REF={}
keys={k[0][0]:k[0] for k in top}
for r,(ky,c) in enumerate(top,1):
    w=d['words'][r-1];assert w['l']==ky[0],(r,w['l'],ky)
    oc=M.get(ky,set());ay=sorted(set(k[:2] for k in oc))
    if not ay:bad.append(('zero',r,ky))
    ex=[]
    for smp in w['s']:
        s,a,wi=smp[0],smp[1],smp[2];ti=tokidx(s,a,wi)
        toks=AR[s][a-1].split(' ')
        if ti is None or (s,a,wi) not in set(oc):bad.append(('ex',r,s,a,wi));continue
        if sk(toks[ti])!=sk(''.join(x[0] for x in Wd[(s,a,wi)])):bad.append(('align',r,s,a,wi,toks[ti],EN[(s,a,wi)][0]));continue
        ex.append([s,a,ti,smp[6]])
    if len(ex)==2 and ex[0][:2]==ex[1][:2]:
        # both samples in one ayah: replace the second with the shortest other ayah containing the word (deterministic)
        cands=sorted((k for k in oc if k[:2]!=tuple(ex[0][:2])),key=lambda k:(len(AR[k[0]][k[1]-1]),k))
        for k in cands:
            ti=tokidx(*k);toks=AR[k[0]][k[1]-1].split(' ')
            if ti is not None and sk(toks[ti])==sk(''.join(x[0] for x in Wd[k])):
                au='wbw/%03d_%03d_%03d.mp3'%k;ex[1]=[k[0],k[1],ti,au];w['s'][1]=[k[0],k[1],k[2],'','','',au];break
        else:bad.append(('dup',r))
    w['na']=len(ay);w['nt']=len(oc);w['x']=ex
    for i,smp in enumerate(w['s']):
        txt=AR[smp[0]][smp[1]-1]
        if smp[1]==1 and smp[0] not in (1,9):  # the app prefixes the Bismillah to ayah 1; it is not part of the ayah
            assert sk(''.join(txt.split(' ')[:4]))==sk('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'),smp[:2];txt=' '.join(txt.split(' ')[4:])
            if i<len(ex):ex[i][2]-=4
        smp[3]=txt;smp[4]=ENT[smp[0]][smp[1]-1];smp[5]=URT[smp[0]][smp[1]-1]
        if i<len(ex):assert sk(txt.split(' ')[ex[i][2]])==sk(''.join(x[0] for x in Wd[tuple(smp[:3])])),(r,smp[:3])
    out.append(w)
exec(open(__file__.rsplit('/',1)[0]+'/fixes.py' if '/' in __file__ else 'fixes.py').read())
for r,(e,u) in FIX.items():d['words'][r-1]['e']=e;d['words'][r-1]['u']=u
for r,(h,t) in HFIX.items():d['words'][r-1]['h']=h;d['words'][r-1]['t']=t
d['basis']='ayahs containing the lemma (alone or with attached prefixes/suffixes), Quranic Arabic Corpus v0.4 segmentation'
print('bad',len(bad));[print(b) for b in bad[:40]]
import pickle as _p
print('na range',min(x['na'] for x in out),max(x['na'] for x in out))
import os
RF='/workspace/quran-app/tests/fixtures/dict-word-ref.json';ref=json.load(open(RF))
for w in d['words']:
    for smp in w['s']:
        k=f'{smp[0]}:{smp[1]}:{smp[2]}'
        if k not in ref:ref[k]=[''.join(x[0] for x in Wd[tuple(smp[:3])]),smp[6]];print('ref+',k,ref[k])
if '--write' in sys.argv and not bad:
    json.dump(ref,open(RF,'w'),ensure_ascii=False,separators=(',',':'))
    json.dump(d,open(APP+'x/dict.json','w'),ensure_ascii=False,separators=(',',':'));print('written')
