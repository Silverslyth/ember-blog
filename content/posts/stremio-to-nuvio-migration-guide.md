---
title: "Stremio → Nuvio: Migration Guide"
date: 2026-06-14
description: "Everything you need to move your library, addons, and debrid setup from Stremio to Nuvio — without starting from scratch."
categories: ["Streaming", "Guides", "Software"]
tags: ["stremio", "nuvio", "migration", "streaming", "debrid", "torbox", "premiumize", "android-tv", "webos", "tizen", "ios", "addons"]
slug: "stremio-to-nuvio-migration-guide"
---

Everything you need to move your library, addons, and debrid setup from Stremio — without starting from scratch.

**Supported platforms:** Android TV · WebOS / Tizen · Android Mobile · iOS (Sideload) · Desktop (WIP)

---

## What is Nuvio?

Before you install anything, here's the quick picture.

Nuvio is a streaming client built around the same addon ecosystem as Stremio — meaning your Torrentio, Comet, AIOStreams, and debrid integrations all carry over. The main differences you'll notice are a more polished TV-first UI, built-in Collections (curated content rows you define), and tighter debrid integration options. Your addons, your watchlist, your debrid service — none of that changes.

> 💡 **Good to know:** Nuvio uses Stremio-compatible addon URLs. If it works in Stremio, it works in Nuvio. You don't need to reconfigure your debrid credentials or re-install addons from scratch — you just migrate them.

---

## Phase 1: Install Nuvio

Pick your device below. Each has a slightly different installation path.

### Android TV / Firestick / Shield / Homatics / onn

