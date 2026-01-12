# Tasks: 數字抽籤遊戲

**Input**: Design documents from `/specs/001-number-lottery-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification, so no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure - single HTML file with embedded assets:
- **Main file**: `index.html` at repository root
- **Assets**: `assets/js/`, `assets/css/`, `assets/icons/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Docs**: `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure with directories assets/js/, assets/css/, assets/icons/, tests/unit/, tests/integration/, tests/e2e/, docs/
- [x] T002 Create initial index.html with basic HTML5 structure and meta tags for mobile viewport
- [x] T003 [P] Create assets/css/game-styles.css with responsive design framework and mobile-first CSS grid
- [x] T004 [P] Create assets/icons/game-icon.png placeholder (32x32 favicon)
- [x] T005 [P] Create docs/README.md with project overview and deployment instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create assets/js/storage-manager.js with LocalStorage and IndexedDB wrapper functions
- [x] T007 Create assets/js/webrtc-manager.js with P2P connection setup and signaling infrastructure  
- [x] T008 Create assets/js/game-engine.js with core GameRoom, Player, GameRound, GameResult entities from data-model.md
- [x] T009 Create assets/js/ui-controller.js with base UI event handling and responsive layout manager
- [x] T010 Implement GameState enum and state transition validation in assets/js/game-engine.js
- [x] T011 Implement ConnectionStatus management and heartbeat system in assets/js/webrtc-manager.js
- [x] T012 Setup error handling and logging framework across all JS modules

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 遊戲設置與參賽者註冊 (Priority: P1) 🎯 MVP

**Goal**: 主持人建立新遊戲並讓五位參賽者透過手機加入遊戲，每位參賽者輸入自己的暱稱後等待遊戲開始

**Independent Test**: 主持人建立遊戲、五個人用不同手機加入並輸入暱稱，驗證多人連線和暱稱顯示功能

### Implementation for User Story 1

- [x] T013 [P] [US1] Implement room code generation (4-6 digits) in assets/js/game-engine.js
- [x] T014 [P] [US1] Create host interface for "建立新遊戲" button in index.html
- [x] T015 [US1] Implement CREATE_ROOM message handling in assets/js/webrtc-manager.js
- [x] T016 [US1] Display room code on projector screen interface in index.html
- [x] T017 [P] [US1] Create mobile player interface for room code input in index.html
- [x] T018 [P] [US1] Create nickname input form with validation in index.html
- [x] T019 [US1] Implement JOIN_ROOM message handling with room validation in assets/js/webrtc-manager.js
- [x] T020 [US1] Implement player limit validation (max 5 players) in assets/js/game-engine.js
- [x] T021 [US1] Display joined players list on projector screen in assets/js/ui-controller.js
- [x] T022 [US1] Implement nickname uniqueness validation in assets/js/game-engine.js
- [x] T023 [US1] Handle "遊戲人數已滿" error message display in assets/js/ui-controller.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 單輪抽籤與計分 (Priority: P1) 🎯 MVP

**Goal**: 參賽者在手機上進行一輪數字抽籤（0-100），主持人設定目標數字，系統計算每位參賽者的得分並顯示結果

**Independent Test**: 五位參賽者各自在手機上抽數字，主持人輸入目標數字，驗證計分邏輯和結果顯示

### Implementation for User Story 2

- [x] T024 [P] [US2] Create host "開始第一輪抽籤" button interface in index.html
- [x] T025 [P] [US2] Create player lottery button interface for mobile devices in index.html
- [x] T026 [US2] Implement START_LOTTERY message broadcasting in assets/js/webrtc-manager.js
- [x] T027 [US2] Implement random number generation (0-100) in assets/js/game-engine.js
- [x] T028 [US2] Handle DRAW_NUMBER message and update player state in assets/js/game-engine.js
- [x] T029 [US2] Display drawn numbers on projector screen in real-time in assets/js/ui-controller.js
- [x] T030 [P] [US2] Create host target number input interface (0-100) in index.html
- [x] T031 [US2] Implement SET_TARGET_NUMBER message handling in assets/js/webrtc-manager.js
- [x] T032 [US2] Implement scoring calculation (player number - host number) in assets/js/game-engine.js
- [x] T033 [US2] Block scoring until host target number is set, display reminder in assets/js/ui-controller.js
- [x] T034 [US2] Display round results with player numbers, target number, and scores in assets/js/ui-controller.js
- [x] T035 [US2] Handle negative scores display correctly in assets/js/ui-controller.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - complete single-round game available

---

## Phase 5: User Story 3 - 多輪遊戲與最終排名 (Priority: P2)

**Goal**: 重複進行五輪遊戲，累計每位參賽者的總得分，最後顯示最終排名並宣布獲勝者

**Independent Test**: 進行完整的五輪遊戲，驗證得分累計、排名計算和獲勝者宣布功能

### Implementation for User Story 3

- [x] T036 [P] [US3] Implement round progression logic (1-5 rounds) in assets/js/game-engine.js
- [x] T037 [P] [US3] Create "啟動下一輪" interface for host in index.html
- [x] T038 [US3] Handle START_NEXT_ROUND message and reset round state in assets/js/webrtc-manager.js
- [x] T039 [US3] Implement cumulative score tracking in assets/js/game-engine.js
- [x] T040 [US3] Display current round rankings after each round in assets/js/ui-controller.js
- [x] T041 [US3] Implement final ranking calculation with tie handling (all winners) in assets/js/game-engine.js
- [x] T042 [US3] Create winner celebration screen interface in index.html
- [x] T043 [US3] Display final results with winner announcement and gift reminder in assets/js/ui-controller.js
- [x] T044 [US3] Handle multiple winners (tied scores) display correctly in assets/js/ui-controller.js

**Checkpoint**: All core user stories should now be independently functional - complete 5-round game available

---

## Phase 6: User Story 4 - 遊戲狀態管理與重置 (Priority: P3)

**Goal**: 主持人可以查看遊戲進度、重新開始遊戲或處理異常情況（如參賽者中途離開）

**Independent Test**: 模擬各種異常情況和重置操作來驗證系統的穩定性

### Implementation for User Story 4

- [x] T045 [P] [US4] Create game status display interface for host in index.html
- [x] T046 [P] [US4] Create "重新開始遊戲" button with confirmation dialog in index.html
- [x] T047 [US4] Implement GET_GAME_STATE message handling in assets/js/webrtc-manager.js
- [x] T048 [US4] Display current round, player count, scores status in assets/js/ui-controller.js
- [x] T049 [US4] Implement RESET_GAME message handling and state clearing in assets/js/game-engine.js
- [x] T050 [US4] Handle player disconnection detection and marking in assets/js/webrtc-manager.js
- [x] T051 [US4] Implement RECONNECT message handling and state synchronization in assets/js/webrtc-manager.js
- [x] T052 [US4] Display offline player indicators and preserve their data in assets/js/ui-controller.js

**Checkpoint**: Complete administrative functionality available

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deployment preparation

- [x] T053 [P] Optimize CSS for mobile performance and cross-browser compatibility in assets/css/game-styles.css
- [x] T054 [P] Implement responsive design breakpoints for different screen sizes in assets/css/game-styles.css
- [x] T055 [P] Add loading states and progress indicators across all interfaces in assets/js/ui-controller.js
- [x] T056 [P] Implement connection quality indicators and WebRTC diagnostics in assets/js/webrtc-manager.js
- [x] T057 [P] Add proper error message translations and user feedback in assets/js/ui-controller.js
- [x] T058 [P] Optimize IndexedDB performance for game history storage in assets/js/storage-manager.js
- [x] T059 Embed all CSS and JS assets inline into index.html for single-file deployment
- [x] T060 [P] Create deployment documentation in docs/API.md
- [x] T061 [P] Validate HTML5 compliance and accessibility standards for index.html
- [x] T062 Run performance audit and ensure <3s load time on 3G networks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories (but builds on US1 for complete experience)
  - User Story 3 (P2): Can start after Foundational - Uses US1+US2 components but independently testable
  - User Story 4 (P3): Can start after Foundational - Administrative layer over existing stories
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: 房間設置與參賽者註冊 - No dependencies, pure foundation
- **User Story 2 (P1)**: 單輪抽籤與計分 - Independent core game logic, works with US1 for full experience
- **User Story 3 (P2)**: 多輪遊戲與最終排名 - Extends US2 logic but independently testable
- **User Story 4 (P3)**: 遊戲狀態管理與重置 - Administrative layer, no story dependencies

### Within Each User Story

- Models and core logic before UI components
- UI components before integration and display logic
- Error handling and edge cases after core functionality
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup phase**: T003, T004, T005 can run in parallel (different files)
- **User Story 1**: T013, T014, T017, T018 can run in parallel (different UI components)
- **User Story 2**: T024, T025, T030 can run in parallel (different interface elements)
- **User Story 3**: T036, T037 can run in parallel (logic vs UI)
- **User Story 4**: T045, T046, T047 can run in parallel (different components)
- **Polish phase**: T053, T054, T055, T056, T057, T058, T060, T061 can run in parallel (different optimization areas)

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Create host interface for 建立新遊戲 button in index.html" [T014]
Task: "Create mobile player interface for room code input in index.html" [T017]
Task: "Create nickname input form with validation in index.html" [T018]

# Launch all core logic for User Story 1 together:
Task: "Implement room code generation (4-6 digits) in assets/js/game-engine.js" [T013]
Task: "Implement nickname uniqueness validation in assets/js/game-engine.js" [T022]
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (房間設置與參賽者註冊)
4. Complete Phase 4: User Story 2 (單輪抽籤與計分)
5. **STOP and VALIDATE**: Test complete single-round game independently
6. Deploy/demo ready - functional wedding game with basic features

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test room creation/joining → Basic multiplayer lobby
3. Add User Story 2 → Test single round game → Complete MVP game ready for wedding use
4. Add User Story 3 → Test 5-round game → Full wedding game experience
5. Add User Story 4 → Test admin features → Production-ready with management tools
6. Each story adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - Developer A: User Story 1 (房間設置)
   - Developer B: User Story 2 (抽籤計分)  
   - Developer C: User Story 3 (多輪遊戲)
   - Developer D: User Story 4 (管理功能)
3. Stories complete and integrate independently
4. Polish phase can be distributed across all developers

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability  
- Each user story should be independently completable and testable
- Single HTML file deployment means final integration step (T059) is critical
- WebRTC P2P architecture means no server-side dependencies
- 正體中文 interface requirements integrated throughout UI tasks
- Commit after each task or logical group for incremental progress
- Stop at any checkpoint to validate story independently
- Focus on mobile-first responsive design throughout implementation