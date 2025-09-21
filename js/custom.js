let games = [];
let filteredGames = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const gameList = document.getElementById("gameList");
const checkoutList = document.getElementById("checkoutList");
const totalPriceEl = document.getElementById("totalPrice");
const totalSizeEl = document.getElementById("totalSize");
const paginationEl = document.getElementById("pagination");
const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");
const sortSelect = document.getElementById("sortSelect");

let currentPage = 1;
let itemsPerPage = parseInt(itemsPerPageSelect.value);

// Load CSV
fetch("data/games.csv")
  .then((response) => response.text())
  .then((csvText) => {
    const results = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
    });
    games = results.data.filter((g) => g.name && g.size);
    filteredGames = [...games];
    renderGames();
    renderPagination();
    renderCheckout(); // load cart dari localstorage
  });

// Render Games
function renderGames() {
  gameList.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredGames.slice(start, end);
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

  // update jumlah game
  const gameCountEl = document.getElementById("gameCount");
  gameCountEl.textContent = `Menampilkan ${pageItems.length} dari ${filteredGames.length} game — Halaman ${currentPage}/${totalPages}`;

  pageItems.forEach((game) => {
    const price = getGamePrice(game);

    const inCart = cart.find((item) => item.name === game.name);

    const card = document.createElement("div");
    card.className =
      "bg-gray-50 rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer flex flex-col justify-between";
    card.onclick = () => toggleCart(game.name);

    card.innerHTML = `
      <div>
        <h3 class="text-lg font-semibold">${game.name}</h3>
        <p class="text-sm text-gray-600">Size: ${formatSize(game.size)} GB</p>
        <p class="text-sm font-medium">
          Rp ${formatPrice(price)}
          ${
            game.discount && game.discount > 0
              ? `<span class="line-through text-gray-400 text-xs ml-2">
                  Rp ${formatPrice(Math.round(game.size * 2000))}
                </span>`
              : ""
          }
        </p>
      </div>
      <button onclick="event.stopPropagation(); toggleCart('${game.name}')" 
        class="mt-3 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium
          transition-all duration-300 ease-in-out transform active:scale-95
          ${
            inCart
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }">
        <i class="fa ${
          inCart ? "fa-times-circle" : "fa-plus-circle"
        } transition-transform duration-300 ${
      inCart ? "rotate-90 scale-110" : "rotate-0 scale-100"
    }"></i> 
        <span class="transition-all duration-300 ${
          inCart ? "translate-x-1 opacity-90" : "translate-x-0 opacity-100"
        }">${inCart ? "Batalkan" : "Pilih"}</span>
      </button>
    `;

    gameList.appendChild(card);
  });
}

function toggleCart(gameName) {
  const game = games.find((g) => g.name === gameName);
  if (!game) return;

  const inCart = cart.find((item) => item.name === game.name);

  if (inCart) {
    cart = cart.filter((item) => item.name !== game.name);
  } else {
    cart.push(game);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderGames();
  renderCheckout();
}

// Render Pagination
function renderPagination() {
  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  if (totalPages <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    paginationEl.appendChild(makePageButton(1));
    if (start > 2) paginationEl.appendChild(makeEllipsis());
  }

  for (let i = start; i <= end; i++) {
    paginationEl.appendChild(makePageButton(i, i === currentPage));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) paginationEl.appendChild(makeEllipsis());
    paginationEl.appendChild(makePageButton(totalPages));
  }
}

function makePageButton(page, active = false) {
  const btn = document.createElement("button");
  btn.textContent = page;
  btn.className = `px-3 py-1 rounded ${
    active ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
  }`;
  btn.onclick = () => {
    currentPage = page;
    renderGames();
    renderPagination();
  };
  return btn;
}

function makeEllipsis() {
  const span = document.createElement("span");
  span.textContent = "...";
  span.className = "px-2 text-gray-500";
  return span;
}

// Realtime Search
function searchGames() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(query)
  );
  sortGames();
  currentPage = 1;
  renderGames();
  renderPagination();
}

// Ubah jumlah item per halaman
function changeItemsPerPage() {
  itemsPerPage = parseInt(itemsPerPageSelect.value);
  currentPage = 1;
  renderGames();
  renderPagination();
}

// Sorting
function sortGames() {
  const value = sortSelect.value;
  filteredGames.sort((a, b) => {
    const priceA = a.size * 2000;
    const priceB = b.size * 2000;

    switch (value) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "size-asc":
        return a.size - b.size;
      case "size-desc":
        return b.size - a.size;
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
    }
  });
  currentPage = 1;
  renderGames();
  renderPagination();
}

// Hapus dari Keranjang
function removeFromCart(name) {
  cart = cart.filter((item) => item.name !== name);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCheckout();
  renderGames();
}

// Render Checkout
function renderCheckout() {
  checkoutList.innerHTML = "";
  let total = 0;
  let totalSize = 0;
  cart.forEach((game) => {
    const price = getGamePrice(game);
    total += price;
    totalSize += game.size;
    const item = document.createElement("div");
    item.className =
      "flex justify-between items-center bg-gray-100 p-2 rounded-lg";
    item.innerHTML = `
          <div>
            <p class="font-medium">${game.name}</p>
            <p class="text-xs text-gray-600">
              ${formatSize(game.size)} GB - Rp ${formatPrice(price)}
            </p>
          </div>
          <button onclick="removeFromCart('${game.name}')" 
            class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600">
            <i class="fa fa-times"></i>
          </button>
        `;
    checkoutList.appendChild(item);
  });

  totalPriceEl.textContent = "Rp " + formatPrice(total);
  totalSizeEl.textContent = formatSize(totalSize) + " GB";
}

// Kirim ke WhatsApp
function sendToWhatsApp() {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  let message = "*List Beli Game*\n\n";
  cart.forEach((game, i) => {
    const price = getGamePrice(game);
    message += `${i + 1}. *${game.name}*\n${formatSize(
      game.size
    )} GB - Rp ${formatPrice(price)}\n\n`;
  });

  let totalSize = cart.reduce((sum, g) => sum + g.size, 0);
  let totalPrice = cart.reduce((sum, g) => sum + getGamePrice(g), 0);

  message += "────────────────────\n";
  message += `Total Size : *${formatSize(totalSize)} GB*\n`;
  message += `Total Bayar: *Rp ${formatPrice(totalPrice)}*`;

  const phone = "6283152898011"; // nomor WA tujuan
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function getGamePrice(game) {
  const basePrice =
    Math.round(game.size) * 2000 > 0 ? Math.round(game.size) * 2000 : 1000;

  if (game.discount && game.discount > 0) {
    return Math.round(basePrice * (1 - game.discount));
  }
  return basePrice;
}

// Format harga (Rp dengan titik ribuan)
function formatPrice(value) {
  return value.toLocaleString("id-ID"); // otomatis Rp 120.000
}

// Format ukuran GB (pakai koma sebagai desimal)
function formatSize(value) {
  return value.toFixed(2).replace(".", ","); // 1,25
}
