/**
 * Loads JSON from /content and renders the portfolio. Serve the site over HTTP
 * (e.g. php -S localhost:8080 or npx serve) so fetch() can read the files.
 */
(function () {
  const CONTENT_BASE = "content";

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadJson(name) {
    const res = await fetch(`${CONTENT_BASE}/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
    return res.json();
  }

  function renderNav(container, data) {
    container.querySelector(".site-brand").textContent = data.brand;
    const wrap = container.querySelector(".site-nav__links");
    wrap.innerHTML = "";
    data.links.forEach((link, i) => {
      const a = document.createElement("a");
      a.className =
        "nav-link site-nav__link text-[#dfe2eb] hover:text-[#00daf3] transition-all font-headline font-bold tracking-tight pb-1 border-b-2 border-transparent";
      a.href = link.href;
      a.textContent = link.label;
      if (i === 0) a.classList.add("active");
      wrap.appendChild(a);
    });
    const cvBtn = container.querySelector(".site-header__cv");
    if (cvBtn) cvBtn.textContent = data.downloadCvLabel;
  }

  function renderHero(root, data) {
    root.querySelector(".hero__eyebrow").textContent = data.eyebrow;
    root.querySelector(".hero__name-first").textContent = data.name.first + " ";
    root.querySelector(".hero__name-accent").textContent = data.name.accent;

    const tag = root.querySelector(".hero__tagline");
    tag.innerHTML = "";
    tag.appendChild(document.createTextNode(data.intro.beforeHighlight));
    const hl = document.createElement("span");
    hl.className = "text-primary font-semibold";
    hl.textContent = data.intro.highlight;
    tag.appendChild(hl);
    tag.appendChild(document.createTextNode(data.intro.afterHighlight));

    const chips = root.querySelector(".hero__contact-chips");
    chips.innerHTML = "";
    data.contactChips.forEach((c) => {
      const wrap = document.createElement("div");
      wrap.className =
        "hero__contact-chip flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl hover:bg-surface-bright transition-colors border border-transparent hover:border-primary/30";
      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined text-primary text-lg";
      icon.textContent = c.icon;
      const textEl = document.createElement(c.href ? "a" : "span");
      textEl.className =
        "hero__contact-text font-mono text-sm " +
        (c.href
          ? "text-on-background hover:text-primary transition-colors cursor-pointer"
          : "cursor-default");
      if (c.href) textEl.href = c.href;
      textEl.textContent = c.text;
      wrap.appendChild(icon);
      wrap.appendChild(textEl);
      chips.appendChild(wrap);
    });

    const term = data.terminal;
    root.querySelector(".hero-terminal__title").textContent = term.windowTitle;
    root.querySelector(".hero-terminal__command").innerHTML =
      `<span class="text-primary">$</span> ${escapeHtml(term.promptLine)}`;

    const jsonBlock = root.querySelector(".hero-terminal__json");
    jsonBlock.innerHTML = "";
    term.jsonFields.forEach((row, i, arr) => {
      const line = document.createElement("div");
      const suffix = i < arr.length - 1 ? "," : "";
      if (row.rawValue !== undefined) {
        line.innerHTML = `<span class="text-tertiary">"${escapeHtml(row.key)}":</span> ${escapeHtml(String(row.rawValue))}${suffix}`;
      } else {
        line.innerHTML = `<span class="text-tertiary">"${escapeHtml(row.key)}":</span> "${escapeHtml(row.value)}"${suffix}`;
      }
      jsonBlock.appendChild(line);
    });

    root.querySelector(".hero-terminal__body").textContent = term.bodyParagraph;
    const blink = root.querySelector(".hero-terminal__cursor-link");
    blink.href = `mailto:${term.cursorMailto}`;
  }

  function renderSkills(root, data) {
    root.querySelector(".section-heading__plain").textContent = data.sectionHeading.plain;
    root.querySelector(".section-heading__accent").textContent = data.sectionHeading.accent;

    const grid = root.querySelector(".toolchain-grid");
    grid.innerHTML = "";
    data.toolchain.forEach((skill) => {
      const card = document.createElement("div");
      const hasRadar = skill.radarLayers > 0;
      card.className =
        "skill-card toolchain-card bg-surface-container hover:bg-surface-bright transition-all p-6 rounded-2xl group border border-outline-variant/5 hover:scale-105 hover-card-glow relative overflow-hidden" +
        (hasRadar ? "" : "");

      if (hasRadar) {
        const radarWrap = document.createElement("div");
        radarWrap.className =
          "skill-card__radar absolute inset-0 flex items-center justify-center pointer-events-none";
        for (let i = 0; i < skill.radarLayers; i++) {
          const ring = document.createElement("div");
          ring.className = "w-12 h-12 rounded-full border border-primary/20 animate-radar";
          const d = skill.radarDelays[i];
          if (d != null) ring.style.animationDelay = `${d}s`;
          radarWrap.appendChild(ring);
        }
        card.appendChild(radarWrap);
      }

      const iconWrap = document.createElement("div");
      iconWrap.className =
        "skill-card__icon text-primary mb-4 group-hover:scale-110 transition-transform relative z-10";
      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined text-4xl";
      icon.setAttribute("data-weight", "fill");
      icon.textContent = skill.icon;
      iconWrap.appendChild(icon);

      const cat = document.createElement("span");
      cat.className =
        "skill-card__category font-label text-xs uppercase tracking-widest text-outline mb-1 block relative z-10";
      cat.textContent = skill.category;

      const name = document.createElement("h3");
      name.className = "skill-card__name font-headline font-bold relative z-10";
      name.textContent = skill.name;

      card.appendChild(iconWrap);
      card.appendChild(cat);
      card.appendChild(name);
      grid.appendChild(card);
    });

    const tags = root.querySelector(".skill-tags");
    tags.innerHTML = "";
    data.secondaryTags.forEach((t) => {
      const span = document.createElement("span");
      span.className =
        "skill-tag px-4 py-1.5 rounded-full border border-primary/20 text-primary text-xs font-label uppercase tracking-widest bg-primary/5 hover:bg-primary/20 transition-colors cursor-default";
      span.textContent = t;
      tags.appendChild(span);
    });
  }

  function renderExperience(root, data) {
    root.querySelector(".section-career__plain").textContent = data.sectionHeading.plain;
    root.querySelector(".section-career__accent").textContent = data.sectionHeading.accent;

    const list = root.querySelector(".timeline__entries");
    list.innerHTML = "";
    data.entries.forEach((entry) => {
      const wrap = document.createElement("div");
      wrap.className = "timeline-entry relative group";

      const dot = document.createElement("div");
      if (entry.timelineDot === "filled") {
        dot.className =
          "timeline-entry__dot timeline-entry__dot--active absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_#00daf3] transition-transform group-hover:scale-125 z-10";
      } else {
        dot.className =
          "timeline-entry__dot absolute -left-[41px] top-0 w-4 h-4 rounded-full border-2 border-outline bg-background transition-colors group-hover:border-primary group-hover:bg-primary group-hover:shadow-[0_0_10px_#00daf3] z-10";
      }
      wrap.appendChild(dot);

      const inner = document.createElement("div");
      inner.className =
        "flex flex-col md:flex-row md:items-start justify-between gap-4";
      const card = document.createElement("div");
      card.className =
        "timeline-entry__card bg-surface-container-low p-6 rounded-2xl hover-card-glow transition-all transform hover:-translate-y-1 w-full border border-transparent";

      const period = document.createElement("span");
      period.className =
        "timeline-entry__period font-label text-xs uppercase tracking-widest mb-1 block " +
        (entry.periodTone === "primary" ? "text-primary" : "text-outline");
      period.textContent = entry.period;

      const title = document.createElement("h3");
      title.className = "timeline-entry__title text-2xl font-headline font-bold text-on-surface";
      title.textContent = entry.title;

      const company = document.createElement("p");
      company.className = "timeline-entry__company text-tertiary font-medium mb-4";
      company.textContent = entry.company;

      const desc = document.createElement("p");
      desc.className =
        "timeline-entry__description max-w-3xl text-on-surface-variant leading-relaxed text-sm";
      desc.textContent = entry.description;

      card.appendChild(period);
      card.appendChild(title);
      card.appendChild(company);
      card.appendChild(desc);
      inner.appendChild(card);
      wrap.appendChild(inner);
      list.appendChild(wrap);
    });
  }

  function renderProjectDescription(pEl, parts) {
    pEl.innerHTML = "";
    parts.forEach((part) => {
      if (part.emphasis) {
        const s = document.createElement("span");
        s.className = "text-primary font-bold";
        s.textContent = part.text;
        pEl.appendChild(s);
      } else {
        pEl.appendChild(document.createTextNode(part.text));
      }
    });
  }

  function renderProjects(root, data) {
    root.querySelector(".section-projects__plain").textContent = data.sectionHeading.plain;
    root.querySelector(".section-projects__accent").textContent = data.sectionHeading.accent;

    const grid = root.querySelector(".projects-grid");
    grid.innerHTML = "";
    data.projects.forEach((proj) => {
      const article = document.createElement("article");
      article.className =
        "project-card bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 group flex flex-col hover-card-glow transition-all hover:scale-[1.01]";

      const media = document.createElement("div");
      media.className = "project-card__media aspect-video overflow-hidden relative";
      const img = document.createElement("img");
      img.className =
        "project-card__image w-full h-full object-cover transition-transform duration-700 group-hover:scale-110";
      img.src = proj.image.src;
      img.alt = proj.image.alt;
      media.appendChild(img);
      const grad = document.createElement("div");
      grad.className =
        "absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-60";
      media.appendChild(grad);
      const tagRow = document.createElement("div");
      tagRow.className = "project-card__tags absolute bottom-4 left-4 flex gap-2";
      proj.tags.forEach((t) => {
        const sp = document.createElement("span");
        sp.className =
          "px-2 py-1 bg-surface-container-highest/80 backdrop-blur rounded text-[10px] font-mono uppercase text-primary";
        sp.textContent = t;
        tagRow.appendChild(sp);
      });
      media.appendChild(tagRow);

      const body = document.createElement("div");
      body.className = "project-card__body p-8";
      const h = document.createElement("h3");
      h.className =
        "project-card__title font-headline text-2xl font-bold mb-4 group-hover:text-primary transition-colors";
      h.textContent = proj.title;
      const p = document.createElement("p");
      p.className = "project-card__description text-on-surface-variant mb-6 text-sm leading-relaxed";
      renderProjectDescription(p, proj.descriptionParts);

      const ul = document.createElement("ul");
      ul.className = "project-card__highlights space-y-2 mb-6";
      proj.highlights.forEach((line) => {
        const li = document.createElement("li");
        li.className = "flex items-center gap-2 text-xs text-on-surface/70";
        li.innerHTML = `<span class="material-symbols-outlined text-primary text-sm">check_circle</span>${escapeHtml(line)}`;
        ul.appendChild(li);
      });

      body.appendChild(h);
      body.appendChild(p);
      body.appendChild(ul);
      article.appendChild(media);
      article.appendChild(body);
      grid.appendChild(article);
    });
  }

  function renderEducation(root, data) {
    root.querySelector(".section-education__heading").textContent = data.heading;
    const list = root.querySelector(".education-list");
    list.innerHTML = "";
    data.entries.forEach((e) => {
      const card = document.createElement("div");
      card.className =
        "education-card bg-surface-container-low p-6 rounded-2xl border-l-4 hover-card-glow transition-all hover:translate-x-2 " +
        (e.borderAccent === "primary" ? "border-primary" : "border-outline");

      const deg = document.createElement("span");
      deg.className =
        "education-card__degree font-label text-xs uppercase tracking-widest block mb-2 " +
        (e.degreeTone === "primary" ? "text-primary" : "text-outline");
      deg.textContent = e.degreeLabel;

      const h4 = document.createElement("h4");
      h4.className = "education-card__field font-headline font-bold text-xl";
      h4.textContent = e.field;

      const p = document.createElement("p");
      p.className = "education-card__meta text-on-surface-variant text-sm";
      p.appendChild(document.createTextNode(`${e.institution} | `));
      const metric = document.createElement("span");
      metric.className =
        "font-mono " + (e.metricTone === "primary" ? "text-primary" : "text-on-surface");
      metric.textContent = e.metric;
      p.appendChild(metric);

      card.appendChild(deg);
      card.appendChild(h4);
      card.appendChild(p);
      list.appendChild(card);
    });
  }

  function renderAchievements(root, data) {
    root.querySelector(".section-achievements__heading").textContent = data.heading;
    const inner = root.querySelector(".achievements-list__items");
    if (!inner) return;
    inner.innerHTML = "";
    data.items.forEach((item) => {
      const row = document.createElement("div");
      row.className =
        "achievement-item flex items-start gap-4 group/item";
      row.innerHTML = `
        <div class="achievement-item__icon-wrap mt-1 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform">
          <span class="material-symbols-outlined text-primary text-xl">${escapeHtml(item.icon)}</span>
        </div>
        <div class="achievement-item__text">
          <h4 class="achievement-item__title font-headline font-bold text-lg leading-tight group-hover/item:text-primary transition-colors">${escapeHtml(item.title)}</h4>
          <p class="achievement-item__description text-sm text-on-surface-variant mt-1">${escapeHtml(item.description)}</p>
        </div>`;
      inner.appendChild(row);
    });
  }

  function renderPersonal(root, data) {
    const langSection = root.querySelector(".personal-languages");
    langSection.querySelector(".personal-panel__heading").innerHTML = `
      <span class="material-symbols-outlined text-primary">${escapeHtml(data.languages.headingIcon)}</span>
      <span class="personal-panel__heading-text"> ${escapeHtml(data.languages.heading)}</span>`;
    const langGrid = langSection.querySelector(".language-grid");
    langGrid.innerHTML = "";
    data.languages.items.forEach((l) => {
      const cell = document.createElement("div");
      cell.className =
        "language-item text-center p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors cursor-default border border-transparent hover:border-primary/20";
      cell.innerHTML = `
        <div class="language-item__code text-primary font-bold mb-1">${escapeHtml(l.code)}</div>
        <div class="language-item__name text-[10px] text-outline uppercase font-label">${escapeHtml(l.name)}</div>`;
      langGrid.appendChild(cell);
    });

    const intSection = root.querySelector(".personal-interests");
    intSection.querySelector(".personal-panel__heading").innerHTML = `
      <span class="material-symbols-outlined text-primary">${escapeHtml(data.interests.headingIcon)}</span>
      <span class="personal-panel__heading-text"> ${escapeHtml(data.interests.heading)}</span>`;
    const flex = intSection.querySelector(".interests-list");
    flex.innerHTML = "";
    data.interests.items.forEach((it) => {
      const chip = document.createElement("div");
      chip.className =
        "interest-chip flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-all cursor-default border border-transparent hover:border-primary/20";
      chip.innerHTML = `<span class="material-symbols-outlined text-sm">${escapeHtml(it.icon)}</span> ${escapeHtml(it.label)}`;
      flex.appendChild(chip);
    });
  }

  function renderFooter(root, data) {
    root.querySelector(".site-footer__name").innerHTML = `${escapeHtml(data.name)} <span class="text-[#00daf3]">${escapeHtml(data.yearBadge)}</span>`;
    const nav = root.querySelector(".site-footer__social");
    nav.innerHTML = "";
    data.socialLinks.forEach((s) => {
      const a = document.createElement("a");
      a.className =
        "site-footer__social-link text-[#dfe2eb]/60 hover:text-[#00daf3] transition-all hover:translate-y-[-2px]";
      a.href = s.href;
      a.textContent = s.label;
      nav.appendChild(a);
    });
    root.querySelector(".site-footer__copyright").textContent = data.copyright;
  }

  async function render() {
    const [
      meta,
      navigation,
      hero,
      skills,
      experience,
      projects,
      education,
      achievements,
      personal,
      footer,
    ] = await Promise.all([
      loadJson("meta"),
      loadJson("navigation"),
      loadJson("hero"),
      loadJson("skills"),
      loadJson("experience"),
      loadJson("projects"),
      loadJson("education"),
      loadJson("achievements"),
      loadJson("personal"),
      loadJson("footer"),
    ]);

    document.title = meta.documentTitle;
    renderNav(document.querySelector(".site-header"), navigation);
    renderHero(document.querySelector(".hero"), hero);
    renderSkills(document.querySelector(".section-toolchain"), skills);
    renderExperience(document.querySelector(".section-career"), experience);
    renderProjects(document.querySelector(".section-projects"), projects);
    renderEducation(document.querySelector(".section-education"), education);
    renderAchievements(document.querySelector(".section-achievements"), achievements);
    renderPersonal(document.querySelector(".section-personal"), personal);
    renderFooter(document.querySelector(".site-footer"), footer);
  }

  function initBehavior() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 150) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(current)) {
          link.classList.add("active");
        }
      });
    });

    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const line = entry.target.querySelector(".timeline-line");
          if (line) line.classList.add("animate");
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    }, observerOptions);

    document.querySelectorAll("section").forEach((section) => {
      observer.observe(section);
    });

    const bubbles = document.querySelectorAll(".floating-bubble");
    const baseOffsets = Array.from(bubbles, (bubble) => ({
      left: bubble.offsetLeft,
      top: bubble.offsetTop,
    }));

    const updateBubbles = () => {
      const scrollY = window.scrollY;
      bubbles.forEach((bubble, idx) => {
        const speed = Number(bubble.dataset.speed) || 0.25;
        bubble.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
      });
    };

    window.addEventListener("scroll", updateBubbles);
    window.addEventListener("resize", updateBubbles);
    updateBubbles();

    if (window.matchMedia("(pointer: fine)").matches) {
      const cursorDot = document.getElementById("cursor-dot");
      const cursorRing = document.getElementById("cursor-ring");
      if (cursorDot && cursorRing && typeof gsap !== "undefined") {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;

        window.addEventListener("mousemove", (event) => {
          mouseX = event.clientX;
          mouseY = event.clientY;
          gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.08, ease: "power1.out" });
        });

        const animateRing = () => {
          ringX += (mouseX - ringX) * 0.14;
          ringY += (mouseY - ringY) * 0.14;
          gsap.set(cursorRing, { x: ringX, y: ringY });
          requestAnimationFrame(animateRing);
        };
        animateRing();

        const interactiveTargets = "a, button, .hover-card-glow, .nav-link";
        document.querySelectorAll(interactiveTargets).forEach((item) => {
          item.addEventListener("mouseenter", () => {
            cursorRing.classList.add("cursor-hover");
          });
          item.addEventListener("mouseleave", () => {
            cursorRing.classList.remove("cursor-hover");
          });
        });
      }
    }
  }

  function showError(err) {
    const main = document.querySelector("main");
    if (main) {
      const div = document.createElement("div");
      div.className = "max-w-xl mx-auto p-6 rounded-xl bg-error-container text-on-error-container text-sm";
      div.innerHTML = `<p class="font-headline font-bold mb-2">Could not load content</p><p>${escapeHtml(err.message)}</p><p class="mt-2 opacity-90">Serve this folder over HTTP (for example: <code class="font-mono">python3 -m http.server</code>) so JSON files can be fetched.</p>`;
      main.prepend(div);
    }
    console.error(err);
  }

  render()
    .then(() => initBehavior())
    .catch(showError);
})();
