// language: JavaScript | file: verifyServer.js | runtime: Node.js 18+
// Servidor HTTP de verificação — captura IP do membro ao clicar no link

const express = require('express');
const crypto  = require('crypto');

const app     = express();
const pending = new Map(); // token → { resolve, timer }

const PORT         = process.env.VERIFY_PORT     || 3000;
const BASE_URL     = process.env.VERIFY_BASE_URL || `http://localhost:${PORT}`;
const REDIRECT_URL = process.env.VERIFY_REDIRECT || 'https://discord.com'; // redireciona após verificar

// ─── Gera token e aguarda IP ──────────────────────────────────────────────────
// Retorna Promise<string|null>: resolve com IP quando o membro clica, ou null após timeout
function awaitVerify(timeoutMs = 120_000) {
    const token = crypto.randomUUID();

    const promise = new Promise((resolve) => {
        const timer = setTimeout(() => {
            pending.delete(token);
            resolve(null); // tempo esgotado — sem IP
        }, timeoutMs);

        pending.set(token, { resolve, timer });
    });

    const link = `${BASE_URL}/verify?t=${token}`;
    return { link, promise };
}

// ─── Rota de verificação ──────────────────────────────────────────────────────
app.get('/verify', (req, res) => {
    const token = req.query.t;
    const entry = pending.get(token);

    if (!entry) {
        return res.status(410).send(html('Link expirado', 'Este link já foi usado ou expirou. Nenhuma ação necessária.', '#ED4245'));
    }

    // IP real — respeita proxies reversos (nginx, Cloudflare, etc.)
    const ip =
        (req.headers['cf-connecting-ip']) ||          // Cloudflare
        (req.headers['x-real-ip']) ||                 // nginx proxy_pass
        (req.headers['x-forwarded-for']?.split(',')[0].trim()) ||
        req.socket.remoteAddress ||
        'desconhecido';

    clearTimeout(entry.timer);
    pending.delete(token);
    entry.resolve(ip);

    res.redirect(302, REDIRECT_URL);
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, pending: pending.size }));

// ─── HTML de resposta ─────────────────────────────────────────────────────────
function html(title, msg, color = '#57F287') {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}
    body{background:#23272a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif}
    .card{background:#2c2f33;border-radius:12px;padding:40px 48px;text-align:center;border-top:4px solid ${color};max-width:400px}
    h1{color:#fff;font-size:1.4rem;margin-bottom:12px}
    p{color:#b9bbbe;font-size:.95rem;line-height:1.5}</style></head>
    <body><div class="card"><h1>${title}</h1><p>${msg}</p></div></body></html>`;
}

// ─── Inicia servidor ──────────────────────────────────────────────────────────
function startServer() {
    app.listen(PORT, () => {
        console.log(`  🌐  Verify server: ${BASE_URL} (porta ${PORT})`);
    });
}

module.exports = { startServer, awaitVerify };
