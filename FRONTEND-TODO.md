# Frontend TODO

Snapshot of frontend issues surfaced during the 2026-04-21 review.
Items are grouped by priority, then by dimension (a11y / perf / responsive / UX / code-quality).
Every item carries `file:line` so you can jump straight to the spot.

Status checkbox: `[ ]` pending, `[x]` done. When closing an item, keep
the line so the log stays auditable — do not delete resolved entries.

---

## P0 — Must fix (a11y / security / SEO-breaking)

### a11y

- [x] **F1. `<main>` drops focus ring and scrollbar** — `src/layouts/LayoutDefault.astro:42`

  - `outline-none` removes the keyboard focus indicator globally (WCAG 2.4.7).
  - `scrollbar-hide` + `overflow-y-scroll` hides the scroll affordance.
  - Fix: drop `outline-none` or replace with `focus:outline-none focus-visible:ring-2`; style the scrollbar instead of hiding it.

- [x] **F2. Post list items use `<h1>`** — `src/components/PostMeta.astro:17`
  - `PostMeta` is shared between single post and list views. On `[...page].astro` every card renders an `<h1>`, so the home page has 5 H1s.
  - Fix: add a `level: 1 | 2 | 3` prop to `PostMeta`; pass `2` from the list view.

### perf / supply-chain

- [x] **F3. KaTeX CSS loaded from `@latest` CDN, no SRI** — `src/components/LaTeX.astro:11-15`
  - `@latest` defeats browser caching and is a supply-chain hazard; no `integrity`.
  - Fix: install `katex` as a dep and `import 'katex/dist/katex.min.css'` from the component or layout so Vite hashes and bundles it locally.

---

## P1 — This week (UX / adaptation / consistency)

### a11y

- [x] **F4. `target="_blank"` missing `rel="noopener noreferrer"`** — `src/components/SiteNavigation.astro:24`, `src/.config/default.ts:52-54`

  - Tab-napping risk + explicit intent. Default footer strings in `default.ts` also need updating.

- [x] **F5. No `prefers-reduced-motion` fallback** — `src/layouts/LayoutDefault.astro:57-107`

  - First-paint fade-in (1s) and swup transitions ignore the OS preference.
  - Fix:
    ```css
    @media (prefers-reduced-motion: reduce) {
      html.animation-prepared .transition-swup-header,
      html.animation-prepared .transition-swup-footer,
      html.animation-prepared .transition-swup-main {
        animation: none !important;
        transition: none !important;
      }
    }
    ```

- [x] **F6. `<time>` without `datetime` attribute** — `src/components/PostMeta.astro:22`, `src/pages/archive.astro:46`, `src/pages/about.astro:21`

  - Add `datetime={date.toISOString()}` so the value is machine-readable.

- [x] **F7. `<hgroup>` has `cursor-pointer` but is not interactive** — `src/components/SiteTitle.astro:7-11`

  - Only the inner `<a>` is clickable; the surrounding hgroup misleads users.
  - Fix: drop `cursor-pointer`, or restructure so the anchor wraps the entire clickable surface.

