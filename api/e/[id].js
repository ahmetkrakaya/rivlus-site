/**
 * Kısa link: /e/:id – Etkinlik bilgisini Supabase'den çekip OG meta ile HTML döner.
 * Ortam değişkenleri: SUPABASE_URL, SUPABASE_ANON_KEY
 */
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  let id = req.query.id;
  if (!id && req.url) {
    const match = req.url.split('?')[0].match(/\/e\/([^/]+)/);
    if (match) id = decodeURIComponent(match[1]);
  }
  if (!id) {
    res.status(400).end('Missing event id');
    return;
  }

  // Crawler ile aynı domain kullanılsın (logo 404 olmasın)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = host ? `${proto}://${host}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rivlus.com');

  let title = 'TCR Etkinlik';
  let description = 'Koşularımız her seviyeye uygundur.';
  // Banner yoksa her zaman TCR logosu (mutlak URL, aynı origin)
  const defaultLogoUrl = `${baseUrl}/tcr_logo.jpg`;
  let imageUrl = defaultLogoUrl;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=title,description,banner_image_url`;
      const fetchRes = await fetch(url, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const e = data[0];
          if (e.title) title = e.title;
          if (e.description && String(e.description).trim()) {
            const d = String(e.description).trim();
            description = d.length > 160 ? d.slice(0, 157) + '...' : d;
          }
          if (e.banner_image_url && String(e.banner_image_url).startsWith('http')) {
            imageUrl = e.banner_image_url;
          }
        }
      }
    } catch (err) {
      // Supabase hatasında varsayılan değerler kullanılır
    }
  }

  const pageUrl = `${baseUrl}/e/${encodeURIComponent(id)}`;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const deepLink = `tcr:///events/${encodeURIComponent(id)}`;
  const isDefaultLogo = imageUrl === defaultLogoUrl;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} | TCR - Twenty City Runners</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${safeTitle} | TCR - Twenty City Runners" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  ${isDefaultLogo ? '<meta property="og:image:width" content="512" /><meta property="og:image:height" content="512" />' : ''}
  <meta property="og:site_name" content="TCR - Twenty City Runners" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} | TCR - Twenty City Runners" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #F5F7FA 0%, #E8ECF0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #1E3A5F;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(30, 58, 95, 0.1);
      max-width: 420px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .header {
      background: linear-gradient(135deg, #1E3A5F 0%, #3D5A80 100%);
      color: white;
      padding: 1.5rem 1rem;
    }
    .header-brand {
      font-size: 0.85rem;
      font-weight: 500;
      opacity: 0.9;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 2rem 1.5rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1E3A5F;
      margin-bottom: 1rem;
      line-height: 1.3;
    }
    .description {
      font-size: 1rem;
      color: #5C6B7A;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #1E3A5F 0%, #3D5A80 100%);
      color: white;
      padding: 0.875rem 2rem;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(30, 58, 95, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-brand">TCR - Twenty City Runners</div>
    </div>
    <div class="content">
      <h1 class="title">${safeTitle}</h1>
      <p class="description">${safeDesc}</p>
      <a href="${escapeHtml(deepLink)}" id="app-link" class="btn">Uygulamada Aç</a>
    </div>
  </div>
  <script>
    (function() {
      // Bot algılama - WhatsApp, Telegram, Facebook gibi crawler'lar için JavaScript çalışmasın
      const ua = navigator.userAgent || '';
      const isBot = /bot|crawler|spider|crawling|facebookexternalhit|WhatsApp|Telegram|Slack|Twitter|LinkedIn/i.test(ua);
      
      // Bot ise JavaScript çalıştırma (preview için sayfa görünür kalmalı)
      if (isBot) {
        return;
      }
      
      // Sadece "Uygulamada Aç" butonuna tıklanınca deep link açılsın.
      // Otomatik redirect (setTimeout ile window.location) birçok ortamda path'i
      // kaybettirip uygulamanın login ekranına düşmesine neden oluyordu.
      const appLink = document.getElementById('app-link');
      appLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = ${JSON.stringify(deepLink)};
      });
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
};
