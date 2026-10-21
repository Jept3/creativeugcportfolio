
"use strict";

// ========================================
// JEP NTE DELA TORRE - PORTFOLIO
// Public gallery with Supabase + YouTube
// ========================================

const labels = {
  all: "All work",
  ugc: "UGC",
  static: "Static ad",
  video: "Video ad"
};

const grid = document.getElementById("projectGrid");
const dialog = document.getElementById("projectDialog");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let projects = [];
let activeFilter = "all";

const videoFile = (path = "") =>
  /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(path);

const youtube = window.YouTubePortfolio;

const hasYouTube = project =>
  Boolean(
    project.youtubeId &&
    youtube?.parseVideoId(project.youtubeId)
  );

function createElement(tag, className, content) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (content !== undefined) {
    element.textContent = content;
  }

  return element;
}

// ========================================
// PERSONAL DETAILS
// ========================================

const defaultSite = {
  name: "Jepnte Dela Torre",

  heroDescription:
    "I'm Jepnte Dela Torre. I create UGC, static ads, and social-first video content designed to stop the scroll.",

  aboutDescription:
    "A good creative can make someone pause, feel something, and take action. Here's where I bring those ideas to life.",

  email: "jepntedelatorre@gmail.com",

  phone: "09362512630",

  whatsapp: "639362512630",

  availability: "Open for creative collaborations",

  socials: {
    facebook: "",
    tiktok: "",
    instagram: "",
    youtube: "",
    linkedin: ""
  }
};

// ========================================
// OPTIONAL SITE SETTINGS
// FIX: A MISSING site.json WILL NOT
// STOP THE PUBLIC GALLERY
// ========================================

async function loadOptionalSiteSettings() {
  try {
    const response = await fetch(
      "data/site.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.warn(
        `Optional site.json unavailable: HTTP ${response.status}. Using built-in settings.`
      );
      return defaultSite;
    }

    const settings = await response.json();

    if (
      !settings ||
      typeof settings !== "object" ||
      Array.isArray(settings)
    ) {
      return defaultSite;
    }

    return {
      ...defaultSite,
      ...settings,
      socials: {
        ...defaultSite.socials,
        ...(settings.socials || {})
      }
    };
  } catch (error) {
    console.warn(
      "Site settings unavailable. Using fallback.",
      error
    );
    return defaultSite;
  }
}

// ========================================
// CONTACT & SOCIAL MEDIA
// ========================================

function safeProfileUrl(value) {
  try {
    const url = new URL(String(value || "").trim());

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) ? url.href : "";
  } catch {
    return "";
  }
}

function normalizePhilippineMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return `63${digits.slice(1)}`;
  }

  if (/^639\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `63${digits}`;
  }

  return "";
}

function setSocialLinks(socials = {}) {
  const names = {
    facebook: "Facebook page",
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube: "YouTube",
    linkedin: "LinkedIn"
  };

  document.querySelectorAll("[data-social]")
    .forEach(link => {
      const key = link.dataset.social;
      const label = names[key] || key;
      const href = safeProfileUrl(socials[key]);

      if (href) {
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.classList.remove("is-unconfigured");
        link.removeAttribute("aria-disabled");

        link.setAttribute(
          "aria-label",
          `Open ${label} (new tab)`
        );

        link.title = label;
      } else {
        link.removeAttribute("href");
        link.removeAttribute("target");
        link.removeAttribute("rel");

        link.classList.add("is-unconfigured");
        link.setAttribute("aria-disabled", "true");

        link.setAttribute(
          "aria-label",
          `${label} (link not configured)`
        );

        link.title = `${label} link not configured`;
      }
    });
}

