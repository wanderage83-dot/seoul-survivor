# 서울, 잔류자 — 작업 안내

서울을 무대로 한 쿼터뷰 좀비 생존 게임. **정적 HTML 단일 파일**(`index.html`)이며 빌드 도구·npm 의존성을 넣지 않는다.

- 기획 원본: `notes/2026-11-25_서울좀비생존_기획안.md`. 장르(탐색·제작·거점 생존)만 참고하는 원작이다. 다른 게임의 이름·인물·그림·맵을 가져오지 않는다.
- 게임 내 문구는 한국어로 쓴다. 기능을 바꾸면 `README.md`도 고친다.
- 세로 휴대폰(390×844)·가로 휴대폰(844×390)·PC(1280×720)에서 확인한다. 수정 후 `node tests/smoke.cjs <정적서버URL>`이 통과해야 한다.
- md 메모는 `notes/YYYY-MM-DD_내용.md`에 둔다. `.vercelignore`가 notes·tests·md를 배포에서 뺀다.
- 공개 주소: https://seoul-survivor.vercel.app (Vercel 프로젝트 seoul-survivor, 팀 bridgej). 새 버전은 main에 올린 뒤 create_deployment(gitSource ref main, target production)로 다시 배포한다.

## 코드 지도 (index.html 안 `/* ─── */` 구획)
| 구획 | 주요 심볼 |
|---|---|
| 데이터 | `ITEMS`, `WEAP`, `LOOT`(뒤질 것별 드롭표), `ZT`(좀비 종류), `RECIPES`, `FACS` |
| 지도 | `gen(seed)`, `tile`/`solid`/`sightB`, `buildings`, `cars`, `trees`, `conts`, `HOME_TILE` |
| 상태 | `G`(day·t·state·stash·fac·kills), `P`(플레이어), `Z`(좀비), `noises`, `thrown`, `alarms` |
| 판정 | `hitsSolid`, `move`, `los`, `bfs`, `fieldDir` |
| 소리 | `noise(x,y,r,show)`, `scream`, `alarm` |
| 행동 | `attack`, `interact`, `finishSearch`, `throwFire`, `useItem`, `hurtPlayer` |
| 갱신 | `update(dt)`, `updateZ` (상태 idle → inv(소리 조사) → chase) |
| 거점 | `openBase`, `renderBase`, `craft`, `build`, `pack`, `sleep`(하루 정산·습격) |
| 그리기 | `render`, `drawBuilding`(지붕을 H만큼 올린 3/4 시점), `drawZombie`, `drawPlayer`, 밤 어둠 `dk` |

- `G.state`: `field` → `base`(거점 창) / `pause` → `over`.
- 하루 길이 `DAY=240`초, 밤 시작 `NIGHT=150`초, 승리 `WIN_DAY=7`.
