# Rivlus Site Deploy Rehberi

## Git ile Deploy (Vercel otomatik çekiyor)

Repo’yu Git’e push ettiğinde Vercel otomatik deploy alır. **404 alıyorsan** büyük ihtimalle Build ayarları yanlıştır.

### Build & Development Settings (Vercel → Settings → Build and Deployment)

- **Framework Preset:** `Other` (veya “None” / static)
- **Build Command:** *(boş bırak)* — bu projede build yok, statik HTML
- **Output Directory:** *(boş bırak)* — site kök dizinde (`index.html` repo kökünde)
- **Install Command:** *(boş bırak)*

Eğer Output Directory `build` veya `dist` ise Vercel oraya bakıyor; bu repoda site dosyaları kökte olduğu için 404 olur. Hepsinin boş olduğundan emin ol, kaydet, sonra **Redeploy** yap.

---

## Environment Variables (Vercel → Settings → Environment Variables)

**ÖNEMLİ:** Bu değişkenler olmadan paylaşım linkleri çalışmaz!

1. Vercel Dashboard → rivlus-site projesi → Settings → Environment Variables
2. Şu değişkenleri ekleyin:

```
SUPABASE_URL=https://lnodjfivycpyoytmwpcn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxub2RqZml2eWNweW95dG13cGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjM3NDMsImV4cCI6MjA4NDU5OTc0M30.Huaq1EC6wM2zzVTKbflG1XIeINvVtYU6mRIAUTvzm5s
```

**Not:** Production, Preview ve Development için aynı değerleri ekleyin.

## Deploy Sonrası Kontrol

1. Vercel Dashboard → rivlus-site → Functions → Logs
2. Bir paylaşım linkini test edin: `https://rivlus.com/m/:id`
3. Log'larda şunları kontrol edin:
   - "Fetching listing from:" mesajı görünüyor mu?
   - "Listing data received:" mesajında veri var mı?
   - "Images data received:" mesajında görsel var mı?

## Sorun Giderme

### Veri gelmiyorsa:
- Environment variables doğru ayarlanmış mı?
- Supabase URL ve key doğru mu?
- Listing ID doğru mu?
- Listing `status = 'active'` mi?

### Görsel gelmiyorsa:
- `listing_images` tablosunda görsel var mı?
- Görsel URL'i `http` ile mi başlıyor?
- RLS policy'leri doğru mu?
