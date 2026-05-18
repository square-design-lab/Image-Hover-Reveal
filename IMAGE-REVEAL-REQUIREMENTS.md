# Image Reveal on Hover — Plugin Requirements

**Version:** 1.0.0  
**Platform:** Squarespace (List / Summary V2 Block sections)  
**Distribution:** LemonSqueezy → Configuration UI Dashboard → Copy/Paste embed code  

---

## 1. Overview

Image Reveal on Hover is a JavaScript + CSS plugin that transforms a Squarespace **Summary V2 / List section** block into an animated, magazine-style row list. When a visitor hovers over a row on desktop, a floating image preview appears beside it. On mobile, the same content is accessible via a tap-to-expand effect or accordion. The plugin reads the existing Squarespace HTML, extracts content, rebuilds the layout as semantic rows, then hides the original block.

---

## 2. Product & Distribution Model

| Concern | Detail |
|---|---|
| Sold via | LemonSqueezy |
| Deliverable | Access to a hosted Configuration UI Dashboard |
| Output | A snippet of embed code (HTML `<link>`, `<script>` tags + `ImageRevealHover.init(…)` call) |
| Plugin assets | `image-reveal.css` and `image-reveal.min.js` hosted on a CDN |
| Squarespace installation | User pastes the generated code into a Squarespace **Code Block** or **Code Injection** area |

The buyer never edits JavaScript manually. The Configuration UI generates all code.

---

## 3. Supported Squarespace Markup

The plugin is designed to work with **Squarespace Summary V2 / List section** HTML. It scans for the following selectors:

### 3.1 Container Discovery

| Method | Detail |
|---|---|
| Default auto-discovery | Scans the page for all elements whose `id` matches `/^image-reveal(?:-\d+)?$/` (e.g. `image-reveal`, `image-reveal-1`, `image-reveal-2`) |
| CSS selector | Any valid CSS selector string passed to `target` |
| DOM node(s) | An element, NodeList, HTMLCollection, or array of elements |

### 3.2 Summary Block Detection

Within each container, the plugin looks for:

- `.sqs-block.summary-v2-block`
- `.sqs-block-summary-v2`
- Fallback: `.summary-block-wrapper` or `.summary-item-list`

It filters to blocks that contain at least one `.summary-item`.

### 3.3 Item Data Extraction

For each `.summary-item`, the plugin extracts:

| Field | Source selectors |
|---|---|
| `title` | `.summary-title-link`, `.summary-title a`, `.summary-title` (text content) |
| `titleHtml` | Inner HTML of the title link (preserves formatting) |
| `href` | Title link → CTA link → thumbnail link (first non-empty `href`) |
| `target` / `rel` | From the title link element |
| `excerptHtml` | `.summary-excerpt` inner HTML |
| `excerptText` | `.summary-excerpt` text content |
| `meta` | All `.summary-metadata-item` elements; deduped; joined with ` \| ` |
| `imageSrc` | Priority order: `currentSrc` → `src` → `data-src` → `data-image` → `data-image-url` → `srcset` (last entry) → `data-srcset` → CSS `background-image` on `.summary-thumbnail` / `.img-wrapper` |
| `imageAlt` | `img[alt]`, falls back to item title |
| `cta` | `.summary-read-more-link`, `.summary-item-read-more-link`, `.summary-button-container a`, `.sqs-block-button-element`, `a[class*="read-more"]` — captures `text`, `href`, `target`, `rel` |

Items with no title, excerpt, image, or href are silently skipped.

---

## 4. Plugin Architecture

### 4.1 Public API (`window.ImageRevealHover`)

```js
// Initialise one or more instances
ImageRevealHover.init(config)       // → string[] of instance IDs created

// Destroy instances
ImageRevealHover.destroy()           // destroy all instances
ImageRevealHover.destroy(instanceId) // destroy one instance by ID (prefix match)

// Destroy all then re-init with new config
ImageRevealHover.refresh(config)    // → string[] of instance IDs

ImageRevealHover.version             // "1.0.0"
```

### 4.2 Instance Lifecycle

