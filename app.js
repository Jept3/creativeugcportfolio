"use strict";

const labels = { all: "All work", ugc: "UGC", static: "Static ad", video: "Video ad" };
const grid = document.getElementById("projectGrid");
const dialog = document.getElementById("projectDialog");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
let projects = [];
let activeFilter = "all";

const videoFile = (path = "") => /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(path);
const youtube = window.YouTubePortfolio;
const hasYouTube = project => Boolean(project.youtubeId && youtube.parseVideoId(project.youtubeId));
const createElement = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// Activate only links explicitly supplied by the owner. No guessed social handles.
function safeProfileUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch { return ""; }
}

function normalizePhilippineMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) return `63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return `63${digits}`;
  return "";
}

function setSocialLinks(socials = {}) {
  const names = {
    facebook: "Facebook page", tiktok: "TikTok", instagram: "Instagram",
    youtube: "YouTube", linkedin: "LinkedIn"
  };
  document.querySelectorAll("[data-social]").forEach(link => {
    const key = link.dataset.social;
    const label = names[key] || key;
    const href = safeProfileUrl(socials[key]);
    if (href) {
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.classList.remove("is-unconfigured");
      link.removeAttribute("aria-disabled");
      link.setAttribute("aria-label", `Open ${label} (new tab)`);
      link.title = label;
    } else {
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.classList.add("is-unconfigured");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("aria-label", `${label} (link not configured)`);
      link.title = `${label} link not configured`;
    }
  });
}

function setSite(site) {
  const name = (site.name || "YOUR NAME").trim();
  document.getElementById("brandName").replaceChildren(document.createTextNode(name), createElement("span", "brand-dot", "."));
  document.getElementById("footerName").replaceChildren(document.createTextNode(name), createElement("span", "", "."));
  document.getElementById("heroDescription").textContent = site.heroDescription || "Explore a portfolio of UGC, static ads, and motion creative.";
  document.getElementById("aboutDescription").textContent = site.aboutDescription || "Social-first creative across formats.";
  document.getElementById("availabilityText").textContent = site.availability || "Open for creative collaborations";
  document.getElementById("footerYear").textContent = new Date().getFullYear();
  document.title = `${name} · UGC / Static / Motion Portfolio`;
  const contact = document.getElementById("emailButton");
  const hint = document.getElementById("contactHint");
  if (site.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) {
    contact.href = `mailto:${site.email}?subject=${encodeURIComponent("Let's collaborate")}`;
    hint.hidden = true;
  } else {
    contact.hidden = true;
    hint.hidden = false;
  }
  const emailLink = document.getElementById("contactEmail");
  if (site.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) {
    emailLink.href = `mailto:${site.email}`;
    emailLink.querySelector(".contact-detail-value").textContent = site.email;
    emailLink.hidden = false;
  } else {
    emailLink.hidden = true;
  }

  const phoneLink = document.getElementById("contactPhone");
  const phone = normalizePhilippineMobile(site.phone);
  if (phone) {
    phoneLink.href = `tel:+${phone}`;
    phoneLink.querySelector(".contact-detail-value").textContent = site.phone;
    phoneLink.hidden = false;
  } else {
    phoneLink.hidden = true;
  }

  const whatsappLink = document.getElementById("whatsappFloat");
  const whatsapp = normalizePhilippineMobile(site.whatsapp || site.phone);
  if (whatsapp) {
    whatsappLink.href = `https://wa.me/${whatsapp}`;
    whatsappLink.setAttribute("aria-label", `Chat with ${name} on WhatsApp`);
    whatsappLink.hidden = false;
  } else {
    whatsappLink.hidden = true;
  }
  setSocialLinks(site.socials || {});
}

