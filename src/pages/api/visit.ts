import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// このファイルだけはアクセスのたびに Vercel 上で動かす (ほかのページは静的なファイルのまま)
export const prerender = false;

// 訪問者の数を保存している Upstash Redis のキー
const KEY = 'homepage:visitors';

// JavaScript を動かす検索エンジンのクローラーなどは数えない
const BOT = /bot|crawler|spider|headless|lighthouse/i;

const NO_STORE = { 'Cache-Control': 'no-store' };

// Vercel の Storage で Upstash for Redis をこのプロジェクトにつなぐと設定される接続情報があるか
function hasDatabase() {
    const env = process.env;
    return Boolean(
        (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL) && (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN),
    );
}

// 今の累計の人数を返す (数は増やさない)。2回目以降に来た人の表示に使う
export const GET: APIRoute = async () => {
    if (!hasDatabase()) return notConfigured();
    try {
        const total = (await Redis.fromEnv().get<number>(KEY)) ?? 0;
        return Response.json({ total }, { headers: NO_STORE });
    } catch (error) {
        return failed(error);
    }
};

// 訪問者の番号を1つ進めて返す。初めて来た人の番号が、そのまま今の累計になる
// (接続先は Vercel が設定する環境変数 KV_REST_API_URL / KV_REST_API_TOKEN から読む)
export const POST: APIRoute = async ({ request }) => {
    if (BOT.test(request.headers.get('user-agent') ?? '')) {
        return new Response(null, { status: 204 });
    }
    if (!hasDatabase()) return notConfigured();
    try {
        const number = await Redis.fromEnv().incr(KEY);
        return Response.json({ number, total: number }, { headers: NO_STORE });
    } catch (error) {
        return failed(error);
    }
};

function notConfigured() {
    console.error(
        '訪問者カウンター: データベースの接続情報がありません。Vercel の Storage で Upstash for Redis を my-homepage につないでから、もう一度公開してください',
    );
    return Response.json({ error: 'not-configured' }, { status: 503 });
}

function failed(error: unknown) {
    console.error('訪問者カウンターを読み書きできませんでした', error);
    return Response.json({ error: 'counter unavailable' }, { status: 500 });
}
