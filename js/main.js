
function start() {
  var btn_open = document.querySelector('.cta-btn');
  if (!btn_open) return;

  var modal_box = document.createElement('div');
  modal_box.className = 'app-modal';
  modal_box.setAttribute('aria-hidden', 'true');
  modal_box.innerHTML = '<div class="app-modal__backdrop"></div>' +
    '<div class="app-modal__card" role="dialog" aria-modal="true" aria-label="Nova Transação">' +
      '<button class="app-modal__close" aria-label="Fechar">×</button>' +
      '<div class="metric-card">' +
        '<div class="metric-row">' +
          '<div class="metric-meta">' +
            '<div class="metric-label">Calma Ledger!</div>' +
            '<div class="metric-value modal-subtitle">essa função está sendo construída</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal_box);

  var back = modal_box.querySelector('.app-modal__backdrop');
  var close_btn = modal_box.querySelector('.app-modal__close');

  function show() {
    modal_box.classList.add('is-open');
    modal_box.setAttribute('aria-hidden', 'false');
    close_btn.focus();
  }

  function hide() {
    modal_box.classList.remove('is-open');
    modal_box.setAttribute('aria-hidden', 'true');
    btn_open.focus();
  }

  btn_open.addEventListener('click', function (e) { e.preventDefault(); show(); });
  back.addEventListener('click', hide);
  close_btn.addEventListener('click', hide);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal_box.classList.contains('is-open')) hide(); });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', start);
} else { start(); }
