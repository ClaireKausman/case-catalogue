let data = [];
const cache = {};
let loaderStartTime = 0;

function showLoader(visible) {
  document.getElementById('loadingBar').style.display = visible ? 'block' : 'none';
}

function hideLoaderAfterMinimumDelay() {
  const elapsed = performance.now() - loaderStartTime;
  const remaining = 500 - elapsed;
  if (remaining > 0) {
    setTimeout(() => showLoader(false), remaining);
  } else {
    showLoader(false);
  }
}

function observePlaceholders(data) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const div = entry.target;
      const index = parseInt(div.dataset.index, 10);
      const row = data[index];
      if (!row) return;

      div.innerHTML = generateCardHTML(row);
      obs.unobserve(div);
    });
  }, {
    rootMargin: '200px',
    threshold: 0.1
  });

  document.querySelectorAll('.productCard').forEach(div => observer.observe(div));
}

function renderCatalog(filteredData) {
  const container = document.getElementById('catalog');
  container.innerHTML = '';

  filteredData.forEach((row, index) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'productCard';
    placeholder.dataset.index = index;
    container.appendChild(placeholder);
  });

  observePlaceholders(filteredData);
}

function generateCardHTML(row) {
  const imageUrls = (row["IMAGES"] || "")
    .split("|")
    .map(url => url.trim())
    .filter(url => url.length > 0);

  const imageGalleryHtml = imageUrls.length > 0 ? `
    <div class="imagesDiv">
      ${imageUrls.map(url =>
        `<img src="${url}" alt="Item Image">`
      ).join('')}
    </div>` : "";

  return `
    <div class="identifierDiv">
      <div class="title">${row["PRODUCT_TITLE"] || "Unnamed Item"}</div>
      <div class="sku">${row["PRODUCT_SKU"] || ""}</div>
    </div>
    ${imageGalleryHtml}
    <div class="infoDiv">
      <div><strong>Color:</strong> ${row["COLOR"] || "-"}</div>
      <div><strong>Phone:</strong> ${row["PHONE"] || "-"}</div>
      <div><strong>Case:</strong> ${row["CASE"] || "-"}</div>
      <div><strong>RRP:</strong> ${row["rrp"] || "-"}</div>
    </div>
    <div class="descDiv">${row["PRODUCT_DESCRIPTION"] || ""}</div>
  `;
}

function setupSearch() {
  const searchBox = document.getElementById('searchBox');
  const searchBtn = document.getElementById('searchBtn');

  function performSearch() {
    const query = searchBox.value.trim().toLowerCase();
    const filtered = data.filter(row =>
      row["PHONE"]?.toLowerCase().includes(query)
    );
    renderCatalog(filtered);
  }

  searchBtn.addEventListener('click', performSearch);
  searchBox.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
  });
}

function setupBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupBackToTop();

  showLoader(true);
  loaderStartTime = performance.now();

  fetch('phone_model_dict.txt')
    .then(response => response.text())
    .then(text => {
      const datalist = document.getElementById("phoneModels");
      text.split('\n').forEach(model => {
        if (model.trim()) {
          const option = document.createElement("option");
          option.value = model;
          datalist.appendChild(option);
        }
      });
    });

  Papa.parse('CLASSIFY.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: results => {
      data = results.data.filter(row => Object.values(row).some(cell => cell !== ""));
      renderCatalog(data);
      hideLoaderAfterMinimumDelay();
    },
    error: err => {
      console.error("Failed to load CLASSIFY.csv:", err);
      document.getElementById('catalog').innerText = "Failed to load CLASSIFY.csv";
      hideLoaderAfterMinimumDelay();
    }
  });
});
