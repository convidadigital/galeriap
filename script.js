const CONFIG = { whatsapp: "5584991474530", expiryHours: 24 };
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const galleryParam = params.get("g");
let photos = [];
let selected = new Set();
let clientGallery = false;
let lightboxIndex = 0;
const editorGallery = $("editorGallery");
const clientGrid = $("gallery");
const selectionKey = "studio-gallery-selection:" + (galleryParam || "local");

function setStatus(message, error = false) {
  const el = $("status");
  if (el) { el.textContent = message; el.classList.toggle("error", error); }
}
function photoId(i) { return "FOTO-" + String(i + 1).padStart(3, "0"); }
function fileToData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
async function optimizeImage(src, rotation = 0) {
  const img = await loadImage(src);
  const sideways = Math.abs(rotation % 180) === 90;
  const maxSide = 1500;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = sideways ? h : w; canvas.height = sideways ? w : h;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.76);
}
function renderEditor() {
  if (!editorGallery) return;
  editorGallery.innerHTML = "";
  photos.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "photo-card edit-card";
    const img = document.createElement("img");
    img.src = p.preview; img.alt = p.id;
    img.style.transform = `rotate(${p.rotation || 0}deg) scale(${p.zoom || 1})`;
    const tag = document.createElement("span"); tag.className = "photo-id"; tag.textContent = p.id;
    const controls = document.createElement("div"); controls.className = "edit-controls";
    const rotate = document.createElement("button"); rotate.type = "button"; rotate.textContent = "↻ Girar"; rotate.title = "Girar 90 graus";
    rotate.onclick = () => { p.rotation = ((p.rotation || 0) + 90) % 360; renderEditor(); };
    const zoom = document.createElement("input"); zoom.type = "range"; zoom.min = "1"; zoom.max = "1.8"; zoom.step = ".1"; zoom.value = p.zoom || 1; zoom.setAttribute("aria-label", "Ajustar enquadramento");
    zoom.oninput = () => { p.zoom = Number(zoom.value); img.style.transform = `rotate(${p.rotation || 0}deg) scale(${p.zoom})`; };
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remover"; remove.className = "remove-photo";
    remove.onclick = () => { URL.revokeObjectURL(p.preview); photos.splice(i, 1); photos.forEach((x, n) => x.id = photoId(n)); renderEditor(); };
    controls.append(rotate, zoom, remove);
    card.append(img, tag, controls); editorGallery.append(card);
  });
  $("editorCount").textContent = photos.length ? `${photos.length} foto(s) prontas para publicar` : "Nenhuma foto adicionada";
  $("publishBtn").disabled = photos.length === 0;
}
$("photoInput")?.addEventListener("change", event => {
  const files = [...event.target.files || []].filter(f => f.type.startsWith("image/"));
  files.forEach(file => photos.push({ id: photoId(photos.length), file, preview: URL.createObjectURL(file), rotation: 0, zoom: 1 }));
  renderEditor(); event.target.value = "";
});
function renderClientGallery() {
  clientGrid.innerHTML = "";
  photos.forEach((p, i) => {
    const card = document.createElement("article"); card.className = "photo-card" + (selected.has(p.id) ? " selected" : "");
    const img = document.createElement("img"); img.src = p.src; img.alt = p.id; img.loading = "lazy";
    const heart = document.createElement("span"); heart.className = "check"; heart.textContent = selected.has(p.id) ? "✓" : "♡";
    const label = document.createElement("span"); label.className = "photo-id"; label.textContent = p.id;
    card.append(img, heart, label);
    card.onclick = () => { selected.has(p.id) ? selected.delete(p.id) : selected.add(p.id); saveSelection(); renderClientGallery(); updateCounters(); };
    clientGrid.append(card);
  });
  updateCounters();
}
function saveSelection() { try { localStorage.setItem(selectionKey, JSON.stringify([...selected])); } catch {} }
function updateCounters() {
  const n = selected.size;
  if ($("counter")) $("counter").textContent = `${n} ${n === 1 ? "foto selecionada" : "fotos selecionadas"}`;
  if ($("bottomCounter")) $("bottomCounter").textContent = `${n} ${n === 1 ? "foto" : "fotos"}`;
}
function sendWhatsApp() {
  if (!selected.size) { alert("Selecione pelo menos uma foto antes de enviar."); return; }
  const ids = photos.filter(p => selected.has(p.id)).map(p => "• " + p.id).join("\n");
  const title = params.get("name") || "Galeria Digital";
  const text = `Olá! 🤍 Finalizei minha seleção na ${title}.\n\nQuantidade: ${selected.size}\nFotos escolhidas:\n${ids}`;
  window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
}
$("clearBtn")?.addEventListener("click", () => { selected.clear(); saveSelection(); renderClientGallery(); });
$("whatsappBtn")?.addEventListener("click", sendWhatsApp);
$("reviewBtn")?.addEventListener("click", () => {
  $("reviewList").innerHTML = "";
  photos.filter(p => selected.has(p.id)).forEach(p => {
    const item = document.createElement("div"); item.className = "review-item";
    const img = document.createElement("img"); img.src = p.src; img.alt = p.id;
    const label = document.createElement("span"); label.textContent = p.id;
    item.append(img, label); $("reviewList").append(item);
  });
  if (!selected.size) { alert("Você ainda não selecionou nenhuma foto."); return; }
  $("reviewDialog").showModal();
});
$("closeDialog")?.addEventListener("click", () => $("reviewDialog").close());
$("sendFromDialog")?.addEventListener("click", sendWhatsApp);

