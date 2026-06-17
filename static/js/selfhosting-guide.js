// Self-Hosting Starter Guide — ASCII diagram, scroll reveal, tracker
(function () {
  // ASCII diagram — draws itself line by line
  const diagramLines = [
    { text: '  ┌─────────────────────────────────────────────────┐', cls: 'dim' },
    { text: '  │              HOME NETWORK  192.168.x.x          │', cls: 'dim' },
    { text: '  │                                                  │', cls: 'dim' },
    { text: '  │   ┌──────────────────┐      ┌──────────────┐   │', cls: '' },
    { text: '  │   │   HOME SERVER    │      │    ROUTER    │   │', cls: '' },
    { text: '  │   │  ─────────────  │◄────►│  DHCP / DNS  │   │', cls: 'hi' },
    { text: '  │   │  jellyfin :8096 │      └──────┬───────┘   │', cls: 'green' },
    { text: '  │   │  vaultwarden    │             │            │', cls: 'green' },
    { text: '  │   │  adguard  :53  │             │            │', cls: 'green' },
    { text: '  │   │  comet    :8888│             │            │', cls: 'green' },
    { text: '  │   └────────┬───────┘         ┌───┴──────┐    │', cls: '' },
    { text: '  │            │                 │  TAILSCALE│    │', cls: '' },
    { text: '  │      ┌─────┴──────┐         │  MESH VPN │    │', cls: '' },
    { text: '  │      │  DOCKER    │         └───────────┘    │', cls: 'yel' },
    { text: '  │      │  COMPOSE   │                          │', cls: 'yel' },
    { text: '  │      └────────────┘                          │', cls: '' },
    { text: '  │                          ▼ accessible from   │', cls: 'dim' },
    { text: '  │   phone · laptop · TV · anywhere via VPN     │', cls: 'hi' },
    { text: '  └─────────────────────────────────────────────────┘', cls: 'dim' },
  ];

  const diag = document.getElementById('arch-diagram');
  if (diag) {
    diagramLines.forEach((l, i) => {
      const span = document.createElement('span');
      span.className = 'line ' + l.cls;
      span.style.animationDelay = (i * 55) + 'ms';
      span.textContent = l.text;
      diag.appendChild(span);
      diag.appendChild(document.createTextNode('\n'));
    });
  }

  // Scroll reveal
  const sections = document.querySelectorAll('.selfhosting-guide .section');
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.06 }
  );
  sections.forEach((s) => revealObs.observe(s));

  // Tracker active state
  const trackerLinks = document.querySelectorAll('.selfhosting-guide .tracker-step');
  const activeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          trackerLinks.forEach((l) => {
            l.classList.toggle(
              'active',
              l.getAttribute('href') === '#' + id
            );
          });
        }
      });
    },
    { rootMargin: '-15% 0px -70% 0px' }
  );
  sections.forEach((s) => activeObs.observe(s));
})();