function makeMedia(project, forDialog = false) {
  const src = project.media || "";
  const poster = project.poster || "";
  if (hasYouTube(project)) {
    const id = youtube.parseVideoId(project.youtubeId);
    if (forDialog) {
      const iframe = createElement("iframe", "youtube-embed");
      iframe.src = youtube.embedUrl(id);
      iframe.title = `YouTube video: ${project.title}`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      return iframe;
    }
    const thumb = createElement("img");
    thumb.src = poster || youtube.thumbnail(id);
    thumb.alt = `YouTube thumbnail for ${project.title}`;
    thumb.loading = "lazy";
    thumb.decoding = "async";
    thumb.addEventListener("error", () => { if (!thumb.dataset.fallback) { thumb.dataset.fallback = "true"; thumb.src = "assets/demo/fallback.svg"; } });
    return thumb;
  }
  if (videoFile(src)) {
    if (forDialog) {
      const video = createElement("video");
      video.src = src;
      if (poster) video.poster = poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", `Video: ${project.title}`);
      return video;
    }
    if (poster) {
      const img = createElement("img");
      img.src = poster;
      img.alt = `Cover image for ${project.title}`;
      img.loading = "lazy";
      img.decoding = "async";
      return img;
    }
    const video = createElement("video");
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", `Video preview for ${project.title}`);
    return video;
  }
  const image = createElement("img");
  image.src = src || "assets/demo/fallback.svg";
  image.alt = project.title;
  image.loading = forDialog ? "eager" : "lazy";
  image.decoding = "async";
  return image;
}

function makeCard(project) {
  const card = createElement("article", "project-card glass");
  const button = createElement("button", "project-open");
  button.type = "button";
  button.setAttribute("aria-label", `View ${project.title} project`);
  const media = createElement("div", "project-media");
  media.append(makeMedia(project));
  media.append(createElement("span", "project-category", labels[project.category] || project.category));
  if (project.demo) media.append(createElement("span", "project-demo", "DEMO"));
  if (hasYouTube(project) || videoFile(project.media)) media.append(createElement("span", "project-play", "▶"));
  const bottom = createElement("div", "project-card-bottom");
  const text = createElement("div");
  text.append(createElement("h3", "project-title", project.title));
  text.append(createElement("p", "project-subtitle", project.client || labels[project.category]));
  bottom.append(text, createElement("span", "project-link-icon", "↗"));
  button.append(media, bottom);
  button.addEventListener("click", () => openProject(project));
  card.append(button);
  return card;
}

function renderProjects() {
  const selected = activeFilter === "all" ? projects : projects.filter(p => p.category === activeFilter);
  grid.replaceChildren(...selected.map(makeCard));
  document.getElementById("emptyState").hidden = selected.length > 0;
  document.getElementById("resultsLabel").textContent = activeFilter === "all"
    ? `Showing all ${selected.length} projects`
    : `Showing ${selected.length} ${labels[activeFilter].toLowerCase()} project${selected.length === 1 ? "" : "s"}`;
  grid.setAttribute("aria-busy", "false");
}

function updateCounts() {
  for (const category of Object.keys(labels)) {
    const count = category === "all" ? projects.length : projects.filter(p => p.category === category).length;
    document.getElementById(`count-${category}`).textContent = String(count).padStart(2, "0");
  }
  document.getElementById("projectTotal").textContent = String(projects.length).padStart(2, "0");
}

function openProject(project) {
  document.getElementById("dialogMedia").replaceChildren(makeMedia(project, true));
  document.getElementById("dialogCategory").textContent = labels[project.category]?.toUpperCase() || "CREATIVE PROJECT";
  document.getElementById("dialogTitle").textContent = project.title;
  document.getElementById("dialogDescription").textContent = project.description || "A selected piece of creative work.";
  document.getElementById("dialogType").textContent = hasYouTube(project) ? "YouTube video" : videoFile(project.media) ? "Video" : "Image";
  document.getElementById("dialogClient").textContent = project.client || "Creative project";
  document.getElementById("dialogNote").hidden = !project.demo;
  if (!dialog.open) dialog.showModal();
}

