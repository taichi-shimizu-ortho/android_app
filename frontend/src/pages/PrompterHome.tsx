import './PrompterHome.css';

interface Talk {
    href: string;
    title: string;
    desc: string;
    archived?: boolean;
}

// 新しい発表を先頭に追加する。終わった発表は archived: true でアーカイブへ移す。
// 静的HTMLの原稿は frontend/public/prompter/<名前>/index.html に置く。
const talks: Talk[] = [
    { href: '/android_app/prompter/joa2026/', title: 'JOA 基礎 2026', desc: '日本整形外科学会基礎学術集会・日本語・LRC' },
    { href: '/android_app/prompter/#/prompter/ors2026', title: 'ORS 2026', desc: 'Orthopaedic Research Society・English', archived: true },
];

function TalkCard({ talk }: { talk: Talk }) {
    return (
        <a href={talk.href} className="talk-card">
            <div className="talk-title">{talk.title}</div>
            <div className="talk-desc">{talk.desc}</div>
        </a>
    );
}

export default function PrompterHome() {
    const current = talks.filter(t => !t.archived);
    const archived = talks.filter(t => t.archived);

    return (
        <div className="prompter-home">
            <div className="prompter-home-inner">
                <a href="/android_app/home/#/" className="prompter-home-back">🏠 ホームへ戻る</a>
                <h1>🎤 Prompter</h1>

                <div className="talk-list">
                    {current.map(t => <TalkCard key={t.href} talk={t} />)}
                </div>

                {archived.length > 0 && (
                    <details className="talk-archive">
                        <summary>アーカイブ（{archived.length}）</summary>
                        <div className="talk-list">
                            {archived.map(t => <TalkCard key={t.href} talk={t} />)}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}
