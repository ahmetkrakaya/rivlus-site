# Rivlus Site Deploy Rehberi

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
