const AMOUNT_USD = 25;

// Gestion du formulaire d'inscription
const form = document.getElementById('formInscription');
const recap = document.getElementById('recapInfos');
const btnReset = document.getElementById('btnReset');

function getFormData() {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

// Utilisation de variables JS au lieu de localStorage
let registrationData = {};

function saveRegistration(data) {
  registrationData = data;
  try {
    localStorage.setItem('dk_registration', JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }
}

function loadRegistration() {
  if (Object.keys(registrationData || {}).length) return registrationData;
  try {
    const s = localStorage.getItem('dk_registration');
    if (s) {
      registrationData = JSON.parse(s);
      return registrationData;
    }
  } catch (e) {
    console.warn('localStorage load failed', e);
  }
  return registrationData || {};
}

function renderRecap() {
  const d = loadRegistration();
  if (!d.name) { 
    recap.innerHTML = '<div class="card"><p class="text-sm opacity-70">Aucune inscription trouvée. Veuillez remplir et enregistrer le formulaire ci‑dessus.</p></div>';
    return; 
  }
  recap.innerHTML = `
    <div class="card">
      <div class="grid grid-2">
        <div><strong>Nom:</strong> ${d.name}</div>
        <div><strong>Téléphone:</strong> ${d.phone}</div>
        <div><strong>Email:</strong> ${d.email}</div>
        <div><strong>Organisation:</strong> ${d.org || '—'}</div>
        <div><strong>Catégorie:</strong> ${d.category || '—'}</div>
        <div><strong>Ville:</strong> ${d.city || '—'}</div>
      </div>
      <p class="text-xs opacity-70 mt-3">Ces informations seront associées à votre paiement.</p>
    </div>`;
}

// Animation d'apparition pour les éléments
function animateOnScroll() {
  const elements = document.querySelectorAll('.fade-in, .slide-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  });
  
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });
}

// Gestion du formulaire
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  
  const data = getFormData();
  if (!data.terms) { 
    alert('Veuillez accepter les conditions.'); 
    return; 
  }
  
  const phoneInput = form.querySelector('[name="phone"]');
  if (!isValidPhone(data.phone || '')) {
    showFieldError(phoneInput, "Numéro invalide. Utilisez +243..., 243... ou 0xxxxxxxx.");
    phoneInput.focus();
    return;
  } else {
    clearFieldError(phoneInput);
  }
  
  // Animation de succès
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="loading"></span> Enregistrement...';
  submitBtn.disabled = true;
  
  setTimeout(() => {
    saveRegistration(data);
    renderRecap();
    submitBtn.textContent = '✓ Enregistré';
    submitBtn.style.background = 'var(--secondary)';
    
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.background = 'var(--primary)';
      window.location.hash = '#paiement';
    }, 1500);
  }, 1000);
});

btnReset.addEventListener('click', () => {
  form.reset();
  registrationData = {};
  renderRecap();
});

// Paiement Flutterwave
const btnPay = document.getElementById('btnPay');
const receipt = document.getElementById('receipt');
const receiptJson = document.getElementById('receiptJson');
const btnPrint = document.getElementById('btnPrint');
const btnNew = document.getElementById('btnNew');

let paymentData = {};

