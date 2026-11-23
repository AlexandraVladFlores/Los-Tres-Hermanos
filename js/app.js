
// ==========================================
// COTIZACIONES FLORES - SOLICITUDES
// ==========================================

const currentYear = document.getElementById("currentYear");
if (currentYear) currentYear.textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
        navigation.classList.toggle("open");
    });

    document.querySelectorAll(".navigation a").forEach(link => {
        link.addEventListener("click", () => {
            navigation.classList.remove("open");
        });
    });
}

// Animaciones
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(element => observer.observe(element));
} else {
    revealElements.forEach(element => element.classList.add("visible"));
}

// Navegación activa
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".navigation .nav-link");

if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === "#" + entry.target.id
                    );
                });
            }
        });
    }, { rootMargin: "-25% 0px -65% 0px" });

    sections.forEach(section => sectionObserver.observe(section));
}

// ==========================================
// PERSONAS ENCARGADAS
// ==========================================

const contacts = {
    roxana: {
        name: "Roxana Flores",
        phone: "526941155456"
    },
    roberto: {
        name: "Roberto Carlos Flores",
        phone: "526692223466"
    },
    sonia: {
        name: "Sonia Flores",
        phone: "526941195909"
    }
};

// ==========================================
// CARRITO DE SOLICITUDES
// ==========================================

const cart = [];
const quoteContainer = document.getElementById("quoteContainer");

let quoteDetails = {
    nombre: "",
    fecha: "",
    lugar: "",
    comentarios: ""
};

// ==========================================
// ASIGNAR RESPONSABLE A CADA PRODUCTO
// ==========================================

function getOwner(card) {
    if (card.closest("#eventos")) return "roxana";

    if (card.closest("#banquetes")) return "sonia";

    if (card.dataset.id === "pasteles") return "roberto";

    return "sonia";
}

// ==========================================
// QUITAR PRECIOS DEL CATÁLOGO
// ==========================================

document.querySelectorAll(".catalog-card").forEach(card => {
    const price = card.querySelector(".catalog-price");

    if (price) {
        price.textContent = "Cotización personalizada";
    }

    card.removeAttribute("data-price");
});

// ==========================================
// CONTROLES ADICIONALES
// ==========================================

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

// Renta: cantidad y días
document.querySelectorAll("#eventos .catalog-card").forEach(card => {
    addControl(card, `
        <div class="control-row">
            <div>
                <label>Cantidad</label>
                <input data-extra="cantidad" type="number" min="1" value="1">
            </div>
            <div>
                <label>Días de renta</label>
                <input data-extra="dias" type="number" min="1" value="1">
            </div>
        </div>
    `);
});

// Comidas: personas y detalles
document.querySelectorAll("#banquetes .catalog-card").forEach(card => {
    addControl(card, `
        <label>Personas o porciones aproximadas</label>
        <input data-extra="cantidad" type="number" min="1" value="1">

        <label>Detalles de tu pedido (opcional)</label>
        <textarea data-extra="notas" rows="2"
            placeholder="Ej. Para 25 personas, poco picante..."></textarea>
    `);
});

// ==========================================
// LEER OPCIONES
// ==========================================

function readOptions(card) {
    const options = {};

    card.querySelectorAll(".dessert-field").forEach(field => {
        const key = field.dataset.field;

        if (key) {
            options[key] = field.value.trim();
        }
    });

    card.querySelectorAll("[data-extra]").forEach(field => {
        options[field.dataset.extra] = field.value.trim();
    });

    return options;
}

// ==========================================
// AGREGAR PRODUCTO
// ==========================================

