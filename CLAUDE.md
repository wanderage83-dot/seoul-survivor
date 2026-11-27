# 서울, 잔류자 — 작업 안내

서울을 무대로 한 쿼터뷰 좀비 생존 게임. **정적 HTML 단일 파일**(`index.html`)이며 빌드 도구·npm 의존성을 넣지 않는다.

- **예외(사용자 동의 2026-11-27):** 3D 보기에 한해 three.js r160을 CDN(`V3_URL`, jsDelivr `three.min.js`)에서 불러온다. npm 설치·빌드는 여전히 없다. 이 환경에서는 CDN이 막혀 있어 `tests/three.min.js`(같은 판, npm에서 받은 사본)를 smoke 테스트가 가로채 넣는다.
- 실제 지명·길 배치는 참고하되 상호는 비튼 이름(스타벅수, 다있소 등)으로 쓴다. 실제 상호·로고를 그대로 쓰지 않는다.
- 기획 원본: `notes/2026-11-25_서울좀비생존_기획안.md`. 장르(탐색·제작·거점 생존)만 참고하는 원작이다. 다른 게임의 이름·인물·그림·맵을 가져오지 않는다.
- 게임 내 문구는 한국어로 쓴다. 기능을 바꾸면 `README.md`도 고친다.
- 세로 휴대폰(390×844)·가로 휴대폰(844×390)·PC(1280×720)에서 확인한다. 수정 후 `node tests/smoke.cjs <정적서버URL>`이 통과해야 한다.
- 그림: 요청은 `notes/2026-11-26_ChatGPT_한번에_프롬프트.md`. 원본(AI 그림)은 `art/raw/`(배포 제외), `python3 tools/build-art.py`가 있는 것만 도트로 바꿔 `art/`에 둔다(`tools/pixelize.py`: 마젠타 배경 제거·가장 큰 덩어리만·그림별 24색). 새 그림을 넣으면 index.html의 `ART_READY`에 이름을 더한다(목록에 없는 파일은 요청하지 않아 404가 없다).
- md 메모는 `notes/YYYY-MM-DD_내용.md`에 둔다. `.vercelignore`가 notes·tests·md를 배포에서 뺀다.
- 공개 주소: https://seoul-survivor-ashen.vercel.app (seoul-survivor.vercel.app은 이미 다른 사람이 써서 Vercel이 붙인 주소) (Vercel 프로젝트 seoul-survivor, 팀 bridgej). 새 버전은 main에 올린 뒤 create_deployment(gitSource ref main, target production)로 다시 배포한다.

