# 開發指南

本文檔說明如何在本地開發環境中設置和運行羽球排點系統。

## 快速開始

### 1. 安裝依賴

```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

### 2. 設置數據庫

#### 選項 A：使用 SQLite（推薦開發）
直接使用 `.env` 中的默認配置，Prisma 會自動建立 `dev.db` 文件。

```bash
cd backend
npm run db:push
```

#### 選項 B：使用 PostgreSQL
1. 安裝並啟動 PostgreSQL
2. 建立數據庫：
   ```bash
   createdb badminton_db
   ```
3. 更新 `backend/.env`：
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/badminton_db"
   ```
4. 執行遷移：
   ```bash
   npm run db:push
   ```

### 3. 啟動開發服務器

#### 終端 1：啟動後端
```bash
cd backend
npm run dev
```
訪問：http://localhost:3001/health

#### 終端 2：啟動前端
```bash
cd frontend
npm run dev
```
訪問：http://localhost:3000

## 項目結構詳解

### 後端結構

```
backend/
├── src/
│   ├── config/           # 配置文件（數據庫、環境等）
│   ├── controllers/      # 路由處理器
│   ├── middleware/       # Express 中間件
│   ├── routes/           # 路由定義
│   ├── services/         # 業務邏輯層
│   ├── models/           # 數據模型（Prisma 生成）
│   ├── types/            # TypeScript 類型定義
│   ├── utils/            # 工具函數（日誌、驗證等）
│   ├── jobs/             # 定時任務
│   └── app.ts            # Express 應用入口
├── prisma/
│   └── schema.prisma     # Prisma 數據庫 schema
├── .env                  # 環境變數（本地開發）
├── .env.example          # 環境變數範本
└── package.json
```

### 前端結構

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # 認證相關頁面
│   │   ├── (main)/       # 主應用頁面
│   │   ├── admin/        # 管理頁面
│   │   └── layout.tsx    # 根佈局
│   ├── components/       # React 組件
│   │   ├── common/       # 通用組件
│   │   ├── layout/       # 佈局組件
│   │   ├── events/       # 活動組件
│   │   └── matches/      # 比賽組件
│   ├── contexts/         # React Context
│   ├── hooks/            # 自定義 Hooks
│   ├── lib/              # 工具函數
│   ├── types/            # TypeScript 類型
│   └── styles/           # 樣式文件
├── .env.local            # 環境變數（本地開發）
└── package.json
```

## 常用命令

### 後端

```bash
# 開發模式（自動重新加載）
npm run dev

# 類型檢查
npm run type-check

# 構建生產版本
npm run build

# 啟動生產版本
npm start

# Prisma 相關
npm run db:push        # 將 schema 同步到數據庫
npm run db:studio      # 打開 Prisma Studio 管理數據庫
```

### 前端

```bash
# 開發模式
npm run dev

# 構建生產版本
npm run build

# 啟動生產版本
npm start

# 類型檢查
npm run type-check
```

## 開發工作流

### 1. 建立新功能分支

```bash
git checkout -b feature/feature-name
```

### 2. 開發代碼

#### 後端開發示例

1. **定義數據模型**（修改 `prisma/schema.prisma`）
2. **建立 API 路由**（`src/routes/`）
3. **實現控制器**（`src/controllers/`）
4. **編寫業務邏輯**（`src/services/`）

#### 前端開發示例

1. **建立頁面**（`src/app/[path]/page.tsx`）
2. **建立組件**（`src/components/`）
3. **建立 Hooks**（`src/hooks/`）
4. **集成 API 調用**（`src/lib/api.ts`）

### 3. 測試代碼

```bash
# 後端測試（未來實現）
npm run test

# 前端測試（未來實現）
npm run test
```

### 4. 提交更改

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/feature-name
```

### 5. 建立 Pull Request

在 GitHub 上建立 PR，請求合併到 `main` 分支。

## API 開發流程

### 後端：新增 API 端點

1. **定義路由** (`src/routes/[feature].routes.ts`)
   ```typescript
   router.post('/endpoint', controller.handler);
   ```

2. **實現控制器** (`src/controllers/[feature].controller.ts`)
   ```typescript
   export const handler = async (req, res) => {
     // 調用 service
   };
   ```

3. **實現服務** (`src/services/[feature].service.ts`)
   ```typescript
   export const businessLogic = async (data) => {
     // 業務邏輯
   };
   ```

4. **註冊路由** (`src/app.ts`)
   ```typescript
   app.use('/api/feature', require('./routes/feature.routes'));
   ```

### 前端：調用 API

1. **定義類型** (`src/types/[feature].ts`)
2. **建立 Hook** (`src/hooks/use[Feature].ts`)
3. **在組件中使用**
   ```typescript
   const { data, loading } = useFeature();
   ```

## 調試技巧

### 後端調試

使用 VS Code 調試器：
1. 在代碼中設置斷點
2. 按 F5 啟動調試
3. 服務器會在斷點處暫停

或使用 console.log：
```typescript
logger.info('Debug message', { data });
```

### 前端調試

1. 在瀏覽器 DevTools 中設置斷點
2. 使用 React DevTools 檢查組件狀態
3. 使用 `console.log()` 調試

## 故障排除

### 常見問題

#### 1. "Cannot find module" 錯誤
```bash
# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

#### 2. 數據庫連接失敗
- 確保 PostgreSQL 正在運行
- 檢查 `.env` 中的 `DATABASE_URL`
- 確保數據庫存在

#### 3. TypeScript 編譯錯誤
```bash
npm run type-check
# 解決所有類型錯誤
```

#### 4. 端口被佔用
```bash
# 後端默認 3001，前端默認 3000
# 更改環境變數或關閉佔用端口的進程

# macOS/Linux 查看佔用進程
lsof -i :3001

# 關閉進程
kill -9 <PID>
```

## 代碼風格指南

### TypeScript

- 始終使用 `const` 而非 `let` 或 `var`
- 為所有函數添加類型註解
- 使用 `interface` 定義對象類型
- 避免使用 `any` 類型

### React

- 使用函數式組件，不使用類組件
- 使用 Hooks 管理狀態
- 組件文件使用 `.tsx` 後綴
- 使用 React.memo 優化性能

## 性能優化注意事項

### 後端

- 使用數據庫索引提高查詢效率
- 實現 API 緩存（Redis）
- 使用連接池管理數據庫連接
- 避免 N+1 查詢問題

### 前端

- 使用 React.memo 避免不必要的重新渲染
- 使用 useCallback 緩存函數
- 使用 useMemo 緩存計算結果
- 按需加載組件（代碼分割）

## 安全性考慮

- **認證**：使用 JWT，安全存儲在 httpOnly Cookie
- **授權**：檢查用戶權限
- **驗證**：驗證所有用戶輸入
- **加密**：敏感數據使用 bcrypt 加密
- **CORS**：配置允許的來源

## 部署準備

- [ ] 所有環境變數配置（.env.production）
- [ ] 數據庫遷移腳本測試
- [ ] 構建和打包測試
- [ ] 安全審計
- [ ] 性能測試
- [ ] 監控和日誌配置

## 下一步

根據計劃，接下來要實現的是 **Phase 2: 認證系統**：
- 用戶註冊和登入 API
- JWT 認證中間件
- 前端登入/註冊頁面
- AuthContext 實現

詳情見 `/plan/vivid-bouncing-bunny.md`。