function addCardToQuote(card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const options = readOptions(card);

    const owner = getOwner(card);
    const isBanquet = !!card.closest("#banquetes");
    const isRental = !!card.closest("#eventos");

    const quantity = Math.max(1, Number(options.cantidad || 1));
    const days = Math.max(1, Number(options.dias || 1));

    if (
        (id === "pasteles" || id === "cheesecake") &&
        !options.sabor
    ) {
        alert("Escribe el sabor que deseas para continuar.");

        card.querySelector('[data-field="sabor"]')?.focus();
        return;
    }

    const image = card.querySelector("img")?.getAttribute("src") || "";

    cart.push({
        key: `${id}-${Date.now()}-${Math.random()}`,
        id,
        name,
        options,
        quantity,
        days,
        image,
        owner,
        isBanquet,
        isRental
    });

    renderQuote();

    const button = card.querySelector(".add-product-btn");

    if (button) {
        const old = button.textContent;

        button.textContent = "Agregado ✓";
        button.classList.add("added");

        setTimeout(() => {
            button.textContent = old;
            button.classList.remove("added");
        }, 1200);
    }
}

document.querySelectorAll(".add-product-btn").forEach(button => {
    button.addEventListener("click", () => {
        addCardToQuote(button.closest(".catalog-card"));
    });
});

// ==========================================
// RESUMEN DE OPCIONES
// ==========================================

function optionSummary(item) {
    const parts = [];

    if (item.options.presentacion) {
        parts.push(item.options.presentacion);
    }

    if (item.options.tamano) {
        parts.push("Tamaño: " + item.options.tamano);
    }

    if (item.options.sabor) {
        parts.push("Sabor: " + item.options.sabor);
    }

    if (item.isRental) {
        parts.push(`${item.quantity} pieza(s) × ${item.days} día(s)`);
    } else if (item.isBanquet) {
        parts.push(`${item.quantity} persona(s)/porción(es)`);

        if (item.options.notas) {
            parts.push(item.options.notas);
        }
    } else {
        parts.push(`Cantidad: ${item.quantity}`);
    }

    return parts.join(" · ");
}

// ==========================================
// DETALLES GENERALES DEL CLIENTE
// ==========================================

function renderClientFields() {
    return `
        <div class="quote-client-details">
            <h3>Detalles de tu solicitud</h3>

            <label>Tu nombre</label>
            <input
                type="text"
                id="clientName"
                placeholder="Escribe tu nombre"
                value="${escapeHTML(quoteDetails.nombre)}"
            >

            <label>Fecha del evento o entrega</label>
            <input
                type="date"
                id="clientDate"
                value="${escapeHTML(quoteDetails.fecha)}"
            >

            <label>Lugar o dirección (opcional)</label>
            <input
                type="text"
                id="clientPlace"
                placeholder="¿Dónde será el evento o entrega?"
                value="${escapeHTML(quoteDetails.lugar)}"
            >

            <label>Comentarios adicionales</label>
            <textarea
                id="clientComments"
                rows="3"
                placeholder="Cuéntanos algún detalle adicional..."
            >${escapeHTML(quoteDetails.comentarios)}</textarea>
        </div>
    `;
}

function saveClientFields() {
    quoteDetails.nombre =
        document.getElementById("clientName")?.value.trim() || "";

    quoteDetails.fecha =
        document.getElementById("clientDate")?.value || "";

    quoteDetails.lugar =
        document.getElementById("clientPlace")?.value.trim() || "";

    quoteDetails.comentarios =
        document.getElementById("clientComments")?.value.trim() || "";
}

// ==========================================
// MOSTRAR SOLICITUD
// ==========================================

