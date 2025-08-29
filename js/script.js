// Global DOM helpers
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// Phone mask helper (simple, ensures +243 prefix)
function normalizePhone(value){
  if (!value) return '';
  value = value.trim();
  if (!value.startsWith('+')) {
    // assume local: prepend +243 if number starts with 0 or digits
    if (value.startsWith('0')) value = '+243' + value.slice(1);
    else value = '+243' + value;
  }
  return value.replace(/[^+0-9]/g,'');
}

function showError(id, msg){
  const el = document.getElementById('err-'+id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(id){
  const el = document.getElementById('err-'+id);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

// Registration modal wiring (unchanged)
document.addEventListener('click', (e) => {
  if (e.target.closest('.track-signup')) {
    e.preventDefault();
    openRegistrationModal();
  }
});
function openRegistrationModal(){
  // Ensure modal scaffold exists in DOM
  let regBackdrop = document.getElementById('regBackdrop');
  if (!regBackdrop) {
    regBackdrop = document.createElement('div');
    regBackdrop.id = 'regBackdrop';
    regBackdrop.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    regBackdrop.setAttribute('aria-hidden','true');

    const regModal = document.createElement('div');
    regModal.id = 'regModal';
    regModal.setAttribute('role','dialog');
    regModal.setAttribute('aria-modal','true');
    regModal.setAttribute('aria-labelledby','regModalTitle');
    regModal.className = 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden';

    regModal.innerHTML = `
      <div class="flex">
        <div class="hidden md:block w-1/2 bg-gradient-to-b from-primary to-accent p-8 text-white">
          <h3 class="text-2xl font-extrabold">Rejoignez la Master Class</h3>
          <p class="mt-4 text-sm opacity-90">Places limitées — Inscrivez-vous pour recevoir votre reçu et accès aux sessions en présentiel.</p>
        </div>
        <div class="w-full md:w-1/2 p-6">
          <div class="flex items-start justify-between">
            <h3 id="regModalTitle" class="text-xl font-semibold">S'inscrire</h3>
            <button id="regClose" class="text-gray-500 hover:text-gray-800" aria-label="Fermer">✕</button>
          </div>
          <div id="regModalContent" class="mt-4"><p class="text-sm text-gray-600">Chargement du formulaire…</p></div>
        </div>
      </div>
    `;

    regBackdrop.appendChild(regModal);
    document.body.appendChild(regBackdrop);

    // Attach close handler
    regBackdrop.addEventListener('click', (e)=>{
      if (e.target === regBackdrop) { regBackdrop.classList.add('hidden'); regBackdrop.setAttribute('aria-hidden','true'); }
    });
    const regCloseBtn = regBackdrop.querySelector('#regClose');
    if (regCloseBtn) regCloseBtn.addEventListener('click', ()=>{ regBackdrop.classList.add('hidden'); regBackdrop.setAttribute('aria-hidden','true'); });
  }

  const regModalContent = document.getElementById('regModalContent');
  // Load form into modal only once
  if (!regModalContent.dataset || !regModalContent.dataset.loaded) {
    const localForm = document.getElementById('formInscription');
    if (localForm) {
      const clone = localForm.cloneNode(true);
      clone.classList.remove('hidden');
      clone.removeAttribute('aria-hidden');
      regModalContent.innerHTML = '';
      regModalContent.appendChild(clone);
      regModalContent.dataset.loaded = '1';
    } else {
      // show loader
      regModalContent.innerHTML = '<div class="py-6 flex items-center justify-center"><svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></div>';
      fetch('Html/inscription.html').then(res=>{ if(!res.ok) throw new Error('fetch failed'); return res.text(); }).then(html=>{
        const parser = new DOMParser();
        const doc = parser.parseFromString(html,'text/html');
        const fetchedForm = doc.getElementById('formInscription');
        if (fetchedForm){
          const clone = fetchedForm.cloneNode(true);
          clone.classList.remove('hidden');
          clone.removeAttribute('aria-hidden');
          regModalContent.innerHTML = '';
          regModalContent.appendChild(clone);
        } else {
          regModalContent.innerHTML = '<p class="text-sm text-gray-600">Formulaire non disponible.</p>';
        }
        regModalContent.dataset.loaded = '1';
      }).catch(()=>{
        regModalContent.innerHTML = '<p class="text-sm text-gray-600">Formulaire non disponible.</p>';
        regModalContent.dataset.loaded = '1';
      });
    }
  }

  // Show modal
  regBackdrop.classList.remove('hidden');
  regBackdrop.setAttribute('aria-hidden','false');
}

// Custom validation and submit
function validateFormData(data){
  let ok = true;
  // name
  if (!data.name || data.name.trim().length < 2){ showError('name','Veuillez entrer votre nom complet.'); ok=false; } else hideError('name');
  // email
  if (!data.email || !/.+@.+\..+/.test(data.email)) { showError('email','E‑mail invalide.'); ok=false; } else hideError('email');
  // phone
  if (!data.phone) { showError('phone','Téléphone requis.'); ok=false; }
  else {
    const normalized = normalizePhone(data.phone);
    if (!/^\+243[0-9]{8,12}$/.test(normalized)) { showError('phone','Numéro invalide. Exemple: +243812345678'); ok=false; }
    else hideError('phone');
  }
  // category
  if (!data.category) { showError('category','Choisir une catégorie.'); ok=false; } else hideError('category');
  return ok;
}

// Submit handler
document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'formInscription'){
    e.preventDefault();
    const form = e.target;
    const fd = Object.fromEntries(new FormData(form).entries());
    // normalize phone
    fd.phone = normalizePhone(fd.phone);
    if (!validateFormData(fd)) return;
    sessionStorage.setItem('registration', JSON.stringify(fd));
    // if on paiement page, populate recap
    if (location.pathname.endsWith('paiement.html')) populatePaymentRecap();
    else window.location.href = 'paiement.html';
  }
});

