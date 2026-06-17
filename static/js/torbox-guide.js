// TorBox + Nuvio Guide — scroll reveal + active TOC
(function () {
  const sections = document.querySelectorAll('.torbox-guide .section');
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08 }
  );
  sections.forEach((s) => obs.observe(s));

  // Active TOC highlighting
  const tocLinks = document.querySelectorAll('.torbox-guide .toc a');
  const headings = document.querySelectorAll('.torbox-guide .section[id]');
  const tocObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          tocLinks.forEach((l) => {
            l.classList.toggle(
              'active',
              l.getAttribute('href') === '#' + id
            );
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );
  headings.forEach((h) => tocObs.observe(h));
})();
