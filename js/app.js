// ==========================================
// COTIZACIONES FLORES - FUNCIONES GENERALES
// ==========================================

const currentYear = document.getElementById("currentYear");
if (currentYear) currentYear.textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");
if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => navigation.classList.toggle("open"));
    document.querySelectorAll(".navigation a").forEach(link => link.addEventListener("click", () => navigation.classList.remove("open")));
}

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealElements.forEach(element => observer.observe(element));
} else revealElements.forEach(element => element.classList.add("visible"));

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".navigation .nav-link");
if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
    }), { rootMargin: "-25% 0px -65% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
}

// Precios provisionales: cambia estos valores o los data-price del HTML cuando tengas tus precios reales.
const dessertPrices = {
    pasteles: { "Pastel completo": { Chico: 250, Mediano: 400, Grande: 600 }, "Por rebanadas": { Chico: 45, Mediano: 45, Grande: 45 } },
    "gelatina-mosaico": { Chico: 100, Mediano: 180, Grande: 280 },
    "arroz-leche": { Chico: 80, Mediano: 150, Grande: 230 },
    enchamoyadas: { unidad: 15 },
    cheesecake: { Chico: 280, Mediano: 450, Grande: 650 }
};
const WHATSAPP_NUMBER = "526941195909";
const cart = [];
const quoteContainer = document.getElementById("quoteContainer");
const money = value => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

function addControl(card, html) {
    let controls = card.querySelector(".catalog-controls");
    if (!controls) {
        controls = document.createElement("div");
        controls.className = "catalog-controls";
        const info = card.querySelector(".catalog-info");
        const bottom = card.querySelector(".catalog-bottom");
        info.insertBefore(controls, bottom);
    }
    controls.insertAdjacentHTML("beforeend", html);
}

// Los artículos de renta necesitan cantidad y días; los banquetes aceptan detalles personalizados.
document.querySelectorAll("#eventos .catalog-card").forEach(card => {
    addControl(card, `<div class="control-row"><div><label>Cantidad</label><input data-extra="cantidad" type="number" min="1" value="1"></div><div><label>Días de renta</label><input data-extra="dias" type="number" min="1" value="1"></div></div>`);
});
document.querySelectorAll("#banquetes .catalog-card").forEach(card => {
    addControl(card, `<label>Personas o porciones aproximadas</label><input data-extra="cantidad" type="number" min="1" value="1"><label>Detalles de tu pedido (opcional)</label><textarea data-extra="notas" rows="2" placeholder="Ej. Para 25 personas, poco picante..."></textarea>`);
});

function readOptions(card) {
    const options = {};
    card.querySelectorAll(".dessert-field").forEach(field => {
        const key = field.dataset.field;
        if (key) options[key] = field.value.trim();
    });
    card.querySelectorAll("[data-extra]").forEach(field => options[field.dataset.extra] = field.value.trim());
    return options;
}

function getUnitPrice(id, options, card) {
    if (dessertPrices[id]) {
        const p = dessertPrices[id];
        if (id === "pasteles") return Number(p[options.presentacion || "Pastel completo"][options.tamano || "Chico"]);
        if (id === "enchamoyadas") return Number(p.unidad);
        return Number(p[options.tamano || "Chico"]);
    }
    return Number(card.dataset.price || 0);
}

function addCardToQuote(card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const options = readOptions(card);
    const isBanquet = card.closest("#banquetes") !== null;
    const quantity = Math.max(1, Number(options.cantidad || 1));
    const days = Math.max(1, Number(options.dias || 1));
    if ((id === "pasteles" || id === "cheesecake") && !options.sabor) {
        alert("Escribe el sabor que deseas para continuar.");
        card.querySelector('[data-field="sabor"]')?.focus();
        return;
    }
    const unitPrice = isBanquet ? 0 : getUnitPrice(id, options, card);
    const total = isBanquet ? 0 : unitPrice * quantity * (card.closest("#eventos") ? days : 1);
    const image = card.querySelector("img")?.getAttribute("src") || "";
    cart.push({ key: `${id}-${Date.now()}-${Math.random()}`, id, name, options, quantity, days, unitPrice, total, image, isBanquet, isRental: !!card.closest("#eventos") });
    renderQuote();
    const button = card.querySelector(".add-product-btn");
    if (button) { const old = button.textContent; button.textContent = "Agregado ✓"; button.classList.add("added"); setTimeout(() => { button.textContent = old; button.classList.remove("added"); }, 1200); }
}