function renderQuote() {
    if (!quoteContainer) return;

    if (!cart.length) {
        quoteContainer.className = "quote-empty reveal visible";

        quoteContainer.innerHTML = `
            <div class="quote-empty-icon">✿</div>
            <h3>Tu solicitud está esperando</h3>
            <p>
                Agrega productos desde el catálogo y aquí podrás
                revisar todo antes de enviarlo a la persona encargada.
            </p>
            <a href="#eventos" class="btn-primary">
                Explorar catálogo <span>→</span>
            </a>
        `;

        return;
    }

    const owners = ["roxana", "roberto", "sonia"];

    const groups = owners
        .map(owner => ({
            owner,
            items: cart.filter(item => item.owner === owner)
        }))
        .filter(group => group.items.length);

    quoteContainer.className = "quote-panel reveal visible";

    quoteContainer.innerHTML = `
        <div class="quote-top">
            <div>
                <h3>Mi solicitud de cotización</h3>
                <span class="quote-count">
                    ${cart.length} selección(es)
                </span>
            </div>
            <span class="quote-empty-icon">✿</span>
        </div>

        <div class="quote-list">
            ${groups.map(group => `
                <div class="quote-owner-group">
                    <h4>${contacts[group.owner].name}</h4>

                    ${group.items.map(item => `
                        <article class="quote-item">
                            <img src="${escapeHTML(item.image)}" alt="">

                            <div>
                                <h4>${escapeHTML(item.name)}</h4>
                                <p>${escapeHTML(optionSummary(item))}</p>

                                <button
                                    class="remove-quote-item"
                                    data-remove="${item.key}"
                                    type="button">
                                    Quitar
                                </button>
                            </div>

                            <div class="quote-item-price">
                                Por cotizar
                            </div>
                        </article>
                    `).join("")}
                </div>
            `).join("")}
        </div>

        <div class="quote-note">
            Esta es una solicitud de cotización.
            La persona encargada revisará tus selecciones
            y te confirmará el precio y la disponibilidad por WhatsApp.
        </div>

        ${renderClientFields()}

        <div class="quote-actions">
            ${groups.map(group => `
                <button
                    type="button"
                    class="send-owner-btn"
                    data-send-owner="${group.owner}">
                    Enviar a ${contacts[group.owner].name} ✧
                </button>
            `).join("")}
        </div>
    `;

    quoteContainer.querySelectorAll("[data-remove]").forEach(button => {
        button.addEventListener("click", () => {
            saveClientFields();

            const index = cart.findIndex(
                item => item.key === button.dataset.remove
            );

            if (index >= 0) {
                cart.splice(index, 1);
            }

            renderQuote();
        });
    });

    ["clientName", "clientDate", "clientPlace", "clientComments"]
        .forEach(id => {
            document.getElementById(id)?.addEventListener("input", saveClientFields);
        });

    quoteContainer.querySelectorAll("[data-send-owner]").forEach(button => {
        button.addEventListener("click", () => {
            sendOwnerRequest(button.dataset.sendOwner);
        });
    });
}

// ==========================================
// ENVIAR SOLICITUD A WHATSAPP
// ==========================================

function sendOwnerRequest(owner) {
    saveClientFields();

    if (!quoteDetails.nombre) {
        alert("Escribe tu nombre antes de enviar la solicitud.");
        document.getElementById("clientName")?.focus();
        return;
    }

    const items = cart.filter(item => item.owner === owner);

    if (!items.length) return;

    const contact = contacts[owner];

    const lines = items.map((item, index) => {
        return `${index + 1}. ${item.name}\n   ${optionSummary(item)}`;
    });

    let message = `¡Hola, ${contact.name}! Me gustaría solicitar una cotización.\n\n`;

    message += `Nombre: ${quoteDetails.nombre}\n`;

    if (quoteDetails.fecha) {
        message += `Fecha: ${quoteDetails.fecha}\n`;
    }

    if (quoteDetails.lugar) {
        message += `Lugar: ${quoteDetails.lugar}\n`;
    }

    message += `\nPRODUCTOS SOLICITADOS:\n\n`;
    message += lines.join("\n\n");

    if (quoteDetails.comentarios) {
        message += `\n\nComentarios adicionales:\n${quoteDetails.comentarios}`;
    }

    message += "\n\nQuedo pendiente de tu cotización y disponibilidad. ¡Muchas gracias!";

    const url = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

// ==========================================
// SEGURIDAD DE TEXTO HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));
}

// ==========================================
// INICIAR
// ==========================================

renderQuote();
