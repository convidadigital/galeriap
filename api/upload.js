export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { data, filename = "photo.jpg", time = "24h" } = req.body || {};
    if (typeof data !== "string" || !data.startsWith("data:image/")) {
      return res.status(400).json({ error: "Imagem inválida." });
    }
    if (!["1h", "12h", "24h", "72h"].includes(time)) {
      return res.status(400).json({ error: "Prazo de expiração inválido." });
    }
    const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (!match) return res.status(400).json({ error: "Formato de imagem inválido." });
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length > 950 * 1024) {
      return res.status(413).json({ error: "A imagem continua grande demais. Tente uma imagem menor." });
    }
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("time", time);
    form.append("fileToUpload", new Blob([bytes], { type: match[1] }), String(filename).replace(/[^a-zA-Z0-9._-]/g, "_"));
    const upstream = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", { method: "POST", body: form });
    const result = (await upstream.text()).trim();
    if (!upstream.ok || !/^https:\/\//i.test(result)) {
      return res.status(502).json({ error: "O serviço temporário não aceitou a imagem. Tente novamente." });
    }
    return res.status(200).json({ url: result, expiresIn: time });
  } catch (error) {
    return res.status(500).json({ error: "Falha no envio temporário da imagem." });
  }
}
