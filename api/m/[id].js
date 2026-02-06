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
  // İlk görseli al (primary_image_url veya listing_images'den ilk görsel)
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
              // İlk görseli al (zaten sort_order'a göre sıralı)
              const firstImage = imagesData[0];
              if (firstImage && firstImage.image_url) {
                const imgUrl = String(firstImage.image_url).trim();
                if (imgUrl.startsWith('http')) {
                  imageUrl = imgUrl;
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
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${safeTitle} | TCR Market" />
  <meta property="og:description" content="${safePrice}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  ${isDefaultLogo ? '<meta property="og:image:width" content="512" /><meta property="og:image:height" content="512" />' : ''}
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
