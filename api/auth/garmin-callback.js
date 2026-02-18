export default function handler(req, res) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`Garmin OAuth Error: ${error} - ${error_description || ''}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code from Garmin');
  }

  const params = new URLSearchParams();
  params.set('code', code);
  if (state) params.set('state', state);

  const deepLink = `tcr://redirect?${params.toString()}`;
  return res.redirect(302, deepLink);
}
