/* Cipta prototype — shared runtime
   Rewires bottom nav, per-screen CTAs, back buttons, auto-advance,
   in-page scan overlay, DFW restaurant autocomplete, and the
   verified-plate share card modal. All visuals come from cipta.css
   + cipta_design/tokens.css (receipt-as-design-language). */
(function () {
  const NAV_ICON_TO_HREF = {
    home: 'dashboard.html',
    history: 'plate_history.html',
    restaurant_menu: 'taste_favorites.html',
    person: 'profile.html',
  };

  // Parent-page fallback used when history.back() has nothing to go to
  // (i.e. the user landed on a screen directly from the index launcher).
  const BACK_PARENTS = {
    'welcome_login.html': 'landing.html',
    'join_cipta.html': 'landing.html',
    'scan_receipt.html': 'dashboard.html',
    'scanning.html': 'scan_receipt.html',
    'scan_success.html': 'scanned_items.html',
    'scanned_items.html': 'scan_receipt.html',
    'add_missing_item.html': 'scanned_items.html',
    'split_list.html': 'scanned_items.html',
    'manual_entry.html': 'dashboard.html',
    'mood_selection.html': 'scanned_items.html',
    'reviewing_plate.html': 'mood_selection.html',
    'summary_screen.html': 'reviewing_plate.html',
    'plate_history.html': 'dashboard.html',
    'taste_favorites.html': 'dashboard.html',
    'profile.html': 'dashboard.html',
  };
  const SCREEN_TITLES = {
    'welcome_login.html': 'Sign in',
    'join_cipta.html': 'Join Cipta',
    'scan_receipt.html': 'Scan receipt',
    'scanning.html': 'Scanning',
    'scan_success.html': 'Verified',
    'scanned_items.html': 'Your items',
    'add_missing_item.html': 'Add item',
    'split_list.html': 'Split list',
    'manual_entry.html': 'Manual entry',
    'mood_selection.html': 'Your mood',
    'reviewing_plate.html': 'Review',
    'summary_screen.html': 'Plate summary',
    'plate_history.html': 'History',
    'taste_favorites.html': 'Your taste',
    'profile.html': 'Profile',
  };

  // Real DFW restaurants — kept as autocomplete fixtures only.
  // These are public restaurant names, not fabricated reviews.
  const DFW_RESTAURANTS = [
    { name: 'Pappas Bros. Steakhouse', area: 'Dallas · Lovers Ln', cuisine: 'Steakhouse', verified: true },
    { name: 'Nick & Sam’s Steakhouse', area: 'Uptown Dallas', cuisine: 'Steakhouse', verified: true },
    { name: 'Uchi Dallas', area: 'Knox-Henderson', cuisine: 'Japanese', verified: true },
    { name: 'Mirador', area: 'Downtown Dallas', cuisine: 'New American', verified: true },
    { name: 'Lucia', area: 'Bishop Arts', cuisine: 'Italian', verified: true },
    { name: 'Mot Hội', area: 'Trinity Groves', cuisine: 'Vietnamese', verified: false },
    { name: 'Kalachandji’s', area: 'East Dallas', cuisine: 'Vegetarian Indian', verified: false },
    { name: 'Pecan Lodge', area: 'Deep Ellum', cuisine: 'BBQ', verified: true },
    { name: 'Meso Maya', area: 'Downtown Dallas', cuisine: 'Mexican', verified: true },
    { name: 'Rise N°1', area: 'Inwood Village', cuisine: 'French Soufflé', verified: true },
    { name: 'Heim Barbecue', area: 'Fort Worth', cuisine: 'BBQ', verified: true },
    { name: 'Clay Pigeon', area: 'Fort Worth · Foundry', cuisine: 'New American', verified: false },
    { name: 'Don Artemio', area: 'Fort Worth · Cultural', cuisine: 'Mexican Fine Dining', verified: true },
    { name: 'Lonesome Dove', area: 'Fort Worth · Stockyards', cuisine: 'Western Bistro', verified: true },
    { name: 'Tei-An', area: 'One Arts Plaza', cuisine: 'Soba / Japanese', verified: true },
    { name: 'Gemma', area: 'Henderson Ave', cuisine: 'New American', verified: true },
    { name: 'Khao Noodle Shop', area: 'East Dallas', cuisine: 'Laotian', verified: true },
    { name: 'Georgie by Curtis Stone', area: 'Highland Park', cuisine: 'Steakhouse', verified: false },
    { name: 'Revolver Taco Lounge', area: 'Deep Ellum', cuisine: 'Mexican', verified: true },
    { name: 'Sachet', area: 'Inwood Village', cuisine: 'Mediterranean', verified: true },
  ];

  function rewireBottomNav() {
    const navs = document.querySelectorAll('nav, footer nav, body > nav');
    navs.forEach((nav) => {
      const cls = nav.className || '';
      if (!/bottom-0/.test(cls) && !/fixed bottom/.test(cls)) return;
      nav.querySelectorAll('a, button').forEach((el) => {
        const icon = (el.getAttribute('data-icon') || '').trim();
        const target = NAV_ICON_TO_HREF[icon];
        if (!target) return;
        if (el.tagName === 'A') {
          el.setAttribute('href', target);
        } else {
          el.setAttribute('onclick', "window.location.href='" + target + "'");
        }
      });
    });
  }

  function rewireBackButtons() {
    document.querySelectorAll('[data-action="back"]').forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        if (history.length > 1) history.back();
        else window.location.href = 'dashboard.html';
      };
      if (btn.tagName === 'A') btn.setAttribute('href', '#');
      btn.addEventListener('click', handler);
    });
  }

  function installBackChip() {
    const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const parent = BACK_PARENTS[page];
    if (!parent) return;

    // Skip if the topbar already exposes a back/cancel/done affordance,
    // or if the page wired its own [data-action="back"].
    if (document.querySelector('[data-action="back"]')) return;
    if (document.querySelector('.cipta-topbar__action')) return;

    const chip = document.createElement('button');
    chip.setAttribute('aria-label', 'Go back');
    chip.className = 'pa-back-chip';
    chip.innerHTML =
      '<span class="pa-back-chip__arrow" aria-hidden="true">←</span>' +
      '<span class="pa-back-label">' + (SCREEN_TITLES[page] || 'Back') + '</span>';
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.referrer && /\.html(\?|#|$)/i.test(document.referrer)
          && new URL(document.referrer).origin === window.location.origin
          && history.length > 1) {
        history.back();
      } else {
        window.location.href = parent;
      }
    });
    document.body.appendChild(chip);
  }

  function fixDeadLinks() {
    const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (page === 'dashboard.html') {
      document.querySelectorAll('a').forEach((a) => {
        if ((a.textContent || '').trim().toLowerCase() === 'view all') {
          a.setAttribute('href', 'plate_history.html');
        }
      });
    }
    if (page === 'scanning.html') {
      document.querySelectorAll('button, a').forEach((b) => {
        const label = (b.textContent || '').trim().toLowerCase();
        if (label.includes('cancel')) {
          b.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'scan_receipt.html';
          });
        }
      });
    }
  }

  /* ---------- In-page scan overlay (collapses scan_receipt → items flow) ---------- */
  function installScanOverlay() {
    if (document.getElementById('scan-overlay-root')) return;
    const root = document.createElement('div');
    root.id = 'scan-overlay-root';
    root.innerHTML = `
      <div class="scan-overlay" id="scan-overlay" role="dialog" aria-modal="true" aria-live="polite">
        <div class="scan-overlay-card">
          <div id="scan-stage-scanning">
            <div class="scan-spinner" aria-hidden="true"></div>
            <div class="scan-overlay__title">Reading the receipt</div>
            <div class="scan-overlay__sub">Items · totals · timestamp</div>
            <div class="scan-progress" id="scan-progress"></div>
          </div>
          <div id="scan-stage-success" style="display:none;">
            <div class="scan-stamp" aria-hidden="true">✓</div>
            <div class="scan-overlay__title">Receipt verified</div>
            <div class="scan-overlay__sub">Items extracted · checks passed</div>
            <div class="scan-verified-pill"><span aria-hidden="true">✓</span>Verified plate</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);
  }

  function runScanSequence() {
    installScanOverlay();
    const overlay = document.getElementById('scan-overlay');
    const stageScanning = document.getElementById('scan-stage-scanning');
    const stageSuccess = document.getElementById('scan-stage-success');
    const progress = document.getElementById('scan-progress');

    progress.innerHTML = '';
    const dots = [];
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('span');
      progress.appendChild(d);
      dots.push(d);
    }
    overlay.setAttribute('data-active', 'true');
    dots.forEach((d, i) => setTimeout(() => { d.classList.add('is-on'); }, 250 + i * 260));

    setTimeout(() => {
      stageScanning.style.display = 'none';
      stageSuccess.style.display = 'block';
    }, 1700);
    setTimeout(() => {
      window.location.href = 'scanned_items.html';
    }, 3100);
  }

  function wireScanReceiptPage() {
    const ctas = document.querySelectorAll('a, button');
    ctas.forEach((el) => {
      const label = (el.textContent || '').trim().toLowerCase();
      const goesToScanning = (el.getAttribute('href') || '').includes('scanning.html')
        || (el.getAttribute('onclick') || '').includes('scanning.html');
      const looksLikeCapture = label.startsWith('confirm') || label.startsWith('capture')
        || label.includes('view items') || label.includes('start scan');
      if (goesToScanning || looksLikeCapture) {
        el.setAttribute('href', '#');
        el.setAttribute('onclick', 'event.preventDefault(); window.__plateScan();');
      }
    });
    window.__plateScan = runScanSequence;

    const viewfinder = document.querySelector('[data-scan-target]');
    if (viewfinder) {
      viewfinder.style.cursor = 'pointer';
      viewfinder.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        runScanSequence();
      });
    }
  }

  /* ---------- DFW restaurant autocomplete ---------- */
  function wireAutocomplete() {
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    inputs.forEach((input) => {
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      const name = (input.getAttribute('name') || '').toLowerCase();
      let labelText = '';
      let node = input.parentElement;
      for (let i = 0; i < 4 && node; i++) {
        const lbl = node.querySelector('label');
        if (lbl) { labelText = lbl.textContent.toLowerCase(); break; }
        node = node.parentElement;
      }
      const hay = placeholder + ' ' + name + ' ' + labelText;
      const isRestaurantField = /restaurant|place|venue|where|name of|eatery|spot/.test(hay);
      if (!isRestaurantField) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'pa-autocomplete';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);

      const list = document.createElement('div');
      list.className = 'pa-autocomplete-list';
      list.setAttribute('role', 'listbox');
      wrapper.appendChild(list);

      const render = (query) => {
        const q = query.trim().toLowerCase();
        if (q.length < 1) { list.removeAttribute('data-active'); return; }
        const matches = DFW_RESTAURANTS
          .filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.area.toLowerCase().includes(q))
          .slice(0, 6);
        if (!matches.length) { list.removeAttribute('data-active'); return; }
        list.innerHTML = matches.map((r, i) => `
          <div class="pa-autocomplete-item" data-index="${i}" role="option">
            <div class="pa-autocomplete-icon">★</div>
            <div style="flex:1;min-width:0;">
              <div class="pa-autocomplete-name">${r.name}</div>
              <div class="pa-autocomplete-meta">${r.cuisine} · ${r.area}</div>
            </div>
            ${r.verified ? '<span class="pa-autocomplete-badge">Verified</span>' : ''}
          </div>`).join('');
        list.setAttribute('data-active', 'true');
        list.querySelectorAll('.pa-autocomplete-item').forEach((el) => {
          el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const idx = parseInt(el.dataset.index, 10);
            input.value = matches[idx].name;
            list.removeAttribute('data-active');
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
        });
      };

      input.addEventListener('input', (e) => render(e.target.value));
      input.addEventListener('focus', (e) => { if (e.target.value) render(e.target.value); });
      input.addEventListener('blur', () => setTimeout(() => list.removeAttribute('data-active'), 120));
    });
  }

  /* ---------- Verified Plate share card (summary_screen)
     Uses bracketed placeholder data per the no-fabricated-data rule.
     ---------- */
  function installVerifiedPlate() {
    if (document.getElementById('vp-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'vp-modal';
    modal.className = 'vp-modal-backdrop';
    modal.innerHTML = `
      <div class="vp-modal" role="dialog" aria-modal="true" aria-labelledby="vp-title">
        <button class="vp-close" aria-label="Close" id="vp-close">✕</button>
        <div class="vp-modal__head" id="vp-title">Your verified plate</div>
        <div class="vp-card-canvas" id="vp-canvas">
          <div class="vp-card-store">[ restaurant · neighborhood ]</div>
          <div class="vp-card-dish">[ dish ]</div>
          <div class="vp-card-meta">[ date ] · [ table ] · #CPT-EXAMPLE</div>
          <hr class="vp-card-divider" />
          <div class="vp-card-rows" id="vp-rows"></div>
          <hr class="vp-card-divider" />
          <div class="vp-card-foot">cipta · sample plate · share preview</div>
          <span class="vp-card-stamp">verified</span>
        </div>
        <div class="vp-actions">
          <button class="vp-btn-primary" id="vp-share">Share</button>
          <button class="vp-btn-secondary" id="vp-download">Save image</button>
        </div>
        <p class="vp-fineprint">Receipt, GPS + timestamp, uniqueness hash verified · Only diners who ate it can post it</p>
      </div>`;
    document.body.appendChild(modal);

    const rowsEl = document.getElementById('vp-rows');
    [
      { label: '[ item 1 ]',  stars: '★★★★★' },
      { label: '[ item 2 ]',  stars: '★★★★☆' },
      { label: '[ item 3 ]',  stars: '★★★★★' },
    ].forEach((r) => {
      const row = document.createElement('div');
      row.className = 'vp-card-row';
      row.innerHTML = `
        <span>${r.label}</span>
        <span class="vp-card-row__leader"></span>
        <span class="vp-card-row__stars">${r.stars}</span>`;
      rowsEl.appendChild(row);
    });

    document.getElementById('vp-close').addEventListener('click', closeVerifiedPlate);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeVerifiedPlate(); });

    document.getElementById('vp-share').addEventListener('click', async () => {
      const text = 'My verified plate on Cipta — the receipt is the review.';
      if (navigator.share) {
        try { await navigator.share({ title: 'Verified plate', text, url: window.location.href }); }
        catch (e) { /* cancelled */ }
      } else {
        navigator.clipboard?.writeText(text);
        toast('Link copied');
      }
    });
    document.getElementById('vp-download').addEventListener('click', () => {
      renderVerifiedPlateToPng().then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'verified-plate.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      });
    });
  }

  function openVerifiedPlate() {
    installVerifiedPlate();
    document.getElementById('vp-modal').setAttribute('data-active', 'true');
  }
  function closeVerifiedPlate() {
    const m = document.getElementById('vp-modal');
    if (m) m.removeAttribute('data-active');
  }
  window.__plateOpenVerified = openVerifiedPlate;

  function renderVerifiedPlateToPng() {
    return new Promise((resolve) => {
      const W = 1080, H = 1350;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');

      // Cream paper background
      ctx.fillStyle = '#F4EDE0';
      ctx.fillRect(0, 0, W, H);

      // Top tear edge (scalloped)
      ctx.fillStyle = '#F4EDE0';
      ctx.strokeStyle = '#1A1410';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 80, W - 80, H - 160);

      // Header — store placeholder
      ctx.fillStyle = '#8B7E6F';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ RESTAURANT · NEIGHBORHOOD ]', W / 2, 180);

      // Dish title placeholder
      ctx.fillStyle = '#1A1410';
      ctx.font = '900 124px "Fraunces", serif';
      ctx.fillText('[ dish ]', W / 2, 340);

      // Meta
      ctx.fillStyle = '#8B7E6F';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('[ DATE ] · [ TABLE ] · #CPT-EXAMPLE', W / 2, 400);

      // Dashed divider
      ctx.strokeStyle = '#8B7E6F';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(80, 460); ctx.lineTo(W - 80, 460); ctx.stroke();
      ctx.setLineDash([]);

      // Itemized rows (placeholder)
      ctx.textAlign = 'left';
      ctx.font = 'bold 32px "JetBrains Mono", monospace';
      const items = ['[ item 1 ]', '[ item 2 ]', '[ item 3 ]'];
      const stars = ['★★★★★', '★★★★☆', '★★★★★'];
      let y = 540;
      items.forEach((label, i) => {
        ctx.fillStyle = '#1A1410';
        ctx.fillText(label, 90, y);
        ctx.fillStyle = '#C8351C';
        ctx.textAlign = 'right';
        ctx.fillText(stars[i], W - 90, y);
        ctx.textAlign = 'left';
        // Dotted leader
        ctx.fillStyle = '#8B7E6F';
        ctx.font = '24px "JetBrains Mono", monospace';
        ctx.fillText('····················································', 90 + ctx.measureText(label).width + 16, y - 8);
        ctx.font = 'bold 32px "JetBrains Mono", monospace';
        y += 70;
      });

      // Total dashed divider
      ctx.strokeStyle = '#8B7E6F';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(80, y + 20); ctx.lineTo(W - 80, y + 20); ctx.stroke();
      ctx.setLineDash([]);

      // Plate score
      ctx.fillStyle = '#8B7E6F';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('PLATE SCORE', 90, y + 90);
      ctx.fillStyle = '#C8351C';
      ctx.textAlign = 'right';
      ctx.font = '900 78px "Fraunces", serif';
      ctx.fillText('★ —', W - 90, y + 110);
      ctx.textAlign = 'left';

      // Verified stamp (rotated)
      ctx.save();
      ctx.translate(W - 220, H - 240);
      ctx.rotate(-7 * Math.PI / 180);
      ctx.strokeStyle = '#C8351C';
      ctx.lineWidth = 4;
      ctx.strokeRect(-90, -34, 180, 68);
      ctx.fillStyle = '#C8351C';
      ctx.font = 'italic bold 28px "Fraunces", serif';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFIED', 0, 6);
      ctx.restore();

      // Footer
      ctx.fillStyle = '#8B7E6F';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CIPTA · SAMPLE PLATE · THE RECEIPT IS THE REVIEW', W / 2, H - 110);

      c.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  function wireSummaryPage() {
    const ctas = document.querySelectorAll('button, a');
    let attached = false;
    ctas.forEach((el) => {
      const label = (el.textContent || '').trim().toLowerCase();
      if ((label.includes('save') && label.includes('share')) || label.startsWith('share')) {
        el.setAttribute('onclick', 'event.preventDefault(); window.__plateOpenVerified();');
        if (el.tagName === 'A') el.setAttribute('href', '#');
        attached = true;
      }
    });
    if (!attached) {
      const main = document.querySelector('main') || document.body;
      const btn = document.createElement('button');
      btn.style.cssText = `
        position: fixed; bottom: 100px; right: 24px; z-index: 80;
        background: var(--ink); color: var(--paper);
        border: 2px solid var(--ink);
        padding: 12px 20px; border-radius: 2px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.18em;
        cursor: pointer;
        box-shadow: 4px 4px 0 0 #C8351C;
      `;
      btn.textContent = 'Share verified plate';
      btn.addEventListener('click', openVerifiedPlate);
      main.appendChild(btn);
    }
  }

  /* ---------- Toast ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
      background: #1A1410; color: #F4EDE0;
      padding: 10px 18px; border-radius: 2px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.18em;
      z-index: 200; opacity: 0; transition: opacity 200ms;
    `;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
  }

  function applyScreenOverrides() {
    const page = (window.location.pathname.split('/').pop() || '').toLowerCase();

    if (page === 'scan_success.html') {
      document.querySelectorAll('button, a').forEach((b) => {
        const label = (b.textContent || '').trim().toLowerCase();
        if (label.startsWith('view') && label.includes('item')) {
          b.setAttribute('onclick', "window.location.href='scanned_items.html'");
          if (b.tagName === 'A') b.setAttribute('href', 'scanned_items.html');
        } else if (label.startsWith('scan again')) {
          b.setAttribute('onclick', "window.location.href='scan_receipt.html'");
          if (b.tagName === 'A') b.setAttribute('href', 'scan_receipt.html');
        }
      });
    }

    if (page === 'add_missing_item.html') {
      document.querySelectorAll('button, a').forEach((el) => {
        const label = (el.textContent || '').trim().toLowerCase();
        if (label.includes('add to plate') || label.startsWith('add item') || (label.includes('save') && label.includes('item'))) {
          el.setAttribute('onclick', "window.location.href='scanned_items.html'");
          if (el.tagName === 'A') el.setAttribute('href', 'scanned_items.html');
        }
      });
    }

    if (page === 'split_list.html') {
      document.querySelectorAll('button, a').forEach((el) => {
        const label = (el.textContent || '').trim().toLowerCase();
        if (label.includes('done') || label.includes('confirm split') || label.includes('continue') || label.includes('send')) {
          el.setAttribute('onclick', "window.location.href='scanned_items.html'");
          if (el.tagName === 'A') el.setAttribute('href', 'scanned_items.html');
        }
      });
    }

    if (page === 'plate_history.html') {
      document.querySelectorAll('a, button').forEach((el) => {
        const oc = el.getAttribute('onclick') || '';
        if (oc.includes('event.preventDefault();') && oc.length < 30) {
          el.setAttribute('onclick', "window.location.href='summary_screen.html'");
          if (el.tagName === 'A') el.setAttribute('href', 'summary_screen.html');
        }
      });
    }

    if (page === 'scan_receipt.html') wireScanReceiptPage();
    if (page === 'manual_entry.html') wireAutocomplete();
    if (page === 'summary_screen.html') wireSummaryPage();

    // Legacy full-screen transitions still work if the user lands on them directly
    // (from the index.html launcher). The in-page overlay is the default path.
    if (page === 'scanning.html') {
      setTimeout(() => { window.location.href = 'scan_success.html'; }, 2200);
    }
    if (page === 'scan_success.html') {
      setTimeout(() => { window.location.href = 'scanned_items.html'; }, 2400);
    }
  }

  function run() {
    try { rewireBottomNav(); } catch (e) { console.error('nav rewire', e); }
    try { rewireBackButtons(); } catch (e) { console.error('back rewire', e); }
    try { installBackChip(); } catch (e) { console.error('back chip', e); }
    try { fixDeadLinks(); } catch (e) { console.error('dead links', e); }
    try { applyScreenOverrides(); } catch (e) { console.error('screen overrides', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