function setSite(site) {
  const name = String(
    site.name || defaultSite.name
  ).trim();

  const brand = document.getElementById("brandName");
  const footer = document.getElementById("footerName");

  if (brand) {
    brand.replaceChildren(
      document.createTextNode(name),
      createElement("span", "brand-dot", ".")
    );
  }

  if (footer) {
    footer.replaceChildren(
      document.createTextNode(name),
      createElement("span", "", ".")
    );
  }

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  setText(
    "heroDescription",
    site.heroDescription || defaultSite.heroDescription
  );

  setText(
    "aboutDescription",
    site.aboutDescription || defaultSite.aboutDescription
  );

  setText(
    "availabilityText",
    site.availability || defaultSite.availability
  );

  setText("footerYear", new Date().getFullYear());

  document.title =
    `${name} · UGC / Static / Motion Portfolio`;

  const email = site.email || defaultSite.email;
  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const emailButton =
    document.getElementById("emailButton");

  const contactHint =
    document.getElementById("contactHint");

  if (emailButton) {
    emailButton.hidden = !emailValid;

    if (emailValid) {
      emailButton.href =
        `mailto:${email}?subject=${encodeURIComponent("Let's collaborate")}`;
    }
  }

  if (contactHint) {
    contactHint.hidden = emailValid;
  }

  const emailLink =
    document.getElementById("contactEmail");

  if (emailLink) {
    emailLink.hidden = !emailValid;

    if (emailValid) {
      emailLink.href = `mailto:${email}`;

      const value = emailLink.querySelector(
        ".contact-detail-value"
      );

      if (value) value.textContent = email;
    }
  }

  const phone =
    site.phone || defaultSite.phone;

  const normalizedPhone =
    normalizePhilippineMobile(phone);

  const phoneLink =
    document.getElementById("contactPhone");

  if (phoneLink) {
    phoneLink.hidden = !normalizedPhone;

    if (normalizedPhone) {
      phoneLink.href = `tel:+${normalizedPhone}`;

      const value = phoneLink.querySelector(
        ".contact-detail-value"
      );

      if (value) value.textContent = phone;
    }
  }

  const whatsappNumber = normalizePhilippineMobile(
    site.whatsapp || site.phone || defaultSite.whatsapp
  );

  const whatsappButton =
    document.getElementById("whatsappFloat");

  if (whatsappButton) {
    whatsappButton.hidden = !whatsappNumber;

    if (whatsappNumber) {
      whatsappButton.href =
        `https://wa.me/${whatsappNumber}`;

      whatsappButton.setAttribute(
        "aria-label",
        `Chat with ${name} on WhatsApp`
      );
    }
  }

  setSocialLinks(site.socials || {});
}

// ========================================
// MEDIA RENDERING
// ========================================

function makeMedia(project, forDialog = false) {
  const src = project.media || "";
  const poster = project.poster || "";

  // YOUTUBE VIDEOS
  if (hasYouTube(project)) {
    const id = youtube.parseVideoId(
      project.youtubeId
    );

    if (forDialog) {
      const iframe = createElement(
        "iframe",
        "youtube-embed"
      );

      iframe.src = youtube.embedUrl(id);
      iframe.title =
        `YouTube video: ${project.title}`;

      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

      iframe.allowFullscreen = true;

      iframe.referrerPolicy =
        "strict-origin-when-cross-origin";

      return iframe;
    }

    const thumb = createElement("img");

    thumb.src = poster || youtube.thumbnail(id);
    thumb.alt =
      `YouTube thumbnail for ${project.title}`;

    thumb.loading = "lazy";
    thumb.decoding = "async";

    thumb.addEventListener("error", () => {
      if (!thumb.dataset.fallback) {
        thumb.dataset.fallback = "true";
        thumb.removeAttribute("src");
        thumb.alt = `Video: ${project.title}`;
      }
    });

    return thumb;
  }

  // LOCAL VIDEO FILES
  if (videoFile(src)) {
    if (forDialog) {
      const video = createElement("video");

      video.src = src;
      if (poster) video.poster = poster;

      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.setAttribute(
        "aria-label",
        `Video: ${project.title}`
      );

      return video;
    }

    if (poster) {
      const image = createElement("img");

      image.src = poster;
      image.alt =
        `Cover image for ${project.title}`;

      image.loading = "lazy";
      image.decoding = "async";

      return image;
    }

    const video = createElement("video");

    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    return video;
  }

  // STATIC IMAGE
  const image = createElement("img");

  if (src) image.src = src;

  image.alt = project.title;
  image.loading = forDialog ? "eager" : "lazy";
  image.decoding = "async";

  return image;
}

