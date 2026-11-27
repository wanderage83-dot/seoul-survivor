// 사용: node tests/smoke.cjs http://127.0.0.1:8795 [스크린샷 폴더]
const {chromium}=require('playwright');
const url=process.argv[2]||'http://127.0.0.1:8795',out=process.argv[3];
(async()=>{
  const b=await chromium.launch();let fail=0;
  const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fail++};
  for(const vp of [{w:390,h:844,touch:true},{w:1280,h:720},{w:844,h:390,touch:true}]){
    const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},hasTouch:!!vp.touch,isMobile:!!vp.touch});
    const p=await ctx.newPage();const errs=[];
    p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
    await p.goto(url);await p.waitForTimeout(300);
    ok(await p.isVisible('#screen.on'),`${vp.w}: 시작 화면`);
    ok(await p.evaluate(()=>{const t=$('#screen').textContent;const r=$('#screen .win').getBoundingClientRect();return t.includes('최종 목표')&&t.includes('남산 송신소')&&t.includes('게임 방법')&&r.bottom<=innerHeight+1}),`${vp.w}: 처음 화면에 목표·하루 흐름·게임 방법`);
    await p.click('#screen .btn.pri');await p.waitForTimeout(400);
    // 처음 시작이면 게임 방법이 먼저 뜬다 → 끝까지 넘기기(각 쪽이 화면 안)
    const help=await p.evaluate(()=>{const r={open:G.state==='pause'&&$('#screen').textContent.includes('게임 방법 1/'),fit:true};
      for(let i=0;i<HELP.length;i++){const w=$('#screen .win').getBoundingClientRect();if(w.top<-1||w.bottom>innerHeight+1)r.fit=false;$('#screen .btn.pri').click()}
      r.closed=G.state==='field';r.flag=localStorage.getItem('seoul-survivor-help')==='1';return r});
    ok(Object.values(help).every(Boolean),`${vp.w}: 첫 시작에 게임 방법 ${JSON.stringify(help)}`);
    ok(await p.evaluate(()=>G&&G.state==='field'&&Z.length>0),`${vp.w}: 게임 시작·좀비 생성`);
    const goal=await p.evaluate(()=>{hud();const g=$('#goal'),r=g.getBoundingClientRect(),t=g.textContent;const o={show:r.height>0&&r.right<=innerWidth+1,first:t.includes('지하에 내려가기'),today:t.includes('해 지기까지')};
      G.seenSub=1;G.seenBri=1;hud();o.next=$('#goal .cur').textContent.includes('남산');G.seenSub=0;G.seenBri=0;
      G.t=NIGHT+5;hud();o.night=$('#goal').textContent.includes('잠자기');G.t=10;
      const open=GOALOPEN;g.click();o.toggle=GOALOPEN!==open;g.click();hud();return o});
    ok(Object.values(goal).every(Boolean),`${vp.w}: 목표 칸 ${JSON.stringify(goal)}`);
    // 기본 화면·재난문자·비·노선도
    await p.waitForTimeout(900);
    const look=await p.evaluate(()=>{
      const r={noir:VLOOK==='pixel',sms:$('#sms').classList.contains('on')&&$('#sms').textContent.includes('행정안전부')};
      const sr=$('#sms').getBoundingClientRect();r.smsFit=sr.left>=0&&sr.right<=innerWidth+1;
      smsNext();smsNext();smsNext();smsNext();
      Z=[];spawnZ(P.x+160,P.y);const z=Z[0];z.fx=1;z.fy=0;G.rain=true;noise(P.x,P.y,200,0);r.rainQuiet=z.state==='idle';
      G.rain=false;noise(P.x,P.y,200,0);r.dryHear=z.state==='inv';Z=[];
      openMap();r.line=$('#modal .ln .st.cur')?.textContent.includes('강남역');closeMap();
      return r});
    ok(Object.values(look).every(Boolean),`${vp.w}: 무채색 기본·재난문자·비·노선도 ${JSON.stringify(look)}`);
    // 가방 무게·장비·손전등
    const inv=await p.evaluate(()=>{
      const r={};P.bag={};P.lay=[];r.cap=gridWH().join()==='6,4';P.bag.scrap=36;r.full=!canCarry('scrap')&&freeCells()===0;P.bag={axe:1,pipe:2,can:9,water:3,scrap:3,cloth:4};P.lay=[];r.sort=sortInv('type')&&P.lay[0].id==='pipe'||P.lay[0].id==='axe';r.pack=sortInv('size')&&overflow().length===0;
      P.bag={backpack:1};openInv();r.win=G.state==='inv';invEquip('backpack');r.bigger=gridWH().join()==='8,5'&&!P.bag.backpack;
      P.bag={vest:1};invEquip('vest');r.vest=P.eq.body==='vest'&&gearDef()>=.25;
      Z=[];spawnZ(P.x+15,P.y);const h=P.hp;hurtPlayer(Z[0]);r.def=h-P.hp<ZT.walker.dmg;Z=[];
      P.bat=50;P.lightOn=true;r.lit=lightActive();P.bag={battery:1};invUse('battery');r.bat=P.bat===100&&!P.bag.battery;
      closeInv();r.back=G.state==='field';P.eq.body=null;P.eq.pack=null;P.bag={};P.lightOn=false;
      return r});
    ok(Object.values(inv).every(Boolean),`${vp.w}: 가방 칸·정렬·정리·장비·손전등 ${JSON.stringify(inv)}`);
    // 끌어 놓기: 옮기기·합치기·장비 칸에 놓아 장착
    const dragOk=await (async()=>{
      await p.evaluate(()=>{P.bag={pipe:1,can:5};P.lay=[];sortInv('type');P.lay.forEach(t=>{if(t.id==='can'&&t.n===1){}});openInv()});
      const box=async sel=>{const b=await p.locator(sel).first().boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2}};
      const drag=async (from,toX,toY)=>{await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move(from.x+10,from.y+10,{steps:3});await p.mouse.move(toX,toY,{steps:6});await p.mouse.up();await p.waitForTimeout(80)};
      const r={};
      // 통조림 묶음(1개짜리)을 오른쪽 아래 빈칸으로
      const cans=await p.evaluate(()=>P.lay.map((t,i)=>[t.id,t.n,i,t.x,t.y]));
      const small=cans.find(c=>c[0]==='can'&&c[1]===1);
      const gc=await p.locator('.bag .gc').last().boundingBox();
      await drag(await box(`.bag .gi[data-i="${small[2]}"]`),gc.x+gc.width/2,gc.y+gc.height/2);
      r.moved=await p.evaluate(()=>{const [W,H]=gridWH();return P.lay.some(t=>t.id==='can'&&t.x===W-1&&t.y===H-1)&&P.bag.can===5});
      // 그 1개를 4개 묶음 위로 → 합침(묶음 최대 4라 4+1은 못 합침 → 하나 빼서 테스트)
      await p.evaluate(()=>{P.bag.can=4;relayout();renderInv()});
      const st=await p.evaluate(()=>P.lay.map((t,i)=>[t.id,t.n,i]).filter(c=>c[0]==='can'));
      if(st.length===2){const a=st.find(c=>c[1]<4)||st[1],b=st.find(c=>c!==a);const tb=await box(`.bag .gi[data-i="${b[2]}"]`);await drag(await box(`.bag .gi[data-i="${a[2]}"]`),tb.x,tb.y)}
      r.merged=await p.evaluate(()=>P.lay.filter(t=>t.id==='can').length===1&&P.bag.can===4);
      // 쇠파이프를 무기 칸으로 → 장착
      await p.evaluate(()=>{P.weapon={id:'fist',dur:Infinity};renderInv()});
      const pi=await p.evaluate(()=>P.lay.findIndex(t=>t.id==='pipe'));
      const ws=await box('.slot[data-s="weapon"]');await drag(await box(`.bag .gi[data-i="${pi}"]`),ws.x,ws.y);
      r.equip=await p.evaluate(()=>P.weapon.id==='pipe'&&!P.bag.pipe);
      await p.evaluate(()=>closeInv());return r})();
    ok(Object.values(dragOk).every(Boolean),`${vp.w}: 끌어 놓기 옮기기·합치기·장착 ${JSON.stringify(dragOk)}`);
    // 눌러서 가기: 땅 → 걸어감, 좀비 → 쫓아가 때림, 상자 → 가서 뒤짐, 막힌 곳 → 가까운 길
    const scr=(x,y)=>p.evaluate(([x,y])=>({x:(x-cam.x)*zoom+W/2,y:(y-cam.y)*zoom+H/2}),[x,y]);
    const tapAt=async(pt)=>{if(vp.touch)await p.touchscreen.tap(pt.x,pt.y);else await p.mouse.click(pt.x,pt.y)};
    const tm={};
    const g0=await p.evaluate(()=>{Z=[];G.t=10;const sx=P.x/T|0,sy=P.y/T|0;let best=null;
      for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const tx=sx+i,ty=sy+j;if(!walk(tx,ty)||hyp(i,j)<3)continue;const D=bfs((tx+.5)*T,(ty+.5)*T);const d=D[sy*MW+sx];if(d>2&&d<12&&(!best||d<best.d))best={x:(tx+.5)*T,y:(ty+.5)*T,d}}
      return best});
    // 화면 오른쪽 위(버튼·조이스틱 없는 곳)에 오도록 플레이어를 옮겨 놓고 누른다
    await tapAt(await scr(g0.x,g0.y));await p.waitForTimeout(80);
    tm.going=await p.evaluate(()=>!!GO);
    await p.waitForTimeout(3500);
    tm.arrive=await p.evaluate(([x,y])=>hyp(P.x-x,P.y-y)<16&&!GO,[g0.x,g0.y]);
    const zt=await p.evaluate(()=>{Z=[];spawnZ(P.x+T*3,P.y,'walker');const z=Z[0];let ok=!hitsSolid(z.x,z.y,z.r);if(!ok){z.x=P.x-T*3;ok=!hitsSolid(z.x,z.y,z.r)}if(!ok){z.x=P.x;z.y=P.y+T*3}z.hp=999;return {x:z.x,y:z.y-14}});
    await tapAt(await scr(zt.x,zt.y));await p.waitForTimeout(2500);
    tm.zombie=await p.evaluate(()=>Z.length===1&&Z[0].hp<999);
    await p.evaluate(()=>{Z=[];GO=null});
    const ct=await p.evaluate(()=>{for(const c of conts){if(c.empty||c.car)continue;const D=bfs(c.x,c.y);const cx=c.x/T|0,cy=c.y/T|0;
        for(let j=0;j<=6;j++)for(let i=-6;i<=6;i++){const tx=cx+i,ty=cy+j,d=D[ty*MW+tx];if(!walk(tx,ty)||d<3||d>7)continue;const px=(tx+.5)*T,py=(ty+.5)*T,sx=(c.x-px)*zoom+W/2,sy=(c.y-py+18)*zoom+H/2;
          if(sx>W*.1&&sx<W*.9&&sy>H*.22&&sy<H*.5){P.x=px;P.y=py;window.__c=c;return {x:c.x,y:c.y}}}}return null});
    await p.waitForTimeout(100);
    if(ct){await tapAt(await scr(ct.x,ct.y));await p.waitForTimeout(4000);tm.cont=await p.evaluate(()=>G.state==='loot'||(P.search&&P.search.c===window.__c)||window.__c.loot!=null);await p.evaluate(()=>{if(G.state==='loot')closeLoot();P.search=null})}else tm.cont=false;
    tm.cancel=await p.evaluate(()=>{const ok=goTo(W*.75,H*.3);keys.KeyD=true;update(.016);keys.KeyD=false;return ok?GO===null:true});
    await p.evaluate(()=>{GO=null;Z=[];P.x=(HOME_TILE.x+.5)*T;P.y=(HOME_TILE.y+.5)*T});
    ok(Object.values(tm).every(Boolean),`${vp.w}: 눌러서 가기(땅·좀비·상자·키 취소) ${JSON.stringify(tm)}`);
    // 조이스틱 없음·두 번 누르면 달리기
    const dbl=await p.evaluate(()=>({nojoy:getComputedStyle($('#joyzone')).display==='none'}));
    {const g1=await p.evaluate(()=>{Z=[];GO=null;const sx=P.x/T|0,sy=P.y/T|0;for(let r=4;r<12;r++)for(let i=-r;i<=r;i++)for(const j of [-r,r])for(const [u,v] of [[i,j],[j,i]])if(walk(sx+u,sy+v)){const x=(sx+u+.5)*T,y=(sy+v+.5)*T,a=(x-P.x)*zoom+W/2,b=(y-P.y+18)*zoom+H/2,el=document.elementFromPoint(a,b);if(el&&el.id==='cv'&&a>20&&b>20)return {a,b}}return null});
     if(g1){if(vp.touch){await p.touchscreen.tap(g1.a,g1.b);await p.waitForTimeout(90);await p.touchscreen.tap(g1.a,g1.b)}else{await p.mouse.click(g1.a,g1.b);await p.waitForTimeout(90);await p.mouse.click(g1.a,g1.b)}
       await p.waitForTimeout(150);Object.assign(dbl,await p.evaluate(()=>({run:!!(GO&&GO.run&&P.run)})))}else dbl.run=false}
    await p.evaluate(()=>{GO=null;P.x=(HOME_TILE.x+.5)*T;P.y=(HOME_TILE.y+.5)*T});
    ok(Object.values(dbl).every(Boolean),`${vp.w}: 조이스틱 없음·두 번 눌러 달리기 ${JSON.stringify(dbl)}`);
    // 소굴: 들키면 무리가 나온다 → 그날은 조용 → 잠자면 다시 → 저장
    const nest=await p.evaluate(()=>{const r={};spawnDay();const N=nests();r.count=N.length>=2;const n=N[0];
      r.guards=Z.filter(z=>hyp(z.x-n.x,z.y-n.y)<4*T).length>=2;
      Z=[];P.x=n.sp[0][0];P.y=n.sp[0][1];P.run=false;nestT=0;nestTick(.016);r.quiet=!nestFired(0);
      spawnZ(n.x+T*2,n.y,'walker');Z[0].sees=true;nestT=0;nestTick(.016);r.woke=nestFired(0)&&HORDE.length===1;
      for(let i=0;i<60;i++)nestTick(.1);r.horde=Z.filter(z=>z.horde&&z.state==='chase').length>=6;
      const c=Z.length;Z=[];spawnZ(n.x,n.y,'walker');Z[0].sees=true;nestT=0;nestTick(.016);r.once=HORDE.length===0;
      r.saved=(saveGame(),readSave().G.nest.gangnam[0]===1);Z=[];
      return r});
    ok(Object.values(nest).every(Boolean),`${vp.w}: 소굴 깨어남·무리·하루 한 번·저장 ${JSON.stringify(nest)}`);
    await p.evaluate(()=>{Z=[];HORDE=[];G.nest={};P.x=(HOME_TILE.x+.5)*T;P.y=(HOME_TILE.y+.5)*T});
    // 지도 연결성: 거점에서 모든 뒤질 것까지 갈 수 있다
    ok(await p.evaluate(()=>{const D=bfs((HOME_TILE.x+.5)*T,(HOME_TILE.y+.5)*T);return conts.every(c=>{const tx=c.x/T|0,ty=c.y/T|0;if(c.car){for(const [i,j] of [[-1,0],[1,0],[0,-1],[0,1],[2,0],[0,2],[-1,1],[1,-1]])if(D[(c.car.y+j)*MW+c.car.x+i]>=0)return true;return false}return D[ty*MW+tx]>=0})}),`${vp.w}: 모든 뒤질 것에 갈 수 있다`);
    // 걷기
    await p.evaluate(()=>{keys.KeyS=true});await p.waitForTimeout(600);await p.evaluate(()=>{keys.KeyS=false});
    ok(await p.evaluate(()=>P.y>(HOME_TILE.y+1)*T),`${vp.w}: 이동`);
    // 뒤지기
    const got=await p.evaluate(async()=>{const c=conts.find(c=>c.type==='mart');P.x=c.x;P.y=c.y+20;Z=Z.filter(z=>hyp(z.x-P.x,z.y-P.y)>400);const before=Object.values(P.bag).reduce((a,b)=>a+b,0)+(P.weapon.id!=='pipe'?1:0);interact();await new Promise(r=>setTimeout(r,1700));const win=G.state==='loot'&&$('#modal').textContent.includes('전부 줍기');const n0=Object.keys(P.bag).length;lootAll();closeLoot();return {s:!!P.search,c:(c.empty||c.loot!==null)&&win&&G.state==='field'&&Object.keys(P.bag).length>=n0}});
    ok(!got.s&&got.c,`${vp.w}: 편의점 선반 뒤지기 → 전리품 창 → 전부 줍기`);
    // 소리 → 좀비 조사
    ok(await p.evaluate(()=>{spawnZ(P.x+150,P.y);const z=Z[Z.length-1];z.fx=1;z.fy=0;noise(P.x,P.y,200,1);return z.state==='inv'}),`${vp.w}: 소리를 듣고 조사`);
    // 공격
    ok(await p.evaluate(()=>{Z=[];spawnZ(P.x+30,P.y);P.fx=1;P.fy=0;P.atkCd=0;const z=Z[0],h=z.hp;attack();return z.hp<h||!Z.includes(z)}),`${vp.w}: 근접 공격 명중`);
    // 비명꾼
    ok(await p.evaluate(()=>{Z=[];spawnZ(P.x+120,P.y,'screamer');spawnZ(P.x+380,P.y,'walker');const s=Z[0],w=Z[1];s.fx=-1;s.fy=0;s.senseT=0;w.fy=1;w.fx=0;updateZ(s,.016,false);return s.state==='chase'&&w.state==='inv'}),`${vp.w}: 비명꾼이 다른 좀비를 부른다`);
    // 폭죽
    ok(await p.evaluate(async()=>{Z=[];P.bag.fire=1;throwFire();await new Promise(r=>setTimeout(r,1100));return thrown.length===1&&thrown[0].st==='burn'}),`${vp.w}: 폭죽 터짐`);
    // 건물 안: 들어가기 → 층 이동 → 뒤지기 → 나오기
    const inside=await p.evaluate(async()=>{
      Z=[];const b=buildings.find(b=>b.kind==='villa'&&b.floors>=3&&!b.home);
      P.x=(b.door.x+.5)*T;P.y=(b.door.y+.5)*T;interact();
      const r={in:!!G.area&&G.area.f===1,notOnExit:!inTile()};
      const D=bfs(P.x,P.y);r.reach=conts.every(c=>D[(c.y/T|0)*MW+(c.x/T|0)]>=0);
      let up=null;for(let i=0;i<MW*MH;i++)if(tile[i]===8)up=i;r.upReach=up!==null&&D[up]>=0;
      P.x=(up%MW+.5)*T;P.y=((up/MW|0)+.5)*T;Z=[];interact();r.f2=G.area&&G.area.f===2;
      const c=conts[0];if(c){Z=[];P.x=c.x;P.y=c.y+14;interact();await new Promise(z=>setTimeout(z,1700));r.searched=c.empty||c.loot!==null;if(G.state==='loot')closeLoot()}else r.searched=true;
      let dn=null;for(let i=0;i<MW*MH;i++)if(tile[i]===9)dn=i;P.x=(dn%MW+.5)*T;P.y=((dn/MW|0)+.5)*T;Z=[];interact();r.back1=G.area&&G.area.f===1;
      const kept=G.floors[`${b.x},${b.y},2`].conts[0];r.kept=!c||kept===c;
      let ex=null;for(let i=0;i<MW*MH;i++)if(tile[i]===10)ex=i;P.x=(ex%MW+.5)*T;P.y=((ex/MW|0)+.5)*T;interact();
      r.out=!G.area&&hyp(P.x-(b.door.x+.5)*T,P.y-(b.door.y+.8)*T)<2&&buildings.length>50&&!!solid[b.y*MW+b.x];
      return r});
    ok(Object.values(inside).every(Boolean),`${vp.w}: 건물 안 층 이동·뒤지기·나오기 ${JSON.stringify(inside)}`);
    // 저장·불러오기: 상태를 바꾸고 저장 → 새로고침 → 이어하기
    const before=await p.evaluate(()=>{
      G.day=3;G.t=77;G.stash.wood=7;G.fac.rain=1;G.kills=9;P.hp=63;P.bag={can:2};P.weapon={id:'axe',dur:31};
      const c=conts.find(c=>c.type==='mart');c.empty=true;c.loot=[];
      const b=buildings.find(b=>b.kind==='villa'&&b.floors>=3&&!b.home);P.x=(b.door.x+.5)*T;P.y=(b.door.y+.5)*T;Z=[];interact();
      conts.forEach(c=>{c.empty=true;c.loot=[]});const px=P.x,py=P.y;saveGame();
      return {mart:conts.length,ci:0,px,py,bx:b.x,by:b.y,martIdx:null}});
    await p.reload();await p.waitForTimeout(300);
    ok(await p.isVisible('text=이어하기'),`${vp.w}: 처음 화면에 이어하기`);
    await p.click('text=이어하기');await p.waitForTimeout(300);
    const after=await p.evaluate(()=>({day:G.day,t:Math.round(G.t),wood:G.stash.wood,rain:G.fac.rain,kills:G.kills,hp:P.hp,can:P.bag.can,w:P.weapon.id+P.weapon.dur,area:G.area&&G.area.f,px:P.x,py:P.y,floorEmpty:conts.every(c=>c.empty),streetMart:STREET.conts.find(c=>c.type==='mart').empty}));
    ok(after.day===3&&after.t===77&&after.wood===7&&after.rain===1&&after.kills===9&&after.hp===63&&after.can===2&&after.w==='axe31'&&after.area===1&&after.px===before.px&&after.floorEmpty&&after.streetMart,`${vp.w}: 저장한 상태 그대로 이어짐 ${JSON.stringify(after)}`);
    await p.evaluate(()=>{exitToStreet();P.hp=0});await p.waitForTimeout(200);
    ok(await p.evaluate(()=>G.state==='over'&&!readSave()),`${vp.w}: 죽으면 저장이 지워진다`);
    await p.evaluate(()=>newGame());
    // 동료: 위치 신호 → 그 층에서 만나기 → 물건 주고 데려오기 → 거점 도움 → 데리고 나가 싸우기
    const ally=await p.evaluate(async()=>{
      const r={};const sv=G.surv.gangseok;const b=buildings.find(b=>b.x===sv.bx&&b.y===sv.by);
      r.hint=hinted('gangseok')&&!hinted('malsun');
      P.x=(b.door.x+.5)*T;P.y=(b.door.y+.5)*T;Z=[];interact();
      while(G.area.f<sv.f){let up=null;for(let i=0;i<MW*MH;i++)if(tile[i]===8)up=i;P.x=(up%MW+.5)*T;P.y=((up/MW|0)+.5)*T;Z=[];interact()}
      r.npc=NPCS.length===1&&NPCS[0].id==='gangseok';
      const D=bfs((G.area?P.x:0),P.y);r.npcReach=D[(NPCS[0].y/T|0)*MW+(NPCS[0].x/T|0)]>=0;
      P.bag={};P.x=NPCS[0].x+30;P.y=NPCS[0].y;interact();r.talk=G.state==='talk'&&$('#modal .pri').disabled;talkEnd();
      P.bag={can:1};interact();$('#modal .pri').click();r.recruit=G.surv.gangseok.st==='base'&&!P.bag.can&&NPCS.length===0;
      exitToStreet();P.x=(HOME_TILE.x+.5)*T;P.y=(HOME_TILE.y+.6)*T;Z=[];interact();
      G.tab='ally';renderBase();r.tab=$('#modal').textContent.includes('최강석');
      G.follow='gangseok';leaveBase();r.follow=!!ALLY&&ALLY.id==='gangseok';
      Z=[];spawnZ(P.x+60,P.y+40,'walker');Z[0].state='chase';const z0=Z[0];
      for(let i=0;i<300&&Z.includes(z0);i++){P.hp=100;update(1/60)}
      r.fight=!Z.includes(z0);
      G.surv.doyun.st='base';G.stash={can:5,water:5};const m0=['scrap','cloth','wood','tape','parts'].reduce((a,k)=>a+(G.stash[k]||0),0);
      P.bag={};interact();sleep();const m1=['scrap','cloth','wood','tape','parts'].reduce((a,k)=>a+(G.stash[k]||0),0);
      r.morning=m1===m0+2&&G.stash.can===3&&G.stash.water===3;
      saveGame();r.saved=readSave().G.surv.gangseok.st==='base';
      return r});
    ok(Object.values(ally).every(Boolean),`${vp.w}: 동료 찾기·데려오기·싸움·아침 도움·저장 ${JSON.stringify(ally)}`);
    if(out)await p.screenshot({path:`${out}/field-${vp.w}.png`});
    // 밤
    await p.evaluate(()=>{G.t=NIGHT+40});await p.waitForTimeout(300);
    if(out)await p.screenshot({path:`${out}/night-${vp.w}.png`});
    // 거점
    await p.evaluate(()=>{Z=[];thrown=[];P.x=(HOME_TILE.x+.5)*T;P.y=(HOME_TILE.y+.6)*T;G.stash.wood=20;G.stash.scrap=20;G.stash.cloth=20;G.stash.tape=5;G.stash.parts=3;interact()});
    ok(await p.evaluate(()=>G.state==='base'&&$('#modal').classList.contains('on')),`${vp.w}: 거점 열림`);
    for(const t of ['stat','craft','fac','pack']){
      await p.evaluate(t=>{G.tab=t;renderBase()},t);
      const fit=await p.evaluate(()=>{const w=$('#modal .win').getBoundingClientRect(),bd=$('#modal .wbody');return w.top>=0&&w.bottom<=innerHeight+1&&bd.scrollHeight<=bd.clientHeight+2});
      ok(fit||vp.h<500,`${vp.w}: 거점 탭 ${t} 화면 안${fit?'':'(가로는 스크롤 허용)'}`);
      if(out&&t==='fac')await p.screenshot({path:`${out}/base-${vp.w}.png`});
    }
    ok(await p.evaluate(()=>{build('barr');build('rain');craft(0);return G.fac.barr===1&&G.fac.rain===1&&G.stash.bandage>=1}),`${vp.w}: 시설·제작`);
    // 며칠 지나도 끝나지 않는다(승리는 남산 송신)
    ok(await p.evaluate(()=>{const d0=G.day;for(let i=0;i<7;i++){P.food=P.water=100;P.hp=100;P.inf=0;G.fac.barr=3;sleep()}return G.state!=='over'&&G.day===d0+7}),`${vp.w}: 7일이 지나도 계속된다`);
    // 구역: 강남 → 지하 → 한남대교 → 남산 → 송신 → 구조
    const zone=await p.evaluate(async()=>{
      const r={};$('#modal').classList.remove('on');G.state='field';Z=[];
      const reach=()=>{const a=links[0];const D=bfs((a.x+.5)*T,(a.y+.5)*T);return links.every(l=>D[l.y*MW+l.x]>=0)&&conts.every(c=>{if(c.car){const k=c.car;for(let j=k.y-1;j<=k.y+k.h;j++)for(let i=k.x-1;i<=k.x+k.w;i++)if(D[j*MW+i]>=0)return true;return false}return D[(c.y/T|0)*MW+(c.x/T|0)]>=0})};
      const go=(id)=>{const l=links.find(l=>l.to===id);P.x=(l.x+.5)*T;P.y=(l.y+.5)*T;interact();Z=[]};
      r.gReach=reach();
      go('subway');r.sub=G.zone==='subway'&&links.length===9;r.sReach=reach();
      const back=links.find(l=>l.id==='s11');P.x=(back.x+.5)*T;P.y=(back.y+.5)*T;interact();const g11=links.find(l=>l.id==='g11');r.back=G.zone==='gangnam'&&hyp(P.x-(g11.x+.5)*T,P.y-(g11.y+.5)*T)<2;
      go('subway');Z=[];go('bridge');r.bridge=G.zone==='bridge';r.bReach=reach();
      go('namsan');r.nam=G.zone==='namsan';r.nReach=reach();
      saveGame();r.savedZone=readSave().G.zone==='namsan';
      const tx=links.find(l=>l.to==='final');P.x=(tx.x+.5)*T;P.y=(tx.y+.5)*T;P.bag={};interact();r.need=G.state==='talk'&&$('#modal .pri').disabled;talkEnd();
      P.bag={parts:5,tape:2};interact();$('#modal .pri').click();r.start=!!G.final&&!P.bag.parts;
      G.final.p=.995;for(let i=0;i<90&&G.state!=='over';i++){P.hp=100;update(1/30)}
      r.win=G.state==='over'&&$('#screen').textContent.includes('구조 신호')&&!readSave();
      return r});
    ok(Object.values(zone).every(Boolean),`${vp.w}: 구역 이동·연결·송신 승리 ${JSON.stringify(zone)}`);
    // 사망
    await p.evaluate(()=>{newGame();P.hp=0});await p.waitForTimeout(200);
    ok(await p.evaluate(()=>G.state==='over'),`${vp.w}: 체력 0이면 끝`);
    ok(!errs.length,`${vp.w}: 콘솔 오류 없음 ${errs.join(' | ')}`);
    await ctx.close();
  }
  await b.close();console.log(fail?`실패 ${fail}`:'모두 통과');process.exit(fail?1:0);
})();
