# art/raw/의 AI 원본을 게임용 도트로 한꺼번에 바꾼다(있는 것만). 다시 실행해도 된다.
# 사용: python3 tools/build-art.py
import os,glob,sys
sys.path.insert(0,os.path.dirname(__file__))
from pixelize import sheet,sprite,tile,unbg
from PIL import Image
RAW='art/raw';OUT='art'
def raw(name):
    m=glob.glob(f'{RAW}/*{name}.png')
    return m[0] if m else None
CHARS=['player','z_walker','z_runner','z_screamer','ally_gangseok','ally_jisu','ally_doyun','ally_yuna','ally_malsun']
# 소품 시트: 이름(칸 순서대로)·논리 높이
PROPS={'props_street':[('car_sedan',20),('car_taxi',20),('bus_blue',30),('car_police',20),('truck_army',28),('scooter',17),('bags',14),('bike',17),('bin',17)],
       'props_misc':[('sign_board',14),('barricade',16),('sandbags',12),('crate_army',12),('tree_ginkgo',40),('fridge',26),('shelf',22),('desk',18),('wardrobe',28)]}
TILES=['t_asphalt','t_sidewalk','t_alley','t_grass','t_floor_wood','t_floor_tile','t_subway','t_water']
done=[]
for c in CHARS:
    f=raw(c)
    if f:sheet(f,3,4,24).save(f'{OUT}/{c}.png');done.append(c)
for sh,items in PROPS.items():
    f=raw(sh)
    if not f:continue
    im=Image.open(f).convert('RGB');cw,ch=im.width//3,im.height//3
    for i,(name,H) in enumerate(items):
        cell=im.crop(((i%3)*cw,(i//3)*ch,(i%3+1)*cw,(i//3+1)*ch));tmp=f'/tmp/_cell_{name}.png';cell.save(tmp)
        sprite(tmp,H).save(f'{OUT}/{name}.png');done.append(name)
f=raw('tiles')
if f:
    im=Image.open(f).convert('RGB');cw,ch=im.width//4,im.height//2
    for i,name in enumerate(TILES):
        x0,y0=(i%4)*cw,(i//4)*ch;cell=im.crop((x0+8,y0+8,x0+cw-8,y0+ch-8));tmp=f'/tmp/_tile_{name}.png';cell.save(tmp)
        tile(tmp,32).save(f'{OUT}/{name}.png');done.append(name)
print('만든 것',len(done),':',' '.join(done))
