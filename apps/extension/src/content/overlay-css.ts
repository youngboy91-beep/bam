// CSS injected into every shadow root we mount. Using :host-scoped
// selectors means Twitter's stylesheet cannot affect us and ours cannot
// leak out.
//
// Two surfaces:
//   1. The dot that lives inline inside tweet headers (host is very small,
//      fits next to the handle link).
//   2. The floating hover card (host is a fixed-position element in a
//      corner of the page — one card at a time).

export const overlayCss = `
:host { all: initial; }
* { box-sizing: border-box; }

/* -------- Inline dot -------- */

.tl-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 6px;
  vertical-align: middle;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  outline: none;
}
.tl-dot:hover,
.tl-dot:focus-visible {
  transform: scale(1.35);
}
.tl-dot-green  { background: #00ba7c; box-shadow: 0 0 6px rgba(0,186,124,0.55); }
.tl-dot-yellow { background: #ffad1f; box-shadow: 0 0 6px rgba(255,173,31,0.55); }
.tl-dot-red    { background: #f4212e; box-shadow: 0 0 6px rgba(244,33,46,0.55); }
.tl-dot-gray   { background: #71767b; }
.tl-dot-gray:hover { box-shadow: 0 0 6px rgba(113,118,123,0.4); }

/* -------- Floating hover card -------- */

.tl-card {
  font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  color: #e7e9ea;
  background: #0f1114;
  border: 1px solid #2f3336;
  border-radius: 12px;
  overflow: hidden;
  width: 400px;
  max-width: 92vw;
  box-shadow: 0 18px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4);
}

.tl-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #2f3336;
}
.tl-brand {
  display: flex; align-items: center; gap: 8px;
  color: #71767b;
  font-size: 12px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.tl-tier {
  color: #e7e9ea;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #2f3336;
  border-radius: 4px;
  text-transform: none;
  letter-spacing: 0;
}
.tl-logo {
  width: 16px; height: 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #1d9bf0, #7856ff);
  display: inline-block;
}
.tl-signal {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 999px;
}
.tl-signal-clean   { background: rgba(0,186,124,0.15); color: #00ba7c; }
.tl-signal-caution { background: rgba(255,173,31,0.15); color: #ffad1f; }
.tl-signal-risk    { background: rgba(244,33,46,0.15); color: #f4212e; }
.tl-signal-unknown { background: rgba(113,118,123,0.2); color: #71767b; }

.tl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #2f3336;
}
.tl-cell {
  background: #0f1114;
  padding: 10px 12px;
}
.tl-label {
  color: #71767b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
}
.tl-value {
  font-size: 14px;
  font-weight: 600;
}
.tl-pos { color: #00ba7c; }
.tl-neg { color: #f4212e; }
.tl-sub { color: #71767b; font-size: 11px; margin-top: 2px; }

.tl-body {
  padding: 10px 12px;
  border-top: 1px solid #2f3336;
  line-height: 1.4;
  color: #e7e9ea;
}
.tl-text {
  color: #e7e9ea;
}

/* -------- External links block -------- */

.tl-links-block {
  padding: 10px 12px;
  border-top: 1px solid #2f3336;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tl-link-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tl-link-title {
  color: #71767b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tl-link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tl-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #16181c;
  border: 1px solid #2f3336;
  border-radius: 999px;
  color: #e7e9ea;
  text-decoration: none;
  font-size: 12px;
  line-height: 1;
  transition: border-color 0.12s, background 0.12s;
}
.tl-link:hover {
  border-color: #4a4d52;
  background: #1c1f23;
}
.tl-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: rgba(29,155,240,0.15);
  color: #1d9bf0;
  font-size: 10px;
  font-weight: 700;
}
.tl-link-label {
  white-space: nowrap;
}

.tl-foot {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid #2f3336;
  color: #71767b;
  font-size: 11px;
}
.tl-foot-link {
  color: #1d9bf0;
  text-decoration: none;
}
.tl-foot-link:hover { text-decoration: underline; }
`;
