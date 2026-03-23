# Android App Project

マルチアプリプロジェクト。timer と prompter の2つのアプリを管理しています。

## フォルダ構成

```
android_app/
├── timer/              # IHC 二重染色タイマーアプリ
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js          (Service Worker)
│   └── main.py
├── prompter/           # プロンプターアプリ
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js          (Service Worker)
│   └── main.py
├── shared/
│   └── icons/          # PWA用アイコン（両アプリで共有）
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

## 開発

各フォルダは独立して開発が可能です。共有アセット（アイコンなど）は `shared/` フォルダに配置してください。
