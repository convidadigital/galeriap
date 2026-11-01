export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { action, files, uploadUrl, data, contentType, finalizeUrl, claimToken } = req.body || {};
    if (action === "start") {
      if (!Array.isArray(files) || !files.length || files.length > 100) {
        return res.status(400).json({ error: "Lista de fotos inválida." });
      }
      const manifest = files.map(file => ({
        path: String(file.path || "").replace(/[^a-zA-Z0-9._/-]/g, "_"),
        size: Number(file.size),
        contentType: "image/jpeg",
        hash: String(file.hash || "")
      }));
      if (manifest.some(f => !f.path || !Number.isFinite(f.size) || f.size < 1 || f.size > 250 * 1024 * 1024 || !/^sha256:[a-f0-9]{64}$/.test(f.hash))) {
        return res.status(400).json({ error: "Dados de uma ou mais fotos são inválidos." });
      }
      const upstream = await fetch("https://beacon.host/v1/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: manifest })
      });
      const result = await upstream.json();
      if (!upstream.ok) return res.status(502).json({ error: "Não foi possível iniciar a hospedagem temporária.", detail: result });
      return res.status(200).json(result);
    }
    if (action === "upload") {
      if (typeof uploadUrl !== "string" || !uploadUrl.startsWith("https://") || typeof data !== "string" || !data.startsWith("data:image/")) {
        return res.status(400).json({ error: "Dados de envio inválidos." });
      }
      const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\\s\\S]+)$/);
      if (!match) return res.status(400).json({ error: "Imagem inválida." });
      const bytes = Buffer.from(match[2], "base64");
      const upstream = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType || match[1] },
        body: bytes
      });
      if (!upstream.ok) return res.status(502).json({ error: "Falha ao transferir uma foto para o armazenamento temporário.", status: upstream.status });
      return res.status(200).json({ uploaded: true });
    }
    if (action === "finalize") {
      if (typeof finalizeUrl !== "string" || !finalizeUrl.startsWith("/v1/") || typeof claimToken !== "string") {
        return res.status(400).json({ error: "Dados de finalização inválidos." });
      }
      const upstream = await fetch("https://beacon.host" + finalizeUrl, {
        method: "POST",
        headers: { "X-Claim-Token": claimToken }
      });
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return res.status(502).json({ error: "Não foi possível finalizar a galeria temporária.", detail: result });
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: "Ação inválida." });
  } catch (error) {
    return res.status(500).json({ error: "Falha na hospedagem temporária.", detail: error.message });
  }
}
