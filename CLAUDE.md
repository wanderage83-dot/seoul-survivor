# 서울, 잔류자 — 작업 안내

서울을 무대로 한 쿼터뷰 좀비 생존 게임. **정적 HTML 단일 파일**(`index.html`)이며 빌드 도구·npm 의존성을 넣지 않는다.

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
| 엔딩 | `finalNeed`/`finalAsk`/`finalStart`/`finalTick`(90초 송신, 6칸 안에 있어야 진행)/`drawFinal`/`drawFinalBar`/`winFinal` |
| 저장 | `SAVE_KEY='seoul-survivor-save-v1'`(키는 그대로, 내용 v2), `saveGame`/`loadGame`/`readSave`/`clearSave`. 지도는 seed로 재생성, 상자는 구역별 `zones[id]`의 conts 순서 인덱스로 복원(v1은 강남 하나로 읽음), 층 상자는 `G.floorSave`→`fillFloor`. 저장 구조를 바꾸면 v를 올리거나 loadGame에서 기본값을 채운다 |
| 화면 분위기 | 기본 `VLOOK='pixel'`(도트: `render`가 `lo` 작은 캔버스에 `render0`을 그리고 `pixelBlit`이 `PAL` 32색+`BAYER` 디더링 후 각지게 확대, 글자는 `loctx.fillText`가 `TXT`에 모아 선명하게 다시 씀. 화면 크기 변환은 `RS`, 한 칸 픽셀 `PXS`). 그 밖에 'noir'·'basic'(주소 `?look=`·일시정지 `toggleLook`, localStorage `seoul-survivor-look2`). `drawShafts`/`SHAFTS` 실내 창문 빛줄기. `noirPass`(1차 그림 후 채도 빼기 → 간판·피·반짝임·사람/좀비만 색으로 다시), `NEON`·`noirNightCut`·`noirNightGlow`(밤 간판 빛), `drawRain`. 날씨: `G.rain`(잠잘 때 30%), `raining()`(바깥에서만): 소리×.7·좀비 시야×.85·갈증×.5·빗물 받이×2. 주소 `&rain=1`은 강제 비 |
| 재난문자 | `sms(kind,from,text)`(kind 'urgent'·'safe'), `SMSQ`, `smsNext`, `morningSms`(아침 확인 버튼에서). 노선도는 `openMap`의 `.ln` |
| 그림 | `ART_READY`/`ART`, `drawSheet`(3열×4행 걷기 시트: 아래·왼·오른·위), `drawProp`, `pat`(바닥 무늬, `TILE_ART`·`FLOOR_ART`). 사람·좀비·동료는 `player`·`z_<종류>`·`ally_<id>` 그림이 있으면 그것, 없으면 코드 그림. 차는 `car_*`·`bus_blue`·`truck_army`. 거리 소품은 decals의 `k`(gen 끝에서 별도 난수) |
| 가방·장비 | 무게: `WT`(kg), `bagWeight`/`capKg`(15+배낭10+도윤6)/`canCarry`. 장비: `GEAR`(slot·def·bite·cap), `P.eq{head,body,pack,light}`, `gearDef`/`gearBite`(hurtPlayer). 창: `openLoot`/`renderLoot`/`lootTake`/`lootAll`/`closeLoot`(G.state 'loot', 뒤지기 끝나면), `openInv`/`renderInv`/`invUse`/`invEquip`/`invUnequip`/`invDrop`(G.state 'inv'). 손전등 `P.bat`·`P.lightOn`·`lightActive`·`toggleLight`·`lightTick`(어두우면 자동 켬). 빛은 render0의 `nightK`/`inDark`/`nk`(밤·실내 어둠 .97) |
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
