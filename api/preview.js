function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function decodeGallery(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(normalized))));
}
export default function handler(req, res) {
  const raw = typeof req.query.g === "string" ? req.query.g : "";
  try {
    if (!raw) throw new Error("Galeria ausente");
    const meta = decodeGallery(raw);
    const title = (meta.name || "Galeria Digital") + " | Studio Digital";
    const description = (meta.shoot ? meta.shoot + " — " : "") + "Confira sua galeria exclusiva e selecione suas fotos favoritas.";
    const image = meta.photos && meta.photos[0] && meta.photos[0].src ? meta.photos[0].src : "";
    const target = "/?g=" + encodeURIComponent(raw);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Studio Digital">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">
${image ? '<meta property="og:image" content="' + escapeHtml(image) + '"><meta name="twitter:image" content="' + escapeHtml(image) + '">' : ""}
<meta http-equiv="refresh" content="1;url=${escapeHtml(target)}">
<style>body{font-family:Arial,sans-serif;background:#f6f1ea;color:#24211e;display:grid;place-items:center;min-height:90vh;text-align:center;padding:20px}main{max-width:520px}img{max-width:100%;max-height:50vh;object-fit:cover;border-radius:12px}a{color:inherit}</style></head>
<body><main>${image ? '<img src="' + escapeHtml(image) + '" alt="Capa da galeria">' : ""}<h1>${escapeHtml(meta.name || "Galeria Digital")}</h1><p>${escapeHtml(description)}</p><p>Abrindo sua galeria… <a href="${escapeHtml(target)}">Clique aqui se não abrir</a>.</p></main>
<script>setTimeout(function(){location.replace(${JSON.stringify(target)})},700)</script></body></html>`);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send("<!doctype html><html lang='pt-BR'><meta charset='utf-8'><title>Galeria indisponível</title><body>Este link de galeria é inválido ou expirou.</body></html>");
  }
}