- [x] **F8. Social icon links lack `aria-label`** — `src/components/SiteNavigation.astro:24-26`
  - `i-mdi-*` turns the span into a background-image; the inner `{name}` text is not visually shown and screen-readers hear lowercase slugs like "github".
  - Fix:
    ```astro
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name}${href.startsWith('mailto:') ? '' : ' (opens in new tab)'}`}
    >
      <span aria-hidden="true" class:list={[`i-mdi-${name}`, 'w-6 h-6']}></span>
    </a>
    ```

### perf / responsive

- [x] **F9. `h-100vh` clipped by iOS Safari URL bar** — `src/layouts/LayoutDefault.astro:29`

  - Footer can be occluded by the dynamic toolbar. Switch to `100dvh` (or `100svh`).

- [x] **F10. Sticky hover state on touch devices** — `src/styles/global.css:17-22`

  - Wrap the hover rule in `@media (hover: hover)` or use the `pointer-fine:hover:` UnoCSS variant so taps don't leave the color-inverted state.

- [x] **F11. 1s first-paint fade-in delays LCP** — `src/layouts/LayoutDefault.astro:60-67`

  - Shorten to 300-500ms.

- [x] **F12. Global `text-shadow` on `<html>`** — `src/styles/global.css:11`
  - Applied to every glyph (including `<pre>`/`<code>`), increases paint cost and reduces readability in low-contrast contexts.
  - Fix: scope the shadow (e.g. exclude `pre, code, small` via `html :not(pre):not(code)`).

### i18n / SEO polish

- [x] **F13. `/categories/index.astro` still has missing i18n key** — `src/pages/categories/index.astro:25,34`

  - `all_categories_description` was not added in the previous pass; fallback is dead because `validateKey` returns the key itself (truthy).
  - Fix: add `all_categories_description` to all five locales in `src/i18n.ts`.

- [x] **F14. `/categories/index.astro` keywords meta still concatenates every category** — `src/pages/categories/index.astro:28`

  - Same fix as the single-category page: drop the list concat. Keywords meta is ignored by Google anyway.

- [x] **F15. List view double-wraps in `<article class="prose">`** — `src/layouts/LayoutPost.astro`
  - Typography plugin adds heading/paragraph rhythm meant for articles, not compact cards. Creates excessive vertical whitespace on the home feed.
  - Fix: split `LayoutPost` into a list-card variant (no `prose` wrapper, or `prose-sm`).

---

## P2 — Tech debt / polish

- [ ] **F16. Pagination arrow icons need `aria-hidden`** — `src/components/Pagination.astro:43,52`

- [ ] **F17. `#` in PostCategory is read aloud** — `src/components/PostCategory.astro:16-18`

  - Move to a `::before` pseudo-element or wrap in `<span aria-hidden="true">#</span>`.

- [ ] **F18. `min-w-390px` forces horizontal scroll on iPhone SE (320px)** — `src/layouts/LayoutDefault.astro:29`

  - Lower to 320px or remove.

- [ ] **F19. `SiteFooter.astro` uses `set:html` with `<a target="_blank">` but no `rel`** — `src/components/SiteFooter.astro:16` + `src/.config/default.ts:52-54`

  - Covered by #F4 once default footer strings are fixed.

- [ ] **F20. KaTeX CSS loaded on every page regardless of math usage** — `src/components/LaTeX.astro:10`

  - Add a `math: true` frontmatter flag (or scan body for `$`/`$$`) and only inject the stylesheet when needed.

- [ ] **F21. Twikoo script pinned to staticfile CDN without SRI** — `src/components/comments/Twikoo.astro:16`

  - Add `integrity` + `crossorigin`; consider `preconnect`. Low risk since Twikoo isn't currently enabled.

- [ ] **F22. Code-block copy button may disappear after swup navigation** — `src/pages/posts/[...id].astro:136-165`

  - Astro-hoisted modules only run once per URL. On swup transitions the new `<pre>` nodes may not get wrapped.
  - Fix: subscribe to swup's `content:replace` event and re-initialise, or use event delegation on `document`.

- [ ] **F23. Footer grid row fixed at `9rem` can truncate** — `src/layouts/LayoutDefault.astro:31`

  - Change `rows-[1fr_9rem]` to `rows-[1fr_auto]` so longer footer text still fits.

- [ ] **F24. `LazyImage` component unused** — `src/components/LazyImage.astro`

  - Markdown `![]()` compiles to plain eager `<img>`. Either wire via MDX component mapping or write a rehype plugin to auto-swap.

- [ ] **F25. Global `a:hover` color inversion is intrusive in `.prose`** — `src/styles/global.css:17`
  - Consider a softer hover style under `.prose a` (e.g. only change decoration, keep text color).

---

## Known limitations (won't fix without larger change)

- **`<meta name="robots">` appears twice.** `astro-seo` unconditionally renders its own `robots` meta at `SEO.astro:149` and only accepts `noindex`/`nofollow` props — no way to inject a custom full string or suppress. Consumer options: fork the lib, bypass `<SEO>` component, or accept duplicate meta (current state: one library-default + one user-extended).

---

## Notes on dependencies & tooling

- `pnpm` is the declared package manager (`package.json#packageManager`); the repo no longer ships `package-lock.json`.
- `dev` script is now `astro dev` only — `astro check` runs in `build` and the dedicated `typecheck` script.
- Service Worker is at `v2` with HTML network-first / static cache-first. Bump `CACHE_NAME` when shipping a breaking SW change so old clients drop their cache on activate.