document.querySelectorAll(".add-product-btn").forEach(button => button.addEventListener("click", () => addCardToQuote(button.closest(".catalog-card"))));

function updateDessertCardPrice(card) {
    const id = card.dataset.id;
    if (!dessertPrices[id]) return;
    const options = readOptions(card);
    const price = getUnitPrice(id, options, card);
    const priceLabel = card.querySelector(".catalog-price");
    if (priceLabel) priceLabel.textContent = `Precio de prueba: ${money(price)}${id === "enchamoyadas" || (id === "pasteles" && options.presentacion === "Por rebanadas") ? " por pieza" : ""}`;
}
document.querySelectorAll("#postres .catalog-card").forEach(card => {
    card.querySelectorAll(".dessert-field").forEach(field => field.addEventListener("change", () => updateDessertCardPrice(card)));
    updateDessertCardPrice(card);
});

function optionSummary(item) {
    const parts = [];
    if (item.options.presentacion) parts.push(item.options.presentacion);
    if (item.options.tamano) parts.push(item.options.tamano);
    if (item.options.sabor) parts.push("Sabor: " + item.options.sabor);
    if (item.isRental) parts.push(`${item.quantity} × ${item.days} día(s)`);
    else if (!item.isBanquet) parts.push(`Cantidad: ${item.quantity}`);
    if (item.isBanquet) { parts.push(`${item.quantity} persona(s)/porción(es)`); if (item.options.notas) parts.push(item.options.notas); }
    return parts.join(" · ");
}

function renderQuote() {
    if (!quoteContainer) return;
    if (!cart.length) {
        quoteContainer.className = "quote-empty reveal visible";
        quoteContainer.innerHTML = `<div class="quote-empty-icon">✿</div><h3>Tu cotización está esperando</h3><p>Agrega productos desde el catálogo y aquí aparecerán tus selecciones, cantidades y precios.</p><a href="#eventos" class="btn-primary">Explorar catálogo <span>→</span></a>`;
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const hasCustom = cart.some(item => item.isBanquet);
    quoteContainer.className = "quote-panel reveal visible";
    quoteContainer.innerHTML = `
      <div class="quote-top"><div><h3>Mi cotización</h3><span class="quote-count">${cart.length} selección(es)</span></div><span class="quote-empty-icon">✿</span></div>
      <div class="quote-list">${cart.map(item => `<article class="quote-item"><img src="${item.image}" alt=""><div><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(optionSummary(item))}</p><button class="remove-quote-item" data-remove="${item.key}" type="button">Quitar</button></div><div class="quote-item-price">${item.isBanquet ? "Por cotizar" : money(item.total)}</div></article>`).join("")}</div>
      <div class="quote-totals"><div>Subtotal de productos con precio<strong>${money(total)}</strong></div><div>Total provisional<strong>${hasCustom ? "Por confirmar" : money(total)}</strong></div></div>
      ${hasCustom ? '<div class="quote-note">Incluiste platillos de banquete. Su precio se acordará por WhatsApp según las porciones y los detalles del pedido. El importe mostrado es parcial.</div>' : ''}
      <div class="quote-actions"><button id="shareQuoteBtn" type="button">Enviar por WhatsApp ✧</button><button id="downloadQuoteBtn" type="button">Descargar imagen</button></div>`;
    quoteContainer.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => { const index = cart.findIndex(item => item.key === btn.dataset.remove); if (index >= 0) cart.splice(index, 1); renderQuote(); }));
    document.getElementById("shareQuoteBtn")?.addEventListener("click", shareQuote);
    document.getElementById("downloadQuoteBtn")?.addEventListener("click", downloadQuoteImage);
}

function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
function quoteText() {
    const lines = cart.map((item, i) => `${i+1}. ${item.name}\n   ${optionSummary(item)}\n   ${item.isBanquet ? "Precio por cotizar" : money(item.total)}`);
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    return `Hola, quiero solicitar esta cotización de Cotizaciones Flores:\n\n${lines.join("\n\n")}\n\nSubtotal con precios disponibles: ${money(total)}${cart.some(x=>x.isBanquet) ? "\nLos banquetes quedan pendientes de cotización personalizada." : ""}\n\n¿Podrían ayudarme con los detalles?`;
}


