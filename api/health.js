export default function handler(_request, response) {
  response.status(200).json({
    ok: true,
    platform: "vercel",
    cerulConfigured: Boolean(process.env.CERUL_API_KEY),
  });
}
