const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const grid = document.getElementById('grid');
const search = document.getElementById('search');
const filter = document.getElementById('filter');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const meta = document.getElementById('meta');
const closeModal = document.getElementById('closeModal');
const shortlistBtn = document.getElementById('shortlistBtn');
const copyShortlist = document.getElementById('copyShortlist');

let DATA = [];

function render(items){
  grid.innerHTML = '';
  items.forEach(d => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <span class="badge">${d.code}</span>
      <img src="${d.src}" alt="${d.title}">
      <div class="caption">
        <span class="meta-small">${d.title}</span>
        <span class="code">${d.silhouette || ''}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(d));
    grid.appendChild(card);
  });
}

function openModal(d){
  modalImg.src = d.src;
  meta.textContent = `${d.code} — ${d.title}`;
  modal.setAttribute('aria-hidden', 'false');
  shortlistBtn.onclick = () => {
    shortlist.push(d.code);
    alert('Added ' + d.code + ' to shortlist');
  };
}

closeModal.addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
modal.addEventListener('click', (e) => { if(e.target === modal) modal.setAttribute('aria-hidden','true') });

let shortlist = [];
copyShortlist.addEventListener('click', () => {
  const text = shortlist.join(', ');
  navigator.clipboard.writeText(text).then(() => alert('Shortlist copied: ' + text));
});

function applyFilters(){
  const q = (search.value || '').toLowerCase();
  const f = filter.value;
  const filtered = DATA.filter(d => {
    const okText = !q || (d.title + ' ' + (d.tags||'') + ' ' + (d.silhouette||'') ).toLowerCase().includes(q);
    const okFilter = !f || (d.silhouette === f);
    return okText && okFilter;
  });
  render(filtered);
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);

fetch('manifest.json').then(r => r.json()).then(list => {
  DATA = list;
  applyFilters();
}).catch(() => {
  DATA = [
    {code:'MB-001', title:'Crepe A-Line', src:'images/example1.jpg', silhouette:'A-Line'},
    {code:'MB-002', title:'Satin Ballgown', src:'images/example2.jpg', silhouette:'Ballgown'}
  ];
  applyFilters();
});
