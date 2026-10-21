"use strict";
/* Safely accept known YouTube URLs and canonical 11-character video IDs. */
window.YouTubePortfolio = (() => {
  const idPattern = /^[a-zA-Z0-9_-]{11}$/;
  function parseVideoId(value) {
    const raw = String(value || "").trim();
    if (idPattern.test(raw)) return raw;
    const candidate = /^(?:www\.|m\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(raw)
      ? `https://${raw}` : raw;
    let url;
    try { url = new URL(candidate); } catch { return ""; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return "";
    const host = url.hostname.toLowerCase();
    let id = "";
    if (host === "youtu.be" || host === "www.youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else {
        const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
        id = match?.[1] || "";
      }
    }
    return idPattern.test(id) ? id : "";
  }
  const thumbnail = id => idPattern.test(id || "") ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  const watchUrl = id => idPattern.test(id || "") ? `https://www.youtube.com/watch?v=${id}` : "";
  const embedUrl = id => idPattern.test(id || "") ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : "";
  return Object.freeze({ parseVideoId, thumbnail, watchUrl, embedUrl });
})();