1. `init(config)` → normalise config → resolve containers → find summary blocks → extract items
2. For each `(container, summaryBlock, items)` triple, create an **instance**:
   - Build `.irh-root` > `.irh-rows` > N × `.irh-row` (article elements)
   - Create a single floating `.irh-preview` appended to `<body>`
   - Insert `.irh-root` immediately after the summary block in the DOM
   - Add `irh-source-hidden` class to the original summary block (hides it with CSS)
3. `destroy(id)` → remove `.irh-root`, remove `.irh-preview` from body, restore original block visibility, remove all event listeners

### 4.3 Instance State

Each instance tracks:

```
id, config, section, source (original block), root, rows[],
cleanup[] (teardown functions), preview { el, img },
media { mobile: MediaQueryList, reduced: MediaQueryList },
state {
  activeRow, mouseTrackingBound,
  currentX, currentY,   ← rendered position
  targetX, targetY,     ← lerp target
  baseX, baseY,         ← position anchored to row
  rafId
}
```

---

## 5. Configuration Schema

All options are passed to `ImageRevealHover.init()`. Every key is optional; unset keys fall back to defaults.

### 5.1 Top-level

| Key | Type | Default | Description |
|---|---|---|---|
| `target` | string \| Element \| NodeList \| null | `null` | Target container(s). `null` = auto-discover by ID pattern |
| `instanceId` | string \| null | `null` | Override the generated instance ID |
| `layout` | string | `'left-content-right-image'` | Row / image layout variant (see §6) |

### 5.2 `animation`

| Key | Type | Default | Description |
|---|---|---|---|
| `preset` | string | `'fade-slide-scale'` | CSS animation preset name (see §7) |
| `speed` | string | `'medium'` | `'slow'` \| `'medium'` \| `'fast'` \| `'custom'` |
| `durationMs` | number | `650` | Used only when `speed === 'custom'`; clamped 120–4000 ms |
| `easing` | string | `'cubic-bezier(0.22, 1, 0.36, 1)'` | CSS easing for the preview enter/exit transition |

Speed map: `slow` = 850 ms, `medium` = 650 ms, `fast` = 420 ms.

### 5.3 `reveal`

| Key | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `'fixed'` | `'fixed'` \| `'followCursor'` \| `'drift'` |
| `rotationDeg` | number | `4` | Preview card tilt in degrees (0 = no tilt) |
| `hoverLiftY` | number | `24` | Pixels the preview floats above the top edge of the hovered row |
| `offsetRightPx` | number | `80` | Right margin (px from right viewport edge) used by `title-left-image-custom` layout |
| `offsetX` | number | `0` | Additional horizontal nudge applied to all layouts |
| `offsetY` | number | `0` | Additional vertical nudge applied to all layouts |

> **Legacy shorthand** (still accepted but normalised): `reveal.followCursor: true` maps to `mode: 'followCursor'`; `reveal.drift: true` maps to `mode: 'drift'`.

### 5.4 `textEffects`

| Key | Type | Default | Description |
|---|---|---|---|
| `rollover` | boolean | `false` | Title ghost-roll animation on row hover (duplicate title slides up from below) |
| `inwardSlidePx` | number | `10` | Distance (px) row text slides inward on hover; 0 = disabled. Automatically negated for `right-content-left-image` layout |

### 5.5 `rowHover`

| Key | Type | Default | Description |
|---|---|---|---|
| `bgEnabled` | boolean | `false` | Apply a background tint on the active row |
| `bgColor` | string | `'rgba(255,255,255,0.06)'` | CSS color for the hover background tint |

### 5.6 `mobile`

| Key | Type | Default | Description |
|---|---|---|---|
| `showEffectOnMobile` | boolean | `false` | Enable tap-to-expand with a thumbnail badge on mobile (viewport ≤ 900 px) |
| `accordionMode` | boolean | `false` | Replace mobile tap effect with a full accordion UI |
| `accordionSingleOpen` | boolean | `true` | When `accordionMode` is on: collapse other rows when a new one opens |
| `forceMode` | string | `'auto'` | `'auto'` \| `'desktop'` \| `'mobile'` — override viewport detection (used by Config UI preview; stripped from generated code) |

