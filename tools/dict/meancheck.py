exec(open('build.py').read().split("bad=[];out=[]")[0])
STOP=set('a an the of to in on is be (e.g. e.g. he she it they we you i his her their our my your was were will who which what that this'.split())
def ws(t):return set(re.findall(r'[a-z]+',t.lower()))-STOP
flag=[]
for r,(ky,c) in enumerate(top,1):
    w=d['words'][r-1];g=collections.Counter()
    for k in M.get(ky,()):
        if k in EN:g.update(ws(EN[k][1]))
    e=ws(w['e']);hit=e&set(x for x,_ in g.most_common(40))
    if not hit:flag.append((r,w['h'],w['e'],w['u'],[x for x,_ in g.most_common(8)]))
print(len(flag))
for f in flag:print(f)
