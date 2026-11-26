# AI로 만든 그림을 게임용 도트로 바꾼다. 게임 화면과 같은 32색(PAL)으로 맞춘다.
# 사용:
#   python3 tools/pixelize.py sprite <출력.png> <원본> [논리높이=32]      한 장짜리 캐릭터·소품 (배경 지우고 자른 뒤 축소, 1px 외곽선)
#   python3 tools/pixelize.py sheet  <출력.png> <원본> <열> <행> [칸높이=32] 격자 시트(4방향×걷기 등)를 칸마다 같은 배율로
#   python3 tools/pixelize.py tile   <출력.png> <원본> [크기=16]           이어 붙는 바닥·벽 타일(정사각형)
# 배경: 원본 네 귀퉁이 색(마젠타·흰색 권장)과 비슷한 픽셀을 투명으로. 출력은 1배 크기 PNG(게임이 각지게 키운다).
import sys
from PIL import Image,ImageFilter
PAL=['#0b0a12','#15141f','#1f1d2b','#2a2838','#373447','#46425a','#58536e','#6d6886','#88839f','#aaa6bd','#d2cfdd','#f0eef5','#1c2c42','#2c4766','#466e93','#74a0c6','#3a3020','#5c4a2e','#8a6e44','#b89a68','#1f3a2c','#33603f','#5a9a5c','#5a1418','#9a2224','#d0453a','#e45c86','#f09a3a','#f2d45c','#40c8c0','#8a5cc8','#ffffff']
def palimg():
    p=Image.new('P',(1,1));flat=[]
    for h in PAL:flat+=[int(h[1:3],16),int(h[3:5],16),int(h[5:7],16)]
    p.putpalette(flat+[0]*(768-len(flat)));return p
def unbg(im,tol=60):
    im=im.convert('RGBA');px=im.load();w,h=im.size
    corners=[px[0,0],px[w-1,0],px[0,h-1],px[w-1,h-1]];bg=max(set(corners),key=corners.count)
    for y in range(h):
        for x in range(w):
            r,g,b,a=px[x,y]
            if abs(r-bg[0])+abs(g-bg[1])+abs(b-bg[2])<tol:px[x,y]=(0,0,0,0)
    return im
def topal(im):
    a=im.getchannel('A').point(lambda v:255 if v>110 else 0)
    q=im.convert('RGB').quantize(palette=palimg(),dither=Image.Dither.NONE).convert('RGBA');q.putalpha(a);return q
def outline(im):
    out=Image.new('RGBA',(im.width+2,im.height+2),(0,0,0,0));out.alpha_composite(im,(1,1))
    A=out.getchannel('A');D=A.filter(ImageFilter.MaxFilter(3));px=out.load();Ap=A.load();Dp=D.load()
    for y in range(out.height):
        for x in range(out.width):
            if Ap[x,y]==0 and Dp[x,y]>0:px[x,y]=(11,10,18,255)
    return out
def sprite(src,H=32):
    im=unbg(Image.open(src));bb=im.getchannel('A').getbbox();im=im.crop(bb)
    w=max(1,round(im.width*H/im.height));return outline(topal(im.resize((w,H),Image.BOX)))
def sheet(src,cols,rows,H=32):
    im=unbg(Image.open(src));cw,ch=im.width//cols,im.height//rows;cells=[]
    for r in range(rows):
        for c in range(cols):cells.append(im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)))
    boxes=[c.getchannel('A').getbbox() for c in cells];hmax=max((b[3]-b[1]) for b in boxes if b)
    k=H/hmax;W=max(round(cw*k),1);out=Image.new('RGBA',(cols*(W+2),rows*(H+4)),(0,0,0,0))
    for i,c in enumerate(cells):
        b=boxes[i]
        if not b:continue
        s=c.crop((0,b[1],cw,b[3]));s=s.resize((W,max(1,round(s.height*k))),Image.BOX);s=outline(topal(s))
        out.alpha_composite(s,((i%cols)*(W+2),(i//cols)*(H+4)+(H+2-s.height)))
    return out
def tile(src,N=16):
    im=Image.open(src).convert('RGBA');m=min(im.size);im=im.crop(((im.width-m)//2,(im.height-m)//2,(im.width+m)//2,(im.height+m)//2))
    return topal(im.resize((N,N),Image.BOX))
if __name__=='__main__':
    mode,out,src=sys.argv[1],sys.argv[2],sys.argv[3];a=[int(v) for v in sys.argv[4:]]
    im=sprite(src,*a) if mode=='sprite' else sheet(src,*a) if mode=='sheet' else tile(src,*a)
    im.save(out);print(out,im.size)
