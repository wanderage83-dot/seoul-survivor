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
    await p.click('#screen .btn.pri');await p.waitForTimeout(400);
    ok(await p.evaluate(()=>G&&G.state==='field'&&Z.length>0),`${vp.w}: 게임 시작·좀비 생성`);
    // 지도 연결성: 거점에서 모든 뒤질 것까지 갈 수 있다
    ok(await p.evaluate(()=>{const D=bfs((HOME_TILE.x+.5)*T,(HOME_TILE.y+.5)*T);return conts.every(c=>{const tx=c.x/T|0,ty=c.y/T|0;if(c.car){for(const [i,j] of [[-1,0],[1,0],[0,-1],[0,1],[2,0],[0,2],[-1,1],[1,-1]])if(D[(c.car.y+j)*MW+c.car.x+i]>=0)return true;return false}return D[ty*MW+tx]>=0})}),`${vp.w}: 모든 뒤질 것에 갈 수 있다`);
    // 걷기
    await p.evaluate(()=>{keys.KeyS=true});await p.waitForTimeout(600);await p.evaluate(()=>{keys.KeyS=false});
    ok(await p.evaluate(()=>P.y>(HOME_TILE.y+1)*T),`${vp.w}: 이동`);
    // 뒤지기
    const got=await p.evaluate(async()=>{const c=conts.find(c=>c.type==='mart');P.x=c.x;P.y=c.y+20;Z=Z.filter(z=>hyp(z.x-P.x,z.y-P.y)>400);const before=Object.values(P.bag).reduce((a,b)=>a+b,0)+(P.weapon.id!=='pipe'?1:0);interact();await new Promise(r=>setTimeout(r,1700));return {s:!!P.search,c:c.empty||c.loot!==null}});
    ok(!got.s&&got.c,`${vp.w}: 편의점 선반 뒤지기 완료`);
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
      const c=conts[0];if(c){Z=[];P.x=c.x;P.y=c.y+14;interact();await new Promise(z=>setTimeout(z,1700));r.searched=c.empty||c.loot!==null}else r.searched=true;
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