---

## 6. Layout Variants

Controlled by `config.layout`. Sets `data-layout` attribute on `.irh-root` and determines which side the floating preview appears on.

| Layout value | Preview side | CSS behaviour |
|---|---|---|
| `left-content-right-image` | Right of row | Default; text left, image floats right |
| `right-content-left-image` | Left of row | `.irh-root` gets `text-align: right`; title wrap aligns right; inward slide negated |
| `title-left-image-custom` | Custom right offset | Preview anchored `offsetRightPx` px from the right edge of the viewport |
| `center-image` | Horizontally centered | Preview centered over the row |
| `alternating-centered` | Alternates per row | Even rows → right, odd rows → left; content centered; `.irh-root` gets `text-align: center` |

---

## 7. Animation Presets

Preset name is stored in `data-preset` on `.irh-preview`. CSS transitions and keyframes handle the enter/exit states.

| Preset | Enter behaviour |
|---|---|
| `fade-slide-scale` | Translates up + fades + scales (default combined effect) |
| `fade-slide` | Translates up + fades; no scale |
| `fade-scale` | Scales up + fades; no translate |
| `fade` | Fade only; no movement |
| `cinematic` | Keyframe animation: slides up, overshoots slightly, settles; adds ~1.4° extra tilt on enter |

When `prefers-reduced-motion: reduce` is active, all presets fall back to `fade` and all transition durations are forced to `1ms` via CSS.

---

## 8. Reveal Modes

| Mode | Behaviour |
|---|---|
| `fixed` | Preview snaps to a computed position relative to the row on enter; does not move |
| `followCursor` | Preview follows the mouse cursor in real time (lerp, `requestAnimationFrame` loop) |
| `drift` | Preview anchors to the row position, then drifts ±18 px horizontally / ±14 px vertically based on cursor position within the row bounds (lerp RAF loop) |

Drift and followCursor share a lerp factor of `0.16` per frame (~60 fps).

Preview position clamping: always kept ≥ 16 px from all four viewport edges. If the computed position would overflow the right edge (for a right-side layout), the preview automatically flips to the left side (and vice versa for left-side layout).

---

## 9. Generated DOM Structure

### 9.1 Row container

```html
<div class="irh-root"
     data-irh-instance="<id>"
     data-layout="<layout>"
     data-mobile-effect="<true|false>"
     data-accordion="<true|false>"
     data-row-bg="<true|false>"
     style="--irh-inward-slide: 10px; --irh-row-hover-bg: rgba(…);">

  <div class="irh-rows" role="list">
    <!-- N × irh-row -->
  </div>
</div>
```

### 9.2 Row element

```html
<article class="irh-row"
         role="listitem"
         tabindex="0"
         data-row-index="0"
         data-irh-img="<imageUrl>"
         data-irh-alt="<altText>">

  <!-- Accordion trigger (hidden on desktop via CSS) -->
  <button type="button"
          class="irh-accordion-trigger"
          id="irh-trigger-<id>-<index>"
          aria-expanded="false"
          aria-controls="irh-panel-<id>-<index>">
    Title text
  </button>

  <!-- Desktop + non-accordion mobile layout -->
  <div class="irh-row-main">
    <div class="irh-inline-image-wrap [is-empty]">
      <img class="irh-inline-image" loading="lazy" decoding="async" src="…" alt="…">
    </div>
    <div class="irh-text">
      <div class="irh-title-wrap [is-rollover]">
        <a class="irh-title irh-title-primary" href="…">Title</a>
        <!-- if rollover enabled: -->
        <span class="irh-title irh-title-ghost">Title</span>
      </div>
      <div class="irh-meta">Jan 19, 2026 | Author Name</div>  <!-- if present -->
      <div class="irh-desc"><p>Excerpt text…</p></div>          <!-- if present -->
      <a class="irh-cta" href="…">Read More</a>               <!-- if present -->
    </div>
  </div>

  <!-- Accordion panel (hidden until opened on mobile) -->
  <div class="irh-accordion-panel"
       id="irh-panel-<id>-<index>"
       role="region"
       aria-labelledby="irh-trigger-<id>-<index>"
       hidden>
    <div class="irh-accordion-inner">
      <!-- irh-inline-image-wrap + irh-text (rollover disabled inside accordion) -->
    </div>
  </div>
</article>
```

