"""docs/ をローカルで配信する（キャッシュさせない）。

ビルド後の HTML やアセットを確認するときに、毎回サーバーから読み直させる。

    python tools/serve_docs.py 8791
"""

import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    handler = functools.partial(NoCacheHandler, directory=str(DOCS))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"http://localhost:{port}/ で {DOCS} を配信中（キャッシュなし）", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
