export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { url } = req.body || {};
    if (typeof url !== "string") return res.status(400).json({ error: "URL inválida." });
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return res.status(400).json({ error: "URL inválida." });
    const api = "https://is.gd/create.php?format=json&url=" + encodeURIComponent(parsed.toString());
    const upstream = await fetch(api);
    const data = await upstream.json();
    if (!upstream.ok || !data.shorturl) {
      return res.status(502).json({ error: data.errormessage || "Não foi possível encurtar o link." });
    }
    return res.status(200).json({ url: data.shorturl });
  } catch (error) {
    return res.status(500).json({ error: "Falha ao encurtar o link." });
  }
}
