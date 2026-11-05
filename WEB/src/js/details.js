/* ---- application page ---- */
async function openApp(slug){
  const sh = $("#sheet"); sh.innerHTML = `<div class="empty">Loading…</div>`; $("#scrim").classList.add("on");
  let d; try{ d = await rpc("store_get_application_details",{p_slug:slug}) }catch(e){ d = null }
  if(!d){ sh.innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><div class="empty">This app is not available.</div>`; return }
  S.cur = d; const a = d.listing, rel = d.latest_release, files = rel ? rel.files : [];
  const native = files.find(f => f.platform === DEV && DEV !== "web"), web = files.find(f => f.platform === "web"), main = native || web;
  const free = a.price_minor === 0, owned = S.own.has(a.id), wished = S.wish.has(a.id);
  const ext = f => f.file_name ? "." + f.file_name.split(".").pop().toLowerCase() : "";
  const lab = f => f.platform==="web" ? "Play in browser" : f.platform==="ios" ? "Get on the App Store" : `⬇ Install on ${PN[f.platform]} (${ext(f) || "installer"})`;
  const hint = {android:"After downloading, open the file and allow “Install unknown apps” for your browser if Android asks.",windows:"After downloading, open the installer. If SmartScreen warns you, check the publisher first.",ios:"iPhone and iPad install apps only through the App Store or TestFlight."}[DEV] || "";
  const rb = d.rating_breakdown || {};
  sh.innerHTML = `<button class="close" id="x" aria-label="Close">✕</button>
  <div class="top">${ic(a)}<div><h3>${esc(a.name)}</h3><p>${esc(a.developer_name)}${a.developer_is_verified ? " ✓" : ""}</p></div></div>
  <div class="stats"><div><b>${stars(a)}</b><span>${a.rating_count} reviews</span></div><div><b>${fmt(a.download_count)}</b><span>Downloads</span></div><div><b>${esc(a.content_rating)}</b><span>Rated for</span></div><div><b>${esc(a.category_name)}</b><span>Category</span></div></div>
  ${!free ? `<button class="install" disabled>Paid app (${(a.price_minor/100).toFixed(2)} ${esc(a.currency)}). Purchases are not available yet.</button>` : main ? `<button class="install" data-file="${main.id}">${lab(main)}</button><p class="meta">${main.file_name ? esc(main.file_name) + " · " : ""}${rel ? "Version " + esc(rel.version_name) : ""}${main.file_size_bytes ? " · " + mb(main.file_size_bytes) : ""}${main.min_os_version ? " · Needs " + esc(main.min_os_version) : ""}${main.sha256 ? "<br>SHA-256: " + esc(main.sha256) : ""}</p>` : `<button class="install" disabled>Not available for ${PN[DEV]} yet</button>`}
  ${native && web && free ? `<button class="install alt" data-file="${web.id}">Play in browser instead</button>` : ""}
  ${hint && native ? `<p class="meta">${hint}</p>` : ""}
  ${free && files.filter(f => f !== main && f !== web).length ? `<div class="pills">${files.filter(f => f !== main && f !== web).map(f => `<button data-file="${f.id}">${PN[f.platform]}${ext(f) ? " (" + ext(f) + ")" : ""}</button>`).join("")}</div>` : ""}
  <div class="pills"><button data-act="own" ${!free ? "disabled" : ""}>${owned ? "✓ In your library" : "Add to library"}</button><button data-act="wish">${wished ? "💜 On your wishlist" : "Add to wishlist"}</button></div>
  ${a.contains_ads || a.has_in_app_purchases ? `<p class="meta">${a.contains_ads ? "Contains ads. " : ""}${a.has_in_app_purchases ? "Offers in-app purchases." : ""}</p>` : ""}
  ${d.screenshots && d.screenshots.length ? `<div class="shots">${d.screenshots.filter(s => https(s.image_url)).map(s => `<img src="${esc(s.image_url)}" alt="${esc(s.caption || "Screenshot")}" loading="lazy">`).join("")}</div>` : ""}
  <h4>About this ${a.kind}</h4><p style="color:var(--mut);line-height:1.6;white-space:pre-line">${esc(d.full_description || a.short_description)}</p>
  ${rel && rel.release_notes ? `<h4>What’s new in ${esc(rel.version_name)}</h4><p style="color:var(--mut)">${esc(rel.release_notes)}</p>` : ""}
  ${d.tags && d.tags.length ? `<div class="pills">${d.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
  ${d.in_app_products && d.in_app_products.length ? `<h4>In-app items</h4><p class="meta">${d.in_app_products.map(p => esc(p.name) + " (" + (p.price_minor/100).toFixed(2) + " " + esc(p.currency) + ")").join(" · ")}</p>` : ""}
  ${d.permissions && d.permissions.length ? `<h4>Permissions</h4><p class="meta">${d.permissions.map(p => esc(p.permission) + (p.purpose ? " – " + esc(p.purpose) : "")).join("<br>")}</p>` : ""}
  ${d.data_safety && d.data_safety.length ? `<h4>Data safety</h4><p class="meta">${d.data_safety.map(p => esc(p.category.replace(/_/g," ")) + ": " + (p.collected ? "collected" : "not collected") + (p.shared ? ", shared" : "")).join("<br>")}</p>` : ""}
  ${https(d.privacy_policy_url) ? `<p class="meta"><a href="${esc(d.privacy_policy_url)}" target="_blank" rel="noopener noreferrer">Privacy policy</a></p>` : ""}
  ${d.related && d.related.length ? `<h4>Related</h4><div class="row">${d.related.map(r => card(r.application)).join("")}</div>` : ""}
  ${d.more_from_developer && d.more_from_developer.length ? `<h4>More from ${esc(a.developer_name)}</h4><div class="row">${d.more_from_developer.map(card).join("")}</div>` : ""}
  <div id="extra"></div><h4>Ratings and reviews</h4><p class="meta">${[5,4,3,2,1].map(n => n + "★ " + (rb[n] || 0)).join(" · ")}</p><div id="revs"></div>`;
  $("#x").focus(); reviews(a.id); extras(a.id);
}
async function reviews(id){
  let h = ""; try{
    const r = await rest(`store_application_reviews?select=rating,title,body,created_at,store_user_profiles(public_handle),store_review_replies(reply_body)&application_id=eq.${id}&order=created_at.desc&limit=20`);
    h = r.length ? r.map(v => { const rp = [].concat(v.store_review_replies || [])[0]; return `<div class="rev"><b>${esc((v.store_user_profiles||{}).public_handle || "Player")}</b> <span style="color:#f5a623">${"★".repeat(v.rating)}</span>${v.title ? "<br><b>" + esc(v.title) + "</b>" : ""}<br>${esc(v.body)}<br><small>${new Date(v.created_at).toLocaleDateString()}</small>${rp ? `<div class="reply"><b>Developer reply</b><br>${esc(rp.reply_body)}</div>` : ""}</div>` }).join("") : `<p class="meta">No reviews yet. Be the first.</p>`;
  }catch(e){ h = `<p class="meta">Reviews could not be loaded.</p>` }
  h += S.sess ? `<div class="field"><label>Your rating</label><div class="stars" id="stars">${[1,2,3,4,5].map(n => `<button data-star="${n}" aria-label="${n} stars">★</button>`).join("")}</div><textarea id="rbody" rows="3" maxlength="2000" placeholder="Write a review (optional)"></textarea><div class="err" id="rerr"></div><button class="btn pri" data-act="review">Post review</button></div>` : `<p class="meta">Sign in to rate this app.</p>`;
  const e = $("#revs"); if(e) e.innerHTML = h; S.stars = 0;
}
