/* ---- account ---- */
function authSheet(mode){
  $("#sheet").innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>${mode==="in" ? "Sign in" : "Create your Draco account"}</h3><p class="meta">Use your Draco Mail address (name@draco-mail.com). One account for your library, wishlist, reviews and game progress.</p>
  <form id="af" data-mode="${mode}">${mode==="up" ? `<div class="field"><label for="un">Username (3–20 letters, numbers, underscore)</label><input id="un" pattern="[A-Za-z0-9_]{3,20}" maxlength="20" autocomplete="username"></div>` : ""}
  <div class="field"><label for="em">Draco Mail address</label><input id="em" type="email" required autocomplete="email" placeholder="name@draco-mail.com" pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}@draco-mail\.com" title="Use your Draco Mail address, like name@draco-mail.com"></div>
  <div class="field"><label for="pw">Password (8+ characters)</label><input id="pw" type="password" minlength="8" required autocomplete="${mode==="in" ? "current-password" : "new-password"}"></div>
  ${mode==="up" ? `<label class="chk"><input type="checkbox" id="c1" required> I agree to the Privacy Policy and Terms of Draco Store.</label><label class="chk"><input type="checkbox" id="c2"> Optional: share which apps I use and for how long, to improve my recommendations. I can turn this off any time.</label>` : ""}
  <div class="err" id="aerr" role="alert"></div><button class="install" type="submit">${mode==="in" ? "Sign in" : "Create account"}</button></form>
  <button class="btn" data-sw="${mode==="in" ? "up" : "in"}">${mode==="in" ? "New here? Create an account" : "Have an account? Sign in"}</button>`;
  $("#scrim").classList.add("on"); (mode==="up" ? $("#un") : $("#em")).focus();
}
async function onAuth(ev){
  ev.preventDefault(); const mode = ev.target.dataset.mode, email = $("#em").value.trim().toLowerCase(), password = $("#pw").value, err = $("#aerr"); err.textContent = "";
  try{
    let s;
    if(mode==="in") s = await auth("token?grant_type=password", {email,password});
    else { const un = $("#un").value.trim(); try{ localStorage.setItem("draco_consent", JSON.stringify({track:$("#c2").checked})) }catch(e){}
      s = await auth("signup", {email,password,data: un ? {username:un} : {}});
      if(!s.access_token){ $("#sheet").innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>Check your email</h3><p class="meta">We sent a confirmation link to ${esc(email)}. Open it, then sign in here.</p>`; return } }
    save(s); $("#scrim").classList.remove("on"); toast("Signed in"); await afterLogin(); render();
  }catch(e){ err.textContent = e.message }
}
async function afterLogin(){
  if(!S.sess) return;
  try{ const c = JSON.parse(localStorage.getItem("draco_consent") || "null");
    if(c){ await rest(`store_user_preferences?user_id=eq.${uid()}`, {method:"PATCH", body:JSON.stringify({privacy_policy_accepted_at:new Date().toISOString(), allow_usage_tracking:!!c.track}), headers:{Prefer:"return=minimal"}}); localStorage.removeItem("draco_consent") } }catch(e){}
  try{
    let key = localStorage.getItem("draco_device_key"); if(!key){ key = crypto.randomUUID(); localStorage.setItem("draco_device_key", key) }
    const r = await rest("store_user_devices?on_conflict=user_id,device_key&select=id", {method:"POST", body:JSON.stringify({user_id:uid(), device_key:key, platform:DEV, device_name:PN[DEV], last_seen_at:new Date().toISOString()}), headers:{Prefer:"resolution=merge-duplicates,return=representation"}});
    S.devId = r && r[0] && r[0].id;
    const [o,w] = await Promise.all([rest("store_user_owned_applications?select=application_id"), rest("store_user_wishlist_items?select=application_id")]);
    S.own = new Set(o.map(x => x.application_id)); S.wish = new Set(w.map(x => x.application_id));
  }catch(e){}
}
async function accountSheet(){
  let p = {}, pr = {}; try{ [p] = await rest(`store_user_profiles?user_id=eq.${uid()}&select=public_handle,experience_points`); [pr] = await rest(`store_user_preferences?user_id=eq.${uid()}&select=allow_usage_tracking`) }catch(e){}
  $("#sheet").innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>${esc((p||{}).public_handle || "Your account")}</h3><p class="meta">${(p||{}).experience_points || 0} XP · ${esc(S.sess.user.email)}</p>
  <div class="field"><label for="ph">Public player name (shown on reviews and leaderboards, 3–20 letters, numbers, underscore)</label><input id="ph" value="${esc((p||{}).public_handle)}" pattern="[A-Za-z0-9_]{3,20}" maxlength="20"></div><div class="err" id="perr"></div><button class="btn" data-act="savehandle">Save name</button>
  <label class="chk" style="margin-top:16px"><input type="checkbox" id="trk" ${pr && pr.allow_usage_tracking ? "checked" : ""}> Share which apps I use and for how long, to improve my recommendations.</label><br>
  <button class="btn" data-act="signout">Sign out</button>`; $("#scrim").classList.add("on");
}
async function saveHandle(){
  const v = $("#ph").value.trim(), err = $("#perr"); err.textContent = ""; if(!/^[A-Za-z0-9_]{3,20}$/.test(v)) return err.textContent = "Use 3–20 letters, numbers or underscores.";
  try{ await rest(`store_user_profiles?user_id=eq.${uid()}`, {method:"PATCH", body:JSON.stringify({public_handle:v}), headers:{Prefer:"return=minimal"}}); toast("Name saved"); accountSheet() }
  catch(e){ err.textContent = /409/.test(e.message) ? "That name is taken. Try another." : "Could not save. Try again." }
}
