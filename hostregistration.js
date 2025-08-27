/* script.js — behavior for host banner & modal
   - modal open/close
   - tilt/parallax effect
   - dropzone image preview
   - form validation + localStorage draft
*/

(() => {
  // Utilities
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Elements
  const openBtns = $$('#open-host-modal, #become-host-btn, #quick-list');
  const modal = $('#host-modal');
  const closeModal = $('#close-modal');
  const form = $('#host-form');
  const saveDraftBtn = $('#save-draft');
  const fileInput = $('#file-input');
  const dropzone = $('#dropzone');
  const dzPreview = $('#dz-preview');
  const previewImage = $('#preview-image');
  const previewTitle = $('#preview-title');
  const previewSub = $('#preview-sub');
  const progress = $('#progress');
  const completePercent = $('#complete-percent');
  const yearSpan = $('#year');

  yearSpan.textContent = new Date().getFullYear();

  // --- Modal open/close (accessible)
  function openModal() {
    modal.setAttribute('aria-hidden', 'false');
    // focus trap: focus first input
    setTimeout(()=> {
      const first = modal.querySelector('input,select,button,textarea');
      first && first.focus();
    }, 50);
    document.body.style.overflow = 'hidden';
  }
  function closeModalFn() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // return focus to CTA
    $('#open-host-modal')?.focus();
  }
  openBtns.forEach(b => b && b.addEventListener('click', (e)=> {
    e.preventDefault();
    openModal();
  }));
  closeModal?.addEventListener('click', closeModalFn);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFn();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModalFn();
  });

  // --- Simple tilt/parallax on banner
  const banner = $('#banner');
  const vehicleCard = document.querySelector('.vehicle-card');
  if (banner && vehicleCard) {
    banner.addEventListener('mousemove', (e) => {
      const rect = banner.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const rotateX = (dy * 8).toFixed(2);
      const rotateY = (dx * -12).toFixed(2);
      vehicleCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
    });
    banner.addEventListener('mouseleave', ()=> {
      vehicleCard.style.transform = 'none';
    });
  }

  // --- Dropzone file handling
  const MAX_PREVIEWS = 6;
  function createThumb(file) {
    const thumb = document.createElement('div');
    thumb.className = 'dz-thumb';
    const img = document.createElement('img');
    img.alt = file.name;
    thumb.appendChild(img);

    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(file);
    return thumb;
  }

  function handleFiles(files) {
    // keep a small set
    const arr = Array.from(files).slice(0, MAX_PREVIEWS);
    dzPreview.innerHTML = '';
    arr.forEach((f,i) => {
      const t = createThumb(f);
      dzPreview.appendChild(t);
      if (i === 0) {
        // set live preview cover image
        const reader = new FileReader();
        reader.onload = e => {
          previewImage.style.backgroundImage = `url(${e.target.result})`;
          previewImage.textContent = '';
        };
        reader.readAsDataURL(f);
      }
    });
    updateCompleteness();
  }

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files?.length) handleFiles(files);
  });
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files?.length) handleFiles(files);
  });

  // Also support keyboard select on dropzone
  dropzone.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      fileInput.click();
    }
  });

  // --- Form validation & autosave
  function formToObject() {
    return {
      type: $('#v-type').value,
      make: $('#v-make').value,
      price: $('#v-price').value,
      savedAt: new Date().toISOString()
    };
  }
  function updateCompleteness() {
    const obj = formToObject();
    let score = 10;
    if (obj.type) score += 30;
    if (obj.make && obj.make.length > 3) score += 30;
    if (obj.price && Number(obj.price) >= 100) score += 30;
    if (dzPreview.children.length) score += 10;
    score = Math.min(100, score);
    progress.value = score;
    completePercent.textContent = `${score}%`;
    previewTitle.textContent = obj.make || 'Vehicle preview';
    previewSub.textContent = obj.price ? `₹${obj.price}/day` : 'Set a price to see estimate';
  }

  ['change','input'].forEach(evt => {
    $('#v-type').addEventListener(evt, updateCompleteness);
    $('#v-make').addEventListener(evt, updateCompleteness);
    $('#v-price').addEventListener(evt, updateCompleteness);
  });

  // Auto-save draft to localStorage
  const DRAFT_KEY = 'hostListingDraftV1';
  function saveDraft() {
    const val = formToObject();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(val));
      toast('Draft saved locally');
    } catch (err) {
      console.warn('save failed', err);
    }
  }

  saveDraftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveDraft();
  });

  // Load draft on open
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj.type) $('#v-type').value = obj.type;
      if (obj.make) $('#v-make').value = obj.make;
      if (obj.price) $('#v-price').value = obj.price;
      updateCompleteness();
    } catch (err) {
      console.warn('load draft failed', err);
    }
  }

  // Auto-save periodically while modal open
  let autoSaveTimer = null;
  modal.addEventListener('transitionstart', () => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      loadDraft();
      autoSaveTimer = setInterval(saveDraft, 5000);
    } else {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // simple validation
    const vtype = $('#v-type').value;
    const make = $('#v-make').value.trim();
    const price = Number($('#v-price').value);
    if (!vtype || make.length < 3 || isNaN(price) || price < 100) {
      toast('Please complete the required fields correctly');
      return;
    }
    // Emulate sending to server...
    const payload = {...formToObject(), images: dzPreview.children.length};
    console.log('Submitting listing', payload);
    // Clear draft and close
    localStorage.removeItem(DRAFT_KEY);
    toast('Listing saved — continue to verification in dashboard');
    setTimeout(() => closeModalFn(), 900);
  });

  // --- tiny toast notifications
  function toast(msg) {
    let el = document.getElementById('tiny-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tiny-toast';
      el.style.cssText = 'position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,0.7);color:#fff;padding:10px 14px;border-radius:10px;z-index:9999;backdrop-filter:blur(4px)';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = 1;
    clearTimeout(el._t);
    el._t = setTimeout(()=> el.style.opacity = 0, 2400);
  }

  // Initialize preview baseline
  previewImage.style.backgroundColor = 'linear-gradient(90deg, rgba(255,255,255,0.02), transparent)';
  updateCompleteness();
})();
