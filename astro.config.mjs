// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    // ページは今までどおり静的なファイルとして配り、訪問者カウンター (src/pages/api/visit.ts) だけを Vercel 上で動かす
    adapter: vercel(),
    // 画像は public/ のものをそのまま使っていて変換しないので、画像変換ライブラリ (sharp) を Vercel 上に載せない
    image: {
        service: passthroughImageService(),
    },
});
