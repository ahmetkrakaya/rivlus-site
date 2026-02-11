/**
 * Apple App Site Association (AASA) – iOS Universal Links için.
 * Apple bu dosyayı /.well-known/apple-app-site-association adresinden çeker.
 * Content-Type: application/json olmalıdır.
 *
 * Team ID: DBRWXQU8LV
 * Bundle ID: com.rivlus.projectTcr
 */
module.exports = function handler(req, res) {
  const aasa = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'DBRWXQU8LV.com.rivlus.projectTcr',
          paths: ['/e/*', '/m/*'],
        },
      ],
    },
    webcredentials: {
      apps: ['DBRWXQU8LV.com.rivlus.projectTcr'],
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).json(aasa);
};
