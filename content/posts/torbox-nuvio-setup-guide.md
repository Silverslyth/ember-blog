---
title: "How I Use TorBox With Nuvio — Full Setup Guide"
date: 2026-06-14
description: "Complete setup guide for TorBox with Nuvio — connect your debrid service, configure AIOStreams, Torrentio, Comet, and visual stream badges for an optimal streaming workflow."
categories: ["Streaming"]
tags: ["torbox", "nuvio", "aiostreams", "torrentio", "comet", "streaming", "debrid", "guide"]
slug: "torbox-nuvio-setup-guide"
---

I switched from Real Debrid to TorBox a while back and haven't looked back. This is the full setup I run with Nuvio as my client — covers everything from connecting TorBox to stream addons to visual badges. Hopefully useful for anyone setting up or optimizing their stack.

---

## Why TorBox

I was on Real Debrid for 5-6 years. Made the switch before things went sideways over there — partly luck, partly a hunch. TorBox has been rock solid since, the pricing is reasonable, and it actually keeps improving.

---

## The Client: Nuvio

Nuvio is a Stremio-compatible streaming client with a cleaner UI and more customization than the stock Stremio app. Available on Android, iOS, and TV. It has native debrid support so you connect TorBox once and it works across all your addons automatically — no need to paste your API key into every single addon config.

```
Settings → Connected Services → TorBox → paste your API key → done.
```

---

## Stream Addons

### AIOStreams

The backbone of the setup. AIOStreams is a super-addon that pulls from multiple scrapers, deduplicates results, and sorts everything by quality. Saves you from seeing the same file listed 10 times from different sources.

**Primary instance:**
`https://aiostreams.viren070.me`

**Backup:**
`https://aiostreams.elfhosted.com`

Add Torrentio and Comet as sources inside AIOStreams. Connect your TorBox API key there too so it can filter and prioritize cached results.

### Torrentio + Comet

The two best torrent scrapers. They cover different indexers so running both gives you much better hit rates.

**Important:** when generating your Comet or Torrentio manifest URL, leave the debrid field empty. Since TorBox is already configured in Nuvio's Connected Services, it handles authentication automatically. Your manifest links stay clean and aren't tied to your credentials.

### Fusion (Optional)

Nuvio-native addon for home screen catalogs and widgets. Not required for streams but nice to have for organization.

---

## Visual Stream Badges

This is a Nuvio-specific feature that overlays visual tags on each stream result — things like 4K, HDR10+, Dolby Atmos, TrueHD, REMUX, etc.

Go to:

```
Settings → Connected Services → Badge URLs
```

Paste:

```
https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/presets/colored-bgb-combo-nodv.json
```

Import it.

Credit to [9mousaa](https://github.com/9mousaa) and BetterFormatter for the preset.

---

## Full Stack at a Glance

| Component | Role |
|---|---|
| TorBox | Debrid service |
| Nuvio | Streaming client |
| AIOStreams | Stream aggregation and deduplication |
| Torrentio | Torrent scraper |
| Comet | Torrent scraper |
| BetterFormatter | Visual stream badges |

---

## Tips

- Configure TorBox once in Nuvio Connected Services.
- Avoid embedding debrid credentials in addon manifest URLs.
- AIOStreams Nightly includes the newest SEL functionality and advanced filtering.
- Popular content is often instantly available through TorBox cache.

---

## Related Guides

- [Coming Soon] Custom Stream Badges in Nuvio
- [Coming Soon] AIOStreams Nightly Configuration
- [Coming Soon] TorBox Optimization Guide

---

## Referral Disclosure

The link below is a referral link. If you choose to use it, I may receive referral credit at no additional cost to you.

👉 [TorBox Subscription](https://torbox.app/subscription?referral=fba33ed8-000f-49b4-a23f-8c7f1be5b16e)

---

## Conclusion

This setup has been stable for me and covers everything from regular releases to 4K remuxes, anime, and international content. If you're already using Nuvio, connecting it to TorBox and consolidating everything through AIOStreams is one of the cleanest streaming workflows I've found so far.

Happy streaming.