// ========================================
// PROJECT CARDS
// ========================================

function makeCard(project) {
  const card = createElement(
    "article",
    "project-card glass"
  );

  const button = createElement(
    "button",
    "project-open"
  );

  button.type = "button";

  button.setAttribute(
    "aria-label",
    `View ${project.title} project`
  );

  const media = createElement(
    "div",
    "project-media"
  );

  media.append(makeMedia(project));

  media.append(
    createElement(
      "span",
      "project-category",
      labels[project.category] || project.category
    )
  );

  if (project.demo) {
    media.append(
      createElement("span", "project-demo", "DEMO")
    );
  }

  if (
    hasYouTube(project) ||
    videoFile(project.media)
  ) {
    media.append(
      createElement("span", "project-play", "▶")
    );
  }

  const bottom = createElement(
    "div",
    "project-card-bottom"
  );

  const text = createElement("div");

  text.append(
    createElement(
      "h3",
      "project-title",
      project.title
    )
  );

  text.append(
    createElement(
      "p",
      "project-subtitle",
      project.client ||
        labels[project.category] ||
        "Creative project"
    )
  );

  bottom.append(
    text,
    createElement("span", "project-link-icon", "↗")
  );

  button.append(media, bottom);

  button.addEventListener("click", () => {
    openProject(project);
  });

  card.append(button);

  return card;
}

// ========================================
// PROJECT FILTERS & COUNTERS
// ========================================

function renderProjects() {
  const selected =
    activeFilter === "all"
      ? projects
      : projects.filter(
          project => project.category === activeFilter
        );

  grid.replaceChildren(...selected.map(makeCard));

  const emptyState =
    document.getElementById("emptyState");

  if (emptyState) {
    emptyState.hidden = selected.length > 0;
  }

  const resultsLabel =
    document.getElementById("resultsLabel");

  if (resultsLabel) {
    resultsLabel.textContent =
      activeFilter === "all"
        ? `Showing all ${selected.length} projects`
        : `Showing ${selected.length} ${labels[activeFilter].toLowerCase()} project${selected.length === 1 ? "" : "s"}`;
  }

  grid.setAttribute("aria-busy", "false");
}

function updateCounts() {
  for (const category of Object.keys(labels)) {
    const count =
      category === "all"
        ? projects.length
        : projects.filter(
            project => project.category === category
          ).length;

    const element =
      document.getElementById(`count-${category}`);

    if (element) {
      element.textContent =
        String(count).padStart(2, "0");
    }
  }

  const total =
    document.getElementById("projectTotal");

  if (total) {
    total.textContent =
      String(projects.length).padStart(2, "0");
  }
}

function openProject(project) {
  const media =
    document.getElementById("dialogMedia");

  media.replaceChildren(
    makeMedia(project, true)
  );

  document.getElementById(
    "dialogCategory"
  ).textContent =
    labels[project.category]?.toUpperCase() ||
    "CREATIVE PROJECT";

  document.getElementById(
    "dialogTitle"
  ).textContent = project.title;

  document.getElementById(
    "dialogDescription"
  ).textContent =
    project.description ||
    "A selected piece of creative work.";

  document.getElementById(
    "dialogType"
  ).textContent =
    hasYouTube(project)
      ? "YouTube video"
      : videoFile(project.media)
        ? "Video"
        : "Image";

  document.getElementById(
    "dialogClient"
  ).textContent =
    project.client || "Creative project";

  document.getElementById(
    "dialogNote"
  ).hidden = !project.demo;

  if (!dialog.open) {
    dialog.showModal();
  }
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    filterButtons.forEach(item => {
      const active = item === button;

      item.classList.toggle(
        "is-active",
        active
      );

      item.setAttribute(
        "aria-pressed",
        String(active)
      );
    });

    renderProjects();
  });
});