function makePayment() {
  const reg = loadRegistration();
  if (!reg.name || !reg.email || !reg.phone) {
    alert('Veuillez d\'abord compléter et enregistrer le formulaire.');
    window.location.hash = '#inscription';
    return;
  }

  // Animation du bouton de paiement
  const originalText = btnPay.textContent;
  btnPay.innerHTML = '<span class="loading"></span> Ouverture...';
  btnPay.disabled = true;

  // Clé publique Flutterwave (remplacer par votre vraie clé)
  const PUBLIC_KEY = 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X';

  FlutterwaveCheckout({
    public_key: PUBLIC_KEY,
    tx_ref: 'FORUM-' + Date.now(),
    amount: AMOUNT_USD,
    currency: 'USD',
    country: 'CD',
    payment_options: 'card, mpesa, mobilemoneyfrancophoneafrica, mobilemoneyrwanda, mobilemoneyuganda, mobilemoneyzambia, banktransfer',
    customer: {
      email: reg.email,
      phonenumber: reg.phone,
      name: reg.name,
    },
    customizations: {
      title: 'Forum Scientifique Digital Kivu',
      description: "Frais d'inscription (17–19 octobre 2025)",
      logo: 'https://dummyimage.com/96x96/4338ca/ffffff.png&text=FK',
    },
    callback: function (data) {
      console.log('Callback Flutterwave:', data);
      paymentData = data;
      
      // Animation d'apparition du reçu
      receipt.classList.remove('hidden');
      receipt.style.opacity = '0';
      receipt.style.transform = 'translateY(20px)';
      receipt.style.transition = 'all 0.6s ease-out';
      
      setTimeout(() => {
        receipt.style.opacity = '1';
        receipt.style.transform = 'translateY(0)';
      }, 100);
      
      receiptJson.textContent = JSON.stringify(data, null, 2);
      
      // Scroll vers le reçu
      setTimeout(() => {
        receipt.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    },
    onclose: function() {
      console.log('Fenêtre de paiement fermée');
      btnPay.textContent = originalText;
      btnPay.disabled = false;
    }
  });
}

// Navigation fluide
function smoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Menu mobile
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu');
  const nav = document.querySelector('.nav');
  
  mobileMenuBtn.addEventListener('click', () => {
    if (nav.style.display === 'flex') {
      nav.style.display = 'none';
    } else {
      nav.style.display = 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '100%';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.background = 'var(--primary)';
      nav.style.padding = '1rem';
      nav.style.boxShadow = '0 4px 12px var(--shadow-lg)';
    }
  });
}

// Event listeners
btnPay.addEventListener('click', makePayment);

btnPrint.addEventListener('click', () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Reçu - Forum Digital Kivu</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .receipt { border: 2px solid #10b981; padding: 20px; border-radius: 10px; }
          pre { background: #f8fafc; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Forum Scientifique Digital Kivu</h1>
          <p>Reçu de paiement</p>
        </div>
        <div class="receipt">
          <pre>${receiptJson.textContent}</pre>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
});

btnNew.addEventListener('click', () => { 
  registrationData = {};
  paymentData = {};
  form.reset();
  receipt.classList.add('hidden');
  renderRecap();
  window.location.hash = '#inscription';
});

// Validation helpers
function isValidPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return false;
  // Accept +243... or 243... with 12 digits (243 + 9)
  if (digits.startsWith('243') && digits.length === 12) return true;
  // Accept local 0xxxxxxxxx (10 digits)
  if (digits.startsWith('0') && digits.length === 10) return true;
  // Fallback: accept any digit string of reasonable length
  return digits.length >= 9 && digits.length <= 15;
}

function showFieldError(input, message) {
  if (!input) return;
  clearFieldError(input);
  const errId = 'err-' + (input.name || input.id || '');
  const errEl = document.getElementById(errId);
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove('hidden');
    errEl.setAttribute('role', 'alert');
  } else {
    const err = document.createElement('div');
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;
    // Place error message after the input (inside the form-group)
    if (input.parentNode) input.parentNode.appendChild(err);
  }
  input.setAttribute('aria-invalid', 'true');
  input.style.borderColor = '#ef4444';
}

function clearFieldError(input) {
  if (!input) return;
  const errId = 'err-' + (input.name || input.id || '');
  const errEl = document.getElementById(errId);
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.add('hidden');
    errEl.classList.remove('text-green-600');
    errEl.classList.add('text-red-500');
    errEl.removeAttribute('role');
  }
  if (input.parentNode) {
    const existing = input.parentNode.querySelector('.field-error, .field-success');
    if (existing) existing.remove();
  }
  input.removeAttribute('aria-invalid');
  input.style.borderColor = '';
}

