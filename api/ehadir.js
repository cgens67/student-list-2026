export default async function handler(req, res) {
  const { classCode } = req.query;
  if (!classCode) {
    return res.status(400).json({ error: "Missing classCode" });
  }

  const url = `https://parents.chsmelaka.com/${encodeURIComponent(classCode.toLowerCase())}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Portal not reachable" });
    }

    const html = await response.text();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ html });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
