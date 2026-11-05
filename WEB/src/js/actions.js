/* ---- actions ---- */
async function download(fid){
  const d = S.cur, f = d.latest_release.files.find(x => x.id == fid), a = d.listing; if(!f || !https(f.download_url) || a.price_minor !== 0) return;
  post("store_download_events", {release_file_id:f.id}).catch(()=>{});
  if(S.sess){
    post("store_user_owned_applications", {user_id:uid(), application_id:a.id}, "resolution=ignore-duplicates,return=minimal").then(()=>S.own.add(a.id)).catch(()=>{});
    if(S.devId && (f.platform==="web" || f.platform===DEV)){
      rest("store_user_device_installs?on_conflict=device_id,application_id", {method:"POST", body:JSON.stringify({device_id:S.devId, user_id:uid(), application_id:a.id, install_status:"installed"}), headers:{Prefer:"resolution=merge-duplicates,return=minimal"}}).catch(()=>{});
      if(f.platform==="web") rpc("store_record_application_session",{p_application_id:a.id, p_duration_seconds:0, p_device_id:S.devId}).catch(()=>{});
    }
  }
  const l = document.createElement("a"); l.rel = "noopener noreferrer";
  l.href = f.delivery_method==="direct_download" && f.file_name && f.download_url.includes("/storage/v1/object/public/") ? f.download_url + "?download=" + encodeURIComponent(f.file_name) : f.download_url;
  if(f.platform==="web" || f.platform==="ios") l.target = "_blank"; else l.download = f.file_name || "";
  document.body.appendChild(l); l.click(); l.remove(); toast(f.platform==="web" ? "Opening…" : f.platform==="ios" ? "Opening the App Store…" : "Download started");
}
async function toggle(kind){
  if(!S.sess) return authSheet("in"); const id = S.cur.listing.id;
  try{
    if(kind==="wish"){ if(S.wish.has(id)){ await rest(`store_user_wishlist_items?application_id=eq.${id}&user_id=eq.${uid()}`, {method:"DELETE"}); S.wish.delete(id) } else { await post("store_user_wishlist_items", {user_id:uid(), application_id:id}); S.wish.add(id) } }
    else if(!S.own.has(id)){ await post("store_user_owned_applications", {user_id:uid(), application_id:id}, "resolution=ignore-duplicates,return=minimal"); S.own.add(id) }
    openApp(S.cur.listing.slug);
  }catch(e){ toast("Could not save. Try again.") }
}
async function postReview(){
  const err = $("#rerr"); err.textContent = ""; if(!S.stars) return err.textContent = "Choose a star rating first.";
  const id = S.cur.listing.id, body = {rating:S.stars, body:$("#rbody").value.trim() || null};
  try{
    const u = await rest(`store_application_reviews?application_id=eq.${id}&user_id=eq.${uid()}`, {method:"PATCH", body:JSON.stringify(body), headers:{Prefer:"return=representation"}});
    if(!u || !u.length) await post("store_application_reviews", {application_id:id, user_id:uid(), ...body});
    toast("Review saved"); openApp(S.cur.listing.slug);
  }catch(e){ err.textContent = "Could not save your review. Try again." }
}