## 코드 지도 (index.html 안 `/* ─── */` 구획)
| 구획 | 주요 심볼 |
|---|---|
| 데이터 | `ITEMS`, `WEAP`, `LOOT`(뒤질 것별 드롭표), `ZT`(좀비 종류), `RECIPES`, `FACS` |
| 지도 | 강남역~신논현역. `ROADS`(길 사각형), `ALLEYS`(먹자골목), `STATIONS`, `LANDMARKS`(고정 건물), `CHAIN`/`ALLEY`/`OFFICE`(패러디 상호·물건 종류·색), `gen(seed)`가 길→블록→보도→랜드마크→줄지은 건물→출구·가로수·차량 순으로 만든다. `tile`(0차도 1보도 2화단 3골목 4버스차로), `mk`(차선·횡단보도 비트), `HOME_TILE`은 gen이 정한다 |
| 지도 화면 | `openMap`/`closeMap` (`G.state='map'`), `drawGround`, `drawExit` |
| 건물 안 | `STREET`(거리 배열 보관), `G.area={b,f,style}`, `G.floors['x,y,f']={conts,Z}`, `floorsOf`, `genFloor`(좌표+층 시드라 늘 같은 모양), `fillFloor`, `enterFloor`/`exitToStreet`/`useStairs`, `doorBuilding`, `inTile`, `drawInTile`. tile 5 바닥 6 벽 7 바깥 8 위계단 9 아래계단 10 출구 |
| 동료 | `SURV`(5명: 대사·원하는 것·능력), `SURV_ORDER`, `G.surv[id]={st:'lost'|'base'|'hurt',bx,by,f}`, `G.follow`, `ALLY`(따라다니는 동료), `NPCS`(이 층의 숨은 생존자), `placeSurvivors`, `hinted`(하루 한 명씩 위치 공개), `placeNpcs`, `talkTo`/`recruit`, `spawnAlly`/`allyUpdate`/`hurtAlly`/`allyDown`, `crewSleep`/`crewMorning`, `allyTab`, `bagCap`, `searchTime` |
| 구역 | `ZONES`(gangnam·subway·bridge·namsan: 이름·어둠·좀비 수·돌아가는 구역), `G.zone`, `ZC[id]`(떠난 구역 보관), `links`(구역 연결점, to:'final'은 송신기), `EXIT_DEF`(강남 출구=지하 계단 위치), `genSubway`/`genBridge`/`genNamsan`(seed+구역 고정 시드), `zoneGen`, `stashZone`/`restoreZone`, `spawnZone`, `travel`, `pruneUnreachable`, `ZLABELS`. tile 11 물 12 선로 13 승강장 끝 15 난간·개찰구 16 모래주머니. 건물 안은 강남에만 |
| 목표·안내 | `titleScreen`(최종 목표·하루 3단계), `HELP`(7쪽)·`openHelp`/`renderHelp`/`closeHelp`(첫 새 게임에 자동, localStorage `seoul-survivor-help`; 닫힌 뒤 아침 재난문자 `HELPSMS`), `#goal`·`goalSteps`/`goalToday`/`goalHud`(hud에서, `GOALOPEN` 펼침·localStorage `seoul-survivor-goal`) |
| 눌러서 가기 | `GO`({kind:'go'\|'z'\|'act',x,y,D(목표에서 퍼진 bfs),ok,key}), `pickTarget`(좀비 → 상자·NPC·계단 → 거점·출입구·건물 문 → 땅), `goTo(sx,sy)`(막힌 칸은 가까운 길 칸으로, 못 가면 「갈 수 없는 곳」), `goStep`(update에서 키·조이스틱 입력이 없을 때만; 좀비는 .3초마다 bfs 다시·사거리 안이면 attack, act는 ok()면 interact, .6초 제자리면 멈춤, 구역·층 바뀌면 취소), `drawGo`. 입력 `TAPD`/`tapGo`: 캔버스 마우스 왼쪽·터치 톡(14px·.5초 안), 340ms 안 48px 안 두 번이면 `GO.run`(달리기), 누른 채 끌기 .15초마다 다시 goTo. 휴대폰 조이스틱(#joyzone)은 숨김(키보드 WASD는 남음) |
| 소굴 | `nests()`(구역별·seed 고정, `NEST` 캐시; 강남은 먼 건물 문, 그 밖은 빈터; {x,y,sp(나올 칸),name}), `NEST_R`, `nestGuards`(spawnDay·spawnZone 끝, 파수꾼), `nestTick`(update: 반경 안에서 z.sees 또는 P.run → `wakeNest`), `HORDE`(.22초마다 한 마리, z.horde=1 chase), `G.nest[구역][i]`(저장, sleep에서 초기화), `drawNests`(noirPass 안·basic은 바닥층), killZ의 무리 전리품, 미니맵 빨간 원 |
| 음식 제작 | `RECIPES`({c:'food'\|'med'\|'tool',need,out,knife,fire,hand(길에서 가능),key(이 재료를 가져 봐야 열림)}), `RCAT`, `G.ccat`(거점 제작 갈래), `craft(i,field)`(field면 가방·버너·소리), `craftWhy`, `craftList(field)`, `seenMark`/`known`/`G.seen`, 연료 `G.gas`(연 부탄가스 남은 횟수)·`fuelOk`/`useFuel`(거점은 나무판도), 상함 `ITEMS[id].rot`·`G.age`·`spoilTick`(sleep에서, 가방+창고 한 종류 통째로 rotten)·`rotLeft`, `bestFood`(곧 상할 요리 먼저, 날것·상한 것 제외), 가방 창 `INVCRAFT`. 작은 짐승 `CR`/`spawnCritters`(spawnDay·spawnZone 끝, ZC에 보관)/`critterTick`/`hitCritters`(attack에서)/`drawCritters`, pickTarget이 짐승도 고름(`cr:1`) |
| 방어·들개·기분 | `FACS.barr.lv`(5단계 이름·재료, `facNeed`가 lv 우선), `smoke`/`ratfarm` 시설(sleep에서), 설치물 `TRAPS`({k,key=goKey()})·`placeTrap`(invUse의 「놓기」)·`trapTick`·`trapsLeave`(층·구역 떠날 때 판자 solid 되돌림)·`nearTrap`/`checkTrap`·`drawTraps`, z.slowT(깨진 병). 들개 `ZT.dog`·`spawnDogs`(2일차~, 감염 없음, killZ에서 「들개」), 낚시·문짝은 `P.search={fish|door,dur}`(finishSearch 분기), `nearWater`. 동료 기분 `G.mood`·`moodOf`·`DOG_TALK`·`crewReact`(craft에서), 30 미만이면 아침 도움 쉼 |
| 목표 표시 | `ZORD`, `goalTarget()`(goalSteps의 다음 단계 → 이 구역에서 그쪽으로 가는 link, 남산이면 final, 건물 안 null), `drawGoalMark`(월드), `edgeArrow`(화면 가장자리, 거점 화살표와 같은 모양), drawMini·openMap에 🎯·소굴(`NEST` 캐시)·경보줄·쥐덫. 휴대폰 세로(<600px)는 `#hotbar`가 왼쪽 아래 고정 4열 |
| 던지는 무기 | `WEAP.spear`(각목창), `ITEMS.molotov/bomb`(thr:1), `THROWS`·`throwKind`(P.throwSel → 남은 것), `throwFire`가 thrown에 kind, update의 thrown 분기(molotov: burn 4.5초·.25초마다 `areaHurt`+z.burnT, bomb: fuse 1.5초 → 반경 100 폭발·플레이어 피해·fx 'boom'), `areaHurt`, 좀비 burnT(update에서 초당 9), `drawFire`, hud가 #bThrow 그림·이름 갱신 |
| 3D 보기 | `V3`(want/ready/key/bmeshes/sprites), `load3D`/`init3D`/`set3D`/`resize3D`, `build3D`(구역·층 바뀌면: 건물 상자(v3box UV 반복 창문)·간판 v3sign·옥상 소품·차·나무·출구·벽 칸 InstancedMesh), `render3D`(카메라 남쪽 위 pit .95·거리는 화면비로, 해/반구/손전등 SpotLight/불 PointLight, 바닥은 2D drawGround 등을 `V3.gcv`에 그려 텍스처, 앞 건물 반투명, 사람·좀비는 drawObj를 64×88 캔버스에 그려 Sprite, 위에 2D로 fx·화살표), `v3proj`/`v3world`(toScreen·toWorld가 3D면 이걸 씀), pickTarget은 3D면 화면 거리로 좀비 고름. render()가 v3on()이면 render3D |
| 엔딩 | `finalNeed`/`finalAsk`/`finalStart`/`finalTick`(90초 송신, 6칸 안에 있어야 진행)/`drawFinal`/`drawFinalBar`/`winFinal` |
| 저장 | `SAVE_KEY='seoul-survivor-save-v1'`(키는 그대로, 내용 v2), `saveGame`/`loadGame`/`readSave`/`clearSave`. 지도는 seed로 재생성, 상자는 구역별 `zones[id]`의 conts 순서 인덱스로 복원(v1은 강남 하나로 읽음), 층 상자는 `G.floorSave`→`fillFloor`. 저장 구조를 바꾸면 v를 올리거나 loadGame에서 기본값을 채운다 |
| 화면 분위기 | 기본 `VLOOK='pixel'`(도트: `render`가 `lo` 작은 캔버스에 `render0`을 그리고 `pixelBlit`이 `PAL` 32색+`BAYER` 디더링 후 각지게 확대, 글자는 `loctx.fillText`가 `TXT`에 모아 선명하게 다시 씀. 화면 크기 변환은 `RS`, 한 칸 픽셀 `PXS`). 그 밖에 'noir'·'basic'(주소 `?look=`·일시정지 `toggleLook`, localStorage `seoul-survivor-look2`). `drawShafts`/`SHAFTS` 실내 창문 빛줄기. `noirPass`(1차 그림 후 채도 빼기 — 도트는 낮 .18·밤/실내 .78로 시간에 따라 → 간판·피·반짝임·사람/좀비만 색으로 다시), `NEON`·`noirNightCut`·`noirNightGlow`(밤 간판 빛), `drawRain`. 날씨: `G.rain`(잠잘 때 30%), `raining()`(바깥에서만): 소리×.7·좀비 시야×.85·갈증×.5·빗물 받이×2. 주소 `&rain=1`은 강제 비 |
| 재난문자 | `sms(kind,from,text)`(kind 'urgent'·'safe'), `SMSQ`, `smsNext`, `morningSms`(아침 확인 버튼에서). 노선도는 `openMap`의 `.ln` |
| 그림 | `ART_READY`/`ART`, `drawSheet`(3열×4행 걷기 시트: 아래·왼·오른·위), `drawProp`, `pat`(바닥 무늬, `TILE_ART`·`FLOOR_ART`). 사람·좀비·동료는 `player`·`z_<종류>`·`ally_<id>` 그림이 있으면 그것, 없으면 코드 그림. 차는 `car_*`·`bus_blue`·`truck_army`. 거리 소품은 decals의 `k`(gen 끝에서 별도 난수) |
| 가방·장비 | 칸: `SZ`(물건 크기 [w,h])·`STK`(한 칸 묶음 수), `gridWH`(6×4, 배낭 8×5, 도윤 +1줄), `P.lay`(묶음 배치, `relayout`이 P.bag에 맞춤·저장됨), `canCarry`(칸 기준), `sortInv('type'|'size')`(정렬·정리), `overflow`, `freeCells`, `picon`/`pimg`(이모지를 16px 도트 아이콘으로). 끌어 놓기: `DRAG`, `bagDown`/`bagMove`/`bagUp`(6px 넘게 움직여야 끌기, 아니면 선택), `dragCheck`(place·merge·equip·bad), `dragDraw`(유령 그림·미리보기), `dragRotate`(R), `invRotate`. 무게 `WT`·`bagWeight`·`capKg`는 걸음 느려짐에만. 장비: `GEAR`(slot·def·bite·cap), `P.eq{head,body,pack,light}`, `gearDef`/`gearBite`(hurtPlayer). 창: `openLoot`/`renderLoot`/`lootTake`/`lootAll`/`closeLoot`(G.state 'loot', 뒤지기 끝나면), `openInv`/`renderInv`/`invUse`/`invEquip`/`invUnequip`/`invDrop`(G.state 'inv'). 손전등 `P.bat`·`P.lightOn`·`lightActive`·`toggleLight`·`lightTick`(어두우면 자동 켬). 빛은 render0의 `nightK`/`inDark`/`nk`(밤·실내 어둠 .97) |
| 화면 구성(HUD) | `#info`(시계·구역·`#mini` 미니맵·지도/일시정지 버튼), `drawMini`/`miniBase`(구역·층 바뀌면 1칸=1점 그림을 다시 만들고 주변 44칸을 보여 줌), `#hotbar`(무기·1~5 빠른 사용·🔦·🎒, `hud`가 그림. 600px 이상은 아래 가운데 고정). `#cv`만 화면 전체 캔버스 |
| 상태 | `G`(day·t·state·stash·fac·kills), `P`(플레이어), `Z`(좀비), `noises`, `thrown`, `alarms` |
| 판정 | `hitsSolid`, `move`, `los`, `bfs`, `fieldDir` |
| 소리 | `noise(x,y,r,show)`, `scream`, `alarm` |
| 행동 | `attack`, `interact`, `finishSearch`, `throwFire`, `useItem`, `hurtPlayer` |
| 갱신 | `update(dt)`, `updateZ` (상태 idle → inv(소리 조사) → chase) |
| 거점 | `openBase`, `renderBase`, `craft`, `build`, `pack`, `sleep`(하루 정산·습격) |
| 그리기 | `render`, `drawBuilding`(그림을 자기 땅 안에: 위는 지붕·아래는 앞면, 높은 빌딩만 48px 넘침. 골목이 가려지지 않게), `drawZombie`, `drawPlayer`, 밤 어둠 `dk` |

- `G.state`: `field` → `base`(거점 창) / `map` / `loot` / `inv` / `talk` / `pause` → `over`. 건물 안에 있어도 state는 `field`이고 `G.area`로 구별한다. 잠은 거리의 거점에서만 잔다.
- 하루 길이 `DAY=240`초, 밤 시작 `NIGHT=150`초. 날짜 제한 없음, 승리는 남산 송신.
