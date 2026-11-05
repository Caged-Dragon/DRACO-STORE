/* ---- leaderboards and achievements (read-only: the games themselves send scores and unlocks) ---- */
const L2 = p => rest(p).catch(() => []);
async function boardSheet(id, name, unit){
  const sh = $("#sheet"); sh.innerHTML = `<div class="empty">Loading…</div>`; $("#scrim").classList.add("on");
  let rows = [], me = null; try{ rows = await rpc("store_get_leaderboard_page",{p_leaderboard_id:id,p_limit:50,p_offset:0}); if(S.sess) [me] = await rpc("store_get_my_leaderboard_rank",{p_leaderboard_id:id}) }catch(e){}
  sh.innerHTML = `<button class="close" id="x" aria-label="Close">✕</button><h3>🏆 ${esc(name)}</h3>` +
    (me ? `<p class="meta">Your rank: #${me.rank_position} · ${esc(me.best_score)} ${esc(unit)}</p>` : S.sess ? `<p class="meta">Play to get on the board.</p>` : `<p class="meta">Sign in to see your rank.</p>`) +
    (rows.length ? rows.map(r => `<div class="rev"><b>#${r.rank_position}</b> ${esc(r.public_handle)} <span style="float:right">${esc(r.best_score)} ${esc(unit)}</span></div>`).join("") : `<div class="empty">No scores yet.</div>`) +
    `<p class="meta">Scores are sent by the games themselves.</p>`;
}
async function extras(id){
  const [bs, as_, un] = await Promise.all([L2(`store_application_leaderboards?select=id,name,score_unit&application_id=eq.${id}`), L2(`store_application_achievements?select=id,title,description,points,is_hidden&application_id=eq.${id}&order=sort_order`), S.sess ? L2("store_user_achievement_unlocks?select=achievement_id") : []]);
  const got = new Set(un.map(x => x.achievement_id)), e = $("#extra"); if(!e) return; let h = "";
  if(bs.length) h += `<h4>Leaderboards</h4><div class="pills">${bs.map(b => `<button data-board="${b.id}" data-bn="${esc(b.name)}" data-bu="${esc(b.score_unit)}">🏆 ${esc(b.name)}</button>`).join("")}</div>`;
  if(as_.length){ const mine = as_.filter(a => got.has(a.id)); h += `<h4>Achievements (${mine.length}/${as_.length} · ${mine.reduce((t,a) => t + a.points, 0)} pts)</h4>` + as_.map(a => { const u = got.has(a.id), hid = a.is_hidden && !u; return `<div class="rev">${u ? "✅" : "🔒"} <b>${esc(hid ? "Hidden achievement" : a.title)}</b> <small>${a.points} pts</small>${hid ? "" : `<br><small>${esc(a.description)}</small>`}</div>` }).join("") }
  e.innerHTML = h;
}
