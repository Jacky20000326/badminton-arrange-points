# 羽球排點系統專案規劃 - Plan Artifact

## 專案概述

**專案名稱**: badminton-arrange-points
**專案類型**: 網頁應用 (Web App)
**目標**: 開發一個自動化羽球比賽配對系統，根據球員等級智能媒合對手
**預計完成時間**: 2-3 個月

---

## 技術架構

### 前端技術棧
- **框架**: Next.js 14+ (React 18+)
- **語言**: TypeScript
- **UI 框架**: Material-UI (MUI)
- **狀態管理**: React Context API + useReducer（中小型應用足夠）
- **HTTP 客戶端**: Axios
- **表單處理**: React Hook Form + Zod（驗證）
- **日期處理**: date-fns

### 後端技術棧
- **框架**: Node.js + Express.js
- **語言**: TypeScript
- **數據庫**: PostgreSQL
- **ORM**: Prisma（類型安全、開發效率高）
- **認證**: JWT (jsonwebtoken)
- **密碼加密**: bcrypt
- **驗證**: Zod（前後端共用 schema）
- **日誌**: Winston

### 開發工具
- **代碼規範**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **測試**: Jest + React Testing Library（前端）、Jest + Supertest（後端）
- **API 文檔**: Swagger/OpenAPI（可選）

---

## 資料庫設計

### 核心資料表

#### 1. users（用戶表）
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE NOT NULL
password_hash     VARCHAR(255) NOT NULL
name              VARCHAR(100) NOT NULL
phone             VARCHAR(20)
role              ENUM('PLAYER', 'ORGANIZER', 'ADMIN') DEFAULT 'PLAYER'
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

#### 2. player_profiles（球員資料表）
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
skill_level       INTEGER NOT NULL CHECK (skill_level BETWEEN 1 AND 10)
total_matches     INTEGER DEFAULT 0
win_rate          DECIMAL(5,2) DEFAULT 0.00
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

#### 3. events（活動表）
```sql
id                UUID PRIMARY KEY
organizer_id      UUID REFERENCES users(id)
name              VARCHAR(200) NOT NULL
description       TEXT
start_time        TIMESTAMP NOT NULL
end_time          TIMESTAMP NOT NULL
court_count       INTEGER NOT NULL CHECK (court_count > 0)
status            ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT'
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

#### 4. event_registrations（報名表）
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id) ON DELETE CASCADE
user_id           UUID REFERENCES users(id)
skill_level       INTEGER NOT NULL
status            ENUM('REGISTERED', 'CHECKED_IN', 'CANCELLED') DEFAULT 'REGISTERED'
registered_at     TIMESTAMP DEFAULT NOW()
UNIQUE(event_id, user_id)
```

#### 5. matches（比賽記錄表）
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id) ON DELETE CASCADE
court_number      INTEGER NOT NULL
player1_id        UUID REFERENCES users(id)
player2_id        UUID REFERENCES users(id)
player3_id        UUID REFERENCES users(id)
player4_id        UUID REFERENCES users(id)
status            ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'WAITING'
started_at        TIMESTAMP
completed_at      TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()
```

#### 6. match_queue（配對佇列表）
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id) ON DELETE CASCADE
user_id           UUID REFERENCES users(id)
queue_position    INTEGER NOT NULL
joined_at         TIMESTAMP DEFAULT NOW()
wait_duration     INTEGER DEFAULT 0  -- 等待時長（分鐘）
match_count       INTEGER DEFAULT 0  -- 本活動已比賽次數
```

