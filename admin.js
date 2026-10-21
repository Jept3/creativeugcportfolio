"use strict";

(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.PORTFOLIO_CONFIG || {};
  const youtube = window.YouTubePortfolio;
  const bucket = cfg.bucket || "portfolio-media";
  const MAX_BYTES = Math.min(100 * 1024 * 1024, Number(cfg.maxFileBytes) || 100 * 1024 * 1024);
  const MIME_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const pictureTypes = new Set(Object.keys(MIME_TYPES));
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || "") &&
    Boolean(cfg.supabaseKey && !cfg.supabaseKey.includes("YOUR-"));
  let api;
  let source = "image";
  let currentFile;
  let currentPreviewUrl;
  let uploadRunning = false;
  let activeUpload = null;
  let activeReject = null;
  let canceled = false;
  let uploadedPaths = [];

  const formatBytes = bytes => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`;
  const status = (id, message, type = "info") => {
    const node = $(id);
    node.textContent = message;
    node.dataset.type = type;
  };
  const humanError = error => error?.message || "Something went wrong. Please try again.";
  const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
  const validFile = file => {
    if (!file) return "Select a photo first.";
    if (!pictureTypes.has(file.type)) return "Unsupported photo. Choose JPG, PNG, or WEBP.";
    if (!file.size) return "This photo is empty.";
    if (file.size > MAX_BYTES) return `Photo too large (${formatBytes(file.size)}). Maximum allowed here: ${formatBytes(MAX_BYTES)}.`;
    return "";
  };

  function getPublicUrl(path) {
    return path ? api.storage.from(bucket).getPublicUrl(path).data.publicUrl : "";
  }

  function releasePreview() {
    if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  function setFile(file) {
    const error = validFile(file);
    if (error) { status("uploadMessage", error, "error"); return false; }
    releasePreview();
    currentFile = file;
    currentPreviewUrl = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.src = currentPreviewUrl;
    image.alt = "Selected ad photo preview";
    $("previewMedia").replaceChildren(image);
    $("fileName").textContent = file.name;
    $("fileInfo").textContent = `${formatBytes(file.size)} · Photo`;
    $("filePreview").hidden = false;
    $("dropTitle").textContent = "Change selected photo";
    if (!$("projectTitle").value.trim()) {
      $("projectTitle").value = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 120);
    }
    status("uploadMessage", "");
    return true;
  }

  function clearFile() {
    currentFile = null;
    $("mediaFile").value = "";
    releasePreview();
    $("previewMedia").replaceChildren();
    $("filePreview").hidden = true;
    $("dropTitle").textContent = "Choose photo to upload";
  }

  function updateYouTubePreview() {
    const id = youtube.parseVideoId($("youtubeUrl").value);
    $("youtubePreview").hidden = !id;
    if (id) {
      $("youtubeThumb").src = youtube.thumbnail(id);
      $("youtubeFoundId").textContent = `Video ID: ${id}`;
    }
    return id;
  }

  function setSource(next) {
    if (uploadRunning || !["image", "youtube"].includes(next)) return;
    source = next;
    $("photoArea").hidden = next !== "image";
    $("youtubeArea").hidden = next !== "youtube";
    $("photoLimit").hidden = next === "youtube";
    $("mediaFile").required = next === "image";
    $("youtubeUrl").required = next === "youtube";
    if (next === "youtube" && $("projectCategory").value === "static") $("projectCategory").value = "video";
    if (next === "image" && $("projectCategory").value === "video") $("projectCategory").value = "static";
    for (const button of document.querySelectorAll("[data-source]")) {
      const active = button.dataset.source === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    $("progressCard").hidden = true;
    status("uploadMessage", "");
    if (next === "youtube") updateYouTubePreview();
  }

  function showProgress(percent, bytes, total, stage = "Uploading photo…") {
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    $("progressCard").hidden = false;
    $("uploadStage").textContent = stage;
    $("uploadPercent").textContent = `${safePercent}%`;
    $("progressFill").style.width = `${safePercent}%`;
    $("progressTrack").setAttribute("aria-valuenow", safePercent);
    $("uploadBytes").textContent = `${formatBytes(bytes)} / ${formatBytes(total)}`;
    $("uploadHint").textContent = safePercent === 100 ? "Finalizing…" : "Keep this tab open";
  }

  function setUploading(value) {
    uploadRunning = value;
    $("uploadButton").disabled = value;
    $("cancelButton").hidden = !value;
    $("clearFile").disabled = value;
    $("loginButton").disabled = value;
    [...$("uploadForm").querySelectorAll("input,select,textarea,button[data-source]")].forEach(el => { el.disabled = value; });
  }

  async function uploadViaTus(file, path, progress) {
    const { data, error } = await api.auth.getSession();
    if (error || !data.session?.access_token) throw new Error("Your session expired. Sign in again.");
    const storageHost = cfg.supabaseUrl.replace(".supabase.co", ".storage.supabase.co").replace(/\/$/, "");
    const token = data.session.access_token;
    return new Promise((resolve, reject) => {
      activeReject = reject;
      const upload = new window.tus.Upload(file, {
        endpoint: `${storageHost}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { authorization: `Bearer ${token}` },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: { bucketName: bucket, objectName: path, contentType: file.type, cacheControl: "3600" },
        chunkSize: 6 * 1024 * 1024,
        onError: err => { activeUpload = null; activeReject = null; reject(err); },
        onProgress: (done, total) => { if (!canceled) progress(done, total); },
        onSuccess: () => { activeUpload = null; activeReject = null; resolve(); }
      });
      activeUpload = upload;
      upload.start();
    });
  }

  async function removePaths(paths) {
    if (!paths.length) return;
    const { error } = await api.storage.from(bucket).remove(paths);
    if (error) console.warn("Could not clean up uploaded photos:", error);
  }

  async function loadProjects() {
    $("libraryMessage").textContent = "";
    const { data, error } = await api.from("portfolio_projects")
      .select("id,title,category,client,media_path,poster_path,media_type,youtube_id,created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (error) { status("libraryMessage", `Could not load projects: ${humanError(error)}`, "error"); return; }
    const projects = data || [];
    $("adminCount").textContent = String(projects.length).padStart(2, "0");
    if (!projects.length) {
      const empty = document.createElement("p");
      empty.className = "library-empty";
      empty.textContent = "No published work yet. Your first creative will appear here and on the public website.";
      $("libraryItems").replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const project of projects) {
      const card = document.createElement("article"); card.className = "library-item";
      const mediaWrap = document.createElement("div"); mediaWrap.className = "library-thumb";
      const previewUrl = project.poster_path ? getPublicUrl(project.poster_path) :
        project.youtube_id ? youtube.thumbnail(project.youtube_id) :
        project.media_type === "image" ? getPublicUrl(project.media_path) : "";
      if (previewUrl) {
        const image = document.createElement("img"); image.src = previewUrl; image.alt = ""; image.loading = "lazy";
        mediaWrap.append(image);
      } else { mediaWrap.textContent = "▶"; }
      const detail = document.createElement("div"); detail.className = "library-item-body";
      const title = document.createElement("strong"); title.textContent = project.title;
      const subtitle = document.createElement("span");
      subtitle.textContent = `${({ugc:"UGC",static:"Static ad",video:"Video ad"})[project.category] || project.category} · ${project.client || "Creative work"}`;
      const view = document.createElement("a"); view.textContent = project.youtube_id ? "Open on YouTube ↗" : "View photo ↗";
      view.href = project.youtube_id ? youtube.watchUrl(project.youtube_id) : getPublicUrl(project.media_path);
      view.target = "_blank"; view.rel = "noopener noreferrer";
      detail.append(title, subtitle, view);
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "library-delete"; remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete ${project.title}`);
      remove.addEventListener("click", () => deleteProject(project, remove));
      card.append(mediaWrap, detail, remove); fragment.append(card);
    }
    $("libraryItems").replaceChildren(fragment);
  }

  async function deleteProject(project, button) {
    if (uploadRunning) { status("libraryMessage", "Finish or cancel your upload first.", "error"); return; }
    if (!window.confirm(`Delete “${project.title}” from your portfolio? This cannot be undone.`)) return;
    button.disabled = true;
    status("libraryMessage", "Removing project…");
    try {
      const { error } = await api.from("portfolio_projects").delete().eq("id", project.id);
      if (error) throw error;
      const paths = [project.media_path, project.poster_path].filter(Boolean);
      // Deleting a YouTube portfolio entry never deletes the video from YouTube.
      const { error: storageError } = paths.length ? await api.storage.from(bucket).remove(paths) : { error: null };
      await loadProjects();
      status("libraryMessage", storageError ? `Project removed, but an uploaded photo could not be deleted: ${humanError(storageError)}` : "Project removed from the portfolio.", storageError ? "error" : "success");
    } catch (error) { button.disabled = false; status("libraryMessage", humanError(error), "error"); }
  }

  async function publish(event) {
    event.preventDefault();
    if (uploadRunning) return;
    const isYouTube = source === "youtube";
    const file = isYouTube ? null : (currentFile || $("mediaFile").files[0]);
    const cover = isYouTube ? $("posterFile").files[0] : null;
    const id = isYouTube ? youtube.parseVideoId($("youtubeUrl").value) : "";
    if (isYouTube && !id) { status("uploadMessage", "Paste a valid YouTube video or Shorts link.", "error"); return; }
    if (!isYouTube) {
      const problem = validFile(file);
      if (problem) { status("uploadMessage", problem, "error"); return; }
    }
    if (cover) {
      const problem = validFile(cover);
      if (problem) { status("uploadMessage", `Video cover: ${problem}`, "error"); return; }
    }
    const title = $("projectTitle").value.trim();
    const category = $("projectCategory").value;
    if (!title || !["ugc", "static", "video"].includes(category)) {
      status("uploadMessage", "Add a title and choose a category.", "error"); return;
    }
    if (!isYouTube && category === "video") {
      status("uploadMessage", "Use the YouTube tab for video ads.", "error"); return;
    }
    if (isYouTube && category === "static") {
      status("uploadMessage", "Choose UGC or Video ad for a YouTube clip.", "error"); return;
    }
    if ((file || cover) && !window.tus?.Upload) {
      status("uploadMessage", "Upload library failed to load. Check your internet connection and reload.", "error"); return;
    }
    const totalBytes = (file?.size || 0) + (cover?.size || 0);
    uploadedPaths = [];
    canceled = false;
    setUploading(true);
    $("progressCard").hidden = !totalBytes;
    if (totalBytes) showProgress(0, 0, totalBytes, "Preparing secure photo upload…");
    status("uploadMessage", totalBytes ? "Uploading photo to your portfolio…" : "Publishing your YouTube link…");
    try {
      let primaryPath = null;
      let posterPath = null;
      if (file) {
        primaryPath = `projects/${randomId()}.${MIME_TYPES[file.type]}`;
        await uploadViaTus(file, primaryPath, done => showProgress(done / totalBytes * 100, done, totalBytes, "Uploading ad photo…"));
        uploadedPaths.push(primaryPath);
      }
      if (canceled) throw new Error("Upload canceled.");
      if (cover) {
        posterPath = `posters/${randomId()}.${MIME_TYPES[cover.type]}`;
        await uploadViaTus(cover, posterPath, done => showProgress(done / totalBytes * 100, done, totalBytes, "Uploading video cover…"));
        uploadedPaths.push(posterPath);
      }
      if (canceled) throw new Error("Upload canceled.");
      if (totalBytes) showProgress(100, totalBytes, totalBytes, "Photo uploaded. Publishing to gallery…");
      // Once bytes are uploaded, database publication is not cancellable.
      $("cancelButton").hidden = true;
      const { error } = await api.from("portfolio_projects").insert({
        title, category,
        client: $("uploadForm").elements.namedItem("client").value.trim(),
        description: $("uploadForm").elements.namedItem("description").value.trim(),
        media_path: primaryPath, poster_path: posterPath,
        media_type: isYouTube ? "youtube" : "image", youtube_id: isYouTube ? id : null
      });
      if (error) throw error;
      uploadedPaths = [];
      clearFile();
      $("uploadForm").reset();
      $("youtubePreview").hidden = true;
      if (totalBytes) {
        showProgress(100, totalBytes, totalBytes, "Published successfully ✓");
        $("uploadHint").textContent = "Ready for your next creative";
      }
      status("uploadMessage", "Published successfully! Your creative is now in your portfolio.", "success");
      await loadProjects();
    } catch (error) {
      const wasCanceled = canceled;
      const cleanup = [...uploadedPaths];
      uploadedPaths = [];
      await removePaths(cleanup);
      $("progressCard").hidden = true;
      status("uploadMessage", wasCanceled ? "Upload canceled. Nothing was published." : `Publishing failed: ${humanError(error)}`, wasCanceled ? "info" : "error");
    } finally { activeUpload = null; activeReject = null; setUploading(false); }
  }

  async function cancelUpload() {
    if (!uploadRunning || !activeUpload) return;
    canceled = true;
    const rejecting = activeReject;
    const upload = activeUpload;
    activeReject = null;
    activeUpload = null;
    try { await upload.abort(true); } catch (error) { console.warn("Could not fully abort upload:", error); }
    rejecting?.(new Error("Upload canceled."));
  }

  async function showDashboard() {
    $("loginPanel").hidden = true;
    $("dashboard").hidden = false;
    $("signOut").hidden = false;
    await loadProjects();
  }

  async function requireAdmin(user) {
    if (!user) return false;
    const { data, error } = await api.from("portfolio_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    return !error && data?.user_id === user.id;
  }

  async function boot() {
    $("loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const btn = $("loginButton");
      btn.disabled = true;
      status("loginMessage", "Signing in…");
      const form = new FormData(event.currentTarget);
      try {
        const { data, error } = await api.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
        if (error) throw error;
        if (!await requireAdmin(data.user)) {
          await api.auth.signOut();
          throw new Error("This account is not an authorized administrator. Add its user ID to portfolio_admins in Supabase.");
        }
        status("loginMessage", "");
        await showDashboard();
      } catch (error) { status("loginMessage", humanError(error), "error"); }
      finally { btn.disabled = false; }
    });
    $("signOut").addEventListener("click", async () => {
      if (uploadRunning) { status("uploadMessage", "Finish your upload before signing out.", "error"); return; }
      await api.auth.signOut();
      $("signOut").hidden = true;
      $("dashboard").hidden = true;
      $("loginPanel").hidden = false;
      $("loginForm").reset();
      status("loginMessage", "Signed out.");
    });
    for (const button of document.querySelectorAll("[data-source]")) {
      button.addEventListener("click", () => setSource(button.dataset.source));
    }
    $("youtubeUrl").addEventListener("input", updateYouTubePreview);
    $("mediaFile").addEventListener("change", event => {
      if (event.target.files[0] && !setFile(event.target.files[0])) event.target.value = "";
    });
    $("clearFile").addEventListener("click", clearFile);
    $("dropZone").addEventListener("dragover", event => { event.preventDefault(); $("dropZone").classList.add("drag-active"); });
    $("dropZone").addEventListener("dragleave", () => $("dropZone").classList.remove("drag-active"));
    $("dropZone").addEventListener("drop", event => {
      event.preventDefault();
      $("dropZone").classList.remove("drag-active");
      if (uploadRunning) return;
      const file = event.dataTransfer.files[0];
      if (file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        $("mediaFile").files = transfer.files;
        if (!setFile(file)) $("mediaFile").value = "";
      }
    });
    $("uploadForm").addEventListener("submit", publish);
    $("cancelButton").addEventListener("click", cancelUpload);
    $("refreshButton").addEventListener("click", loadProjects);
    setSource("image");

    if (!configured) { $("setupPanel").hidden = false; return; }
    if (!window.supabase?.createClient) {
      $("setupPanel").hidden = false;
      $("setupPanel").querySelector("p").textContent = "Could not load Supabase. Check your internet connection and reload this page.";
      return;
    }
    api = window.supabase.createClient(cfg.supabaseUrl.replace(/\/$/, ""), cfg.supabaseKey);
    $("loginPanel").hidden = false;
    try {
      const { data, error } = await api.auth.getUser();
      if (!error && data.user && await requireAdmin(data.user)) await showDashboard();
      else if (data?.user) await api.auth.signOut();
    } catch (error) { status("loginMessage", humanError(error), "error"); }
  }

  window.addEventListener("beforeunload", releasePreview);
  boot();
})();
