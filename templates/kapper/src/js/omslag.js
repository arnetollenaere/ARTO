// Omslag: kleine extra's. Alles werkt ook zonder JavaScript.
(() => {
  const q = new URLSearchParams(location.search);

  // Bevestiging na het verzenden van het formulier (?verzonden=1)
  if (q.get('verzonden') === '1') {
    document.querySelectorAll('[data-bevestiging]').forEach((el) => {
      el.hidden = false;
      el.closest('form')?.scrollIntoView({ block: 'start' });
    });
  }

  // Stylist voorselecteren vanuit de teampagina (?stylist=Naam)
  const stylist = q.get('stylist');
  const keuze = document.getElementById('f-stylist');
  if (stylist && keuze) {
    for (const o of keuze.options) if (o.value === stylist) keuze.value = stylist;
  }

  // Vandaag markeren in de openingsuren
  const dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const vandaag = dagen[new Date().getDay()];
  document.querySelectorAll(`.uren [data-dag="${vandaag}"]`).forEach((el) => el.classList.add('vandaag'));

  // Lookbook: pijlen en voortgang (voortgang alleen als CSS het niet zelf kan)
  const strook = document.querySelector('.lookbook__strook');
  if (strook) {
    document.querySelectorAll('[data-lookbook]').forEach((k) => k.addEventListener('click', () => {
      const look = strook.querySelector('.look');
      const stap = look ? look.getBoundingClientRect().width + parseFloat(getComputedStyle(strook).columnGap || 0) : 320;
      strook.scrollBy({ left: stap * Number(k.dataset.lookbook), behavior: 'smooth' });
    }));
    if (!CSS.supports('animation-timeline: scroll()')) {
      const balk = document.querySelector('.lookbook__voortgang span');
      const zet = () => {
        const max = strook.scrollWidth - strook.clientWidth;
        balk?.style.setProperty('--voortgang', max > 0 ? Math.max(0.08, strook.scrollLeft / max) : 1);
      };
      strook.addEventListener('scroll', zet, { passive: true });
      zet();
    }
  }

  // Menu zonder popover-ondersteuning: gewoon tonen/verbergen
  const toc = document.getElementById('inhoudstafel');
  if (toc && !('popover' in HTMLElement.prototype)) {
    toc.style.display = 'none';
    document.querySelectorAll('[popovertarget="inhoudstafel"]').forEach((k) => k.addEventListener('click', () => {
      toc.style.display = toc.style.display === 'none' ? 'flex' : 'none';
    }));
  }
  // Sluit het menu na klikken op een anker op dezelfde pagina
  toc?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { try { toc.hidePopover(); } catch (e) {} }));

  // Actieve categorie in de index van de prijslijst
  const index = document.querySelectorAll('.catalogus__index a');
  if (index.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((items) => {
      for (const it of items) if (it.isIntersecting) {
        index.forEach((a) => a.classList.toggle('actief', a.getAttribute('href') === '#' + it.target.id));
      }
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.categorie').forEach((s) => io.observe(s));
  }
})();