#### 7. match_history（歷史配對記錄）
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id)
player1_id        UUID REFERENCES users(id)
player2_id        UUID REFERENCES users(id)
matched_at        TIMESTAMP DEFAULT NOW()
INDEX idx_event_players (event_id, player1_id, player2_id)
```

---

## API 設計

### 認證相關 API
```
POST   /api/auth/register          註冊新用戶
POST   /api/auth/login             登入
POST   /api/auth/logout            登出
GET    /api/auth/me                獲取當前用戶資訊
PUT    /api/auth/profile           更新個人資料
```

### 活動管理 API
```
POST   /api/events                 創建活動（團主）
GET    /api/events                 獲取活動列表
GET    /api/events/:id             獲取活動詳情
PUT    /api/events/:id             更新活動（團主）
DELETE /api/events/:id             刪除活動（團主）
POST   /api/events/:id/register    報名活動
DELETE /api/events/:id/register    取消報名
GET    /api/events/:id/registrations 獲取參與者列表
```

### 比賽配對 API
```
POST   /api/events/:id/matches/generate  生成新一輪配對
GET    /api/events/:id/matches           獲取當前比賽狀態
POST   /api/matches/:id/start            開始比賽
POST   /api/matches/:id/complete         完成比賽
GET    /api/matches/my-turn              查詢我的上場狀態
```

### 系統管理 API
```
GET    /api/admin/users            用戶管理
GET    /api/admin/stats            統計數據
```

---

## 配對演算法設計

### 核心配對邏輯

```typescript
interface MatchingFactors {
  skillLevel: number;        // 等級
  waitDuration: number;      // 等待時長（分鐘）
  matchCount: number;        // 已比賽次數
  userId: string;
}

interface MatchingWeights {
  skillLevel: number;        // 權重：0.5（最重要）
  waitDuration: number;      // 權重：0.25
  matchCount: number;        // 權重：0.15
  avoidRepeat: number;       // 權重：0.10
}
```

### 配對演算法主流程
1. 獲取所有等待中的球員
2. 計算每對球員的配對分數
3. 使用貪心演算法選擇最優配對組合
4. 分配場地並創建比賽記錄

### 計分因素
1. **等級相近分數** - 方差越小分數越高
2. **等待時間分數** - 等越久分數越高
3. **比賽次數均衡分數** - 次數越少分數越高
4. **避免重複配對分數** - 防止同組過多

### 觸發機制
1. **自動觸發**：當比賽完成時自動觸發配對；使用後端定時任務每 30 秒檢查一次
2. **手動觸發**：團主可以手動觸發新一輪配對
3. **時間控制**：檢查當前時間是否在活動時間範圍內

---

## 前端架構

### 目錄結構
```
frontend/src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認證相關頁面 (login, register)
│   ├── (main)/              # 主要應用頁面
│   │   ├── dashboard/       # 儀表板
│   │   ├── events/          # 活動管理
│   │   │   ├── page.tsx     # 活動列表
│   │   │   ├── [id]/        # 活動詳情
│   │   │   ├── create/      # 創建活動
│   │   │   └── [id]/edit/   # 編輯活動
│   │   ├── matches/         # 比賽狀態
│   │   └── profile/         # 個人資料
│   ├── admin/               # 管理後台
│   ├── layout.tsx
│   └── page.tsx
├── components/              # React 組件
│   ├── EventCard.tsx        # 活動卡片
│   ├── EventForm.tsx        # 活動表單
│   ├── Pagination.tsx       # 分頁組件
│   ├── ProtectedRoute.tsx   # 受保護的路由
│   └── ...
├── contexts/                # React Context
│   └── AuthContext.tsx      # 認證上下文
├── hooks/                   # 自定義 Hooks
│   └── useAuth.ts           # 認證 Hook
├── lib/                     # 工具函數
│   ├── api.ts               # API 客戶端
│   └── validation.ts        # 驗證 schemas
├── types/                   # TypeScript 類型
│   ├── user.ts
│   ├── event.ts
│   └── match.ts
└── styles/                  # 樣式文件
    └── globals.css