filterButtons.forEach(button => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderProjects();
}));

document.getElementById("dialogClose").addEventListener("click", () => dialog.close());
document.getElementById("dialogBack").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => { document.getElementById("dialogMedia").replaceChildren(); });

function connectedConfig() {
  const config = window.PORTFOLIO_CONFIG || {};
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.supabaseUrl || "") &&
    Boolean(config.supabaseKey && !config.supabaseKey.includes("YOUR-"));
}

async function fetchPublishedProjects() {
  const config = window.PORTFOLIO_CONFIG;
  if (!window.supabase?.createClient) throw new Error("Supabase could not load. Check your connection.");
  const client = window.supabase.createClient(config.supabaseUrl.replace(/\/$/, ""), config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data, error } = await client.from("portfolio_projects")
    .select("id,title,category,client,description,media_path,poster_path,media_type,youtube_id,created_at")
    .order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id, title: row.title, category: row.category, client: row.client,
    description: row.description, demo: false,
    youtubeId: row.youtube_id || "",
    media: row.media_path ? client.storage.from(config.bucket || "portfolio-media").getPublicUrl(row.media_path).data.publicUrl : "",
    poster: row.poster_path ? client.storage.from(config.bucket || "portfolio-media").getPublicUrl(row.poster_path).data.publicUrl : ""
  }));
}

// Essential contact information is embedded here as a reliable fallback.
// A missing data/site.json must NEVER block the public Supabase gallery.
const defaultSite = {
  name: "Jepnte Dela Torre",
  heroDescription: "I'm Jepnte Dela Torre. I create UGC, static ads, and social-first video content designed to stop the scroll.",
  aboutDescription: "A good creative can make someone pause, feel something, and take action. Here's where I bring those ideas to life.",
  email: "jepntedelatorre@gmail.com",
  availability: "Open for creative collaborations",
  phone: "09362512630",
  whatsapp: "639362512630",
  socials: { facebook: "", tiktok: "", instagram: "", youtube: "", linkedin: "" }
};

async function loadOptionalSiteSettings() {
  // Display the portfolio even when the site settings file wasn't published.
  // Keep supporting data/site.json for future social-profile customization.
  try {
    const response = await fetch("data/site.json", { cache: "no-store" });
    if (!response.ok) {
      console.warn(`Optional data/site.json unavailable (HTTP ${response.status}); using built-in site details.`);
      return defaultSite;
    }
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return defaultSite;
    return { ...defaultSite, ...data, socials: { ...defaultSite.socials, ...(data.socials || {}) } };
  } catch (error) {
    console.warn("Optional site settings could not be loaded; using built-in details.", error);
    return defaultSite;
  }
}

async function initialize() {
  try {
    setSite(await loadOptionalSiteSettings());
    if (connectedConfig()) {
      // On a configured site the public gallery always uses published cloud projects.
      // Do not accidentally show local DEMOs when the cloud is empty or inaccessible.
      projects = await fetchPublishedProjects();
    } else {
      const projectsResponse = await fetch("data/projects.json");
      if (!projectsResponse.ok) throw new Error("Could not load the local demo projects.");
      const data = await projectsResponse.json();
      if (!Array.isArray(data)) throw new Error("projects.json must contain an array of projects.");
      projects = data.filter(item => item && item.title && labels[item.category] && item.category !== "all" &&
        (item.media || (item.youtubeId && youtube.parseVideoId(item.youtubeId))));
    }
    updateCounts();
    renderProjects();
  } catch (error) {
    console.error("Portfolio loading error:", error);
    grid.setAttribute("aria-busy", "false");
    const help = connectedConfig()
      ? "The live gallery is unavailable right now. Check your Supabase settings, public read policies, and connection."
      : "The gallery couldn't load. Preview this site through a web server. See README.md.";
    grid.replaceChildren(createElement("div", "loading-projects glass", help));
  }
}
initialize();
