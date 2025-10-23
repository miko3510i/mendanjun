# 面談スケジューラ Web アプリ

保護者が提出した希望面談日時と教師の空き枠CSVを読み込み、希望優先で面談順を自動で割り当てるクライアントサイドアプリです。ブラウザのみで動作するため、GitHub Pagesなどの静的ホスティングにも対応できます。

## セットアップ

```bash
npm install
npm run dev
```

- `npm run dev` : ローカル開発サーバー (http://localhost:5173)
- `npm run build` : 本番ビルド（`dist/`）
- `npm run lint` : ESLint による静的解析
- `npm run test` : Vitest によるユニットテスト（スケジューラの基本ケースを検証）

## CSV フォーマット

### 希望一覧 (`families.csv`)
| 列名 | 必須 | 説明 |
|------|------|------|
| `student_number` | ✅ | 出席番号（クラス内で一意） |
| `priority` | ✅ | 希望優先度（1が最優先） |
| `preferred_start` | ✅ | `YYYY-MM-DD HH:MM` 形式、15分刻みが基準 |
| `preferred_end` | ✅ | `preferred_start` より後の時刻 |

### 教師枠 (`teacher_slots.csv`)
| 列名 | 必須 | 説明 |
|------|------|------|
| `slot_id` | ✅ | 枠ID（ユニーク） |
| `start` | ✅ | 枠の開始時刻（`YYYY-MM-DD HH:MM`） |
| `end` | ✅ | 枠の終了時刻 |

サンプルCSVは `templates/` ディレクトリに同梱しています。

## アプリの流れ

1. **CSVアップロード**: 出席番号と希望枠のみを含むCSVと、教師枠CSVを読み込むと、フォーマットと日時を検証します。
2. **内容確認**: 取り込んだデータを一覧表示。面談時間の目安（10/15/20/30分）を選ぶと、希望枠の長さが異なる場合に警告を表示します。
3. **自動割当**: 希望優先度順に一致する枠を検索。空いていない場合は最も近い空き枠に自動調整し、割当結果・未割当リストを生成します。
4. **CSVダウンロード**: 割当結果（`assignments.csv`）と未割当一覧（`unassigned.csv`）をダウンロードできます。

## 構成メモ

- `src/services/csv.ts` : CSVパースとバリデーション
- `src/services/scheduler.ts` : 割当ロジック（希望優先→近傍枠→未割当）
- `src/components/` : ステップ表示、プレビュー、結果パネルなどのUI
- `docs/design.md` : 要件ヒアリングに基づく設計メモ

## 今後の拡張例

- PDF出力やGoogleスプレッドシート連携
- 兄弟調整や特定時間帯の除外ルール
- ローカルストレージへの入力保存、CSVテンプレ生成
