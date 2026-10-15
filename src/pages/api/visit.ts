import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// このファイルだけはアクセスのたびに Vercel 上で動かす (ほかのページは静的なファイルのまま)
export const prerender = false;

// JavaScript を動かす検索エンジンのクローラーなどは数えない
const BOT = /bot|crawler|spider|headless|lighthouse/i;

// 訪問者の番号を1つ進めて返す。数は Vercel からつないだ Upstash Redis に保存する
// (接続先は Vercel が設定する環境変数 KV_REST_API_URL / KV_REST_API_TOKEN から読む)
export const POST: APIRoute = async ({ request }) => {
    if (BOT.test(request.headers.get('user-agent') ?? '')) {
        return new Response(null, { status: 204 });
    }
    try {
        const number = await Redis.fromEnv().incr('homepage:visitors');
        return Response.json({ number }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('訪問者カウンターを更新できませんでした', error);
        return Response.json({ error: 'counter unavailable' }, { status: 500 });
    }
};