function showFieldSuccess(input, message) {
  if (!input) return;
  const errId = 'err-' + (input.name || input.id || '');
  const errEl = document.getElementById(errId);
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove('hidden');
    errEl.classList.remove('text-red-500');
    errEl.classList.add('text-green-600');
    errEl.setAttribute('role', 'status');
  } else {
    const msg = document.createElement('div');
    msg.className = 'field-success text-green-600 text-xs mt-1';
    msg.textContent = message;
    if (input.parentNode) input.parentNode.appendChild(msg);
  }
  input.style.borderColor = '#16a34a';
  input.removeAttribute('aria-invalid');
}

function initFormValidation() {
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      // Required fields
      if (input.required && input.value.trim() === '') {
        showFieldError(input, 'Ce champ est requis.');
        return;
      }

      if (input.name === 'phone') {
        if (isValidPhone(input.value)) {
          showFieldSuccess(input, 'Valide ✓');
        } else if (input.value) {
          showFieldError(input, 'Numéro invalide. Formats acceptés: +243..., 243... ou 0xxxxxxxx.');
        } else {
          clearFieldError(input);
        }
        return;
      }

      if (input.name === 'email') {
        if (input.value && !input.validity.valid) {
          showFieldError(input, 'Adresse e-mail invalide.');
        } else {
          showFieldSuccess(input, 'Valide ✓');
        }
        return;
      }

      if (input.validity.valid) {
        showFieldSuccess(input, 'Valide ✓');
      } else if (input.value) {
        showFieldError(input, 'Valeur invalide.');
      } else {
        clearFieldError(input);
      }
    });
    
    input.addEventListener('input', () => {
      if (input.name === 'phone') {
        if (isValidPhone(input.value)) {
          showFieldSuccess(input, 'Valide ✓');
        } else if (input.value) {
          showFieldError(input, 'Numéro invalide. Formats acceptés: +243..., 243... ou 0xxxxxxxx.');
        } else {
          clearFieldError(input);
        }
        return;
      }

      if (input.name === 'email') {
        if (input.value && !input.validity.valid) {
          showFieldError(input, 'Adresse e-mail invalide.');
        } else {
          if (input.value) showFieldSuccess(input, 'Valide ✓'); else clearFieldError(input);
        }
        return;
      }

      if (input.required) {
        if (input.value.trim() === '') {
          showFieldError(input, 'Ce champ est requis.');
        } else {
          showFieldSuccess(input, 'Valide ✓');
        }
      } else {
        if (input.validity.valid) {
          showFieldSuccess(input, 'Valide ✓');
        }
      }
    });
  });
}

// Indicateur de progression pour le formulaire
function updateProgress() {
  const requiredInputs = form.querySelectorAll('input[required], select[required]');
  const filledInputs = Array.from(requiredInputs).filter(input => input.value.trim() !== '');
  const progress = (filledInputs.length / requiredInputs.length) * 100;
  
  let progressBar = document.getElementById('progressBar');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'progressBar';
    progressBar.style.cssText = `
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin-bottom: 1rem;
      overflow: hidden;
    `;
    progressBar.innerHTML = '<div style="height: 100%; background: var(--primary); width: 0%; transition: width 0.3s ease;"></div>';
    form.insertBefore(progressBar, form.firstChild);
  }
  
  progressBar.querySelector('div').style.width = progress + '%';
}

// Event listeners pour la progression
function initProgressTracking() {
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('input', updateProgress);
    input.addEventListener('change', updateProgress);
  });
}

// Notifications toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--secondary)' : type === 'error' ? '#ef4444' : 'var(--primary)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 12px var(--shadow-lg);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Also notify screen readers via aria-live region if present
  const live = document.getElementById('toastContainer');
  if (live) {
    live.textContent = message;
    // Clear after delay to avoid repeated announcements
    setTimeout(() => { live.textContent = ''; }, 3500);
  }
  
  setTimeout(() => toast.style.transform = 'translateX(0)', 100);
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Modal elements
const modalBackdrop = document.getElementById('modalBackdrop');
const modal = document.getElementById('modal');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const modalContent = document.getElementById('modalContent');

