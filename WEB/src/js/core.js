const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const https = u => typeof u === "string" && u.startsWith("https://") ? u : "", col = c => /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#4b32c3";
const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1) + "M+" : n >= 1e3 ? (n/1e3).toFixed(1) + "K+" : String(n || 0);
const mb = b => b ? (b/1048576).toFixed(0) + " MB" : "";
const toast = t => { const e=$("#toast"); e.textContent=t; e.style.display="block"; clearTimeout(toast.t); toast.t=setTimeout(()=>e.style.display="none",2800) };
function detect(){ const ua=navigator.userAgent||"", p=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||"";
  if(/android/i.test(ua)) return "android"; if(/iPhone|iPad|iPod/i.test(ua)||(/Mac/i.test(p)&&navigator.maxTouchPoints>1)) return "ios";
  if(/Windows|Win32|Win64/i.test(p+" "+ua)) return "windows"; if(/Macintosh|MacIntel|Mac OS X/i.test(p+" "+ua)) return "macos"; if(/Linux|X11|CrOS/i.test(p+" "+ua)) return "linux"; return "web"; }
const DEV = detect(), PN = {web:"Browser",android:"Android",windows:"Windows",macos:"macOS",linux:"Linux",ios:"iPhone / iPad"};
const S = {tab:"home", cat:0, q:"", list:[], more:false, cats:[], sess:null, own:new Set(), wish:new Set(), devId:null, cur:null, stars:0};
try{ S.sess = JSON.parse(localStorage.getItem("draco_session")) }catch(e){}

/* ---- network ---- */
function save(s){ S.sess = s ? {...s, expires_at: s.expires_at || Math.floor(Date.now()/1000) + (s.expires_in||3600)} : null; try{ s ? localStorage.setItem("draco_session", JSON.stringify(S.sess)) : localStorage.removeItem("draco_session") }catch(e){} $("#acct").textContent = S.sess ? "Account" : "Sign in" }
async function auth(path, body, token){ const r = await fetch(URL_+"/auth/v1/"+path, {method:"POST", headers:{apikey:KEY,"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})}, body: body?JSON.stringify(body):undefined});
  const j = await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.msg||j.error_description||j.message||"Something went wrong. Try again."); return j }
async function token(){ if(!S.sess) return null; if(S.sess.expires_at - 60 < Date.now()/1000){ try{ save(await auth("token?grant_type=refresh_token",{refresh_token:S.sess.refresh_token})) }catch(e){ save(null); return null } } return S.sess.access_token }
async function rest(path, o = {}){ const t = await token(); const r = await fetch(URL_+"/rest/v1/"+path, {...o, headers:{apikey:KEY,"Content-Type":"application/json",...(t?{Authorization:"Bearer "+t}:{}),...(o.headers||{})}});
  if(!r.ok) throw new Error("Request failed ("+r.status+")"); const x = await r.text(); return x ? JSON.parse(x) : null }
const rpc = (n,b) => rest("rpc/"+n, {method:"POST", body:JSON.stringify(b)});
const post = (t,b,pre="return=minimal") => rest(t, {method:"POST", body:JSON.stringify(b), headers:{Prefer:pre}});
const uid = () => S.sess && S.sess.user.id;
