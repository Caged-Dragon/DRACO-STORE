/* ---- views ---- */
const ic = (a,big) => `<div class="icon" style="background:linear-gradient(145deg,${col(a.theme_color_start)},${col(a.theme_color_end)})" aria-hidden="true">${https(a.icon_url) ? `<img src="${esc(a.icon_url)}" alt="" loading="lazy">` : esc(a.icon_emoji)}</div>`;
const stars = a => a.rating_count === undefined ? "" : a.rating_count ? (+a.rating_average).toFixed(1) + " ★" : "New";
const card = a => `<button class="card" data-slug="${esc(a.slug)}">${ic(a)}<b>${esc(a.name)}</b><span>${esc(a.category_name)} · ${stars(a)}</span></button>`;
const item = (a,extra="") => `<button class="item" data-slug="${esc(a.slug)}">${ic(a)}<div><b>${esc(a.name)}</b><small>${esc(a.developer_name)}</small><small>${stars(a)} · ${esc(a.category_name)}${extra}</small></div></button>`;
const row = (t,l) => l && l.length ? `<h2>${t}</h2><div class="row">${l.map(card).join("")}</div>` : "";
const NAV = [["home","🏠","For you"],["game","🎮","Games"],["app","🧩","Apps"],["top","🏆","Top charts"],["lib","📚","My library"],["wish","💜","Wishlist"],["lead","🏆","Leaderboards"],["ach","🏅","Achievements"],["dev","🛠️","Developer"]];
const L = (q) => rest("store_application_listing?select=*&" + q).catch(() => []);

async function render(){
  $("#nav").innerHTML = NAV.map(([k,i,l]) => `<button data-tab="${k}" aria-current="${S.tab===k}"><span aria-hidden="true">${i}</span>${l}</button>`).join("");
  const m = $("#main"); let h = "";
  if(S.q){ m.innerHTML = `<div class="empty">Searching…</div>`;
    try{ const r = await rpc("store_search_applications",{p_query:S.q,p_limit:40}); if(S.q !== $("#q").value.trim()) return;
      m.innerHTML = `<h2>Results for “${esc(S.q)}”</h2>` + (r.length ? `<div class="grid">${r.map(a=>item(a)).join("")}</div>` : `<div class="empty">No matches. Try another name.</div>`) }catch(e){ m.innerHTML = `<div class="empty">Search is unavailable right now.</div>` } return }
  if(S.tab==="lib" || S.tab==="wish"){
    if(!S.sess){ m.innerHTML = `<div class="empty">Sign in to see your ${S.tab==="lib"?"library":"wishlist"}.<br><br><button class="btn pri" data-act="signin">Sign in</button></div>`; return }
    m.innerHTML = `<div class="empty">Loading…</div>`;
    try{
      if(S.tab==="lib"){ const r = await rest("store_user_library_overview?select=*&order=acquired_at.desc"); m.innerHTML = r.length ? `<h2>Your library</h2><div class="grid">${r.map(a=>item(a,` · ${Math.round(a.total_play_seconds/60)} min played`)).join("")}</div>` : `<div class="empty">Your library is empty. Open an app and tap “Add to library”.</div>` }
      else { const ids = [...S.wish]; const r = ids.length ? await L("id=in.("+ids.join(",")+")") : []; m.innerHTML = r.length ? `<h2>Your wishlist</h2><div class="grid">${r.map(a=>item(a)).join("")}</div>` : `<div class="empty">Your wishlist is empty.</div>` }
    }catch(e){ m.innerHTML = `<div class="empty">Could not load. Try again.</div>` } return }
  if(["lead","ach","dev"].includes(S.tab)) return extraTabs(m);
  if(S.tab==="home"){ m.innerHTML = `<div class="empty">Loading the store…</div>`;
    const [tr,nw,tp,rt,dv,wb] = await Promise.all([ rest("store_application_trending?select=*&order=downloads_last_7_days.desc&limit=12").catch(()=>[]), L("order=published_at.desc&limit=12"), L("order=download_count.desc&limit=12"), L("rating_count=gt.0&order=rating_average.desc,rating_count.desc&limit=12"), L(`platforms=cs.{${DEV}}&limit=12`), L("platforms=cs.{web}&limit=12") ]);
    h = row("Trending this week",tr) + row("New and updated",nw) + row("Most downloaded",tp) + row("Top rated",rt) + (DEV!=="web" ? row("Available for "+PN[DEV],dv) : "") + row("Play in your browser",wb);
    m.innerHTML = h || `<div class="empty">No apps are published yet.</div>`; return }
  const kind = S.tab==="game" ? "game" : S.tab==="app" ? "app" : null;
  const chips = S.cats.filter(c => c.parent_category_id && kind && c.applies_to===kind);
  let qs = "order=" + (S.tab==="top" ? "download_count.desc" : "published_at.desc") + "&limit=24&offset=" + S.list.length;
  if(kind) qs += "&kind=eq." + kind; if(S.cat) qs += "&category_id=eq." + S.cat;
  const first = S.list.length === 0, r = await L(qs); S.list = S.list.concat(r); S.more = r.length === 24;
  h = chips.length ? `<div class="chips"><button class="chip" data-cat="0" aria-pressed="${!S.cat}">All</button>${chips.map(c=>`<button class="chip" data-cat="${c.id}" aria-pressed="${S.cat===c.id}">${esc(c.icon_emoji)} ${esc(c.name)}</button>`).join("")}</div>` : "";
  h += S.list.length ? `<div class="grid">${S.list.map(a=>item(a)).join("")}</div>` + (S.more ? `<p style="text-align:center"><button class="btn" data-act="more">Load more</button></p>` : "") : `<div class="empty">Nothing here yet.</div>`;
  m.innerHTML = h;
}
