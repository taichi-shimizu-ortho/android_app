# Android App Project

マルチアプリプロジェクト。timer、prompter、protocol の3つのアプリを管理しています。

## フォルダ構成

```
android_app/
├── timer/              # IHC 二重染色タイマーアプリ
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js          (Service Worker)
│   ├── main.py
│   └── icons/
├── prompter/           # プロンプターアプリ
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js          (Service Worker)
│   ├── main.py
│   └── icons/
├── protocol/           # 滑膜由来MSC継代プロトコルアプリ
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js          (Service Worker)
│   ├── main.js
│   └── icons/
├── shared/
│   └── icons/          # PWA用アイコン（共有）
├── pyproject.toml      # Python依存関係
└── .gitignore
```

## 各アプリの起動

### Timer
- URL: `/android_app/timer/`
- PWA 対応

### Prompter
- URL: `/android_app/prompter/`
- PWA 対応

### Protocol
- URL: `/android_app/protocol/`
- PWA 対応
- 機能: 細胞培養プロトコル手順ガイド、タイマー機能、Supabase 統合

## 開発

各フォルダは独立して開発が可能です。共有アセット（アイコンなど）は `shared/` フォルダに配置してください。