let lastFocusedElement = null;

function openModal(contentHTML = '') {
  if (!modalBackdrop) return;
  lastFocusedElement = document.activeElement;
  modalContent.innerHTML = contentHTML;
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.removeAttribute('aria-hidden');
  // trap focus
  trapFocus(modal);
}

function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  releaseFocus();
  if (lastFocusedElement) lastFocusedElement.focus();
}

// Focus trap (simple implementation)
let focusableElements = [];
let firstFocusable = null;
let lastFocusable = null;

function trapFocus(container) {
  focusableElements = Array.from(container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.hasAttribute('disabled'));
  if (focusableElements.length === 0) return;
  firstFocusable = focusableElements[0];
  lastFocusable = focusableElements[focusableElements.length - 1];
  firstFocusable.focus();

  document.addEventListener('keydown', handleKeydown);
}

function releaseFocus() {
  document.removeEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    if (focusableElements.length === 0) return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}

// Hook modal buttons
if (modalCancel) modalCancel.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Integrate modal in payment flow: open confirm modal instead of direct makePayment
btnPay.addEventListener('click', (e) => {
  e.preventDefault();
  const reg = loadRegistration();
  if (!reg.name || !reg.email || !reg.phone) {
    showToast("Veuillez d'abord compléter et enregistrer le formulaire.");
    window.location.hash = '#inscription';
    return;
  }
  const content = `
    <div>
      <p class="text-sm text-gray-700">Nom: <strong>${reg.name}</strong></p>
      <p class="text-sm text-gray-700">Téléphone: <strong>${reg.phone}</strong></p>
      <p class="text-sm text-gray-700">E-mail: <strong>${reg.email}</strong></p>
      <p class="text-sm text-gray-700 mt-2">Montant: <strong>${AMOUNT_USD} USD</strong></p>
    </div>`;
  openModal(content);
});

if (modalConfirm) modalConfirm.addEventListener('click', () => {
  // Close modal UI and start payment; we keep it open to show processing/result if desired
  closeModal();
  makePayment();
});

function showPaymentResult(success, data) {
  const content = success ? `
    <div>
      <p class="text-green-600 font-semibold">Paiement réussi ✅</p>
      <pre class="mt-2 bg-gray-50 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
    </div>` : `
    <div>
      <p class="text-red-600 font-semibold">Paiement échoué ❌</p>
      <pre class="mt-2 bg-gray-50 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
    </div>`;

  openModal(content);
}

