/**
 * Android Asset Links – Android App Links için.
 * Android bu dosyayı /.well-known/assetlinks.json adresinden çeker.
 * Content-Type: application/json olmalıdır.
 *
 * Package name: com.rivlus.project_tcr
 * SHA-256: Google Play Console > Setup > App signing bölümünden alınmalı.
 *          Aşağıda PLACEHOLDER var, gerçek değerle değiştirilmeli.
 */
module.exports = function handler(req, res) {
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.rivlus.project_tcr',
        sha256_cert_fingerprints: [
          // TODO: Google Play Console > Setup > App signing > SHA-256 certificate fingerprint
          // Aşağıdaki değeri gerçek fingerprint ile değiştirin.
          // Debug için: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
          process.env.ANDROID_SHA256_FINGERPRINT || 'PLACEHOLDER:SHA256:FINGERPRINT',
        ],
      },
    },
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).json(assetLinks);
};
