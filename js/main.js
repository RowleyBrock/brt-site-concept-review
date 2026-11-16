(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character];
    });
  }

  const catalogContainer = document.querySelector('#research-catalog');
  if (catalogContainer && window.BRT_RESEARCH_CATALOG) {
    const serviceLabels = {
      participation: 'Participation & accessibility',
      alignment: 'Standards & alignment',
      psychometrics: 'Psychometrics & validity',
      reporting: 'Reporting & growth',
      technology: 'Technology & data'
    };
    catalogContainer.innerHTML = window.BRT_RESEARCH_CATALOG.map(function (record) {
      const authorText = record.authors.length ? record.authors.join(', ') : 'See source record';
      const yearText = record.year || 'Ongoing collection';
      const categories = record.categories.join(' ');
      const methods = (record.methods || []).join(', ');
      const publicationType = record.publicationType || (record.doi ? 'Journal article' : 'Research record');
      const identifier = record.doi ? 'DOI: ' + record.doi : (record.reportNumber ? 'BRT Technical Report ' + record.reportNumber : 'Official source record');
      const tags = record.services.map(function (service) {
        return '<span class="tag">' + escapeHtml(serviceLabels[service] || service) + '</span>';
      }).join('');
      return '<li class="report research-record" id="' + escapeHtml(record.id) + '" data-report data-categories="' + escapeHtml(categories) + '" data-researchers="' + escapeHtml(record.authors.join('|')) + '" data-methods="' + escapeHtml(methods) + '" data-services="' + escapeHtml(record.services.join('|')) + '" data-publication-type="' + escapeHtml(publicationType) + '" data-year="' + escapeHtml(record.year || '') + '">' +
        '<p class="eyebrow">Verified BRT research</p><h3>' + escapeHtml(record.title) + '</h3>' +
        '<p>' + escapeHtml(record.summary) + '</p><p><strong>Technical contribution:</strong> ' + escapeHtml(record.contributions) + '</p>' +
        (methods ? '<p><strong>Research methods:</strong> ' + escapeHtml(methods) + '</p>' : '') +
        '<dl class="citation"><div><dt>Authors</dt><dd>' + escapeHtml(authorText) + '</dd></div>' +
        '<div><dt>Year</dt><dd>' + escapeHtml(yearText) + '</dd></div>' +
        '<div><dt>Publication type</dt><dd>' + escapeHtml(publicationType) + '</dd></div>' +
        '<div><dt>Related services</dt><dd>' + escapeHtml(record.services.map(function (service) { return serviceLabels[service] || service; }).join(', ')) + '</dd></div>' +
        '<div><dt>Identifier</dt><dd>' + escapeHtml(identifier) + '</dd></div>' +
        '<div><dt>Evidence status</dt><dd>' + escapeHtml(record.evidenceStatus || 'Verified BRT public record') + '</dd></div></dl>' +
        '<div class="tags">' + tags + '</div><a class="publication-link" href="' + escapeHtml(record.sourceUrl) + '">' + escapeHtml(record.sourceLabel) + '</a></li>';
    }).join('');
  }

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (event) {
      if (event.target.matches('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      }
    });
  }

  const search = document.querySelector('#report-search');
  const filter = document.querySelector('#report-filter');
  const filterPanel = document.querySelector('.filter-panel');
  function addCatalogFilter(id, label, values) {
    if (!filterPanel || !values.length) return null;
    const field = document.createElement('div'); field.className = 'field';
    field.innerHTML = '<label for="' + id + '">' + label + '</label><select id="' + id + '"><option value="">All</option>' + values.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join('') + '</select>';
    filterPanel.appendChild(field); return field.querySelector('select');
  }
  const catalog = window.BRT_RESEARCH_CATALOG || [];
  const unique = function (values) { return Array.from(new Set(values.filter(Boolean))).sort(function (a, b) { return String(a).localeCompare(String(b)); }); };
  const researcherFilter = addCatalogFilter('researcher-filter', 'Filter by researcher', unique(catalog.flatMap(function (r) { return r.authors || []; })));
  const methodFilter = addCatalogFilter('method-filter', 'Filter by method', unique(catalog.flatMap(function (r) { return r.methods || []; })));
  const serviceFilter = addCatalogFilter('service-filter', 'Filter by service area', unique(catalog.flatMap(function (r) { return r.services || []; })));
  const typeFilter = addCatalogFilter('publication-type-filter', 'Filter by publication type', unique(catalog.map(function (r) { return r.publicationType || (r.doi ? 'Journal article' : 'Research record'); })));
  const yearFilter = addCatalogFilter('year-filter', 'Filter by year', unique(catalog.map(function (r) { return r.year ? String(r.year) : ''; })).reverse());
  const reports = Array.from(document.querySelectorAll('[data-report]'));
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#no-results');

  function updateReports() {
    if (!reports.length) return;
    const query = search.value.trim().toLowerCase();
    const category = filter.value;
    const selected = [researcherFilter, methodFilter, serviceFilter, typeFilter, yearFilter].map(function (field) { return field ? field.value.toLowerCase() : ''; });
    let visible = 0;
    reports.forEach(function (report) {
      const categories = report.dataset.categories.split(' ');
      const attributes = [report.dataset.researchers, report.dataset.methods, report.dataset.services, report.dataset.publicationType, report.dataset.year].map(function (value) { return (value || '').toLowerCase(); });
      const matches = (!query || report.textContent.toLowerCase().includes(query)) && (!category || categories.includes(category)) && selected.every(function (value, index) { return !value || attributes[index].split('|').includes(value); });
      report.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = visible + (visible === 1 ? ' report' : ' reports');
    empty.hidden = visible !== 0;
  }

  if (search && filter) {
    search.addEventListener('input', updateReports);
    filter.addEventListener('change', updateReports);
    [researcherFilter, methodFilter, serviceFilter, typeFilter, yearFilter].filter(Boolean).forEach(function (field) { field.addEventListener('change', updateReports); });
    updateReports();
  }

  const content = window.BRT_CONTENT;
  if (content) {
    document.querySelectorAll('[data-range]').forEach(function (element) {
      element.textContent = content.engagementRanges[element.dataset.range] || '';
    });
    document.querySelectorAll('[data-planning-note]').forEach(function (element) {
      element.textContent = content.planningRangeNote;
    });
    document.querySelectorAll('[data-range-option]').forEach(function (option) {
      const range = content.engagementRanges[option.dataset.rangeOption];
      if (range) option.textContent = option.dataset.label + ' (' + range + ' planning range)';
    });
  }

  const inquiryForm = document.querySelector('#inquiry-form');
  if (inquiryForm) {
    const params = new URLSearchParams(window.location.search);
    ['audience', 'service', 'engagement'].forEach(function (name) {
      const field = inquiryForm.elements[name];
      if (field && params.has(name)) field.value = params.get(name);
    });

    inquiryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!inquiryForm.reportValidity()) return;
      const data = new FormData(inquiryForm);
      const serviceLabel = inquiryForm.elements.service.selectedOptions[0].text;
      const engagementLabel = inquiryForm.elements.engagement.selectedOptions[0].text;
      const audienceLabel = inquiryForm.elements.audience.selectedOptions[0].text;
      const subject = 'BRT Peer Review Services inquiry: ' + serviceLabel;
      const body = [
        'Organization: ' + data.get('organization'),
        'Organization type: ' + audienceLabel,
        'Contact name: ' + data.get('contactName'),
        'Contact email: ' + data.get('contactEmail'),
        '',
        'Technical service: ' + serviceLabel,
        'Engagement level: ' + engagementLabel,
        'Desired timeline: ' + data.get('timeline'),
        '',
        'Project or technical question:',
        data.get('project')
      ].join('\n');
      const mailto = 'mailto:brt@uoregon.edu?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      const status = document.querySelector('#form-status');
      status.hidden = false;
      status.textContent = 'Your email application will open with the inquiry details. Review the message, then send it to BRT.';
      window.location.href = mailto;
    });
  }

  const serviceByPath = {
    'participation-accessibility-implementation.html': 'participation',
    'standards-alignment-assessment-design.html': 'alignment',
    'psychometrics-validity-reliability.html': 'psychometrics',
    'reporting-growth-data-use.html': 'reporting',
    'technology-stack-data-management.html': 'technology',
    'assessment-forensics-test-security.html': 'test-security',
    'automated-scoring-evaluation-validation.html': 'automated-scoring',
    'measurement-fairness-dif-analysis.html': 'measurement-fairness'
  };
  const currentFile = window.location.pathname.split('/').pop();
  if (serviceByPath[currentFile]) {
    document.querySelectorAll('main a[href="../contact.html"]').forEach(function (link) {
      link.href = '../contact.html?service=' + serviceByPath[currentFile];
      link.textContent = 'Discuss this service with BRT';
    });
    function renderRelatedTeam() {
      const teamCatalog = window.BRT_TEAM_CATALOG || [];
      const relatedTeam = teamCatalog.filter(function (profile) {
        return profile.services.includes(serviceByPath[currentFile]);
      }).slice(0, 3);
      const main = document.querySelector('main');
      const finalSection = main && main.querySelector('section:last-of-type');
      if (main && finalSection && relatedTeam.length && !document.querySelector('.team-grid')) {
        const section = document.createElement('section');
        section.className = 'section mist';
        section.innerHTML = '<div class="container"><div class="section-head"><div><p class="eyebrow">BRT expertise</p><h2>Related official team profiles</h2><p>Explore verified BRT profiles related to this service area. Profile links do not imply a project staffing commitment.</p></div></div><div class="team-grid">' + relatedTeam.map(function (profile) {
          return '<article class="team-card"><h3>' + escapeHtml(profile.name) + '</h3><p class="role">' + escapeHtml(profile.role) + '</p><p>' + escapeHtml(profile.expertise) + '</p><a class="text-link" href="' + escapeHtml(profile.profileUrl) + '">View official BRT profile directory</a></article>';
        }).join('') + '</div></div>';
        main.insertBefore(section, finalSection);
      }
    }
    if (window.BRT_TEAM_CATALOG) {
      renderRelatedTeam();
    } else {
      const catalogScript = document.createElement('script');
      catalogScript.src = '../js/research-catalog.js';
      catalogScript.addEventListener('load', renderRelatedTeam);
      document.head.appendChild(catalogScript);
    }
  }
})();
