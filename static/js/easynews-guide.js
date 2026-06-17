// EasyNews vs Debrid — terminal reveal + scroll + active nav
(function () {
  // Terminal line reveal
  const termLines = document.querySelectorAll('.easynews-guide .term-line');
  termLines.forEach((line) => {
    const delay = parseInt(line.dataset.delay || 0);
    setTimeout(() => line.classList.add('visible'), delay + 400);
  });

  // Scroll reveal for sections
  const sections = document.querySelectorAll('.easynews-guide .section');
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.07 }
  );
  sections.forEach((s) => sectionObs.observe(s));

  // Active nav link
  const navLinks = document.querySelectorAll('.easynews-guide .sticky-nav a');
  const navObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach((l) => {
            l.classList.toggle(
              'active',
              l.getAttribute('href') === '#' + id
            );
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  sections.forEach((s) => navObs.observe(s));
})();
