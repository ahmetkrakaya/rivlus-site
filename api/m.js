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
</head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 1rem; text-align: center;">
  <p style="color: #666; font-size: 0.9rem;">TCR Market - Twenty City Runners</p>
  <h1 style="font-size: 1.25rem;">${safeTitle}</h1>
  <p style="color: #444; font-size: 1.1rem; font-weight: bold; color: #ea580c;">${safeDesc}</p>
  ${id ? `<p><a href="${escapeHtml(deepLink)}" style="display: inline-block; background: #ea580c; color: white; padding: 0.6rem 1.2rem; text-decoration: none; border-radius: 8px;">Uygulamada aç</a></p>` : ''}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
}
