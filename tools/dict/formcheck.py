exec(open('build.py').read().split("bad=[];out=[]")[0])
ex=lambda x:re.sub(r'[\u06D6-\u06ED\u0640\s]','',x)
rows=[]
for r,(ky,c) in enumerate(top,1):
    w=d['words'][r-1];h=sk(w['h']);cnt=collections.Counter()
    for k in M.get(ky,()):
        segs=Wd[k]
        if ex(''.join(x[0] for x in segs))==ex(w['h']):
            core=[x for x in segs if 'PREF' not in x[2] and 'SUFF' not in x[2].split('|')]
            for x in core[-1:]:cnt[tuple(t for t in x[2].split('|') if re.match(r'^([123]?[MF]?[SDP]|PERF|IMPF|IMPV|PASS|NOM|ACC|GEN|DET)$',t))]+=1
    tg=cnt.most_common(1)[0][0] if cnt else ()
    num=[t for t in tg if re.match(r'^[123]?[MF]?[SDP]$',t)]
    if (num and num[0][-1] in 'DP') or (num and num[0]!='3MS' and any(t in tg for t in ('PERF','IMPF','IMPV'))) :rows.append((r,w['h'],'|'.join(tg),w['e'],w['u'],w['p']))
print(len(rows))
for x in rows:print(*x,sep=' ¦ ')
