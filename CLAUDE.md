# 서울, 잔류자 — 작업 안내

서울을 무대로 한 쿼터뷰 좀비 생존 게임. **정적 HTML 단일 파일**(`index.html`)이며 빌드 도구·npm 의존성을 넣지 않는다.

- 실제 지명·길 배치는 참고하되 상호는 비튼 이름(스타벅수, 다있소 등)으로 쓴다. 실제 상호·로고를 그대로 쓰지 않는다.
- 기획 원본: `notes/2026-11-25_서울좀비생존_기획안.md`. 장르(탐색·제작·거점 생존)만 참고하는 원작이다. 다른 게임의 이름·인물·그림·맵을 가져오지 않는다.
- 게임 내 문구는 한국어로 쓴다. 기능을 바꾸면 `README.md`도 고친다.
- 세로 휴대폰(390×844)·가로 휴대폰(844×390)·PC(1280×720)에서 확인한다. 수정 후 `node tests/smoke.cjs <정적서버URL>`이 통과해야 한다.
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
| 저장 | `SAVE_KEY='seoul-survivor-save-v1'`, `saveGame`/`loadGame`/`readSave`/`clearSave`. 지도는 seed로 재생성, 상자는 conts 순서 인덱스로 복원, 층 상자는 `G.floorSave`→`fillFloor`. 저장 구조를 바꾸면 v를 올리거나 loadGame에서 기본값을 채운다 |
| 상태 | `G`(day·t·state·stash·fac·kills), `P`(플레이어), `Z`(좀비), `noises`, `thrown`, `alarms` |
| 판정 | `hitsSolid`, `move`, `los`, `bfs`, `fieldDir` |
| 소리 | `noise(x,y,r,show)`, `scream`, `alarm` |
| 행동 | `attack`, `interact`, `finishSearch`, `throwFire`, `useItem`, `hurtPlayer` |
| 갱신 | `update(dt)`, `updateZ` (상태 idle → inv(소리 조사) → chase) |
| 거점 | `openBase`, `renderBase`, `craft`, `build`, `pack`, `sleep`(하루 정산·습격) |
| 그리기 | `render`, `drawBuilding`(그림을 자기 땅 안에: 위는 지붕·아래는 앞면, 높은 빌딩만 48px 넘침. 골목이 가려지지 않게), `drawZombie`, `drawPlayer`, 밤 어둠 `dk` |

- `G.state`: `field` → `base`(거점 창) / `map` / `pause` → `over`. 건물 안에 있어도 state는 `field`이고 `G.area`로 구별한다. 잠은 거리의 거점에서만 잔다.
- 하루 길이 `DAY=240`초, 밤 시작 `NIGHT=150`초, 승리 `WIN_DAY=7`.
