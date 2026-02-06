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

  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Marketplace listing bilgilerini al
      const listingUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/marketplace_listings?id=eq.${encodeURIComponent(id)}&status=eq.active&select=title,price,currency`;
      const listingRes = await fetch(listingUrl, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
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
        }
      } else {
        // Hata durumunda log
        const errorText = await listingRes.text();
        console.error('Supabase listing fetch error:', listingRes.status, errorText);
      }
    } catch (err) {
      // Supabase hatasında varsayılan değerler kullanılır
      console.error('Supabase error:', err);
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
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  ${isDefaultLogo ? '<meta property="og:image:width" content="512" /><meta property="og:image:height" content="512" />' : ''}
  <meta property="og:site_name" content="TCR Market - Twenty City Runners" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} | TCR Market" />
  <meta name="twitter:description" content="${safePrice}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 1rem; text-align: center;">
  <p style="color: #666; font-size: 0.9rem;">TCR Market - Twenty City Runners</p>
  <h1 style="font-size: 1.25rem;">${safeTitle}</h1>
  <p style="color: #ea580c; font-size: 1.1rem; font-weight: bold;">${safePrice}</p>
  <p><a href="${escapeHtml(deepLink)}" style="display: inline-block; background: #ea580c; color: white; padding: 0.6rem 1.2rem; text-decoration: none; border-radius: 8px;">Uygulamada aç</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
};