// ========================================
// VIDEO VIEWER EVENTS
// ========================================

document.getElementById("dialogClose")
  ?.addEventListener("click", () => dialog.close());

document.getElementById("dialogBack")
  ?.addEventListener("click", () => dialog.close());

dialog?.addEventListener("click", event => {
  if (event.target === dialog) {
    dialog.close();
  }
});

dialog?.addEventListener("close", () => {
  document.getElementById(
    "dialogMedia"
  ).replaceChildren();
});

// ========================================
// SUPABASE CONFIGURATION
// ========================================

function connectedConfig() {
  const config =
    window.PORTFOLIO_CONFIG || {};

  const validURL =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(
      config.supabaseUrl || ""
    );

  const validKey =
    Boolean(
      config.supabaseKey &&
      !config.supabaseKey.includes("YOUR-")
    );

  return validURL && validKey;
}

// ========================================
// FETCH PUBLISHED PROJECTS
// ========================================

async function fetchPublishedProjects() {
  const config = window.PORTFOLIO_CONFIG;

  if (!window.supabase?.createClient) {
    throw new Error(
      "Supabase library could not load."
    );
  }

  const client = window.supabase.createClient(
    config.supabaseUrl.replace(/\/$/, ""),
    config.supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const { data, error } = await client
    .from("portfolio_projects")
    .select(
      "id,title,category,client,description,media_path,poster_path,media_type,youtube_id,created_at"
    )
    .order("created_at", {
      ascending: false
    })
    .limit(200);

  if (error) {
    console.error(
      "Supabase portfolio error:",
      error
    );
    throw error;
  }

  console.log(
    "Published projects loaded:",
    data?.length || 0
  );

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
    client: row.client,
    description: row.description,
    demo: false,

    youtubeId: row.youtube_id || "",

    media: row.media_path
      ? client.storage
          .from(config.bucket || "portfolio-media")
          .getPublicUrl(row.media_path)
          .data.publicUrl
      : "",

    poster: row.poster_path
      ? client.storage
          .from(config.bucket || "portfolio-media")
          .getPublicUrl(row.poster_path)
          .data.publicUrl
      : ""
  }));
}

// ========================================
// LOCAL DEMO PROJECTS
// ========================================

async function fetchLocalProjects() {
  const response = await fetch(
    "data/projects.json"
  );

  if (!response.ok) {
    throw new Error(
      "Could not load local projects."
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "projects.json must contain an array."
    );
  }

  return data.filter(project =>
    project &&
    project.title &&
    labels[project.category] &&
    project.category !== "all" &&
    (
      project.media ||
      hasYouTube(project)
    )
  );
}

// ========================================
// INITIALIZE PUBLIC PORTFOLIO
// ========================================

async function initialize() {
  if (!grid) {
    console.error(
      "Portfolio grid element not found."
    );
    return;
  }

  try {
    grid.setAttribute(
      "aria-busy",
      "true"
    );

    // Site settings are optional.
    // A 404 will NOT stop the gallery.
    const site =
      await loadOptionalSiteSettings();

    setSite(site);

    // Load your real Supabase projects.
    if (connectedConfig()) {
      projects = await fetchPublishedProjects();
    } else {
      // Use demo content only when
      // Supabase is not configured.
      projects = await fetchLocalProjects();
    }

    updateCounts();
    renderProjects();

    console.log(
      "Portfolio initialized successfully.",
      projects.length,
      "project(s)."
    );
  } catch (error) {
    console.error(
      "Portfolio loading error:",
      error
    );

    grid.setAttribute(
      "aria-busy",
      "false"
    );

    const message = connectedConfig()
      ? "Unable to load published projects. Please try again later."
      : "Unable to load local portfolio projects.";

    grid.replaceChildren(
      createElement(
        "div",
        "loading-projects glass",
        message
      )
    );
  }
}

// Start the portfolio
initialize();
