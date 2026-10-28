const CONFIG = {
  whatsapp: "5584991474530",
  nomeGaleria: "Galeria Digital",
  limiteSelecao: 0
};

const PHOTOS = [
  {
    "id": "FOTO-001",
    "src": "foto-001.webp"
  },
  {
    "id": "FOTO-002",
    "src": "foto-002.webp"
  },
  {
    "id": "FOTO-003",
    "src": "foto-003.webp"
  },
  {
    "id": "FOTO-004",
    "src": "foto-004.webp"
  },
  {
    "id": "FOTO-005",
    "src": "foto-005.webp"
  },
  {
    "id": "FOTO-006",
    "src": "foto-006.webp"
  },
  {
    "id": "FOTO-007",
    "src": "foto-007.webp"
  },
  {
    "id": "FOTO-008",
    "src": "foto-008.webp"
  },
  {
    "id": "FOTO-009",
    "src": "foto-009.webp"
  },
  {
    "id": "FOTO-010",
    "src": "foto-010.webp"
  }
];

const gallery = document.getElementById("gallery");
const counter = document.getElementById("counter");
const bottomCounter = document.getElementById("bottomCounter");
const limitText = document.getElementById("limitText");
const clearBtn = document.getElementById("clearBtn");
const whatsappBtn = document.getElementById("whatsappBtn");
const reviewBtn = document.getElementById("reviewBtn");
const reviewDialog = document.getElementById("reviewDialog");
const reviewList = document.getElementById("reviewList");
const closeDialog = document.getElementById("closeDialog");
const sendFromDialog = document.getElementById("sendFromDialog");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxLabel = document.getElementById("lightboxLabel");

const STORAGE_KEY = "galeria-digital-selecao-v5";
let selected = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
let lightboxIndex = 0;

function saveSelection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
}

function renderGallery() {
  gallery.innerHTML = "";

  PHOTOS.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "photo-card" + (selected.has(photo.id) ? " selected" : "");

    card.innerHTML = `
      <img src="${photo.src}" loading="lazy" alt="${photo.id}">
      <span class="check">${selected.has(photo.id) ? "✓" : "♡"}</span>
      <span class="photo-id">${photo.id}</span>
      <button class="zoom" type="button" title="Ampliar">↗</button>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => {
      card.style.display = "none";
      console.error("Imagem não encontrada:", photo.src);
    });

    card.addEventListener("click", (event) => {
      if (event.target.closest(".zoom")) {
        openLightbox(index);
        return;
      }
      togglePhoto(photo.id);
    });

    gallery.appendChild(card);
  });

  updateCounters();
}

function togglePhoto(id) {
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    if (CONFIG.limiteSelecao > 0 && selected.size >= CONFIG.limiteSelecao) {
      alert(`Você já atingiu o limite de ${CONFIG.limiteSelecao} fotos.`);
      return;
    }
    selected.add(id);
  }

  saveSelection();
  renderGallery();
}

function updateCounters() {
  const n = selected.size;
  counter.textContent = `${n} ${n === 1 ? "foto selecionada" : "fotos selecionadas"}`;
  bottomCounter.textContent = `${n} ${n === 1 ? "foto" : "fotos"}`;
  limitText.textContent = CONFIG.limiteSelecao > 0 ? `Limite: ${CONFIG.limiteSelecao} fotos` : "";
}

function selectedPhotos() {
  return PHOTOS.filter(photo => selected.has(photo.id));
}

function sendWhatsApp() {
  if (!selected.size) {
    alert("Selecione pelo menos uma foto antes de enviar.");
    return;
  }

  const list = selectedPhotos()
    .map(photo => `• ${photo.id}`)
    .join("\n");

  const message = `Olá! 🤍

Finalizei minha seleção na GALERIA DIGITAL.

Quantidade: ${selected.size}

Fotos escolhidas:
${list}`;

  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function openReview() {
  if (!selected.size) {
    alert("Você ainda não selecionou nenhuma foto.");
    return;
  }

  reviewList.innerHTML = "";

  selectedPhotos().forEach(photo => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `<img src="${photo.src}" alt="${photo.id}"><span>${photo.id}</span>`;
    reviewList.appendChild(item);
  });

  reviewDialog.showModal();
}

function openLightbox(index) {
  lightboxIndex = index;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  updateLightbox();
}

function updateLightbox() {
  const photo = PHOTOS[lightboxIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.id;
  lightboxLabel.textContent = photo.id;
}

function closeLightboxFn() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

clearBtn.addEventListener("click", () => {
  if (!selected.size) return;

  if (confirm("Deseja limpar toda a seleção?")) {
    selected.clear();
    saveSelection();
    renderGallery();
  }
});

whatsappBtn.addEventListener("click", sendWhatsApp);
reviewBtn.addEventListener("click", openReview);
closeDialog.addEventListener("click", () => reviewDialog.close());
sendFromDialog.addEventListener("click", sendWhatsApp);

document.getElementById("lightboxClose").addEventListener("click", closeLightboxFn);

document.getElementById("prevPhoto").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex - 1 + PHOTOS.length) % PHOTOS.length;
  updateLightbox();
});

document.getElementById("nextPhoto").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex + 1) % PHOTOS.length;
  updateLightbox();
});

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightboxFn();
});

document.addEventListener("keydown", event => {
  if (lightbox.hidden) return;

  if (event.key === "Escape") closeLightboxFn();
  if (event.key === "ArrowLeft") document.getElementById("prevPhoto").click();
  if (event.key === "ArrowRight") document.getElementById("nextPhoto").click();
});

renderGallery();
