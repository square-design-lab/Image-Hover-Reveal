(function () {
  'use strict';

  var CDN_CSS = 'https://cdn.example.com/image-reveal.css';
  var CDN_JS = 'https://cdn.example.com/image-reveal.min.js';

  var seedItems = [
    {
      title: 'Precision Under Load',
      excerpt: 'Techniques for maintaining expressive UI while scaling operational complexity.',
      link: 'https://example.com/precision-under-load',
      image: 'https://picsum.photos/id/1005/960/1200',
      author: 'Lio Hart',
      date: '2026-01-19',
      dateLabel: 'Jan 19, 2026'
    },
    {
      title: 'Interfaces that Explain Themselves',
      excerpt: 'Lower support tickets with intent-first defaults and clearer state transitions.',
      link: 'https://example.com/interfaces-explain-themselves',
      image: 'https://picsum.photos/id/1011/960/1200',
      author: 'Nora Lee',
      date: '2026-01-23',
      dateLabel: 'Jan 23, 2026'
    },
    {
      title: 'Cross-Team Motion Language',
      excerpt: 'A practical way to standardize interaction behavior without slowing delivery.',
      link: 'https://example.com/cross-team-motion-language',
      image: 'https://picsum.photos/id/1020/960/1200',
      author: 'Omar Voss',
      date: '2026-01-27',
      dateLabel: 'Jan 27, 2026'
    },
    {
      title: 'Clarity in Dense Surfaces',
      excerpt: 'Information-rich layouts can still be calm when hierarchy remains strict.',
      link: 'https://example.com/clarity-dense-surfaces',
      image: 'https://picsum.photos/id/1031/960/1200',
      author: 'Rin Park',
      date: '2026-02-01',
      dateLabel: 'Feb 1, 2026'
    },
    {
      title: 'Quality Signals at a Glance',
      excerpt: 'Readers scan first; your structure should reveal trust instantly.',
      link: 'https://example.com/quality-signals',
      image: 'https://picsum.photos/id/1041/960/1200',
      author: 'Sora Hale',
      date: '2026-02-03',
      dateLabel: 'Feb 3, 2026'
    },
    {
      title: 'Systems Thinking for UI Detail',
      excerpt: 'Small visual rules compound into major product coherence.',
      link: 'https://example.com/systems-thinking-ui-detail',
      image: 'https://picsum.photos/id/1059/960/1200',
      author: 'Tali Knox',
      date: '2026-02-06',
      dateLabel: 'Feb 6, 2026'
    }
  ];

  var app = document.getElementById('cfgApp');
  var sidebar = document.getElementById('cfgSidebar');
  var menuBtn = document.getElementById('menuBtn');
  var previewStage = document.getElementById('previewStage');
  var codeOutput = document.getElementById('codeOutput');
  var copyBtn = document.getElementById('copyCodeBtn');
  var copyStatus = document.getElementById('copyStatus');

  var controls = {
    layout: document.getElementById('layoutSelect'),
    preset: document.getElementById('presetSelect'),
    speed: document.getElementById('speedSelect'),
    durationWrap: document.getElementById('durationWrap'),
    duration: document.getElementById('durationInput'),
    easing: document.getElementById('easingInput'),

    follow: document.getElementById('followCursorToggle'),
    drift: document.getElementById('driftToggle'),
    rotationToggle: document.getElementById('rotationToggle'),
    rotationWrap: document.getElementById('rotationWrap'),
    rotation: document.getElementById('rotationInput'),

    alternate: document.getElementById('alternateToggle'),
    hoverLiftToggle: document.getElementById('hoverLiftToggle'),
    hoverLiftWrap: document.getElementById('hoverLiftWrap'),
    hoverLift: document.getElementById('hoverLiftInput'),

    offsetRightWrap: document.getElementById('offsetRightWrap'),
    offsetRight: document.getElementById('offsetRightInput'),
    offsetX: document.getElementById('offsetXInput'),
    offsetY: document.getElementById('offsetYInput'),

    rollover: document.getElementById('rolloverToggle'),
    rowBg: document.getElementById('rowBgToggle'),
    inwardWrap: document.getElementById('inwardWrap'),
    inward: document.getElementById('inwardSlideInput'),

    showMobile: document.getElementById('showMobileToggle'),
    accordion: document.getElementById('accordionToggle'),
    singleOpen: document.getElementById('singleOpenToggle')
  };

  var state = {
    previewDevice: 'desktop'
  };

  function asNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function renderSeedSummary() {
    var list = document.querySelector('#image-reveal-preview .summary-item-list');
    var template = document.getElementById('summaryItemTemplate');

    list.innerHTML = '';

    seedItems.forEach(function (item, index) {
      var node = template.content.firstElementChild.cloneNode(true);
      node.classList.toggle('sqs-active-slide', index === 0);

      var img = node.querySelector('.summary-thumbnail-image');
      img.src = item.image;
      img.alt = item.title;

      var thumbLink = node.querySelector('.summary-thumbnail-container');
      thumbLink.href = item.link;

      var title = node.querySelector('.summary-title-link');
      title.textContent = item.title;
      title.href = item.link;

      var excerpt = node.querySelector('.summary-excerpt p');
      excerpt.textContent = item.excerpt;

      var dateNodes = node.querySelectorAll('.summary-metadata-item--date');
      dateNodes.forEach(function (dateNode) {
        dateNode.textContent = item.dateLabel;
        dateNode.setAttribute('datetime', item.date);
      });

      var authorNodes = node.querySelectorAll('.summary-metadata-item--author a');
      authorNodes.forEach(function (author) {
        author.textContent = item.author;
        author.href = item.link;
      });

      var readMore = node.querySelector('.summary-read-more-link');
      readMore.href = item.link;

      list.appendChild(node);
    });
  }

  function syncControlVisibility() {
    controls.durationWrap.classList.toggle('is-hidden', controls.speed.value !== 'custom');
    controls.rotationWrap.classList.toggle('is-hidden', !controls.rotationToggle.checked);
    controls.hoverLiftWrap.classList.toggle('is-hidden', !controls.hoverLiftToggle.checked);
    controls.offsetRightWrap.classList.toggle('is-hidden', controls.layout.value !== 'title-left-image-custom');
    controls.inwardWrap.classList.toggle('is-hidden', !controls.rowBg.checked);
    controls.singleOpen.closest('label').classList.toggle('is-hidden', !controls.accordion.checked);
  }

  function enforceModeToggles(changed) {
    if (changed === 'follow' && controls.follow.checked) {
      controls.drift.checked = false;
    }
    if (changed === 'drift' && controls.drift.checked) {
      controls.follow.checked = false;
    }

    if (changed === 'alternate') {
      if (controls.alternate.checked) {
        controls.layout.value = 'alternating-centered';
      } else if (controls.layout.value === 'alternating-centered') {
        controls.layout.value = 'left-content-right-image';
      }
    }

    if (changed === 'layout') {
      controls.alternate.checked = controls.layout.value === 'alternating-centered';
    }
  }

  function getConfig(forCode) {
    var mode = 'fixed';
    if (controls.follow.checked) {
      mode = 'followCursor';
    } else if (controls.drift.checked) {
      mode = 'drift';
    }

    var config = {
      target: '#image-reveal-preview',
      instanceId: 'config-preview',
      layout: controls.layout.value,
      animation: {
        preset: controls.preset.value,
        speed: controls.speed.value,
        durationMs: asNumber(controls.duration.value, 650),
        easing: controls.easing.value.trim() || 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      reveal: {
        mode: mode,
        rotationDeg: controls.rotationToggle.checked ? asNumber(controls.rotation.value, 4) : 0,
        hoverLiftY: controls.hoverLiftToggle.checked ? asNumber(controls.hoverLift.value, 24) : 0,
        offsetRightPx: asNumber(controls.offsetRight.value, 80),
        offsetX: asNumber(controls.offsetX.value, 0),
        offsetY: asNumber(controls.offsetY.value, 0)
      },
      textEffects: {
        rollover: controls.rollover.checked,
        inwardSlidePx: controls.rowBg.checked ? asNumber(controls.inward.value, 10) : 0
      },
      rowHover: {
        bgEnabled: controls.rowBg.checked,
        bgColor: 'rgba(173, 231, 250, 0.12)'
      },
      mobile: {
        showEffectOnMobile: controls.showMobile.checked,
        accordionMode: controls.accordion.checked,
        accordionSingleOpen: controls.singleOpen.checked,
        forceMode: state.previewDevice
      }
    };

    if (forCode) {
      delete config.mobile.forceMode;
      config.target = '.page-section-id-or-selector';
      delete config.instanceId;
    }

    return config;
  }

  function buildCode() {
    var embedConfig = getConfig(true);
    var configJson = JSON.stringify(embedConfig, null, 2);

    return [
      '<link rel="stylesheet" href="' + CDN_CSS + '">',
      '<script src="' + CDN_JS + '" defer><\/script>',
      '<script>',
      'window.ImageRevealHover.init(' + configJson + ');',
      '<\/script>'
    ].join('\n');
  }

  function renderCode() {
    codeOutput.textContent = buildCode();
  }

  function renderPreview() {
    if (!window.ImageRevealHover) {
      return;
    }

    var config = getConfig(false);
    window.ImageRevealHover.destroy('config-preview');
    window.ImageRevealHover.init(config);
  }

  function applyAll() {
    syncControlVisibility();
    renderPreview();
    renderCode();
  }

  function setDevice(device) {
    state.previewDevice = device;
    previewStage.setAttribute('data-device', device);

    var buttons = document.querySelectorAll('.cfg-device-switch button');
    buttons.forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-device') === device);
    });

    renderPreview();
  }

  function copyCode() {
    var text = codeOutput.textContent;
    navigator.clipboard
      .writeText(text)
      .then(function () {
        copyStatus.textContent = 'Copied';
        copyStatus.classList.add('is-success');
        copyBtn.textContent = 'Copied';
        window.setTimeout(function () {
          copyStatus.textContent = 'Ready';
          copyStatus.classList.remove('is-success');
          copyBtn.textContent = 'Copy Embed Code';
        }, 1400);
      })
      .catch(function () {
        copyStatus.textContent = 'Clipboard blocked';
      });
  }

  function bindControls() {
    Object.keys(controls).forEach(function (key) {
      var control = controls[key];
      if (!control || !control.addEventListener || key.endsWith('Wrap')) {
        return;
      }

      control.addEventListener('change', function () {
        enforceModeToggles(key.replace('Toggle', ''));
        applyAll();
      });

      if (control.tagName === 'INPUT' && (control.type === 'text' || control.type === 'number')) {
        control.addEventListener('input', function () {
          applyAll();
        });
      }
    });

    document.querySelectorAll('.cfg-device-switch button').forEach(function (button) {
      button.addEventListener('click', function () {
        setDevice(button.getAttribute('data-device'));
      });
    });

    copyBtn.addEventListener('click', copyCode);

    menuBtn.addEventListener('click', function () {
      var open = app.classList.toggle('is-sidebar-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('pointerdown', function (event) {
      if (window.innerWidth > 1100) {
        return;
      }
      if (!app.classList.contains('is-sidebar-open')) {
        return;
      }
      if (sidebar.contains(event.target) || menuBtn.contains(event.target)) {
        return;
      }
      app.classList.remove('is-sidebar-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  }

  function init() {
    renderSeedSummary();
    bindControls();
    setDevice('desktop');
    applyAll();
  }

  init();
})();

