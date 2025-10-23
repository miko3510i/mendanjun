# 面談スケジューラ設計メモ

## 目的
保護者が提出した希望日時（優先度付き）と教師の空き枠CSVを読み込み、希望優先で面談予定を自動生成し、結果をCSVでダウンロードできるWebアプリを提供する。

## 技術選定
- **フロントエンド**: React + TypeScript + Vite（クライアントサイド完結・GitHub Pages配信が容易）
- **状態管理**: React hooks + Context（アップロード済データや割当結果を共有）
- **CSV解析**: [`papaparse`](https://www.papaparse.com/)（ブラウザ内での高速パース）
- **スタイル**: Tailwind CSS を導入し素早くレイアウト（後からプリセット調整可能）
- **ユーティリティ**: `dayjs`（日時計算、タイムゾーン `Asia/Tokyo` 固定）

## データスキーマ
### 保護者希望 CSV (`families.csv`)
| column             | type           | required | note                                      |
|--------------------|----------------|----------|-------------------------------------------|
| guardian_id        | string         | ✅        | 一意ID                                    |
| guardian_name      | string         | ✅        | 保護者氏名                                |
| student_name       | string         | ✅        | 生徒氏名                                  |
| priority           | integer (1..)  | ✅        | 希望優先度 1が最優先                      |
| preferred_start    | ISO datetime   | ✅        | `YYYY-MM-DD HH:MM` 15分刻み               |
| preferred_end      | ISO datetime   | ✅        | start + 面談時間                          |
| notes              | string         | ❌        | 任意メモ                                  |

### 教師枠 CSV (`teacher_slots.csv`)
| column   | type         | required | note                               |
|----------|--------------|----------|------------------------------------|
| slot_id  | string       | ✅        | 一意ID                             |
| start    | ISO datetime | ✅        | `YYYY-MM-DD HH:MM`                 |
| end      | ISO datetime | ✅        | start + 面談時間（柔軟長さ対応）  |

### 割当結果 CSV (`assignments.csv`)
| column             | note                                                   |
|--------------------|--------------------------------------------------------|
| guardian_id        | 入力からコピー                                         |
| guardian_name      | 同上                                                   |
| student_name       | 同上                                                   |
| assigned_start     | 実際に割り当てた開始時刻（自動調整時は近傍枠）         |
| assigned_end       | 終了時刻                                               |
| slot_id            | 割当済教師枠。自動調整時は選択した枠ID                 |
| status             | `assigned` / `auto_adjusted` / `unassigned`            |
| matched_priority   | 成功時に採用された希望優先度                           |
| notes              | 保護者メモ + システム注記（自動調整理由など）         |

未割当リストは `unassigned.csv` として guardian_id, guardian_name, student_name, reasons を出力。

## 割当アルゴリズム
1. 両CSVを読み込み、日時を `dayjs` で正規化（`Asia/Tokyo`）。
2. 教師枠を開始時刻でソートし、`availableSlots`（未使用）として保持。
3. 保護者希望を `guardian_id` でグルーピング → 優先度昇順にソート。
4. 各保護者について優先度順に希望枠を走査：
   - 希望時間と完全一致する教師枠があれば割当、ステータス `assigned`。
   - 無ければ `availableSlots` から開始時刻の絶対差が最小の枠を探索。
       - 差が同じ場合は開始時刻が早い方。
       - 見つかれば `auto_adjusted` として割当、希望との差分を注記。
5. すべて失敗した場合は `unassigned`。教師枠は一度割当されたら `availableSlots` から除外。

## 画面構成
1. **Landing**: 目的説明 + CSVテンプレDLボタン + ステップガイド。
2. **UploadStep**: 保護者CSV/教師CSVアップローダー（ドラッグ＆ドロップ or ファイル選択）。
3. **PreviewStep**: タブ表示
   - 保護者希望テーブル（優先度、希望時刻、バリデーションアイコン）
   - 教師枠テーブル
   - バリデーションエラー一覧（致命的エラーと警告を分離）
4. **AssignmentStep**: 自動割当実行ボタン + 結果サマリーカード。
5. **ResultsStep**: 割当結果テーブル（フィルタリング：全件/希望通り/自動調整/未割当） + CSVダウンロードボタン。

## 主要コンポーネント
- `App`：ステップ管理（状態マシン）
- `UploadSection`：CSV読み込み + パース + バリデーション
- `PreviewTables`
- `AssignmentRunner`：割当処理（ビジネスロジックは `services/scheduler.ts`）
- `ResultsPanel`
- `DownloadButton`

## バリデーション
- 必須列の存在チェック
- 日時フォーマット検証
- 優先度が正の整数か
- 教師枠の重複検出（同じ日時が複数存在する場合は警告）
- 保護者の希望枠が面談時間長に一致しているか（任意）

## 実装マイルストーン
1. Vite + React + TS + Tailwind 初期化、ESLint設定。
2. CSVテンプレート／型定義、ユーティリティ作成（パース・バリデーション）。
3. ステップUI骨組み（アップロード→プレビュー→結果）。
4. 割当ロジック実装 & 単体テスト（Vitest）。
5. 結果出力＆CSVダウンロード機能。
6. UI整備、空状態・エラーハンドリング・TypeScript整合。
7. README/利用手順・今後のTODO記載。

## テスト方針
- `services/scheduler.test.ts` にて代表ケース（希望通り/自動調整/全滅）を検証。
- バリデーションのユニットテストも将来追加可能。
- E2Eは将来的に Playwright など採用可能だが今回は省略。