$("publishBtn")?.addEventListener("click", async () => {
  const btn = $("publishBtn"); btn.disabled = true;
  $("sharePanel").hidden = true;
  try {
    const hosted = [];
    for (let i = 0; i < photos.length; i++) {
      setStatus(`Preparando foto ${i + 1} de ${photos.length}…`);
      let data = await optimizeImage(photos[i].preview, photos[i].rotation || 0);
      // Litterbox temporary uploads have a 1 MB per-file limit.
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, filename: photos[i].id + ".jpg", time: "24h" }) });
        if (response.ok) break;
        if (attempt === 0) {
          const img = await loadImage(data), canvas = document.createElement("canvas");
          const factor = 0.72; canvas.width = Math.round(img.naturalWidth * factor); canvas.height = Math.round(img.naturalHeight * factor);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          data = canvas.toDataURL("image/jpeg", 0.55);
        }
      }
      if (!response?.ok) throw new Error(await response.text().catch(() => "Não foi possível hospedar temporariamente uma foto."));
      const result = await response.json();
      hosted.push({ id: photos[i].id, src: result.url });
    }
    const coupleName = $("clientName").value.trim() || "Galeria Digital";
    const shootName = $("shootName").value.trim() || "Ensaio fotográfico";
    $("previewCoupleName").textContent = coupleName;
    $("previewShootName").textContent = shootName;
    const firstPhoto = hosted[0]?.src;
    const previewCover = $("previewCover");
    previewCover.style.backgroundImage = firstPhoto ? "linear-gradient(#0002,#0002), url(" + JSON.stringify(firstPhoto) + ")" : "";
    previewCover.style.backgroundSize = "cover";
    previewCover.style.backgroundPosition = "center";
    const meta = { name: coupleName, shoot: $("shootName").value.trim(), photos: hosted };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(meta)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const longUrl = location.origin + location.pathname + "?g=" + encoded;
    setStatus("Encurtando o link da galeria…");
    const shortResponse = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: longUrl })
    });
    if (!shortResponse.ok) throw new Error("A galeria foi criada, mas não foi possível encurtar o link. Tente novamente.");
    const shortResult = await shortResponse.json();
    $("shareUrl").value = shortResult.url || longUrl;
    $("sharePanel").hidden = false;
    setStatus(shortResult.url ? "Galeria pronta! O link curto está pronto para compartilhar." : "Galeria pronta. Use o link abaixo.");
  } catch (err) {
    setStatus("Não foi possível criar a galeria: " + (err.message || "verifique sua conexão e tente novamente."), true);
  } finally { btn.disabled = false; }
});
$("copyLinkBtn")?.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("shareUrl").value); setStatus("Link copiado."); }
  catch { $("shareUrl").select(); document.execCommand("copy"); setStatus("Link copiado."); }
});
$("sendLinkBtn")?.addEventListener("click", () => {
  const client = $("clientName").value.trim();
  const text = `Olá${client ? " " + client : ""}! Sua galeria do Studio Digital está pronta. Escolha suas fotos favoritas neste link (disponível por 24 horas): ${$("shareUrl").value}`;
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
});

function decodeGallery(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(normalized))));
}
function initClientGallery(meta) {
  clientGallery = true;
  $("adminPanel").hidden = true; $("clientPanel").hidden = false;
  $("pageTitle").textContent = meta.name || "Escolha suas fotos favoritas";
  $("pageIntro").textContent = meta.shoot || "Selecione as fotos que deseja receber.";
  $("clientTitle").textContent = meta.name || "Escolha suas fotos favoritas";
  $("clientDescription").textContent = (meta.shoot ? meta.shoot + " · " : "") + "Toque nas fotos favoritas e envie sua seleção pelo WhatsApp.";
  photos = meta.photos || [];
  try { selected = new Set(JSON.parse(localStorage.getItem(selectionKey) || "[]")); } catch { selected = new Set(); }
  renderClientGallery();
}
if (galleryParam) {
  try { initClientGallery(decodeGallery(galleryParam)); }
  catch { $("pageTitle").textContent = "Link de galeria inválido"; $("pageIntro").textContent = "Peça ao Studio Digital um novo link de seleção."; $("adminPanel").hidden = true; }
}