### 9.3 Floating preview element (appended to `<body>`)

```html
<div class="irh-preview [is-visible]"
     aria-hidden="true"
     data-preset="<preset>"
     style="--irh-duration: 650ms; --irh-easing: …; --irh-rotation: 4deg; transform: translate3d(Xpx, Ypx, 0);">
  <div class="irh-preview-frame">
    <img class="irh-preview-img" alt="" decoding="async" src="…">
  </div>
</div>
```

- One `.irh-preview` per plugin instance.
- Positioned with `position: fixed; top: 0; left: 0`; offset via `translate3d`.
- Size: `clamp(220px, 28vw, 420px)` wide, `aspect-ratio: 4/5`.
- `pointer-events: none` — never blocks clicks.
- `aria-hidden: true` — invisible to screen readers.
- Hidden on mobile viewports (≤ 900 px) via CSS `display: none`.

---

## 10. CSS Custom Properties

### On `.irh-root`

| Property | Set by |
|---|---|
| `--irh-inward-slide` | `config.textEffects.inwardSlidePx` (px; negated for right layout) |
| `--irh-row-hover-bg` | `config.rowHover.bgColor` |
| `--irh-border` | Fixed: `rgba(255, 255, 255, 0.16)` |
| `--irh-title` | Fixed: `#f4f7f8` |
| `--irh-body` | Fixed: `rgba(244, 247, 248, 0.78)` |
| `--irh-muted` | Fixed: `rgba(244, 247, 248, 0.58)` |

### On `.irh-preview`

| Property | Set by |
|---|---|
| `--irh-duration` | `config.animation.durationMs` |
| `--irh-easing` | `config.animation.easing` |
| `--irh-rotation` | `config.reveal.rotationDeg` |

---

## 11. Mobile Behaviour (≤ 900 px)

The plugin has three mutually exclusive mobile modes:

### 11.1 Static list (`showEffectOnMobile: false`, `accordionMode: false`)
Default. Rows render as a standard vertical list with the inline image displayed above the text (column layout). No interactivity added beyond links.

### 11.2 Tap-to-reveal (`showEffectOnMobile: true`, `accordionMode: false`)
- Tapping a row toggles it open (`is-mobile-open` class).
- When open: a 94 × 94 px thumbnail badge appears in the top-right corner; title, meta, excerpt, and CTA become visible.
- When closed: only the title is shown (`min-height: 78px`).
- Only one row is open at a time (tapping another row closes the previous one).
- Tapping outside the plugin root closes all rows.

### 11.3 Accordion (`accordionMode: true`)
- A `<button class="irh-accordion-trigger">` replaces the standard row click target.
- Button has `+` icon that rotates to `×` when open.
- Accordion panel (`irh-accordion-panel`) animates open/closed via `max-height` transition (260 ms).
- `accordionSingleOpen: true` means only one panel can be expanded at a time.
- Accordion panel contains its own copy of the inline image + text column (rollover effect is disabled inside the accordion).
- Keyboard: `Enter` / `Space` on the trigger button toggles the panel.
- ARIA: `aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby` are all wired correctly.

### 11.4 Resize handling
On resize from mobile to desktop: all open touch rows and accordion panels are collapsed. If a row was active (desktop hover), its preview position is recalculated.

---

## 12. Keyboard & Accessibility

| Interaction | Behaviour |
|---|---|
| `Tab` to row | Row receives focus; on desktop, preview shown via `focusin` |
| `Tab` away from row | Preview hidden via `focusout` (unless focus moves to a child element) |
| `Enter` / `Space` on row (desktop) | No default action (links inside are already focusable) |
| `Enter` / `Space` on row (mobile, touch mode) | Toggles tap-to-reveal |
| `Enter` / `Space` on accordion trigger | Toggles accordion panel |
| Accordion trigger | `aria-expanded`, `aria-controls`, `role="region"` |
| Preview element | `aria-hidden="true"`, `pointer-events: none` |
| `prefers-reduced-motion` | All transitions → 1 ms; animations disabled; preset forced to `fade`; mode forced to `fixed` |