// Modify makePayment to call showPaymentResult from the Flutterwave callback
const _originalMakePayment = makePayment;
makePayment = function() {
  const reg = loadRegistration();
  if (!reg.name || !reg.email || !reg.phone) {
    alert('Veuillez d\'abord compléter et enregistrer le formulaire.');
    window.location.hash = '#inscription';
    return;
  }

  const originalText = btnPay.textContent;
  btnPay.innerHTML = '<span class="loading"></span> Ouverture...';
  btnPay.disabled = true;

  const PUBLIC_KEY = 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X';

  FlutterwaveCheckout({
    public_key: PUBLIC_KEY,
    tx_ref: 'FORUM-' + Date.now(),
    amount: AMOUNT_USD,
    currency: 'USD',
    country: 'CD',
    payment_options: 'card, mpesa, mobilemoneyfrancophoneafrica, mobilemoneyrwanda, mobilemoneyuganda, mobilemoneyzambia, banktransfer',
    customer: {
      email: reg.email,
      phonenumber: reg.phone,
      name: reg.name,
    },
    customizations: {
      title: 'Forum Scientifique Digital Kivu',
      description: "Frais d'inscription (17–19 octobre 2025)",
      logo: 'https://dummyimage.com/96x96/4338ca/ffffff.png&text=FK',
    },
    callback: function (data) {
      console.log('Callback Flutterwave:', data);
      paymentData = data;
      btnPay.textContent = originalText;
      btnPay.disabled = false;
      showPaymentResult(true, data);

      // Existing receipt rendering
      receipt.classList.remove('hidden');
      receipt.style.opacity = '0';
      receipt.style.transform = 'translateY(20px)';
      receipt.style.transition = 'all 0.6s ease-out';
      setTimeout(() => {
        receipt.style.opacity = '1';
        receipt.style.transform = 'translateY(0)';
      }, 100);
      receiptJson.textContent = JSON.stringify(data, null, 2);
      setTimeout(() => { receipt.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
    },
    onclose: function() {
      console.log('Fenêtre de paiement fermée');
      btnPay.textContent = originalText;
      btnPay.disabled = false;
      showPaymentResult(false, { message: 'Paiement annulé par l\'utilisateur' });
    }
  });
};

// Analytics helper
function trackEvent(action, label) {
  try {
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push({ event: 'custom_event', action: action, label: label });
    } else if (window.gtag) {
      window.gtag('event', action, { 'event_label': label });
    } else {
      console.log('TRACK', action, label);
    }
  } catch (e) {
    console.warn('Analytics track failed', e);
  }
}

// Attach signup trackers
document.addEventListener('DOMContentLoaded', () => {
  const signupLinks = document.querySelectorAll('.track-signup');
  signupLinks.forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('signup_click', window.location.pathname + '#' + (link.getAttribute('href') || 'inscription'));
    });
  });

  // TDR download tracking
  const tdrLink = document.querySelector('a[href$="TDR_FORUM_SCIENTIFIQUE.pdf"]');
  if (tdrLink) {
    tdrLink.addEventListener('click', () => trackEvent('download_tdr', 'TDR_FORUM_SCIENTIFIQUE.pdf'));
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Restaurer données enregistrées depuis localStorage si présentes
  const saved = loadRegistration();
  if (saved && saved.name) {
    Object.entries(saved).forEach(([key, val]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = val;
    });
  }

  renderRecap();
  animateOnScroll();
  smoothScroll();
  initMobileMenu();
  initFormValidation();
  initProgressTracking();
  updateProgress();
  
  // Message de bienvenue
  setTimeout(() => {
    showToast('Bienvenue au Forum Digital Kivu! 🚀', 'success');
  }, 1000);
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
  console.error('Erreur:', e.error);
  showToast('Une erreur est survenue. Veuillez réessayer.', 'error');
}); 

