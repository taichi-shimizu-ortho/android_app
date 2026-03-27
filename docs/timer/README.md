# IHC 二重染色タイマー

## 概要
免疫組織化学（IHC）の二重染色プロトコルに対応したタイマーアプリです。

## アクセス方法

### URL
```
https://taichi-shimizu-ortho.github.io/android_app/timer/
```

### ホーム画面に追加（PWA対応）
**iOS:**
1. Safari で上記 URL を開く
2. 共有ボタン → 「ホーム画面に追加」

**Android:**
1. Chrome で上記 URL を開く
2. メニュー → 「アプリをインストール」
3. または URL バーの右側のアイコンをタップ

## ファイル構成

```
timer/
├── index.html          メインアプリケーション（HTML/CSS/JavaScript）
├── manifest.json       PWA設定ファイル
├── sw.js              Service Worker（オフライン対応）
├── icons/             アプリアイコン
│   ├── icon-192.png
│   └── icon-512.png
├── main.py            ダミーファイル（Python）
└── README.md          このファイル
```

## 機能

- **タイマー表示** - 各ステップの残り時間を表示
- **セクション管理** - 複数のステップ（日程）に対応
- **自動進行** - 時間終了時に自動的に次のステップへ
- **プログレスバー** - 全体の進捗状況を表示
- **オフライン対応** - インターネット接続なしで使用可能
- **ホーム画面追加** - ネイティブアプリのようにご利用可能

## Pages構成

### ルート
```
https://taichi-shimizu-ortho.github.io/android_app/
```
→ アプリ一覧メニューページ

### Timer
```
https://taichi-shimizu-ortho.github.io/android_app/timer/
```
→ このアプリ

### Prompter
```
https://taichi-shimizu-ortho.github.io/android_app/prompter/
```
→ プレゼンテーション補助アプリ

## 使い方

1. **アプリを開く** - 上記 URL でアクセス
2. **日を選択** - 画面上部のタブから実施日を選択
3. **START ボタンをタップ** - タイマーが開始
4. **NEXT/PREV** - セクションを移動
5. **時間終了** - 自動的に次のセクションへ進む

## 技術仕様

- **言語** - HTML5, CSS3, JavaScript (Vanilla)
- **対応** - iOS/Android, デスクトップブラウザ
- **オフライン** - Service Worker による完全オフライン対応
- **互換性** - モダンブラウザ全般（Chrome, Safari, Firefox など）
