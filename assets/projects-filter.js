(() => {
  const buttons = document.querySelectorAll('[data-filter-button]');
  const cards = document.querySelectorAll('[data-project-card]');
  const status = document.querySelector('[data-projects-status]');

  const applyFilter = tag => {
    const resolvedTag = typeof tag === 'string' && tag.trim().length > 0 ? tag : 'all';
    let visibleCount = 0;

    cards.forEach(card => {
      const tags = (card.getAttribute('data-tags') || '').split(',').filter(Boolean);
      const isVisible = resolvedTag === 'all' || tags.includes(resolvedTag);
      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    buttons.forEach(button => {
      const isActive = button.getAttribute('data-filter') === resolvedTag;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (status) {
      const label = resolvedTag === 'all' ? 'All projects' : 'Projects tagged '.concat(resolvedTag);
      status.textContent = `${label}: ${visibleCount} shown.`;
    }
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => applyFilter(button.getAttribute('data-filter')));
  });

  applyFilter('all');
})();