1. Open the **Downloader** app on your device (install it from the Play Store / Amazon Appstore if you don't have it).
2. Enter the universal downloader code: `9919325`
3. Download and install the APK. You may need to enable **Install from unknown sources** in your device settings.
4. Alternatively, sideload directly from the [NuvioTV GitHub releases](https://github.com/NuvioMedia/NuvioTV).

> ✓ The same APK works across Firestick, Cube, Shield, Homatics, and onn devices.

### WebOS (LG Smart TVs)

1. Head to the [NuvioWeb GitHub](https://github.com/NuvioMedia/NuvioWeb) and follow the WebOS sideload instructions in the README.
2. You'll need your TV in **Developer Mode** — enable it via the LG Developer Mode app on your phone.
3. Use **webOS Dev Manager** or `ares-install` CLI to push the `.ipk` to your TV.

### TizenOS (Samsung Smart TVs)

1. Head to the [NuvioWeb GitHub](https://github.com/NuvioMedia/NuvioWeb) for the Tizen package.
2. Enable **Developer Mode** on your Samsung TV under Settings → Support → About This TV (tap the version number multiple times).
3. Use **Tizen Studio** or the CLI to deploy the `.wgt` package to your TV.

### Android Mobile

1. Download the APK from the [NuvioMobile GitHub](https://github.com/NuvioMedia/NuvioMobile) releases page.
2. Allow installation from unknown sources in Settings → Apps → Special access.
3. Install and open — the mobile UI is adapted from the TV layout but works well on phones.

### iOS (Sideload Only)

> ⚠️ TestFlight is full. Use the direct IPA link below.

1. Download the IPA: [`Nuvio-v0.2.4-Full.ipa`](https://github.com/luqmanfadlli/NuvioMobile-iOS/releases/download/0.2.4/Nuvio-v0.2.4-Full.ipa)
2. Sideload using **AltStore**, **Sideloadly**, or **TrollStore** if your iOS version supports it.
3. Trust the developer certificate under Settings → General → VPN & Device Management.

> ✓ Also check the [NuvioMobile GitHub](https://github.com/NuvioMedia/NuvioMobile) for the latest release when the repo updates.

---

## Phase 2: Migrate Your Stremio Library

Move your watchlist, history, and addon configuration over before you do anything else.

### [Nuvio Sync](https://nuviosync.com/) — Library Migration

The dedicated migration tool. Connects to your Stremio account and pushes your watchlist and history into your Nuvio account.

### [Account Cloner](https://nuvio-account-cloner.vercel.app/) — Full Account Transfer

Does more than just cloning — also handles addon transfer, account linking, and configuration copying between Stremio and Nuvio accounts.

### [Account Bootstrapper](https://bootstrapper.stremx.net/) — Fresh Start

If you'd rather start clean than migrate, this sets up a new Nuvio account with sensible defaults and lets you add addons from scratch.

> 💡 **Which tool to use?** Use **Nuvio Sync** if you primarily want your watchlist. Use the **Account Cloner** if you also want addons transferred. Use the **Bootstrapper** if you're done with your Stremio history and want a clean slate.

---

## Phase 3: Set Up Your Addons

Nuvio uses the same addon protocol as Stremio. Any addon URL that worked there works here.

### Recommended Addon Managers

Instead of adding addons one by one, use a manager that handles configuration, deduplication, and ordering for you:

- ✓ **AIOStreams** — aggregates multiple streaming addons into one. Use Viren's instance or the ElfHosted backup. Handles Torrentio, Comet, Debridio, and more under a single addon URL.
- ✓ **Torrentio** — the staple torrent source. Configure it at [torrentio.strem.fun](https://torrentio.strem.fun) with your debrid credentials and paste the resulting URL into Nuvio.
- ✓ **Comet** — a self-hostable alternative to Torrentio with better caching for some debrid services.
- ✓ **Fusion** — metadata and discovery addon, pairs well with Cinemeta and Amatsu.

> 💡 In Stremio you configured addons by visiting their web UI and clicking "Install." In Nuvio it's the same: generate your configured addon URL, then add it under **Settings → Addons → Add Addon** by pasting the manifest URL.

### Metadata Addons

Nuvio works with all the standard Stremio metadata addons. Recommended stack:

- ✓ **Cinemeta** — default catalog and metadata provider for movies and series.
- ✓ **AIOMetadata** — aggregated metadata from multiple sources, useful for anime and K-drama.
- ✓ **Amatsu** — anime-focused metadata, pairs well with Bingecat for tracking.
- ✓ **Trakt** — if you use Trakt for scrobbling and watchlist sync, the Trakt addon works in Nuvio identically to Stremio.

### [Xperience](https://xperience-app.com/) — Addon Configuration UI

A browser-based tool to configure your Nuvio addons and UI layout visually — useful for users who find the in-app settings limiting. [See the r/Nuvio post](https://www.reddit.com/r/Nuvio/comments/1tqhm9n/built_a_web_tool_to_configure_your_nuvio_and/) for a full explanation of what it can do.

---

## Phase 4: Connect Your Debrid Service

Nuvio supports the standard route (via addon like Torrentio) and a direct debrid integration for supported services.

### Standard Route (via Torrentio / AIOStreams)

This is identical to how you used debrid in Stremio. Configure Torrentio or AIOStreams with your debrid API key, copy the manifest URL, and add it as an addon in Nuvio. No special steps required.

### Direct Debrid Integration (TorBox & Premiumize)

Nuvio has a native direct integration for **TorBox** and **Premiumize** that bypasses the addon layer entirely — faster lookups, cleaner stream selection.

**[Direct Debrid Integration Starter Guide](https://nuvioinstant.3hpm.ca/)** — Step-by-step guide for setting up TorBox or Premiumize as a native Nuvio integration, including where to find your API key and how to test it.

> 💡 If you're on TorBox, the direct integration is worth the extra setup step. It gives Nuvio first-class cache lookups rather than routing through a third-party addon URL.

### [Crispy Duck](https://crispyduck.xyz/) — AIOStreams / Direct Integration Formatter

Formatting tool that helps you correctly structure stream result templates for AIOStreams and Nuvio direct debrid configs. Useful when stream names look wrong or sorting is off.

---

## Phase 5: Customise — Collections, Badges & More

Once you're up and running, Nuvio's Collections system and badge customisation are worth exploring.

### Collections

Collections are curated content rows on your Nuvio home screen — you define them with a `.json` file. You can browse and add pre-made collections (including cover art) directly from the [official Nuvio website](https://nuvio.tv).

**[Collections Editor](https://yaarpatandaraa.github.io/nuvio-collections-editor/)** — A GUI editor for building and editing your Nuvio Collections JSON file without touching raw JSON. Drag, drop, and preview your collections layout.

### Badges

Badges are the small metadata overlays on stream results (resolution, codec, HDR, audio format). Nuvio lets you customise these with your own badge URLs.

**[Badger](https://nintle.github.io/Badger/)** — Generate and configure custom badge sets for your Nuvio streams — pick styles, formats, and icons for resolution, codec, HDR, and audio labels.

---

## All Official Links

### Official

- **[Nuvio Website](https://nuvio.tv)** — Browse collections, manage addons, find cover art.
- **[Nuvio Discord](https://discord.gg/CEQ773qCk)** — Official support server for help and announcements.

### GitHub Repositories

- **[NuvioTV](https://github.com/NuvioMedia/NuvioTV)** — Android TV releases and source.
- **[NuvioWeb](https://github.com/NuvioMedia/NuvioWeb)** — WebOS (LG) and TizenOS (Samsung) builds.
- **[NuvioMobile](https://github.com/NuvioMedia/NuvioMobile)** — Android and iOS mobile releases.
- **[NuvioDesktop](https://github.com/NuvioMedia/NuvioDesktop)** — Desktop app — active development, not yet released.

### Migration & Setup Tools

- **[Nuvio Setup Guide](https://numb3rs.stream/guide/Nuvio/)** — Full community-written setup walkthrough.
- **[Nuvio Sync](https://nuviosync.com/)** — Migrate your Stremio library to Nuvio.
- **[Account Cloner](https://nuvio-account-cloner.vercel.app/)** — Clone account, addons, and config from Stremio.
- **[Account Bootstrapper](https://bootstrapper.stremx.net/)** — Set up a fresh Nuvio account from scratch.
- **[Direct Debrid Starter](https://nuvioinstant.3hpm.ca/)** — TorBox and Premiumize native integration guide.
- **[Xperience](https://xperience-app.com/)** — Visual addon and UI configuration tool.

### Customisation

- **[Collections Editor](https://yaarpatandaraa.github.io/nuvio-collections-editor/)** — Visual JSON editor for Nuvio Collections.
- **[Badger](https://nintle.github.io/Badger/)** — Custom stream badge generator and configurator.
- **[Crispy Duck](https://crispyduck.xyz/)** — Stream template formatter for AIOStreams and direct debrid.

### Status / Uptime

- **[Ibbylabs Uptime](https://uptime.ibbylabs.dev/)** — Status tracker for Nuvio and addon services.
- **[Stremio Status](https://status.stremio-status.com/)** — Stremio-side service status (useful for shared addons).

---

*All tools and links credit their respective developers — this guide only gathers them in one place. For support, join the [Nuvio Discord](https://discord.gg/CEQ773qCk).*
