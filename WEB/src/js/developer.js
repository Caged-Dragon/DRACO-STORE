const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "app";
let DV = null, M = {app:null, rels:[]};
async function extraTabs(m){
  if(S.tab==="lead"){ m.innerHTML = `<div class="empty">Loading…</div>`;
    const r = await L2("store_application_leaderboards?select=id,name,score_unit,store_applications(name,icon_emoji)&order=id");
    m.innerHTML = r.length ? `<h2>Leaderboards</h2><div class="grid">${r.map(b => `<button class="item" data-board="${b.id}" data-bn="${esc(b.name)}" data-bu="${esc(b.score_unit)}"><div class="icon" style="background:var(--chip)" aria-hidden="true">${esc((b.store_applications||{}).icon_emoji || "🏆")}</div><div><b>${esc((b.store_applications||{}).name)}</b><small>${esc(b.name)}</small></div></button>`).join("")}</div>` : `<div class="empty">No leaderboards yet.</div>`; return }
  if(!S.sess){ m.innerHTML = `<div class="empty">Sign in to continue.<br><br><button class="btn pri" data-act="signin">Sign in</button></div>`; return }
  m.innerHTML = `<div class="empty">Loading…</div>`;
  if(S.tab==="ach"){
    const [r, p] = await Promise.all([L2("store_user_achievement_unlocks?select=unlocked_at,store_application_achievements(title,description,points,store_applications(name))&order=unlocked_at.desc"), L2(`store_user_profiles?user_id=eq.${uid()}&select=experience_points`)]);
    m.innerHTML = `<h2>Your achievements</h2><p class="meta">${(p[0]||{}).experience_points || 0} XP in total · ${r.length} unlocked</p>` + (r.length ? r.map(u => { const a = u.store_application_achievements || {}; return `<div class="rev">✅ <b>${esc(a.title)}</b> <small>${a.points} pts · ${esc((a.store_applications||{}).name)} · ${new Date(u.unlocked_at).toLocaleDateString()}</small><br><small>${esc(a.description)}</small></div>` }).join("") : `<div class="empty">Nothing unlocked yet. Play a game to earn achievements.</div>`); return }
  /* developer home */
  try{ [DV] = await rpc("store_get_my_developers",{}) }catch(e){ DV = null }
  if(!DV){ m.innerHTML = `<h2>Become a developer</h2><p class="meta">Create a developer account to publish apps and games. Every new app and release is reviewed by our team before it goes live.</p><form id="devform" style="max-width:420px"><div class="field"><label for="dn">Studio or developer name</label><input id="dn" required maxlength="80"></div><div class="field"><label for="ds">Your website (optional, starts with https://)</label><input id="ds" type="url" pattern="https://.*"></div><div class="err" id="derr"></div><button class="btn pri" type="submit">Create developer account</button></form>`; return }
  const apps = await L(`developer_id=eq.${DV.id}&order=id.desc`);
  m.innerHTML = `<h2>${esc(DV.name)}${DV.is_verified ? " ✓" : ""}</h2><p><button class="btn pri" data-dact="newapp">+ New application</button></p>` + (apps.length ? `<div class="grid">${apps.map(a => `<button class="item" data-manage="${esc(a.slug)}">${ic(a)}<div><b>${esc(a.name)}</b><small>Status: ${esc(a.status.replace("_"," "))}</small><small>${fmt(a.download_count)} downloads</small></div></button>`).join("")}</div>` : `<div class="empty">You have no applications yet.</div>`);
}
async function createDev(e){
  e.preventDefault(); const err = $("#derr"); err.textContent = ""; const name = $("#dn").value.trim(), site = $("#ds").value.trim();
  for(let i = 0; i < 3; i++){ try{
    await rest("store_developers?select=id", {method:"POST", body:JSON.stringify({slug: slugify(name) + (i ? "-" + Math.random().toString(36).slice(2,6) : ""), name, owner_user_id:uid(), website_url:site || null}), headers:{Prefer:"return=representation"}});
    toast("Developer account created"); return render() }catch(x){ if(!/409/.test(x.message)) return err.textContent = "Could not create the account. Try again." } }
  err.textContent = "That name is taken. Try a different one.";
}
function newAppSheet(){
  const opt = k => S.cats.filter(c => c.parent_category_id && c.applies_to===k).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  $("#sheet").innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>New application</h3><form id="appform">
  <div class="field"><label for="an">Name</label><input id="an" required maxlength="80"></div>
  <div class="field"><label for="ac">Category</label><select id="ac" required><optgroup label="Games">${opt("game")}</optgroup><optgroup label="Apps">${opt("app")}</optgroup></select></div>
  <div class="field"><label for="as">Short description (max 160 characters)</label><input id="as" required maxlength="160"></div>
  <div class="field"><label for="ad">Full description</label><textarea id="ad" rows="4" maxlength="4000"></textarea></div>
  <div class="field"><label for="ar">Content rating</label><select id="ar"><option value="everyone">Everyone</option><option value="teen">Teen</option><option value="mature">Mature</option><option value="adult">Adult</option></select></div>
  <div class="field"><label for="ae">Icon (one emoji)</label><input id="ae" value="📦" maxlength="8"></div>
  <div class="err" id="aerr2"></div><button class="install" type="submit">Create draft</button></form>`; $("#scrim").classList.add("on");
}
async function createApp(e){
  e.preventDefault(); const err = $("#aerr2"); err.textContent = ""; const cid = +$("#ac").value, cat = S.cats.find(c => c.id === cid), name = $("#an").value.trim();
  for(let i = 0; i < 3; i++){ try{
    const [a] = await rest("store_applications?select=id,slug", {method:"POST", body:JSON.stringify({slug: slugify(name) + (i ? "-" + Math.random().toString(36).slice(2,6) : ""), name, developer_id:DV.id, kind:cat.applies_to, primary_category_id:cid, short_description:$("#as").value.trim(), full_description:$("#ad").value.trim(), content_rating:$("#ar").value, icon_emoji:$("#ae").value.trim() || "📦", status:"draft"}), headers:{Prefer:"return=representation"}});
    toast("Draft created"); return manage(a.slug) }catch(x){ if(!/409/.test(x.message)) return err.textContent = "Could not create the application. Check the fields and try again." } }
  err.textContent = "An application with that name already exists.";
}
const EXT = {android:/\.apk$/i, windows:/\.(exe|msi|msix)$/i, macos:/\.(dmg|pkg)$/i, linux:/\.(deb|rpm|appimage|tar\.gz|tgz)$/i, source:/\.(zip|tar\.gz|tgz|7z)$/i};
const ACC = {android:".apk", windows:".exe,.msi,.msix", macos:".dmg,.pkg", linux:".deb,.rpm,.AppImage,.tar.gz,.tgz", source:".zip,.tar.gz,.tgz,.7z"};
const MIME = {apk:"application/vnd.android.package-archive", exe:"application/vnd.microsoft.portable-executable", msi:"application/x-msi", dmg:"application/x-apple-diskimage", zip:"application/zip", deb:"application/vnd.debian.binary-package"};
const sendFile = (url, file, headers, onp) => new Promise((ok, no) => { const x = new XMLHttpRequest(); x.open("POST", url); for(const k in headers) x.setRequestHeader(k, headers[k]);
  x.upload.onprogress = e => e.lengthComputable && onp(Math.round(e.loaded / e.total * 100)); x.onload = () => x.status < 300 ? ok() : no(new Error("upload " + x.status)); x.onerror = () => no(new Error("network")); x.send(file) });
/* Check that a file's real contents match its type (a renamed file is refused) */
const MAGIC = {elf:[0x7f,0x45,0x4c,0x46], mz:[0x4d,0x5a], zip:[0x50,0x4b], gz:[0x1f,0x8b], ole:[0xd0,0xcf,0x11,0xe0], xar:[0x78,0x61,0x72,0x21], ar:[0x21,0x3c,0x61,0x72,0x63,0x68,0x3e], rpm:[0xed,0xab,0xee,0xdb], sz:[0x37,0x7a,0xbc,0xaf]};
const KIND = {elf:"a Linux program", mz:"a Windows program", zip:"a ZIP-style package", gz:"a compressed archive", ole:"a Windows installer (.msi)", xar:"a Mac installer package", ar:"a Debian package", rpm:"an RPM package", sz:"a 7-Zip archive"};
const WANT = {exe:["mz"], msi:["ole"], msix:["zip"], apk:["zip"], pkg:["xar"], deb:["ar"], rpm:["rpm"], appimage:["elf"], zip:["zip"], tgz:["gz"], gz:["gz"], "7z":["sz"]};
async function sniff(file){
  const name = file.name.toLowerCase(), ext = name.endsWith(".tar.gz") ? "gz" : name.split(".").pop(), want = WANT[ext]; if(!want) return "";
  const b = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(new Uint8Array(fr.result)); fr.readAsArrayBuffer(file.slice(0, 8)) });
  const found = Object.keys(MAGIC).find(k => MAGIC[k].every((v, i) => b[i] === v));
  if(found && want.includes(found)) return "";
  return `This file is named “.${ext}” but its contents look like ${found ? KIND[found] : "something else"}, not ${want.map(k => KIND[k]).join(" or ")}. Please build or export the right file first` + (found === "elf" && ext === "exe" ? " (a Windows program must be built on Windows)." : ".");
}
async function manage(slug){
  const sh = $("#sheet"); sh.innerHTML = `<div class="empty">Loading…</div>`; $("#scrim").classList.add("on");
  try{
    [M.app] = await rest(`store_applications?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name,status`);
    M.rels = await rest(`store_application_releases?application_id=eq.${M.app.id}&select=id,version_name,version_code,status,store_release_files(id,platform,file_name)&order=version_code.desc`);
  }catch(e){ sh.innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><div class="empty">Could not load this application.</div>`; return }
  const a = M.app, next = M.rels.length ? M.rels[0].version_name : "1.0.0";
  sh.innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>${esc(a.name)}</h3><p class="meta">Status: <b>${esc(a.status.replace("_"," "))}</b>${a.status==="draft" ? " · upload a file, then submit for review" : a.status==="in_review" ? " · waiting for staff review" : ""}</p>
  ${a.status==="draft" ? `<button class="install" data-dact="submit" data-id="${a.id}">Submit for review</button>` : ""}
  <h4>Releases</h4>${M.rels.length ? M.rels.map(r => `<div class="rev"><b>v${esc(r.version_name)}</b> <small>${esc(r.status)}</small>${(r.store_release_files||[]).map(f => `<br><small>${esc(f.platform)}: ${esc(f.file_name || "web link")}</small>`).join("") || "<br><small>no files yet</small>"}</div>`).join("") : `<p class="meta">No releases yet.</p>`}
  <h4>Upload a file</h4><p class="meta"><b>Recommended:</b> upload a ready-to-install file (.apk, .exe, .msi, .dmg). Players install it with one tap. You can also upload your complete codebase as a .zip: it stays private and is only seen by our review team.</p>
  <form id="filef"><div class="field"><label for="fv">Version (a new number creates a new release)</label><input id="fv" name="v" value="${esc(next)}" required maxlength="30"></div>
  <div class="field"><label for="fn">Release notes (for a new release)</label><textarea id="fn" name="n" rows="2" maxlength="2000"></textarea></div>
  <div class="field"><label for="fp">What are you uploading?</label><select id="fp" name="p"><option value="android">Android installer (.apk)</option><option value="windows">Windows installer (.exe, .msi)</option><option value="macos">macOS installer (.dmg, .pkg)</option><option value="linux">Linux package (.deb, .rpm, .AppImage)</option><option value="web">Web version (play in browser)</option><option value="ios">iPhone / iPad (App Store link)</option><option value="source">Complete source code (.zip) – private, for review</option></select></div>
  <div class="field"><label for="ff">File</label><input id="ff" name="f" type="file" accept="${ACC.android}"></div>
  <div class="field"><label for="fu">Web address (Web and iPhone / iPad only, starts with https://)</label><input id="fu" name="u" type="url" pattern="https://.*" disabled></div>
  <div class="field"><label for="fo">Minimum system version (optional, e.g. Android 8)</label><input id="fo" name="o" maxlength="20"></div>
  <progress id="fbar" max="100" value="0" hidden style="width:100%"></progress>
  <div class="err" id="ferr" role="alert"></div><button class="install" type="submit">Upload</button></form>
  <p class="meta">Our team checks every release before it goes live. Very large files can take a while to upload.</p>`;
}
document.addEventListener("change", e => { if(e.target.id === "fp"){ const p = e.target.value; $("#ff").accept = ACC[p] || ""; $("#ff").disabled = !ACC[p]; $("#fu").disabled = !!ACC[p] } });
async function addFile(e){
  e.preventDefault(); const f = e.target, err = $("#ferr"), bar = $("#fbar"); err.textContent = "";
  const ver = f.v.value.trim(), plat = f.p.value, file = f.f.files[0], url = f.u.value.trim(), os = f.o.value.trim() || null, up = !!ACC[plat], src = plat === "source";
  try{
    let rel = M.rels.find(r => r.version_name === ver);
    if(rel && rel.status !== "draft") throw new Error("That version is already published. Use a new version number.");
    if(up){ if(!file) throw new Error("Choose the file to upload."); if(!EXT[plat].test(file.name)) throw new Error("This choice needs a file of type: " + ACC[plat]); const bad = await sniff(file); if(bad) throw new Error(bad) }
    else if(!https(url)) throw new Error("Enter the web address, starting with https://");
    if(!rel){ [rel] = await rest("store_application_releases?select=id,version_name,version_code,status", {method:"POST", body:JSON.stringify({application_id:M.app.id, version_name:ver, version_code:M.rels.reduce((n,r) => Math.max(n, r.version_code), 0) + 1, release_notes:f.n.value.trim()}), headers:{Prefer:"return=representation"}}) }
    const body = {release_id:rel.id, platform:plat, file_role: src ? "source_code" : "installer", delivery_method: src ? "source_archive" : plat==="web" ? "web_play" : plat==="ios" ? "external_store" : "direct_download", min_os_version: src ? null : os};
    if(up){
      err.textContent = "Checking the file…";
      const sum = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map(b => b.toString(16).padStart(2,"0")).join("");
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_"), path = `${DV.id}/${M.app.id}/${ver.replace(/[^A-Za-z0-9._-]/g,"_")}/${plat}-${safe}`, tk = await token(), bucket = src ? "store-source-code" : "store-app-files";
      bar.hidden = false; err.textContent = "Uploading…";
      await sendFile(`${URL_}/storage/v1/object/${bucket}/${path}`, file, {apikey:KEY, Authorization:"Bearer " + tk, "Content-Type": MIME[safe.split(".").pop().toLowerCase()] || "application/octet-stream"}, p => bar.value = p);
      Object.assign(body, {file_name:safe, file_size_bytes:file.size, sha256:sum});
      if(src) body.storage_path = path; else body.download_url = `${URL_}/storage/v1/object/public/${bucket}/${path}`;
    } else body.download_url = url;
    await post("store_release_files", body); toast(src ? "Source code uploaded for review." : "File uploaded. It goes live after our review."); manage(M.app.slug);
  }catch(x){ bar.hidden = true; err.textContent = /409/.test(x.message) ? "This version already has a file for that choice." : /upload 409/.test(x.message) ? "A file with that name was already uploaded for this version." : /upload 413/.test(x.message) ? "This file is larger than your Supabase plan allows." : x.message }
}