```

### 關鍵頁面設計

#### 活動列表頁面 (`/events`)
- 活動卡片（顯示時間、場地數、已報名人數）
- 狀態篩選與搜尋
- 報名按鈕
- 分頁支持

#### 活動詳情頁面 (`/events/[id]`)
**球友視角**：
- 活動資訊
- 報名/取消報名
- 查看當前比賽狀態

**團主視角**：
- 活動管理
- 參與者列表
- 場地即時狀態
- 手動觸發配對按鈕
- 開始/結束活動

#### 創建活動頁面 (`/events/create`)
- 活動表單（名稱、描述、時間、場地數）
- 表單驗證
- 團主/管理員限制

#### 編輯活動頁面 (`/events/[id]/edit`)
- 預填表單
- 權限檢查（只有創建者可編輯）

---

## 後端架構

### 目錄結構
```
backend/src/
├── app.ts                   # Express 應用主入口
├── config/                  # 配置
├── controllers/             # 控制器
│   ├── auth.controller.ts
│   ├── event.controller.ts
│   ├── matches.controller.ts
│   └── admin.controller.ts
├── middleware/              # 中間件
│   ├── auth.ts              # JWT 驗證
│   ├── errorHandler.ts      # 錯誤處理
│   └── validator.ts         # 驗證
├── routes/                  # 路由
│   ├── auth.routes.ts
│   ├── events.routes.ts
│   ├── matches.routes.ts
│   └── admin.routes.ts
├── services/                # 業務邏輯
│   ├── auth.service.ts
│   ├── events.service.ts
│   ├── matching.service.ts  # 配對演算法
│   └── notification.service.ts
├── types/                   # TypeScript 類型
├── utils/                   # 工具函數
│   ├── logger.ts
│   └── validation.ts
├── jobs/                    # 定時任務
│   └── matchScheduler.ts    # 自動配對任務
└── lib/                     # 庫
    └── prisma.ts            # Prisma 客戶端單例
```

### 關鍵服務

#### 1. matching.service.ts（配對服務）
- 實現配對演算法
- 管理比賽佇列
- 處理配對歷史記錄

#### 2. notification.service.ts（通知服務）
- 簡單的輪詢機制：前端每 5-10 秒輪詢 `/api/matches/my-turn`
- 可選：升級到 Server-Sent Events (SSE)

#### 3. matchScheduler.ts（定時任務）
```typescript
import cron from 'node-cron';

