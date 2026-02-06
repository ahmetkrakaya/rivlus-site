/**
 * Etkinlik paylaşım landing sayfası – Open Graph meta ile zengin önizleme.
 * Query: id, title, desc, img (opsiyonel)
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

  const { id = '', title = '', desc = '', img = '' } = req.query;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = host ? `${proto}://${host}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://rivlus.com');

  const pageUrl = `${baseUrl}/e?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}${img ? `&img=${encodeURIComponent(img)}` : ''}`.replace(/\?$/, '') || `${baseUrl}/e`;
  const imageUrl = img && img.startsWith('http') ? img : `${baseUrl}/tcr_logo.jpg`;
  const safeTitle = escapeHtml(title) || 'TCR Etkinlik';
  const safeDesc = escapeHtml(desc) || 'Koşularımız her seviyeye uygundur.';
  const deepLink = `tcr:///events/${encodeURIComponent(id)}`;

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
  ${id ? `<p><a href="${escapeHtml(deepLink)}" style="display: inline-block; background: #ea580c; color: white; padding: 0.6rem 1.2rem; text-decoration: none; border-radius: 8px;">Uygulamada aç</a></p>` : ''}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).end(html);
}
