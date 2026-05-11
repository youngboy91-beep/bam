// CSS injected into the Shadow DOM root. Using :host-scoped selectors means
// Twitter's stylesheet cannot affect us and ours cannot leak out.
export const overlayCss = `
:host { all: initial; }
* { box-sizing: border-box; }
.tl {
  font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  color: #e7e9ea;
  background: #0f1114;
  border: 1px solid #2f3336;
  border-radius: 12px;
  overflow: hidden;
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
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.tl-icon {
  width: 18px; height: 18px; border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  margin-top: 1px;
}
.tl-icon-green   { background: rgba(0,186,124,0.2); color: #00ba7c; }
.tl-icon-yellow  { background: rgba(255,173,31,0.2); color: #ffad1f; }
.tl-icon-red     { background: rgba(244,33,46,0.2); color: #f4212e; }
.tl-icon-neutral { background: rgba(113,118,123,0.2); color: #71767b; }
.tl-text { line-height: 1.4; color: #e7e9ea; }

.tl-foot {
  display: flex; justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid #2f3336;
  color: #71767b;
  font-size: 11px;
}
.tl-foot a { color: #1d9bf0; text-decoration: none; }
`;