// Populate recap
function populatePaymentRecap(){
  const raw = sessionStorage.getItem('registration');
  if (!raw) return;
  const data = JSON.parse(raw);
  const recap = document.getElementById('recapInfos');
  if (!recap) return;
  recap.innerHTML = `
    <div class="text-sm"><strong>Nom:</strong> ${escapeHtml(data.name || '')}</div>
    <div class="text-sm"><strong>Email:</strong> ${escapeHtml(data.email || '')}</div>
    <div class="text-sm"><strong>Téléphone:</strong> ${escapeHtml(data.phone || '')}</div>
  `;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c])); }

// Payment flow with loader + success state
document.addEventListener('DOMContentLoaded', () =>{
  if (document.getElementById('recapInfos')) populatePaymentRecap();
  const btnPay = document.getElementById('btnPay');
  if (btnPay) btnPay.addEventListener('click', handlePayment);
});

function showLoader(container){
  const loader = document.createElement('div');
  loader.className = 'loader flex items-center justify-center py-4';
  loader.innerHTML = `<svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>`;
  container.appendChild(loader);
  return loader;
}

function handlePayment(e){
  const payContainer = e.target.closest('div') || document.body;
  // show loader
  const loader = showLoader(payContainer);
  // simulate network/payment delay
  setTimeout(()=>{
    loader.remove();
    // show success panel and receipt link
    const receipt = document.getElementById('receipt');
    if (receipt){
      receipt.classList.remove('hidden');
      const raw = sessionStorage.getItem('registration');
      const data = raw ? JSON.parse(raw) : {};
      const fakeResponse = { tx_ref: 'SIM-'+Date.now(), status: 'successful', flw_ref: 'FLW_SIM_123456' };
      document.getElementById('receiptJson').textContent = JSON.stringify({ customer: data, payment: fakeResponse }, null, 2);
      // create downloadable receipt (simple text PDF alternative: create blob)
      const blob = new Blob([`Reçu de paiement\n\nNom: ${data.name}\nEmail: ${data.email}\nTéléphone: ${data.phone}\nRéférence: ${fakeResponse.tx_ref}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      // add link if not exists
      if (!document.getElementById('receiptDownload')){
        const a = document.createElement('a');
        a.id = 'receiptDownload';
        a.href = url;
        a.download = 'recu_inscription.txt';
        a.textContent = 'Télécharger le reçu';
        a.className = 'inline-block mt-3 text-sm underline';
        receipt.appendChild(a);
      }
      // clear session but keep for printing
      sessionStorage.removeItem('registration');
    }
  }, 1500);
}

// Print and New handlers
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'btnPrint') window.print();
  if (e.target && e.target.id === 'btnNew') {
    sessionStorage.removeItem('registration');
    window.location.href = 'inscription.html';
  }
});

// Exported functions for manual testing
window.populatePaymentRecap = populatePaymentRecap;

// Ensure mobile drawer works on pages that don't include the markup
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('mobileOpen');
  if (!openBtn) return;

  let drawer = document.getElementById('mobileDrawer');
  const isInHtmlFolder = location.pathname.includes('/Html/');

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobileDrawer';
    drawer.className = 'drawer';
    drawer.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'drawer-content';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const brand = document.createElement('a');
    brand.href = isInHtmlFolder ? '../index.html' : 'index.html';
    brand.className = 'flex items-center gap-3 text-white';
    const logo = document.createElement('img');
    logo.src = isInHtmlFolder ? '../assets/img/forumlogo.png' : 'assets/img/forumlogo.png';
    logo.alt = 'Logo';
    logo.className = 'w-10 h-10 rounded-full object-cover shadow';
    const span = document.createElement('span');
    span.className = 'text-lg font-extrabold';
    span.textContent = 'Digital Kivu';
    brand.appendChild(logo);
    brand.appendChild(span);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'mobileClose';
    closeBtn.className = 'text-white text-2xl';
    closeBtn.textContent = '✕';

    header.appendChild(brand);
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Clone existing nav if present
    const mainNav = document.getElementById('mainNav');
    let navEl;
    if (mainNav) {
      // Clone and normalize the nav to match index.html appearance
      navEl = mainNav.cloneNode(true);
      navEl.classList.remove('hidden');
      navEl.classList.add('flex', 'flex-col', 'mt-8', 'items-start', 'gap-3', 'px-2');

      // Normalize each link and identify the signup CTA
      const anchors = Array.from(navEl.querySelectorAll('a'));
      anchors.forEach(a => {
        // Remove any inline layout classes from desktop nav
        a.classList.remove('ml-4', 'inline-flex', 'items-center', 'gap-2');
        // Ensure block-level link with consistent sizing
        a.classList.add('block', 'w-full', 'text-left', 'mt-3', 'text-lg', 'font-medium', 'text-white', 'px-2');
      });

      // Find the signup CTA and promote it to the top of the drawer
      const signup = anchors.find(a => {
        const txt = (a.textContent || '').trim().toLowerCase();
        return txt.includes("s'inscrire") || txt.includes('s inscrire') || a.classList.contains('btn-primary-hero') || a.classList.contains('btn-gold');
      });
      if (signup) {
        // Ensure CTA styling matches index
        signup.className = 'block w-full btn-gold text-center py-3 mb-4';
        // Move to top
        navEl.removeChild(signup);
        navEl.insertBefore(signup, navEl.firstChild);
      }
    } else {
      navEl = document.createElement('nav');
      navEl.className = 'mt-8';
      const links = [
        { href: isInHtmlFolder ? '../Html/inscription.html' : 'Html/inscription.html', text: "S'inscrire" },
        { href: isInHtmlFolder ? '../Html/programme.html' : 'Html/programme.html', text: 'Programme' },
        { href: isInHtmlFolder ? '../Html/paiement.html' : 'Html/paiement.html', text: 'Paiement' },
        { href: isInHtmlFolder ? '../Html/contact.html' : 'Html/contact.html', text: 'Contact' },
        { href: isInHtmlFolder ? '../index.html#infos' : 'index.html#infos', text: 'Infos' }
      ];
      links.forEach(l => {
        const a = document.createElement('a');
        a.href = l.href;
        a.className = 'block mt-4';
        a.textContent = l.text;
        navEl.appendChild(a);
      });
    }

    content.appendChild(navEl);
    drawer.appendChild(content);
    document.body.appendChild(drawer);

    // close when clicking backdrop
    drawer.addEventListener('click', (e) => { if (e.target === drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); } });
  }

  // Wire open/close actions safely
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  });

  const closeBtnEl = document.getElementById('mobileClose');
  if (closeBtnEl) closeBtnEl.addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
}); 