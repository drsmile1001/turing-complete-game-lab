# CODING_STYLE.md

本文件整理本專案的程式風格與實務約定。

## 核心原則

- 保持變更聚焦，避免與需求無關的重構。
- 先讓行為正確，再追求可讀與可觀測。
- 盡量延續既有檔案風格與命名。

## 格式與排版

- 依 `.prettierrc.yaml` 與 Prettier 自動格式化。
- 使用雙引號與分號。
- 保持 LF 換行。
- 不做手動對齊排版。

## Import 規範

- 匯入排序由 `@trivago/prettier-plugin-sort-imports` 管理。
- 分組順序：
  1. `bun`
  2. 第三方套件
  3. `@/` 別名
  4. `~test/` 別名
  5. 相對路徑
- 優先使用 `import type` 處理型別匯入。

## TypeScript 約定

- 專案使用 strict mode。
- 重要編譯選項：
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`
  - `noFallthroughCasesInSwitch: true`
- 匯出函式在可行時補上明確回傳型別。
- 優先使用 `const`；需要可變時才用 `let`。

## 型別與資料建模

- 偏好使用窄型別與字面值聯集。
- opcode / mode / flag 類資料可搭配 `as const`。
- 位元寬度與數值意義需明確（例如 `UInt8`、`UInt16`）。
- Parser/Assembler 流程維持強型別資料結構。

## 命名規範

- 類別、型別、介面：`PascalCase`
- 變數、函式、方法：`camelCase`
- 指令/操作碼字串常量：遵循 ISA 與既有命名慣例
- 測試檔命名：`*.test.ts`

## 錯誤處理

- Assembler/Parser 流程優先用 `Result<T, E>`（`ok/err/isErr`）表示預期錯誤。
- `throw` 保留給不應發生的狀態或不變式違反。
- 錯誤訊息應具體且可行動。

## 控制流程與可讀性

- 優先 early return，減少巢狀。
- `switch` 分支保持明確，避免隱式 fallthrough。
- 函式保持單一職責，避免過長。

## 測試實務

- 使用 `bun:test`：`describe`、`test`、`expect`。
- 測試名稱以可讀、可定位意圖為主（中英文皆可）。
- 關卡測試建議使用 `CpuTestContext` 控制 trace dump。
- CPU/Runner 測試需驗證輸出與狀態轉移。
- Parser/Assembler 測試需同時覆蓋成功與失敗路徑。

## 位元與數值處理

- 與機器寬度相關邏輯優先使用 `UInt` helper（`uint8`、`uint16`、`uint32`、`uint64`）。
- 明確區分 signed/unsigned 比較語義。
- 位寬轉換與 byte 操作需檢查範圍與對齊假設。

## 執行與除錯建議

- 修改後先跑受影響測試，再跑全量。
- CPU 長程追蹤優先使用 trace 檔案，而非大量 console log。
- trace dump 位置預設在 `artifacts/traces/`，可由測試環境變數控制。
