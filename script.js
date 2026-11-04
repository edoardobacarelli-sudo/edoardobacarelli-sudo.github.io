(() => {
  'use strict';
  const readSetting = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const saveSetting = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalTitle = document.title;
  let language = ['en', 'nl', 'it'].includes(readSetting('language')) ? readSetting('language') : 'en';
  let theme = ['light', 'dark'].includes(readSetting('eb-theme')) ? readSetting('eb-theme') : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const navigation = document.getElementById('nav');
  const menu = document.querySelector('.menu');
  const controls = document.createElement('div');
  controls.className = 'header-controls';
  controls.innerHTML = '<button class="theme-toggle" type="button" role="switch" aria-checked="false" aria-label="Switch to dark mode" title="Switch to dark mode"><span class="switch-sun" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg></span><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span><span class="switch-moon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486A9 9 0 1 1 11.51 3.012a7 7 0 0 0 9.475 9.475z"/></svg></span></button><label class="language-control"><span class="visually-hidden">Language</span><select aria-label="Language" data-no-translate><option value="en">English</option><option value="nl">Nederlands</option><option value="it">Italiano</option></select></label>';
  navigation.before(controls);
  const themeButton = controls.querySelector('.theme-toggle');
  const languageSelect = controls.querySelector('select');
  languageSelect.value = language;
  function translated(source) {
    if (language === 'en') return source;
    const dictionary = window.TRANSLATIONS?.[language] || {};
    const stripped = source.trim();
    const value = dictionary[source] ?? dictionary[stripped];
    return value == null ? source : source.replace(stripped, value);
  }
  function translatePage() {
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('script,style,[data-no-translate]') || !node.textContent.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!originalText.has(node)) originalText.set(node, node.textContent);
      node.textContent = translated(originalText.get(node));
    }
    document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(element => {
      let saved = originalAttributes.get(element);
      if (!saved) { saved = {}; originalAttributes.set(element, saved); }
      ['aria-label', 'title', 'placeholder'].forEach(attribute => {
        if (!element.hasAttribute(attribute)) return;
        if (!(attribute in saved)) saved[attribute] = element.getAttribute(attribute);
        element.setAttribute(attribute, translated(saved[attribute]));
      });
    });
    document.title = translated(originalTitle);
  }
  // Dynamic text is always written from an English source, then translated.
  function setSource(element, text) {
    element.textContent = text;
    originalText.set(element.firstChild, text);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-checked', String(theme === 'dark'));
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    originalAttributes.set(themeButton, {'aria-label': label, title: label});
    themeButton.setAttribute('aria-label', translated(label));
    themeButton.title = translated(label);
  }
  themeButton.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; saveSetting('eb-theme', theme); applyTheme(); });
  languageSelect.addEventListener('change', () => { language = languageSelect.value; saveSetting('language', language); translatePage(); });
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); }
  });
  const filters = document.querySelectorAll('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
      const show = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
      card.hidden = !show; if (show) count++;
    });
    setSource(document.querySelector('.filter-count'), `Showing ${count} project${count === 1 ? '' : 's'}`);
    translatePage();
  }));
  const workflowContent = [
    ['Define the business question', 'Identify the decision, intended audience and limits of the available data before selecting tools.'],
    ['Audit the data', 'Check data provenance, missing records, duplicates and metric definitions. Document exclusions and assumptions.'],
    ['Analyze and validate', 'Choose appropriate comparisons and check that calculations and conclusions follow from the data.'],
    ['Communicate a decision', 'Present findings, limitations and recommended next steps. Distinguish proposals from measured outcomes.']
  ];
  document.querySelectorAll('[data-workflow]').forEach(group => group.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    group.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const content = workflowContent[Number(button.dataset.step)], panel = group.querySelector('.workflow-detail');
    setSource(panel.querySelector('h3'), content[0]); setSource(panel.querySelector('p'), content[1]); translatePage();
  })));
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activate(tab) {
    tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !selected; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(tabs[next]); tabs[next].focus(); }
    });
  });
  const cards = [...document.querySelectorAll('.project-card')];
  cards.forEach(card => {
    card.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') card.classList.add('touch-active'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(event => card.addEventListener(event, () => card.classList.remove('touch-active')));
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)); }, { rootMargin: '-25% 0px -25% 0px', threshold: .5 });
    cards.forEach(card => observer.observe(card));
  }
  applyTheme(); translatePage();
  window.applyPortfolioLanguage = translatePage;
})();