// Simple registration modal handlers (re-added)
document.addEventListener('DOMContentLoaded', () => {
  const regBackdrop = document.getElementById('regBackdrop');
  const regModal = document.getElementById('regModal');
  const regModalContent = document.getElementById('regModalContent');
  const regClose = document.getElementById('regClose');

  function openRegModal(prefill = {}) {
    if (!regBackdrop || !regModalContent) return;
    // Inject a simple form (same fields as inline)
    regModalContent.innerHTML = `
      <form id="modalForm" class="grid gap-4">
        <label class="text-sm font-medium">Nom complet *</label>
        <input name="name" class="border p-2 rounded" value="${prefill.name || ''}" required />
        <label class="text-sm font-medium">Téléphone *</label>
        <input name="phone" class="border p-2 rounded" value="${prefill.phone || ''}" required />
        <label class="text-sm font-medium">E-mail *</label>
        <input name="email" type="email" class="border p-2 rounded" value="${prefill.email || ''}" required />
        <label class="text-sm font-medium">Organisation</label>
        <input name="org" class="border p-2 rounded" value="${prefill.org || ''}" />
        <label class="text-sm font-medium">Catégorie *</label>
        <select name="category" class="border p-2 rounded" required>
          <option value="">-- Choisir --</option>
          <option ${prefill.category === 'Étudiant' ? 'selected' : ''}>Étudiant</option>
          <option ${prefill.category === 'Entrepreneur' ? 'selected' : ''}>Entrepreneur</option>
          <option ${prefill.category === 'Organisation/Association' ? 'selected' : ''}>Organisation/Association</option>
          <option ${prefill.category === 'Influenceur' ? 'selected' : ''}>Influenceur</option>
        </select>
        <label class="text-sm font-medium">Ville</label>
        <input name="city" class="border p-2 rounded" value="${prefill.city || ''}" />
        <div class="flex items-center gap-2">
          <input type="checkbox" name="terms" id="modalTerms" required />
          <label for="modalTerms" class="text-sm">J'accepte les conditions & la politique de confidentialité.</label>
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <button type="button" id="modalReset" class="px-4 py-2 border rounded">Réinitialiser</button>
          <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Enregistrer</button>
        </div>
      </form>
    `;

    regBackdrop.classList.remove('hidden');
    regBackdrop.removeAttribute('aria-hidden');

    // attach handlers for this simple form
    const modalForm = document.getElementById('modalForm');
    const modalReset = document.getElementById('modalReset');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(modalForm);
        const data = Object.fromEntries(fd.entries());
        try { localStorage.setItem('dk_registration', JSON.stringify(data)); } catch (err) { console.warn(err); }
        showToast('Inscription enregistrée', 'success');
        regBackdrop.classList.add('hidden');
        regBackdrop.setAttribute('aria-hidden', 'true');
        renderRecap();
        window.location.hash = '#paiement';
      });
    }
    if (modalReset) modalReset.addEventListener('click', () => modalForm.reset());
  }

  function closeRegModal() {
    if (!regBackdrop) return;
    regBackdrop.classList.add('hidden');
    regBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (regClose) regClose.addEventListener('click', closeRegModal);
  if (regBackdrop) regBackdrop.addEventListener('click', (e) => { if (e.target === regBackdrop) closeRegModal(); });

  // Wire track-signup triggers
  const signupTriggers = document.querySelectorAll('.track-signup');
  signupTriggers.forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    openRegModal({ name: '', phone: '', email: '' });
  }));
});

// Delegated handler to open registration modal from any .track-signup click
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest && e.target.closest('.track-signup');
    if (!trigger) return;
    e.preventDefault();
    console.log('track-signup clicked', trigger);
    const regBackdrop = document.getElementById('regBackdrop');
    const regModalContent = document.getElementById('regModalContent');
    if (!regBackdrop || !regModalContent) {
      console.warn('Registration modal elements missing');
      alert("Le module d'inscription n'est pas disponible. Veuillez contacter l'administrateur.");
      return;
    }

    // inject a simple form (same fields)
    regModalContent.innerHTML = `
      <form id="modalForm" class="grid gap-4">
        <label class="text-sm font-medium">Nom complet *</label>
        <input name="name" class="border p-2 rounded" value="" required />
        <label class="text-sm font-medium">Téléphone *</label>
        <input name="phone" class="border p-2 rounded" value="" required />
        <label class="text-sm font-medium">E-mail *</label>
        <input name="email" type="email" class="border p-2 rounded" value="" required />
        <label class="text-sm font-medium">Organisation</label>
        <input name="org" class="border p-2 rounded" value="" />
        <label class="text-sm font-medium">Catégorie *</label>
        <select name="category" class="border p-2 rounded" required>
          <option value="">-- Choisir --</option>
          <option>Étudiant</option>
          <option>Entrepreneur</option>
          <option>Organisation/Association</option>
          <option>Influenceur</option>
        </select>
        <label class="text-sm font-medium">Ville</label>
        <input name="city" class="border p-2 rounded" value="" />
        <div class="flex items-center gap-2">
          <input type="checkbox" name="terms" id="modalTerms" required />
          <label for="modalTerms" class="text-sm">J'accepte les conditions & la politique de confidentialité.</label>
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <button type="button" id="modalReset" class="px-4 py-2 border rounded">Réinitialiser</button>
          <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Enregistrer</button>
        </div>
      </form>
    `;

    regBackdrop.classList.remove('hidden');
    regBackdrop.removeAttribute('aria-hidden');

    // attach handlers
    const modalForm = document.getElementById('modalForm');
    const modalReset = document.getElementById('modalReset');
    if (modalForm) {
      modalForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(modalForm);
        const data = Object.fromEntries(fd.entries());
        try { localStorage.setItem('dk_registration', JSON.stringify(data)); } catch (err) { console.warn(err); }
        showToast('Inscription enregistrée', 'success');
        regBackdrop.classList.add('hidden');
        regBackdrop.setAttribute('aria-hidden', 'true');
        renderRecap();
        window.location.hash = '#paiement';
      });
    }
    if (modalReset) modalReset.addEventListener('click', () => modalForm.reset());
  });
});

