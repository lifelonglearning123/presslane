import re, sys, html
from html.parser import HTMLParser

src = open(sys.argv[1], encoding='utf-8').read()

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.sections=[]; self.cur=None; self.skip=0; self.depth=0; self.stack=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('script','style','svg','template'): self.skip+=1
        if tag=='section' or (tag=='footer'):
            self.cur={'id':a.get('id',tag),'text':[], 'h2':None}; self.sections.append(self.cur)
        if self.cur is not None and tag in ('h2',): self._h2=True
        self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in ('script','style','svg','template'): self.skip-=1
        if self.stack: self.stack.pop()
    def handle_data(self, data):
        if self.skip or self.cur is None: return
        t=' '.join(data.split())
        if not t: return
        if self.stack and self.stack[-1]=='h2' and self.cur['h2'] is None: self.cur['h2']=t
        self.cur['text'].append(t)

p=P(); p.feed(src)

def syl(w):
    w=w.lower(); w=re.sub(r'[^a-z]','',w)
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    s=len(re.findall(r'[aeiouy]{1,2}',w)); return max(1,s)

def stats(text):
    sents=[s for s in re.split(r'(?<=[.!?])\s+|\n', text) if len(s.split())>=2]
    words=re.findall(r"[A-Za-z][A-Za-z'’-]*", text)
    if not sents or not words: return None
    sy=sum(syl(w) for w in words)
    asl=len(words)/len(sents); asw=sy/len(words)
    fk=0.39*asl+11.8*asw-15.59
    hard=sorted({w for w in words if syl(w)>=3 and len(w)>8}, key=str.lower)
    longest=max(sents,key=lambda s:len(s.split()))
    return dict(words=len(words),sents=len(sents),asl=asl,fk=fk,hard=hard,longest=longest, pct_long=100*sum(1 for s in sents if len(s.split())>20)/len(sents))

tot=[]
print(f"{'section':<10}{'words':>6}{'sent':>5}{'avg len':>8}{'FK grade':>9}{'>20w %':>7}  h2")
for s in p.sections:
    text=' '.join(s['text']); st=stats(text)
    if not st: continue
    tot.append(text)
    print(f"{s['id']:<10}{st['words']:>6}{st['sents']:>5}{st['asl']:>8.1f}{st['fk']:>9.1f}{st['pct_long']:>7.0f}  {(s['h2'] or '')[:60]}")
all_=stats(' '.join(tot))
print(f"\nWHOLE PAGE: {all_['words']} words, {all_['sents']} sentences, avg {all_['asl']:.1f} words/sentence, FK grade {all_['fk']:.1f} (target for 10-11 yr olds: 5-6), {all_['pct_long']:.0f}% of sentences over 20 words")
print("\nLONGEST SENTENCE PER SECTION:")
for s in p.sections:
    st=stats(' '.join(s['text']))
    if st: print(f"- [{s['id']}] ({len(st['longest'].split())} words) {st['longest'][:220]}")
print("\nHARD WORDS (3+ syllables, >8 letters):")
print(', '.join(sorted({w for t in tot for w in stats(t)['hard']}, key=str.lower)))
