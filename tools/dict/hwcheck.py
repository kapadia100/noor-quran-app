exec(open('build.py').read().split("bad=[];out=[]")[0])
ex=lambda x:re.sub(r'[\u06D6-\u06ED\u0640\s]','',x)
for r,(ky,c) in enumerate(top,1):
    w=d['words'][r-1];cnt=collections.Counter()
    for k in M.get(ky,()):
        segs=Wd[k];core=[x for x in segs if not ('PREF' in x[2] or '|SUFF' in x[2] or x[2].startswith('SUFF'))]
        cnt[ex(''.join(x[0] for x in core))]+=1
    hc=cnt.get(ex(w['h']),0);top1=cnt.most_common(1)[0]
    if hc<0.2*top1[1]:print(r,w['h'],hc,top1,w['l'],w['e'])