// 每 30 秒檢查一次活動狀態
cron.schedule('*/30 * * * * *', async () => {
  const activeEvents = await getActiveEvents();

  for (const event of activeEvents) {
    if (!isEventActive(event)) continue;

    const availableCourts = await getAvailableCourts(event.id);

    if (availableCourts > 0) {
      await generateMatches(event.id, availableCourts);
    }
  }
});
```

---

## 實現步驟

### Phase 1: 專案初始化 ✅ **完成**
- [x] 初始化 Next.js 前端專案
- [x] 初始化 Node.js + Express 後端專案
- [x] 設置 TypeScript 配置
- [x] 設置 ESLint + Prettier
- [x] 設置 Prisma 和數據庫 Schema
- [x] 建立基礎文件結構

**完成內容**: 完整的項目初始化，包括前後端項目結構、數據庫 schema、環境變數配置

### Phase 2: 認證系統 ✅ **完成**
- [x] 後端認證服務（註冊、登入、JWT）
- [x] 認證中間件
- [x] 密碼加密（bcryptjs）
- [x] 前端 AuthContext
- [x] 登入/註冊頁面
- [x] Protected Routes
- [x] 個人資料頁面
- [x] Token 管理

**完成內容**: 完整的 JWT 認證系統、前端狀態管理、受保護路由

### Phase 3: 活動管理 ✅ **完成**

#### 後端實現 (5 個文件)
- [x] `types/event.ts` - 活動類型定義
- [x] `services/event.service.ts` - 7 個業務邏輯函數（CRUD、報名、參與者查詢）
- [x] `controllers/event.controller.ts` - 8 個 HTTP 端點
- [x] `routes/events.routes.ts` - 路由配置
- [x] Enhanced ValidationError in `utils/validation.ts`

#### 前端實現 (14 個文件)
- [x] `types/event.ts` - 前端事件類型定義
- [x] Extended `lib/api.ts` - 活動 API 端點
- [x] `components/EventCard.tsx` - 活動卡片組件
- [x] `components/EventForm.tsx` - 活動表單組件
- [x] `components/Pagination.tsx` - 分頁組件
- [x] `app/(main)/events/page.tsx` - 活動列表頁
- [x] `app/(main)/events/[id]/page.tsx` - 活動詳情頁
- [x] `app/(main)/events/create/page.tsx` - 創建活動頁
- [x] `app/(main)/events/[id]/edit/page.tsx` - 編輯活動頁
- [x] CSS Modules for all components

**完成內容**: 完整的活動管理系統，包括 CRUD、報名、參與者列表、權限控制

**核心功能**:
- ✅ 活動 CRUD API（創建、查詢、更新、刪除）
- ✅ 活動狀態管理（DRAFT → ACTIVE → COMPLETED/CANCELLED）
- ✅ 報名/取消報名功能
- ✅ 參與者列表查詢 & 統計
- ✅ 權限控制（團主/管理員）
- ✅ 分頁與狀態篩選
- ✅ 形式驗證（前後端）

### Phase 4: 配對演算法 ⏳ **待實現**

**時程**: 1-2 週

**實現內容**:
- [ ] 創建 `services/matching.service.ts`
- [ ] 實現配對分數計算邏輯
- [ ] 實現組合生成演算法
- [ ] 實現貪心選擇邏輯
- [ ] 重複配對檢測
- [ ] 單元測試（重要！）

**關鍵 API**:
```
POST   /api/events/:id/matches/generate  # 生成配對
GET    /api/events/:id/matches           # 獲取配對狀態
```

### Phase 5: 比賽狀態管理 ⏳ **待實現**

**時程**: 1-2 週

**後端實現**:
- [ ] 比賽狀態機（waiting → in_progress → completed）
- [ ] 場地分配邏輯
- [ ] 比賽歷史記錄
- [ ] 自動配對定時任務（node-cron）

**前端實現**:
- [ ] 場地視圖組件（Grid 佈局）
- [ ] 比賽卡片組件
- [ ] 等待佇列顯示
- [ ] 比賽控制按鈕（開始/完成）
- [ ] 輪詢機制實現上場通知

### Phase 6: 系統管理 ⏳ **待實現**

**時程**: 1 週

- [ ] 管理員儀表板
- [ ] 用戶管理
- [ ] 活動管理
- [ ] 統計報表

### Phase 7: 測試與優化 ⏳ **待實現**

**時程**: 1-2 週

**測試**:
- [ ] 後端單元測試（重點：配對演算法）
- [ ] 後端整合測試
- [ ] 前端組件測試
- [ ] E2E 測試（可選）

**優化**:
- [ ] 數據庫查詢優化（索引）
- [ ] 前端組件優化（React.memo）
- [ ] API 響應緩存
- [ ] 打包優化

### Phase 8: 部署上線 ⏳ **待實現**

**時程**: 1 週

- [ ] 環境變數配置
- [ ] 數據庫遷移腳本
- [ ] Docker 配置
- [ ] CI/CD 設置（GitHub Actions）
- [ ] 部署平台配置

---

## 關鍵設計決策

### 1. 權限控制策略
- **創建活動**: 僅團主/管理員（中間件檢查）
- **編輯/刪除活動**: 創建者或管理員（Service 層檢查）
- **報名活動**: 已登入用戶
- **查看報名列表**: 團主/管理員

### 2. 時區處理
- 後端使用 UTC 時間存儲
- 前端使用 ISO 8601 格式傳輸
- 顯示時轉換為本地時區

### 3. 並發處理
- 使用數據庫 UNIQUE 約束防止重複報名
- 在 Service 層檢查報名狀態

### 4. 分頁策略
- 默認每頁 10 條記錄
- 支持狀態篩選

### 5. Token 存儲
- 使用 sessionStorage（自動清除）而非 localStorage（防止 XSS）
- API 攔截器處理 401 錯誤自動重定向

---

## 潛在風險和緩解措施

| 風險 | 問題 | 解決方案 |
|------|------|--------|
| 時區混淆 | 時間轉換不一致 | 統一使用 ISO 8601 格式，前端使用 datetime-local 輸入 |
| 並發報名衝突 | 多人同時報名造成衝突 | 數據庫 UNIQUE 約束 + Service 層檢查 |
| 權限漏洞 | 前端驗證不可信 | 後端雙重檢查（中間件 + Service 層） |
| 無效狀態轉換 | 狀態機混亂 | 明確定義狀態機，Service 層驗證 |
| 配對演算法性能 | 組合爆炸導致性能下降 | 限制參與人數，使用貪心算法近似最優解 |

---

## 實施優先級

### P0 (必須實現)
1. 活動 CRUD API
2. 報名/取消報名 API
3. 活動列表頁面
4. 活動詳情頁面
5. 創建活動表單
6. 權限控制

### P1 (建議實現)
1. 編輯活動頁面
2. 分頁功能
3. 狀態篩選
4. 參與者列表顯示

### P2 (可選增強)
1. 高級搜索
2. 批量操作
3. 活動提醒
4. 導出功能

---

## 潛在挑戰與解決方案

### 挑戰 1: 配對演算法的公平性
**解決方案**:
- 將「比賽次數均衡」作為重要因素
- 設置等待時間上限，超過時間自動提高優先級
- 提供手動調整優先級功能（團主）

### 挑戰 2: 即時性需求
**解決方案**:
- 前端輪詢（簡單有效）
- 可選升級到 WebSocket 或 SSE
- 使用視覺化通知（閃爍、顏色高亮）

### 挑戰 3: 人數不足時的配對
**解決方案**:
- 提示團主人數不足
- 允許 2v2 以外的模式（如 1v1 練習）
- 顯示當前等待人數

### 挑戰 4: 等級分級標準
**解決方案**:
- 使用 1-10 數字等級
- 提供等級說明（初學者、初級、中級、中高級、高級）
- 允許團主手動調整球員等級

### 挑戰 5: 數據庫性能
**解決方案**:
- 在 `match_history` 表上建立索引
- 使用 Redis 緩存最近配對記錄
- 限制歷史記錄查詢範圍（僅本活動）

---

## 關鍵成功因素

1. **配對演算法的準確性** — 這是系統的核心價值，必須經過充分測試
2. **用戶體驗的流暢性** — 報名、查看配對、上場通知等流程要簡潔明瞭
3. **系統的穩定性** — 定時任務不能出錯，配對邏輯要處理各種邊界情況
4. **響應式設計** — 大部分用戶會用手機查看，手機端體驗要優化

---

## 預期成果

- ✅ 完整的網頁應用，支援團主、球友、管理員三種角色
- ✅ 智能配對系統，自動媒合等級相近的球員
- ✅ 即時比賽狀態更新（輪詢機制）
- ✅ 完善的活動管理功能
- ✅ 用戶友好的界面設計
- ✅ 穩定可靠的後端服務

---

## 後續擴展方向

1. **移動 App** — 開發 React Native 版本
2. **積分系統** — 根據比賽結果計算積分排名
3. **社交功能** — 球友互加好友、組隊功能
4. **進階統計** — 勝率分析、對手分析
5. **多球種支持** — 擴展到網球、桌球等運動
6. **AI 教練建議** — 根據比賽記錄提供技術建議

---

## 開發者指南

### 環境設置
```bash
# 後端
cd backend
npm install
npm run db:push  # 初始化數據庫

# 前端
cd frontend
npm install
```

### 開發服務器
```bash
# 後端（在 backend/ 目錄）
npm run dev  # 運行在 http://localhost:3001

# 前端（在 frontend/ 目錄）
npm run dev  # 運行在 http://localhost:3000
```

### 構建與部署
```bash
# 後端
npm run build
npm start

# 前端
npm run build
npm start
```

---

## 專案預計完成時間

**2-3 個月**（含開發、測試和優化）

**團隊建議**: 1 前端工程師 + 1 後端工程師 + 1 UI/UX 設計師（可選）

**預算考量**: 開發成本（人力）+ 雲端服務費用（~$20-50/月）

---

*最後更新: 2025-12-28*
*當前階段: Phase 3 (活動管理) ✅ 完成*
*下一階段: Phase 4 (配對演算法)*
