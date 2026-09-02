# Prompter - Presentation Timer

## 概要

プレゼンテーション時間管理アプリです。セクション別にタイマーを設定し、進行状況をリアルタイムで表示します。

## アクセス方法

### URL
```
https://taichi-shimizu-ortho.github.io/android_app/prompter/
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
docs/prompter/
├── index.html          メインアプリケーション（HTML/CSS/JavaScript）
├── manifest.json       PWA設定ファイル
├── README.md          このファイル
```

## 機能

- **セクション別タイマー** - 各セクションの時間制限を表示
- **進捗表示** - 全体進捗バーと残り時間を表示
- **セクション管理** - 複数のセクション（導入、方法、結果、結論など）に対応
- **自動進行** - 時間終了時に自動的に次のセクションへ
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
→ IHC 二重染色タイマーアプリ

### Prompter
```
https://taichi-shimizu-ortho.github.io/android_app/prompter/
```
→ このアプリ

## 使い方

1. **アプリを開く** - 上記 URL でアクセス
2. **START ボタンをタップ** - タイマーが開始
3. **NEXT/PREV** - セクションを移動（手動）
4. **時間終了** - 自動的に次のセクションへ進む

## 技術仕様

- **言語** - HTML5, CSS3, JavaScript (Vanilla)
- **対応** - iOS/Android, デスクトップブラウザ
- **互換性** - モダンブラウザ全般（Chrome, Safari, Firefox など）
