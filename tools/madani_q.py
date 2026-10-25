import json,re
BASE='/workspace/quran-app/public/offline/s/ar/'
LET=re.compile('[\u0621-\u064A\u0671]')
BIS=len('بسمٱللهٱلرحمنٱلرحيم')
def cons(t): return re.sub('[^\u0621-\u064A\u0671]','',t)
def ayahs(s):
    j=json.load(open(BASE+f'{s}.json',encoding='utf8'))
    out=[]
    for a,t in enumerate(j,1):
        tk=t.strip().split()
        if a==1 and s not in (1,9) and len(tk)>4 and cons(tk[0])=='بسم' and cons(tk[3])=='\u0671لرحيم':
            tk=tk[4:]
        out.append(tk)
    return out
def words(s):
    for a,tk in enumerate(ayahs(s),1):
        i=0
        for t in tk:
            if not LET.search(t): continue
            i+=1
            yield (s,a,i),t
def tokens(s):
    """per ayah: list of (idx or None, token)"""
    for a,tk in enumerate(ayahs(s),1):
        i=0;row=[]
        for t in tk:
            if LET.search(t): i+=1;row.append((i,t))
            else: row.append((None,t))
        yield a,row