---

## 13. Event Handling & Cleanup

Per row: `pointerenter`, `pointerleave`, `focusin`, `focusout`, `keydown`, `click`.  
Per instance: `mousemove` on `window` (bound/unbound dynamically), `resize` on `window`, `pointerdown` on `document` (for outside-click-to-close).

All event listeners are stored in `instance.cleanup[]` and removed by `destroyInstance()`. No global state leaks between `destroy` / `init` cycles.

---

## 14. Configuration UI Dashboard

A standalone web app (`index.html` + `config-ui.css` + `config-ui.js`) used by plugin purchasers to generate embed code without writing code.

### 14.1 Layout

| Region | Description |
|---|---|
| Left sidebar | All controls grouped into labelled sections |
| Main → top bar | Device switcher (Desktop / Mobile), menu button (mobile), Copy Embed Code button |
| Main → preview pane | Live preview of the plugin rendering with seed data |
| Main → code pane | Generated embed code (read-only `<pre>`) |

Responsive: at ≤ 1100 px the sidebar becomes a slide-in drawer triggered by the Menu button.

### 14.2 Control Groups

#### Layout
- **Row / Image layout** — `<select>` mapping to `layout` values (5 options)

#### Animation
- **Preset** — `<select>` (5 options)
- **Speed** — `<select>` (slow / medium / fast / custom)
- **Duration (ms)** — `<input type="number">` (visible only when speed = custom)
- **Easing** — `<input type="text">`

#### Reveal
- **Follow cursor** — checkbox → `reveal.mode = 'followCursor'`
- **Drift motion** — checkbox → `reveal.mode = 'drift'` (mutually exclusive with Follow cursor)
- **Rotation** — checkbox toggle; `rotationDeg` number input (visible when checked)
- **Alternate direction per row** — checkbox; synced with `alternating-centered` layout select
- **Float higher than row** — checkbox toggle; `hoverLiftY` number input (visible when checked)
- **offsetRightPx** — number input (visible only when layout = `title-left-image-custom`)
- **offsetX** — number input
- **offsetY** — number input

#### Text / Row
- **Text rollover** — checkbox
- **Row BG change + text inward slide** — checkbox; `inwardSlidePx` number input (visible when checked)

#### Mobile
- **Show Effect on Mobile** — checkbox
- **Accordion Mode** — checkbox
- **Accordion single open** — checkbox (visible only when Accordion Mode is on)

### 14.3 Mutual Exclusions / Sync Rules

| Action | Rule |
|---|---|
| Enable Follow Cursor | Auto-unchecks Drift Motion |
| Enable Drift Motion | Auto-unchecks Follow Cursor |
| Enable Alternate direction | Forces layout select to `alternating-centered` |
| Disable Alternate direction | Resets layout to `left-content-right-image` (if it was alternating) |
| Change layout to `alternating-centered` | Checks Alternate direction checkbox |
| Change layout away from `alternating-centered` | Unchecks Alternate direction checkbox |

### 14.4 Preview Behaviour
- Seed data: 6 hard-coded items with Picsum images.
- On every control change: `ImageRevealHover.destroy('config-preview')` then `ImageRevealHover.init(config)` (live re-render).
- Device switcher adds `data-device="mobile"` to the preview stage (max-width: 390 px) to simulate mobile viewport; `forceMode: 'mobile'` is injected into config.
- `forceMode` is removed before generating embed code.

### 14.5 Code Generation

The generated embed code block contains:

```html
<link rel="stylesheet" href="https://cdn.example.com/image-reveal.css">
<script src="https://cdn.example.com/image-reveal.min.js" defer></script>
<script>
window.ImageRevealHover.init({
  "target": ".page-section-id-or-selector",
  "layout": "…",
  "animation": { … },
  "reveal": { … },
  "textEffects": { … },
  "rowHover": { … },
  "mobile": { … }
});
</script>
```

