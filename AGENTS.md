# AGENTS.md

給在 `turing-complete-game-lab` 工作的 agent 使用。

## 專案背景與目標

- 本專案對應遊戲 `https://turingcomplete.game/`。
- 核心目標是模擬遊戲中的電路/CPU/ISA 行為，從實作與測試中學習。
- 方向優先順序：
  1. 行為正確可驗證
  2. 可觀察、可除錯
  3. 方便擴充新關卡與新指令

## 專案快照

- 執行環境與套件管理：`bun`
- 語言：TypeScript（strict mode）
- 路徑別名：
  - `@/*` -> `src/*`
  - `~test/*` -> `test/*`
- `*.isa` 由 `bunfig.toml` 當文字檔載入

## 目錄結構

- `src/`
  - `src/Components/`：共用元件（`CPU`、`Ram`、`LevelIO`）
  - `src/Assembler/`：通用組譯流程與語法解析
  - `src/Overtrue/`：Overtrue ISA、Assembler、CPU、Runner
  - `src/Symphony/`：Symphony ISA、Assembler、CPU、Runner
  - `src/CpuRunner.ts`：通用 CPU 執行器（setup/tick/trace dump）
- `test/`
  - `test/Overtrue/`：Overtrue 單元與關卡測試
  - `test/Symphony/`：Symphony 單元與關卡測試
  - `test/Assembler/`、`test/Components/`：通用模組測試
  - `test/helpers/CpuTestContext.ts`：測試用 runner context 與 trace dump
- `artifacts/traces/`：測試 trace 輸出（依環境變數控制）

## 常用命令

請在 repo root 執行。

### 安裝

- `bun install`

### 型別檢查

- `bun run typecheck`
- 等價：`bunx tsc --noEmit`

### 格式化

- 套用格式：`bun run format`
- 僅檢查：`bunx prettier . --check`

### Lint

- 目前沒有獨立 linter 設定。
- 以 `typecheck + prettier --check + test` 作為主要品質門檻。

### 測試

- 全量測試：`bun test`
- 單一測試檔：`bun test test/UInt.test.ts`
- 單一檔案特定測試名：`bun test test/UInt.test.ts -t "isLessThan"`
- 全域依名稱篩選：`bun test -t "assembleOvertrue"`

### 建議提交前檢查

- `bun run typecheck && bunx prettier . --check && bun test`

## 工作流程建議

- 優先跑受影響模組測試，再跑全量。
- 影響 Assembler 相關時先跑 `test/Assembler/*`。
- 影響 CPU/Runner 相關時先跑 `test/Overtrue/*` 或 `test/Symphony/*`。
- 變更應聚焦在需求本身，避免順手大改。

## 程式風格與工具規範

- 詳細規範請看 `docs/CODING_STYLE.md`。

## 已知腳本注意事項

- `package.json` 有 `bun run index` -> `bun run src/index.ts`
- 目前 `src/index.ts` 不存在；除非先補 entrypoint，否則不要依賴這個 script。

## 規則檔檢查

- 目前未找到 `.cursor/rules/`。
- 目前未找到 `.cursorrules`。
- 目前未找到 `.github/copilot-instructions.md`。
- 若未來新增上述檔案，請視為更高優先級規範。