// Registration modal logic re-added (minimal) 

// Fallback direct modal helper + diagnostics
function showRegModalSimple(prefill = {}) {
  const regBackdrop = document.getElementById('regBackdrop');
  const regModalContent = document.getElementById('regModalContent');
  if (!regBackdrop || !regModalContent) {
    console.warn('showRegModalSimple: modal elements missing');
    return false;
  }

  regModalContent.innerHTML = `
    <form id="modalForm" class="grid gap-4">
      <label class="text-sm font-medium">Nom complet *</label>
      <input name="name" class="border p-2 rounded" value="${prefill.name || ''}" required />
      <label class="text-sm font-medium">Téléphone *</label>
      <input name="phone" class="border p-2 rounded" value="${prefill.phone || ''}" required />
      <label class="text-sm font-medium">E-mail *</label>
      <input name="email" type="email" class="border p-2 rounded" value="${prefill.email || ''}" required />
      <label class="text-sm font-medium">Organisation</label>
      <input name="org" class="border p-2 rounded" value="${prefill.org || ''}" />
      <label class="text-sm font-medium">Catégorie *</label>
      <select name="category" class="border p-2 rounded" required>
        <option value="">-- Choisir --</option>
        <option ${prefill.category === 'Étudiant' ? 'selected' : ''}>Étudiant</option>
        <option ${prefill.category === 'Entrepreneur' ? 'selected' : ''}>Entrepreneur</option>
        <option ${prefill.category === 'Organisation/Association' ? 'selected' : ''}>Organisation/Association</option>
        <option ${prefill.category === 'Influenceur' ? 'selected' : ''}>Influenceur</option>
      </select>
      <label class="text-sm font-medium">Ville</label>
      <input name="city" class="border p-2 rounded" value="${prefill.city || ''}" />
      <div class="flex items-center gap-2">
        <input type="checkbox" name="terms" id="modalTerms" required />
        <label for="modalTerms" class="text-sm">J'accepte les conditions & la politique de confidentialité.</label>
      </div>
      <div class="flex justify-end gap-3 mt-4">
        <button type="button" id="modalReset" class="px-4 py-2 border rounded">Réinitialiser</button>
        <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Enregistrer</button>
      </div>
    </form>
  `;

  regBackdrop.classList.remove('hidden');
  regBackdrop.removeAttribute('aria-hidden');

  const modalForm = document.getElementById('modalForm');
  const modalReset = document.getElementById('modalReset');
  if (modalForm) {
    modalForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(modalForm);
      const data = Object.fromEntries(fd.entries());
      try { localStorage.setItem('dk_registration', JSON.stringify(data)); } catch (err) { console.warn(err); }
      showToast('Inscription enregistrée', 'success');
      regBackdrop.classList.add('hidden');
      regBackdrop.setAttribute('aria-hidden', 'true');
      renderRecap();
      window.location.hash = '#paiement';
    });
  }
  if (modalReset) modalReset.addEventListener('click', () => modalForm.reset());
  return true;
}

// Add direct listeners on load as extra fallback
window.addEventListener('load', () => {
  try {
    const els = document.querySelectorAll('.track-signup');
    console.log('track-signup elements count:', els.length);
    els.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Direct click handler fired for', el);
        const ok = showRegModalSimple({});
        if (!ok) alert("Le module d'inscription n'est pas disponible. Veuillez contacter l'administrateur.");
      });
    });
  } catch (err) {
    console.warn('Error wiring direct track-signup handlers', err);
  }
}); 

