# Repository Settings — для роста звёзд

После мёрджа этого PR пройди по списку (3 минуты) — это превращает страницу репозитория в landing page и резко повышает discoverability.

## 1. Description (1 минута)

GitHub → главная страница репо → шестерёнка справа от "About" → **Description**:

```
On-chain reality checks for Crypto Twitter. Chrome extension that reveals who really holds what they shill — directly in your X feed. Wallet-verified KOLs, shill detection, anti-rug signals.
```

**Website:**
```
https://truthlayer.app
```
(или твой Vercel URL пока нет домена)

## 2. Topics (важно для поиска внутри GitHub)

В той же панели **Topics** → добавь по очереди:

```
cryptocurrency
crypto
chrome-extension
twitter
on-chain
wallet
ethereum
solana
defi
typescript
fastify
react
web3
kol-tracker
shill-detector
identity-graph
siwe
sign-in-with-ethereum
postgres
monorepo
```

Чем больше релевантных топиков — тем чаще репо появляется в "Topic feeds" и "Trending" по нишам.

## 3. Social preview image (Open Graph)

GitHub → **Settings** → раздел **General** → **Social preview** → **Edit** → **Upload an image**:

Загрузи `.github/assets/og-image.svg` (или сначала экспортируй в PNG 1280×640 — GitHub принимает PNG/JPG/GIF, не SVG).

Чтобы конвертнуть SVG → PNG локально:
```bash
# через rsvg-convert (brew install librsvg)
rsvg-convert .github/assets/og-image.svg -o og-image.png -w 1280

# или через ImageMagick
convert -density 200 .github/assets/og-image.svg og-image.png
```

После загрузки: каждый раз когда кто-то шерит ссылку на репо в Twitter / Slack / Telegram — там будет красивый preview с лого и слоганом, а не серый GitHub-плейсхолдер. Это **критично для CTR** в шерах.

## 4. Включить Discussions

**Settings** → **Features** → ☑️ Discussions

Зачем: люди комментируют публично, ответы остаются индексируемыми, повышается "weight" страницы для GitHub-поиска. Плюс "💬 Discussions" в шапке репо выглядит как живое community.

## 5. Pin лучшие репозитории на свой профиль

Зайди на свой GitHub-профиль (`/miraekims`) → **Customize your pins** → закрепи `Truthlayer` сверху. Без этого его не увидят те, кто пришёл на твой профиль.

## 6. Сделай Release v0.1.0

```bash
git tag v0.1.0
git push origin v0.1.0
```

Затем GitHub → **Releases** → **Draft a new release** → выбрать тег `v0.1.0` → автоматически генерится changelog. Релизы повышают доверие — "оно живое и развивается".

## 7. Добавь в README "Trending" сигналы

После 10+ звёзд GitHub начинает рекомендовать репо в Trending по топикам. Способы ускорить:

- Запостить на **Hacker News** (Show HN: TruthLayer — see who really holds what they shill)
- Запостить на **r/ethdev**, **r/solana**
- Пост в **X-thread** с скрином dot-overlay'а на твитах известных KOL
- Запостить на **dev.to** с кратким "behind the scenes"

Каждый source даёт первые 50-200 звёзд — дальше работает GitHub Trending, который дополнительно даёт 1000+.

## 8. Чек-лист "репо выглядит как продукт"

- [x] README с hero-баннером, badges, comparison table
- [x] LICENSE file
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [x] Issue templates (bug, feature)
- [x] PR template
- [x] FUNDING.yml stub
- [x] OG image готов
- [ ] Description + topics заполнены (← вручную, пункты 1-2)
- [ ] Social preview загружен (← вручную, пункт 3)
- [ ] Discussions включены (← вручную, пункт 4)
- [ ] Release v0.1.0 опубликован (← вручную, пункт 6)

Этот файл — **только для тебя**, навигация по последним 4 шагам. Когда сделаешь все 4 — можно удалить.
