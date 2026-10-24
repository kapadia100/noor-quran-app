#!/usr/bin/env python3
"""v3.5.1 text corrections, derived from a character-level comparison of public/offline/s/ar/*.json against an independent
Uthmani reference (Tanzil, all style options) and the King Fahd (QPC Hafs) text via quran.com.  What this applies:
  1. strips a stray U+FEFF at the start of 1:1 (the tajweed offsets of 1:1 were computed without it, so colours sat one character off);
  2. 38 words in the Quran with U+06E6 (small yeh) where both references have U+06E7 (small high yeh), e.g. 2:61 ٱلنَّبِيِّۧنَ;
  3. 6 tanween marks (U+06ED x4, U+06E2 x2) missing in 2:181, 12:39, 12:41, 13:37 - both references have them;
  4. 3 qalqalah letters missing from the tajweed data (12:39 and 12:41 ٱلسِّجْنِ, 97:1 ٱلْقَدْرِ).
Usage: fix-text-v351.py <tanzil-all-options.txt>  (idempotent)."""
import json,sys,difflib,re
TZ=sys.argv[1]
tz={}
for l in open(TZ,encoding='utf8'):
    p=l.rstrip('\n').split('|',2)
    if len(p)==3 and p[0].isdigit(): tz[(int(p[0]),int(p[1]))]=p[2]
RULES=json.load(open('scripts/tj-rule-names.json')) if False else None
QALQ=14  # index of 'qalqalah' in src/tj-rules.js RULES
rep=ins=bom=qal=0;changed=[]
for n in range(1,115):
    fa=f'public/offline/s/ar/{n}.json';ft=f'public/offline/tj/{n}.json'
    A=json.load(open(fa,encoding='utf8'));T=json.load(open(ft,encoding='utf8'));dirty=False
    for i,t in enumerate(A):
        if t.startswith('\ufeff'): A[i]=t=t[1:];bom+=1;dirty=True
        z=tz[(n,i+1)];ann=[T[i][k:k+3] for k in range(0,len(T[i]),3)]
        ops=[o for o in difflib.SequenceMatcher(None,t,z,autojunk=False).get_opcodes() if o[0]!='equal']
        new=list(t);pend=[]
        for op,i1,i2,j1,j2 in ops:
            a,b=t[i1:i2],z[j1:j2]
            if op=='replace' and a=='\u06e6' and b=='\u0640\u06e7': new[i1]='\u06e7';rep+=1;dirty=True;changed.append(f'{n}:{i+1} yeh')
            elif op=='insert' and b in('\u06ed','\u06e2'): pend.append((i1,b))
        for p,ch in sorted(pend,reverse=True):
            new.insert(p,ch);ins+=1;dirty=True;changed.append(f'{n}:{i+1} +U+{ord(ch):04X}')
            for a_ in ann:
                s,e=a_[1],a_[2]
                if s>=p: a_[1]+=1;a_[2]+=1
                elif e>=p: a_[2]+=1
        if pend or ''.join(new)!=t:
            A[i]=''.join(new)
            T[i]=[x for a_ in ann for x in a_]
    # qalqalah additions
    for (nn,aa) in [(12,39),(12,41),(97,1)]:
        if nn!=n: continue
        t=A[aa-1];ann=[T[aa-1][k:k+3] for k in range(0,len(T[aa-1]),3)]
        for m in re.finditer('[قطبجد][\u064b-\u0651\u0653-\u065f\u0670]*\u0652[\u064b-\u065f\u0670]*',t):
            s,e=m.start(),m.end()
            if any(x[0]==QALQ and x[1]<=s<x[2] for x in ann): continue
            if (nn,aa)==(12,39) or (nn,aa)==(12,41):
                if t[s]!='ج': continue
            if (nn,aa)==(97,1) and t[s]!='د': continue
            ann.append([QALQ,s,e]);qal+=1;dirty=True;changed.append(f'{n}:{aa} qalqalah@{s}')
        ann.sort(key=lambda x:x[1]);T[aa-1]=[x for a_ in ann for x in a_]
    if dirty:
        json.dump(A,open(fa,'w',encoding='utf8'),ensure_ascii=False,separators=(',',':'))
        json.dump(T,open(ft,'w',encoding='utf8'),ensure_ascii=False,separators=(',',':'))
print('bom stripped',bom,'yeh fixed',rep,'marks inserted',ins,'qalqalah added',qal)
print('\n'.join(changed[:60]))
