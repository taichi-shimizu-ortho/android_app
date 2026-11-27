# Android App Project

IHC Timer、ISHpalette Timer、Protocol を GitHub Pages で公開しています。

## フォルダ構成

```
android_app/
├── frontend/           # React と Vite のソース
│   └── public/         # PWA のマニフェスト、アイコン、Service Worker
└── docs/               # GitHub Pages に配信するビルド成果物
```

## 各アプリの起動

- [ホーム・記録一覧](https://taichi-shimizu-ortho.github.io/android_app/home/)
- [IHC Timer](https://taichi-shimizu-ortho.github.io/android_app/ihc/)
- [ISHpalette Timer](https://taichi-shimizu-ortho.github.io/android_app/ish/)
- [Protocol](https://taichi-shimizu-ortho.github.io/android_app/msc/)

Prompter は別の場所への移設に伴い、このリポジトリでの公開を終了しました。

## 開発

`frontend/` で `npm ci` の後に `npm run build` を実行すると、公開用の `docs/` が生成されます。