`target` is set to `.page-section-id-or-selector` as a placeholder. `instanceId` is omitted.

### 14.6 Copy to Clipboard
- "Copy Embed Code" button uses `navigator.clipboard.writeText()`.
- On success: button text changes to "Copied", status indicator turns green, reverts after 1.4 s.
- On failure: status shows "Clipboard blocked".

---

## 15. CSS Architecture

Two separate CSS files:

| File | Purpose |
|---|---|
| `image-reveal.css` | Plugin UI styles (`irh-*` classes). Deployed to CDN. |
| `config-ui.css` | Dashboard UI styles (`cfg-*` classes). Not shipped to end users. |

### Plugin CSS highlights

- Uses CSS custom properties on `.irh-root` and `.irh-preview` for all configurable values.
- Typographic scale for `.irh-title`: `clamp(1rem, 0.9rem + 0.35vw, 1.34rem)`.
- Preview size: `clamp(220px, 28vw, 420px)` wide, `aspect-ratio: 4/5`.
- Preview `border-radius: 18px`, `box-shadow: 0 18px 70px rgba(5, 11, 14, 0.5)`.
- All transitions respect `prefers-reduced-motion`.
- `.irh-source-hidden` hides the original summary block: `max-height: 0`, `opacity: 0`, `overflow: hidden`, `pointer-events: none`.

### Config UI CSS highlights

- Dark theme: base `#0a1215`, surface `#0f1b21`, accent `#74c4de`.
- Two-column grid (`sidebar | main`) collapsing to single column at ≤ 1100 px.
- Main pane is a 3-row grid: top bar / preview pane / code pane.
- Code pane uses `IBM Plex Mono` for the `<pre>` output.

---

## 16. Known Constraints & Assumptions

1. **Squarespace Summary V2 / List block only.** The plugin does not support Gallery blocks, Portfolio blocks, or custom-coded blocks unless they replicate the `.summary-item` markup.
2. **Images must be rendered in the DOM.** The image extraction logic reads `src`, `currentSrc`, `data-src`, `data-image`, `srcset`, and background-image. Squarespace lazy-loading may delay `currentSrc`; the `src` attribute is always checked as a fallback.
3. **One `.irh-preview` per instance.** Multiple instances on the same page each get their own floating preview element.
4. **CDN URLs are placeholder.** `https://cdn.example.com/image-reveal.css` and `https://cdn.example.com/image-reveal.min.js` must be replaced with real CDN URLs before going live.
5. **`forceMode` is for the Config UI only.** It overrides `matchMedia` for the preview simulation and is never emitted into generated code.
6. **No IE support.** Uses `Map`, `Set`, `requestAnimationFrame`, `matchMedia`, `pointer` events, CSS custom properties, `clamp()`.

---

## 17. Planned / Potential Future Features

The following are not implemented in v1.0.0 but are natural extensions:

- [ ] Per-row custom image override (data attribute)
- [ ] Support for Squarespace **List section** (new 7.1 native list blocks) in addition to Summary V2
- [ ] Image preloading / prefetch on row focus
- [ ] Multiple animation presets per instance (randomised per row)
- [ ] Custom preview aspect ratio control
- [ ] Preview caption / text overlay option
- [ ] Dark / light theme toggle in Config UI
- [ ] URL-shareable Config UI state (query params)
- [ ] Export config as standalone JSON file
- [ ] A11y: announce active row title to screen readers via `aria-live`
- [ ] Touch swipe support for mobile tap mode
- [ ] Scroll-triggered entrance animations for rows on load
- [ ] Config UI: item editor (add/remove/reorder seed items)

---

## 18. File Map

```
plugin/
  image-reveal.js          ← Core plugin (IIFE, no dependencies)
  image-reveal.css         ← Plugin styles

config-ui/
  index.html               ← Config UI dashboard HTML
  config-ui.js             ← Dashboard logic (IIFE, no dependencies)
  config-ui.css            ← Dashboard styles

demo/
  index.html               ← Standalone demo with two sections (image-reveal, image-reveal-1)
```