async function createQuoteBlob() {
    await document.fonts?.ready;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = 1200;
    const pad = 85;
    const rowHeight = 155;
    const height = 650 + (cart.length * rowHeight);

    canvas.width = width;
    canvas.height = height;

    // ======================================
    // PALETA ELEGANTE
    // ======================================

    const colors = {
        background: "#eee9df",
        paper: "#fffdf8",
        green: "#354b38",
        greenLight: "#65775e",
        terracotta: "#a75e4c",
        text: "#514c43",
        muted: "#948b7e",
        line: "#e8dfd2",
        cream: "#f7f2e9"
    };

    // ======================================
    // FONDO Y MARCO
    // ======================================

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = colors.paper;
    ctx.fillRect(28, 28, width - 56, height - 56);

    ctx.strokeStyle = "#d9cbbb";
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, width - 84, height - 84);

    // Línea decorativa superior
    ctx.fillStyle = colors.terracotta;
    ctx.fillRect(pad, 75, 90, 5);

    // ======================================
    // ENCABEZADO
    // ======================================

    ctx.fillStyle = colors.green;
    ctx.font = "italic 48px Georgia";
    ctx.fillText("Cotizaciones Flores", pad, 145);

    ctx.fillStyle = colors.terracotta;
    ctx.font = "32px Georgia";
    ctx.fillText("✿", width - pad - 40, 140);

    ctx.fillStyle = colors.muted;
    ctx.font = "17px Arial";
    ctx.fillText("EVENTOS · BANQUETES · POSTRES", pad, 185);

    // Fecha de elaboración
    const fecha = new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date());

    ctx.textAlign = "right";
    ctx.fillStyle = colors.muted;
    ctx.font = "16px Arial";
    ctx.fillText(fecha, width - pad, 185);
    ctx.textAlign = "left";

    // Separador
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, 220);
    ctx.lineTo(width - pad, 220);
    ctx.stroke();

    // ======================================
    // TÍTULO DE LA COTIZACIÓN
    // ======================================

    ctx.fillStyle = colors.green;
    ctx.font = "italic 35px Georgia";
    ctx.fillText("Una propuesta para tu ocasión", pad, 285);

    ctx.fillStyle = colors.muted;
    ctx.font = "17px Arial";
    ctx.fillText(
        "A continuación encontrarás el detalle de los productos seleccionados.",
        pad,
        325
    );

    // Encabezados de columnas
    ctx.fillStyle = colors.greenLight;
    ctx.font = "bold 14px Arial";
    ctx.fillText("PRODUCTO Y DETALLES", pad, 390);

    ctx.textAlign = "right";
    ctx.fillText("IMPORTE", width - pad, 390);
    ctx.textAlign = "left";

    ctx.strokeStyle = colors.line;
    ctx.beginPath();
    ctx.moveTo(pad, 410);
    ctx.lineTo(width - pad, 410);
    ctx.stroke();

    // ======================================
    // PRODUCTOS
    // ======================================

    let y = 445;

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];

        // Fondo alternado
        if (i % 2 === 0) {
            ctx.fillStyle = "#faf7f1";
            ctx.fillRect(pad - 15, y - 30, width - pad * 2 + 30, 125);
        }

        // Fotografía del producto
        const thumb = await loadQuoteImage(item.image);

        if (thumb) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(pad, y - 15, 90, 90, 12);
            ctx.clip();
            ctx.drawImage(thumb, pad, y - 15, 90, 90);
            ctx.restore();
        } else {
            ctx.fillStyle = colors.cream;
            ctx.beginPath();
            ctx.roundRect(pad, y - 15, 90, 90, 12);
            ctx.fill();
            ctx.fillStyle = colors.terracotta;
            ctx.font = "30px Georgia";
            ctx.fillText("✿", pad + 29, y + 40);
        }

        const textX = pad + 120;

        // Nombre
        ctx.fillStyle = colors.green;
        ctx.font = "bold 23px Georgia";
        ctx.fillText(item.name, textX, y + 12, 550);

        // Detalles
        ctx.fillStyle = colors.text;
        ctx.font = "16px Arial";

        const detail = optionSummary(item);

        wrapCanvasText(
            ctx,
            detail,
            textX,
            y + 43,
            570,
            24
        );

        // Precio
        ctx.fillStyle = colors.terracotta;
        ctx.font = "bold 23px Arial";
        ctx.textAlign = "right";

        ctx.fillText(
            item.isBanquet ? "Por cotizar" : money(item.total),
            width - pad,
            y + 12
        );

        ctx.textAlign = "left";

        // Separador
        ctx.strokeStyle = colors.line;
        ctx.beginPath();
        ctx.moveTo(textX, y + 105);
        ctx.lineTo(width - pad, y + 105);
        ctx.stroke();

        y += rowHeight;
    }

    // ======================================
    // RESUMEN DE IMPORTES
    // ======================================

    y += 15;

    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const hasBanquet = cart.some(item => item.isBanquet);

    const boxY = y;
    const boxHeight = 150;

    ctx.fillStyle = colors.cream;
    ctx.beginPath();
    ctx.roundRect(pad - 10, boxY, width - pad * 2 + 20, boxHeight, 16);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.font = "18px Arial";
    ctx.fillText("Subtotal de productos", pad + 15, boxY + 45);

    ctx.fillStyle = colors.green;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "right";
    ctx.fillText(money(total), width - pad - 15, boxY + 48);

    ctx.textAlign = "left";

    ctx.strokeStyle = colors.line;
    ctx.beginPath();
    ctx.moveTo(pad + 15, boxY + 70);
    ctx.lineTo(width - pad - 15, boxY + 70);
    ctx.stroke();

    ctx.fillStyle = colors.green;
    ctx.font = "bold 19px Arial";
    ctx.fillText(
        hasBanquet ? "Total: pendiente de confirmar" : "Total de tu cotización",
        pad + 15,
        boxY + 112
    );

    ctx.fillStyle = colors.terracotta;
    ctx.font = "bold 29px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        hasBanquet ? "Por confirmar" : money(total),
        width - pad - 15,
        boxY + 115
    );

    ctx.textAlign = "left";

    // ======================================
    // PIE DE IMAGEN
    // ======================================

    const footerY = boxY + boxHeight + 85;

    ctx.strokeStyle = colors.line;
    ctx.beginPath();
    ctx.moveTo(pad, footerY - 30);
    ctx.lineTo(width - pad, footerY - 30);
    ctx.stroke();

    ctx.fillStyle = colors.terracotta;
    ctx.font = "italic 26px Georgia";
    ctx.fillText("Cada detalle hace especial tu celebración.", pad, footerY + 15);

    ctx.fillStyle = colors.muted;
    ctx.font = "15px Arial";
    ctx.fillText(
        hasBanquet
            ? "Los platillos de banquete requieren confirmación de precio y disponibilidad."
            : "Precios provisionales sujetos a confirmación.",
        pad,
        footerY + 55
    );

    ctx.fillStyle = colors.green;
    ctx.font = "italic 20px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(
        "Gracias por elegir Cotizaciones Flores  ✿",
        width / 2,
        height - 75
    );

    ctx.textAlign = "left";

    return await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
    });
}

function loadQuoteImage(src) {
    return new Promise(resolve => {
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){
    const words=String(text).split(" ");let line="";
    for(const word of words){const test=line+word+" ";if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+" ";y+=lineHeight;}else line=test;}
    if(line)ctx.fillText(line,x,y);
}
async function downloadQuoteImage(){
    if(!cart.length)return;
    const blob=await createQuoteBlob();if(!blob){alert("No se pudo generar la imagen.");return;}
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="cotizacion-flores.png";a.click();URL.revokeObjectURL(url);
}
async function shareQuote(){
    if(!cart.length)return;
    const blob=await createQuoteBlob();if(!blob){alert("No se pudo generar la imagen.");return;}
    const file=new File([blob],"cotizacion-flores.png",{type:"image/png"});
    const text=quoteText();
    if(navigator.canShare?.({files:[file]}) && navigator.share){
        try{await navigator.share({files:[file],title:"Cotización Flores",text});return;}catch(error){if(error.name==="AbortError")return;}
    }
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="cotizacion-flores.png";a.click();
    const wa=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(wa,"_blank","noopener,noreferrer");
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    alert("La imagen se descargó. Adjunta cotizacion-flores.png en el chat de WhatsApp que se abrió.");
}

renderQuote();
