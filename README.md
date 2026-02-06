# Rivlus – Web sitesi ve Paylaşım Linkleri

rivlus.com için ana sayfa, gizlilik politikası ve TCR paylaşım linkleri. Vercel'e deploy için bu klasörü kullanın.

## İçerik

- `index.html` – Ana sayfa (Rivlus / TCR tanıtımı, info@rivlus.com)
- `privacy/index.html` – Gizlilik politikası (URL: `/privacy`)
- `terms/index.html` – Kullanım koşulları (URL: `/terms`)

## API Endpoint'leri (Paylaşım Linkleri)

### Etkinlikler
- `/e/:id` (kısa link) → Supabase'den başlık/açıklama/görsel çeker
- `/e?...` (uzun link - geriye dönük) → query ile gelen veriyi kullanır

### Marketplace
- `/m/:id` (kısa link) → Supabase'den ürün başlığı/fiyat/ilk görsel çeker
- `/m?...` (uzun link) → query ile gelen veriyi kullanır (title, price, currency, img)

## Vercel'e deploy

1. [vercel.com](https://vercel.com) → Add New → Project
2. **Deploy without Git:** Bu klasörü zip'leyip yükleyin veya sürükle-bırak yapın.
3. **Git ile:** Bu klasörü bir repo'ya koyun, Vercel'de Import Repository ile bağlayın.
4. Deploy sonrası Settings → Domains'e `rivlus.com` ve `www.rivlus.com` ekleyin.
5. Cloudflare DNS'te Vercel'in gösterdiği A/CNAME kayıtlarını ekleyin.

## Environment Variables (Vercel → Settings)

- `SUPABASE_URL` – Supabase proje URL'i
- `SUPABASE_ANON_KEY` – Supabase anonymous key

## Garmin formu

- Company website: `https://rivlus.com`
- Privacy policy: `https://rivlus.com/privacy`
