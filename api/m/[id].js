/**
 * Kısa link: /m/:id – Marketplace listing bilgisini Supabase'den çekip OG meta ile HTML döner.
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
    const match = req.url.split('?')[0].match(/\/m\/([^/]+)/);
    if (match) id = decodeURIComponent(match[1]);
  }
  if (!id) {
    res.status(400).end('Missing listing id');
    return;
  }

  // Crawler ile aynı domain kullanılsın (logo 404 olmasın)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = host ? `${proto}://${host}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rivlus.com');

  let title = 'TCR Market Ürünü';
  let price = null;
  let currency = 'TRY';
  // Etkinliklerdeki gibi: ürün fotoğrafı varsa ilk fotoğraf, yoksa TCR logosu
  const defaultLogoUrl = `${baseUrl}/tcr_logo.jpg`;
  let imageUrl = defaultLogoUrl;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // Debug mode (development için)
  const isDebug = req.query.debug === 'true';
  let debugInfo = null;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    if (isDebug) {
      debugInfo = 'Environment variables not set';
    }
  } else {
    try {
      // Marketplace listing bilgilerini al
      // RLS policy: status = 'active' OR seller_id = auth.uid()
      // Anonymous key ile sadece active olanları görebiliriz
      const listingUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/marketplace_listings?id=eq.${encodeURIComponent(id)}&status=eq.active&select=title,price,currency`;
      
      const listingRes = await fetch(listingUrl, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });
      
      if (listingRes.ok) {
        const listingData = await listingRes.json();
        
        if (Array.isArray(listingData) && listingData.length > 0) {
          const listing = listingData[0];
          
          // Başlık
          if (listing.title) {
            title = String(listing.title);
          }
          
          // Fiyat
          if (listing.price !== null && listing.price !== undefined) {
            price = parseFloat(listing.price);
          }
          
          // Para birimi
          if (listing.currency) {
            currency = String(listing.currency);
          }
          
          // Görselleri ayrı bir query ile çek
          const imagesUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/listing_images?listing_id=eq.${encodeURIComponent(id)}&select=image_url,sort_order&order=sort_order.asc`;
          
          const imagesRes = await fetch(imagesUrl, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (imagesRes.ok) {
            const imagesData = await imagesRes.json();
            
            if (Array.isArray(imagesData) && imagesData.length > 0) {
              // İlk görseli al (birden fazla varsa sadece ilki - etkinliklerdeki gibi)
              const firstImage = imagesData[0];
              if (firstImage && firstImage.image_url) {
                let imgUrl = String(firstImage.image_url).trim();
                if (imgUrl.startsWith('http')) {
                  imageUrl = imgUrl;
                } else if (supabaseUrl && imgUrl) {
                  // Relative path: Supabase storage public URL'ye çevir
                  const base = supabaseUrl.replace(/\/$/, '');
                  if (imgUrl.startsWith('listing-images/') || imgUrl.startsWith('/listing-images/')) {
                    imageUrl = `${base}/storage/v1/object/public/${imgUrl.replace(/^\//, '')}`;
                  } else if (!imgUrl.includes('/')) {
                    imageUrl = `${base}/storage/v1/object/public/listing-images/${imgUrl}`;
                  }
                }
              }
            }
          }
        } else {
          if (isDebug) {
            debugInfo = `No listing found with id: ${id} (status must be 'active')`;
          }
        }
      } else {
        // Hata durumunda log
        const errorText = await listingRes.text();
        if (isDebug) {
          debugInfo = `Supabase error ${listingRes.status}: ${errorText.substring(0, 200)}`;
        }
      }
    } catch (err) {
      // Supabase hatasında varsayılan değerler kullanılır
      console.error('Supabase error:', err);
      if (isDebug) {
        debugInfo = `Error: ${err.message || String(err)}`;
      }
    }
  }

  let appStoreUrl = 'https://apps.apple.com/us/app/twenty-city-runners/id6758884316';
  let playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rivlus.project_tcr';

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const versionsUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/app_versions?select=platform,app_store_url,play_store_url`;
      const versionsRes = await fetch(versionsUrl, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (versionsRes.ok) {
        const rows = await versionsRes.json();
        if (Array.isArray(rows)) {
          for (const r of rows) {
            if (r.platform === 'ios' && r.app_store_url) appStoreUrl = r.app_store_url;
            if (r.platform === 'android' && r.play_store_url) playStoreUrl = r.play_store_url;
          }
        }
      }
    } catch (_) { /* fallback değerler kullanılır */ }
  }

  const pageUrl = `${baseUrl}/m/${encodeURIComponent(id)}`;
  const safeTitle = escapeHtml(title);
  const safePrice = price !== null && price !== undefined 
    ? `${parseFloat(price).toFixed(0)} ${escapeHtml(currency)}`
    : 'Fiyat Sorunuz';
  const deepLink = `tcr:///marketplace/${encodeURIComponent(id)}`;
  const isDefaultLogo = imageUrl === defaultLogoUrl;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} | TCR Market - Twenty City Runners</title>
  <meta name="apple-itunes-app" content="app-id=6758884316, app-argument=${escapeHtml(deepLink)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${safeTitle} | TCR Market" />
  <meta property="og:description" content="${safePrice}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  ${isDefaultLogo ? '<meta property="og:image:width" content="512" /><meta property="og:image:height" content="512" /><meta property="og:image:type" content="image/jpeg" />' : ''}
  <meta property="og:site_name" content="TCR Market - Twenty City Runners" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} | TCR Market" />
  <meta name="twitter:description" content="${safePrice}" />
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
    .store-links {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .store-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #000;
      color: white;
      padding: 0.625rem 1.25rem;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.875rem;
      transition: opacity 0.2s;
      min-width: 180px;
      justify-content: center;
    }
    .store-btn:hover { opacity: 0.85; }
    .store-btn svg { width: 20px; height: 20px; fill: white; flex-shrink: 0; }
    .redirect-msg {
      display: none;
      font-size: 0.9rem;
      color: #5C6B7A;
      margin-bottom: 1rem;
    }
    .debug {
      background: #FFF3CD;
      border: 1px solid #FFC107;
      color: #856404;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 1rem;
      text-align: left;
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
      <div class="price">${safePrice}</div>
      ${debugInfo ? `<div class="debug">Debug: ${escapeHtml(debugInfo)}</div>` : ''}
      <p class="redirect-msg" id="redirect-msg">Mağazaya yönlendiriliyorsunuz…</p>
      <a href="${escapeHtml(deepLink)}" id="app-link" class="btn">Uygulamada Aç</a>
      <div class="store-links" id="store-links">
        <a href="${escapeHtml(appStoreUrl)}" class="store-btn" id="ios-btn">
          <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          App Store
        </a>
        <a href="${escapeHtml(playStoreUrl)}" class="store-btn" id="android-btn">
          <svg viewBox="0 0 24 24"><path d="M3.18 23.49c.16.16.38.24.6.24.12 0 .24-.02.35-.07L22.43 12.9c.38-.19.61-.58.61-1.01s-.24-.82-.62-1.01L4.13.12C3.83-.04 3.47-.03 3.18.14 2.89.31 2.72.63 2.72.97v22.05c0 .35.17.67.46.84zM4.22 2.37l9.69 5.48L5.99 15.6V2.37z"/></svg>
          Google Play
        </a>
      </div>
    </div>
  </div>
  <script>
    (function() {
      var ua = navigator.userAgent || '';
      var isBot = /bot|crawler|spider|crawling|facebookexternalhit|WhatsApp|Telegram|Slack|Twitter|LinkedIn/i.test(ua);
      if (isBot) return;

      var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      var isAndroid = /Android/i.test(ua);
      var appStoreUrl = ${JSON.stringify(appStoreUrl)};
      var playStoreUrl = ${JSON.stringify(playStoreUrl)};

      if (isIOS || isAndroid) {
        var storeUrl = isIOS ? appStoreUrl : playStoreUrl;
        var msg = document.getElementById('redirect-msg');
        var appLink = document.getElementById('app-link');
        if (msg) msg.style.display = 'block';
        if (appLink) {
          appLink.textContent = isIOS ? 'App Store\\'dan İndir' : 'Google Play\\'den İndir';
          appLink.href = storeUrl;
        }
        var storeLinks = document.getElementById('store-links');
        if (storeLinks) storeLinks.style.display = 'none';
        setTimeout(function() { window.location.href = storeUrl; }, 800);
        return;
      }

      var appLink = document.getElementById('app-link');
      if (appLink) {
        appLink.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = ${JSON.stringify(deepLink)};
        });
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
};
