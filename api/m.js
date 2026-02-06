/**
 * Marketplace paylaşım landing sayfası – Open Graph meta ile zengin önizleme.
 * Query: id, title, price (opsiyonel), currency (opsiyonel), img (opsiyonel)
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

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const { id = '', title = '', price = '', currency = 'TRY', img = '' } = req.query;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = host ? `${proto}://${host}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rivlus.com');

  const params = [];
  if (id) params.push(`id=${encodeURIComponent(id)}`);
  if (title) params.push(`title=${encodeURIComponent(title)}`);
  if (price) params.push(`price=${encodeURIComponent(price)}`);
  if (currency) params.push(`currency=${encodeURIComponent(currency)}`);
  if (img) params.push(`img=${encodeURIComponent(img)}`);
  
  const pageUrl = params.length > 0 
    ? `${baseUrl}/m?${params.join('&')}` 
    : `${baseUrl}/m`;
  const imageUrl = img && img.startsWith('http') ? img : `${baseUrl}/tcr_logo.jpg`;
  const safeTitle = escapeHtml(title) || 'TCR Market Ürünü';
  
  // Fiyat bilgisini açıklama olarak ekle
  let safeDesc = '';
  if (price && price !== '') {
    safeDesc = `${escapeHtml(price)} ${escapeHtml(currency)}`;
  } else {
    safeDesc = 'Fiyat Sorunuz';
  }
  
  const deepLink = id ? `tcr:///marketplace/${encodeURIComponent(id)}` : '';

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} | TCR Market - Twenty City Runners</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${safeTitle} | TCR Market" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:site_name" content="TCR Market - Twenty City Runners" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} | TCR Market" />
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
    .price {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1E3A5F;
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
      <div class="header-brand">TCR Market - Twenty City Runners</div>
    </div>
    <div class="content">
      <h1 class="title">${safeTitle}</h1>
      <div class="price">${safeDesc}</div>
      ${id ? `<a href="${escapeHtml(deepLink)}" id="app-link" class="btn">Uygulamada Aç</a>
  <script>
    (function() {
      // Bot algılama - WhatsApp, Telegram, Facebook gibi crawler'lar için JavaScript çalışmasın
      const ua = navigator.userAgent || '';
      const isBot = /bot|crawler|spider|crawling|facebookexternalhit|WhatsApp|Telegram|Slack|Twitter|LinkedIn/i.test(ua);
      
      // Bot ise JavaScript çalıştırma (preview için sayfa görünür kalmalı)
      if (isBot) {
        return;
      }
      
      const deepLink = ${JSON.stringify(deepLink)};
      const appLink = document.getElementById('app-link');
      let clicked = false;
      let opened = false;
      
      function tryOpenApp() {
        if (opened) return;
        opened = true;
        window.location.href = deepLink;
        setTimeout(function() {
          if (!clicked) {
            appLink.style.opacity = '1';
          }
        }, 2000);
      }
      
      setTimeout(tryOpenApp, 500);
      appLink.addEventListener('click', function(e) {
        clicked = true;
        tryOpenApp();
      });
    })();
  </script>` : ''}
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
}
