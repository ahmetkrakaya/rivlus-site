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
</head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 1rem; text-align: center;">
  <p style="color: #666; font-size: 0.9rem;">TCR - Twenty City Runners</p>
  <h1 style="font-size: 1.25rem;">${safeTitle}</h1>
  <p style="color: #444;">${safeDesc}</p>
  <p><a href="${escapeHtml(deepLink)}" id="app-link" style="display: inline-block; background: #ea580c; color: white; padding: 0.6rem 1.2rem; text-decoration: none; border-radius: 8px;">Uygulamada aç</a></p>
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
      
      // Kullanıcı sayfaya tıklarsa veya sayfa yüklendiğinde otomatik aç
      function tryOpenApp() {
        if (opened) return;
        opened = true;
        
        // Deep link'i deneyelim
        window.location.href = deepLink;
        
        // Eğer uygulama açılmazsa (2 saniye sonra), sayfada kal
        setTimeout(function() {
          if (!clicked) {
            // Sayfa görünür kalır, kullanıcı tekrar deneyebilir
            appLink.style.opacity = '1';
          }
        }, 2000);
      }
      
      // Sayfa yüklendiğinde otomatik aç (sadece gerçek kullanıcılar için)
      // Küçük bir gecikme ile aç ki preview gösterilsin
      setTimeout(tryOpenApp, 500);
      
      // Manuel tıklama için
      appLink.addEventListener('click', function(e) {
        clicked = true;
        tryOpenApp();
      });
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
};
