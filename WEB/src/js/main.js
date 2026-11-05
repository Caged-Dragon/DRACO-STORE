/* ---- events ---- */
document.addEventListener("click", async e => {
  if(e.target.id==="scrim") return $("#scrim").classList.remove("on");
  const t = e.target.closest("[data-tab],[data-cat],[data-slug],[data-file],[data-star],[data-sw],[data-act],[data-board],[data-manage],[data-dact],#x,#theme,#acct"); if(!t) return;
  const d = t.dataset;
  if(d.tab){ S.tab=d.tab; S.cat=0; S.list=[]; S.q=""; $("#q").value=""; render() }
  else if(d.cat !== undefined){ S.cat=+d.cat; S.list=[]; render() }
  else if(d.slug) openApp(d.slug);
  else if(d.file) download(d.file);
  else if(d.star){ S.stars=+d.star; document.querySelectorAll("#stars button").forEach(b => b.classList.toggle("on", +b.dataset.star <= S.stars)) }
  else if(d.sw) authSheet(d.sw);
  else if(d.act==="more") render();
  else if(d.act==="own" || d.act==="wish") toggle(d.act);
  else if(d.act==="review") postReview();
  else if(d.act==="savehandle") saveHandle();
  else if(d.act==="signin") authSheet("in");
  else if(d.act==="signout"){ const tk = S.sess && S.sess.access_token; save(null); S.own.clear(); S.wish.clear(); S.devId=null; $("#scrim").classList.remove("on"); if(tk) auth("logout",null,tk).catch(()=>{}); toast("Signed out"); render() }
  else if(d.board) boardSheet(+d.board, d.bn, d.bu);
  else if(d.manage) manage(d.manage);
  else if(d.dact==="newapp") newAppSheet();
  else if(d.dact==="submit"){ try{ await rest(`store_applications?id=eq.${d.id}`, {method:"PATCH", body:JSON.stringify({status:"in_review"}), headers:{Prefer:"return=minimal"}}); toast("Submitted for review"); manage(M.app.slug) }catch(x){ toast("Could not submit. Try again.") } }
  else if(t.id==="x") $("#scrim").classList.remove("on");
  else if(t.id==="acct") S.sess ? accountSheet() : authSheet("in");
  else if(t.id==="theme"){ const r=document.documentElement, dk = r.dataset.theme==="dark" || (!r.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches); r.dataset.theme = dk ? "light" : "dark" }
});
document.addEventListener("change", async e => { if(e.target.id==="trk"){ try{ await rest(`store_user_preferences?user_id=eq.${uid()}`, {method:"PATCH", body:JSON.stringify({allow_usage_tracking:e.target.checked}), headers:{Prefer:"return=minimal"}}); toast("Saved") }catch(x){ toast("Could not save") } } });
document.addEventListener("submit", e => { const id = e.target.id; if(id==="af") onAuth(e); else if(id==="devform") createDev(e); else if(id==="appform") createApp(e); else if(id==="filef") addFile(e) });
document.addEventListener("keydown", e => { if(e.key==="Escape") $("#scrim").classList.remove("on") });
let tm; $("#q").addEventListener("input", e => { clearTimeout(tm); tm = setTimeout(() => { S.q = e.target.value.trim(); render() }, 300) });

save(S.sess); $("#main").innerHTML = `<div class="empty">Loading the store…</div>`;
(async () => { try{ S.cats = await rest("store_categories?select=id,slug,name,parent_category_id,applies_to,icon_emoji&order=sort_order") }catch(e){} await afterLogin(); render() })();
