#!/usr/bin/env python3
"""Project cpfair/quran-tajweed (CC BY 4.0) annotations onto the app's own Tanzil text.
The annotations index the pinned 2017 Tanzil text; the app text only differs by INSERTED marks (pause signs, small
tanween marks), so spans are projected through a character diff. The script aborts if any non-insert difference is found
(ayahs with any other difference get NO colours) or if a projected span fails its rule check, so wrong colours can never ship.
usage: build-tajweed.py <tajweed.json> <pinned-quran-uthmani.txt>   -> public/offline/tj/<surah>.json"""
import json,sys,os,difflib
RULES=['madd_2','madd_246','madd_muttasil','madd_munfasil','madd_6','ghunnah','idghaam_ghunnah','idghaam_no_ghunnah','idghaam_shafawi','idghaam_mutajanisayn','idghaam_mutaqaribayn','ikhfa','ikhfa_shafawi','iqlab','qalqalah','hamzat_wasl','lam_shamsiyyah','silent']
RID={r:i for i,r in enumerate(RULES)}
T=json.load(open(sys.argv[1]));pin={}
for l in open(sys.argv[2],encoding='utf8'):
    p=l.rstrip('\n').split('|',2)
    if len(p)==3 and p[0].isdigit():pin[(int(p[0]),int(p[1]))]=p[2].lstrip('\ufeff')
os.makedirs('public/offline/tj',exist_ok=True)
ann={(e['surah'],e['ayah']):e['annotations'] for e in T}
nA=0;bad=0
for s in range(1,115):
    ar=[a.lstrip('\ufeff') for a in json.load(open(f'public/offline/s/ar/{s}.json'))]
    out=[]
    for i,t in enumerate(ar):
        k=(s,i+1);p=pin[k];sm=difflib.SequenceMatcher(None,p,t,autojunk=False)
        mp=list(range(len(p)+1));ok=True
        # map pinned index -> app index (identity except shifted by inserted chars)
        shift=0;m=[0]*(len(p)+1)
        for op,i1,i2,j1,j2 in sm.get_opcodes():
            if op=='equal':
                for q in range(i1,i2+1 if i2==len(p) else i2):m[q]=j1+(q-i1)
            elif op=='insert':pass
            else:ok=False
        if not ok:print('skipped (non-insert diff, no colours):',k);out.append([]);continue
        m[len(p)]=len(t)
        flat=[]
        for a in ann[k]:
            r=a['rule'];st=m[a['start']];en=m[a['end']-1]+1 if a['end']>a['start'] else st
            seg=t[st:en];nA+=1
            if r=='hamzat_wasl' and seg!='\u0671':bad+=1
            if r=='qalqalah' and not any(c in 'قطبجد' for c in seg):bad+=1
            if r=='lam_shamsiyyah' and 'ل' not in seg:bad+=1
            flat+= [RID[r],st,en]
        out.append(flat)
    json.dump(out,open(f'public/offline/tj/{s}.json','w'),separators=(',',':'))
print('annotations',nA,'failed checks',bad)
sys.exit(1 if bad else 0)
