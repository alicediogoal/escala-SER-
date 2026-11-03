// Liga o app ao servidor do Google Apps Script (planilha + Drive + e-mail).
const TK = "ser_token";
let token = null, codeFor = "", codeMail = "", offline = false;
try { token = localStorage.getItem(TK); } catch (e) {}
S = { members: [], avail: {}, scale: {}, notes: {}, pub: {}, meets: [], sugs: [], files: [], extra: [], nid: 10 };
me = null;

const KIND = { "Imagens": "Imagem", "Vídeos": "Vídeo", "Áudios": "Áudio" };
const cargoIdx = n => CARGOS.findIndex(c => c[0] === n);

// Chamada ao servidor. Sem cabeçalhos extras (evita bloqueio de CORS no Apps Script).
async function call(a, p = {}) {
  const url = window.SER_API;
  if (!url || url.indexOf("COLE_AQUI") >= 0) { const x = new Error("O endereço do servidor ainda não foi configurado (config.js)."); x.cfg = true; throw x; }
  let r;
  try { r = await fetch(url, { method: "POST", body: JSON.stringify(Object.assign({ a, t: token }, p)) }); }
  catch (e) { const x = new Error("Sem conexão. Tente de novo."); x.net = true; throw x; }
  let d;
  try { d = await r.json(); } catch (e) { throw new Error("Resposta inválida do servidor."); }
  if (!d.ok) {
    const x = new Error(d.erro || "Erro no servidor"); x.status = d.status;
    if (d.status === 401 && token && !["verify", "code", "register"].includes(a)) sair();
    throw x;
  }
  return d.data;
}

async function carregar() {
  const s = await call("state");
  const toM = m => ({ id: m.id, name: m.name, phone: m.phone || "", email: m.email || "", birth: m.birth || "", role: m.role, min: m.ministries });
  me = toM(s.me);
  S.members = s.members.map(m => m.id === me.id ? me : toM(m));
  if (!S.members.includes(me)) S.members.push(me);
  S.avail = {}; S.scale = {}; S.notes = {}; S.pub = {}; S.extra = [];
  s.events.forEach(e => {
    if (e.title && e.title !== holiday(e.date)) S.extra.push({ date: e.date, title: e.title });
    if (e.published) S.pub[e.date] = true;
    if (e.note) S.notes[e.date] = e.note;
    const sc = {};
    Object.entries(e.scale || {}).forEach(([c, id]) => { const i = cargoIdx(c); if (i >= 0) sc[i] = id; });
    if (Object.keys(sc).length) S.scale[e.date] = sc;
  });
  (s.availability || []).forEach(a => (S.avail[a.membro] = S.avail[a.membro] || []).push(a.data));
  S.avail[me.id] = s.mine;
  S.meets = s.meetings; S.sugs = s.suggestions || [];
  S.files = s.files.map(f => ({ id: f.id, name: f.name, kb: f.kb, by: f.by || "—", kind: KIND[f.kind] || f.kind, hol: f.holyrics, off: false }));
  await Promise.all(S.files.map(async f => { try { f.off = !!(await idbGet(f.id)); } catch (e) {} }));
  offline = false;
  try { localStorage.setItem("ser_cache", JSON.stringify({ S, me })); } catch (e) {}
}

function R() {
  buildDays();
  const a = document.getElementById("app");
  a.innerHTML = me ? shell() : login();
  if (me) dicaIOS(a);
  if (offline) a.insertAdjacentHTML("afterbegin", '<div style="background:#D4AF37;color:#0F172A;padding:6px 12px;font-size:13px;text-align:center">Sem conexão: mostrando os últimos dados salvos.</div>');
}
// iPhone: mostra uma vez como instalar o app na Tela de Início (só no Safari, antes de instalar)
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instalado = () => navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
function dicaIOS(a) {
  let visto = false; try { visto = !!localStorage.getItem("ser_dica"); } catch (e) {}
  if (!isIOS || instalado() || visto) return;
  a.insertAdjacentHTML("afterbegin", '<div id="dica" style="background:#D4AF37;color:#0F172A;padding:10px 14px;font-size:14px;display:flex;gap:10px;align-items:center"><span style="flex:1">Para usar o Ser como app no iPhone: abra no <b>Safari</b>, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</span><button onclick="fechaDica()" style="min-height:36px;padding:6px 12px;border:0;border-radius:8px;background:#0F172A;color:#fff;font-weight:600">OK</button></div>');
}
function fechaDica() { try { localStorage.setItem("ser_dica", "1"); } catch (e) {} const d = document.getElementById("dica"); if (d) d.remove(); }
const falha = async e => { alert(e.message); try { await carregar(); } catch (_) {} R(); };

// ---------- Entrada ----------
function login() {
  if (reg) return regView();
  if (codeFor) return `<div class="lg"><header class="hero"><img src="logo.jpg" alt="Ser" width="230" height="230"><p>“Aquele que quer ser o maior, seja o que serve.”</p></header>
<main><h2>Código de acesso</h2><p class="muted">Enviamos um código de 6 dígitos para o e-mail ${esc(codeMail)}. Se não encontrar, olhe a caixa de spam.</p>
<label for="cd">Código</label><input id="cd" inputmode="numeric" maxlength="6" autocomplete="one-time-code">
${err ? `<p style="color:var(--er);margin:0 0 10px">${err}</p>` : ""}
<button class="btn block" onclick="doCode()">Entrar</button>
<button class="btn ghost block" style="margin-top:8px" onclick="codeFor='';err='';R()">Voltar</button></main></div>`;
  return `<div class="lg"><header class="hero"><img src="logo.jpg" alt="Ser" width="230" height="230"><p>“Aquele que quer ser o maior, seja o que serve.”</p></header>
<main><h2>Entrar</h2><p class="muted">Informe seu WhatsApp. O código de acesso será enviado para o e-mail do seu cadastro. No primeiro acesso, você cria o cadastro na próxima tela.</p>
<label for="ph">WhatsApp (com DDD)</label><input id="ph" type="tel" inputmode="tel" placeholder="11 99999-0001" autocomplete="tel">
${err ? `<p style="color:var(--er);margin:0 0 10px">${err}</p>` : ""}
<button class="btn block" onclick="doLogin()">Continuar</button>
<p class="ios">No iPhone: abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”. O Ser abre como um app.</p></main></div>`;
}
async function pedirCodigo(n) {
  const r = await call("code", { phone: n });
  codeFor = n; codeMail = r.email; err = ""; R();
}
async function doLogin() {
  const n = document.getElementById("ph").value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (n.length < 10) { err = "Informe o WhatsApp com DDD."; return R(); }
  try { await pedirCodigo(n); }
  catch (e) { if (e.status === 404) { reg = n; err = ""; return R(); } err = e.message; R(); }
}
async function doCode() {
  try {
    const r = await call("verify", { phone: codeFor, code: document.getElementById("cd").value.trim() });
    token = r.token;
    try { localStorage.setItem(TK, token); } catch (e) {}
    codeFor = ""; codeMail = ""; err = ""; tab = "inicio";
    await carregar(); R();
  } catch (e) { err = e.message; R(); }
}
async function doReg() {
  const n = rn.value.trim(), m = [...document.querySelectorAll(".rm:checked")].map(x => x.value);
  if (!n || !m.length) { err = "Informe seu nome e ao menos um ministério."; return R(); }
  if (!rb.value || rb.value > new Date().toISOString().slice(0, 10) || rb.value < "1900-01-01") { err = "Informe uma data de nascimento válida."; return R(); }
  if (!/^\S+@\S+\.\S+$/.test(re.value.trim())) { err = "Informe um e-mail válido."; return R(); }
  if (!rc.checked) { err = "Para usar o Ser, aceite receber os lembretes por e-mail."; return R(); }
  try {
    await call("register", { name: n, phone: reg, birth: rb.value, email: re.value.trim(), ministries: m, optin: true });
    const p = reg; reg = ""; await pedirCodigo(p);
  } catch (e) { err = e.message; R(); }
}
function logout() {
  token = null; me = null; codeFor = ""; err = "";
  try { localStorage.removeItem(TK); localStorage.removeItem("ser_cache"); } catch (e) {}
  R();
}
function sair() { logout(); }

// ---------- Disponibilidade e escala ----------
async function tog(d) {
  const a = S.avail[me.id] = S.avail[me.id] || [];
  const i = a.indexOf(d); i < 0 ? a.push(d) : a.splice(i, 1);
  R();
  try { await call("avail.set", { dates: a }); } catch (e) { falha(e); }
}
function evBody(d) {
  const o = {};
  Object.entries(S.scale[d] || {}).forEach(([i, id]) => { if (id) o[CARGOS[i][0]] = id; });
  return { date: d, title: evTitle(d) || "", note: S.notes[d] || "", published: !!S.pub[d], scale: o };
}
const putEv = (d, extra = {}) => call("event.put", Object.assign(evBody(d), extra));
async function setS(i, v) {
  S.scale[day] = S.scale[day] || {};
  v ? S.scale[day][i] = +v : delete S.scale[day][i];
  R();
  try { await putEv(day); } catch (e) { falha(e); }
}
async function setN(v) { S.notes[day] = v; try { await putEv(day); } catch (e) { alert(e.message); } }
async function pub() {
  const d = day; S.pub[d] = !S.pub[d]; R();
  try { await putEv(d); } catch (e) { S.pub[d] = !S.pub[d]; alert(e.message); R(); }
}
async function addEv() {
  const t = et.value.trim(), d = ed.value;
  if (!t || !d) return alert("Informe o nome e a data do evento.");
  if (d < new Date().toISOString().slice(0, 10)) return alert("Escolha uma data a partir de hoje.");
  try { await putEv(d, { title: t }); day = d; await carregar(); R(); } catch (e) { alert(e.message); }
}
async function delEv(d) { try { await call("event.del", { date: d }); await carregar(); R(); } catch (e) { alert(e.message); } }

// ---------- Equipe, perfil, reuniões, sugestões ----------
async function setRole(id, r) { try { await call("member.role", { id, role: r }); await carregar(); R(); } catch (e) { falha(e); } }
async function setMin(id, k, on) {
  const m = S.members.find(x => x.id === id); if (!m) return;
  const s = new Set(m.min); on ? s.add(k) : s.delete(k);
  if (!s.size) { alert("A pessoa precisa ter ao menos um ministério."); return R(); }
  try { await call("member.min", { id, ministries: [...s] }); await carregar(); R(); } catch (e) { falha(e); }
}
async function savePerfil() {
  const n = pn.value.trim();
  if (!n) return alert("Informe o nome.");
  if (!pb.value || !/^\S+@\S+\.\S+$/.test(pe.value.trim())) return alert("Informe nascimento e e-mail válidos.");
  try { await call("me.update", { name: n, birth: pb.value, email: pe.value.trim() }); await carregar(); alert("Perfil salvo."); R(); } catch (e) { alert(e.message); }
}
async function addM() {
  const t = mt.value.trim(), d = md.value;
  if (!t || !d) return alert("Preencha o assunto e a data.");
  try { await call("meeting.add", { title: t, date: d, min: mm.value }); await carregar(); R(); } catch (e) { alert(e.message); }
}
async function addSg() {
  const t = sg.value.trim();
  if (!t) return alert("Escreva sua sugestão.");
  try { await call("suggestion.add", { text: t, anon: an.checked }); alert("Sugestão enviada. Obrigado!"); await carregar(); R(); } catch (e) { alert(e.message); }
}

// ---------- Arquivos (Google Drive) ----------
const toB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = () => no(r.error); r.readAsDataURL(f); });
async function addF(el) {
  const aviso = document.createElement("div");
  aviso.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:9;background:#D4AF37;color:#0F172A;padding:8px;text-align:center;font-size:14px";
  aviso.textContent = "Enviando arquivos... aguarde.";
  document.body.appendChild(aviso);
  for (const f of [...el.files]) {
    if (f.size > 10 * 1024 * 1024) { alert(f.name + ": o arquivo passa de 10 MB. Reduza o tamanho (limite do plano gratuito)."); continue; }
    try { const d = await call("file.upload", { name: f.name, mime: f.type, data: await toB64(f) }); try { await idbSet(d.id, f); } catch (e) {} }
    catch (e) { alert(f.name + ": " + e.message); }
  }
  aviso.remove();
  try { await carregar(); } catch (e) {}
  R();
}
async function dl(id) {
  const f = S.files.find(x => x.id === id);
  try {
    let b = null;
    try { b = await idbGet(id); } catch (e) {}
    if (!b) {
      const d = await call("file.get", { id });
      const bin = atob(d.data), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      b = new Blob([u], { type: d.mime });
      try { await idbSet(id, b); f.off = true; } catch (e) {}
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    R();
  } catch (e) { alert("Não foi possível baixar. Verifique a conexão."); }
}
async function toHol(id) { try { await call("file.holyrics", { id }); await carregar(); R(); } catch (e) { alert(e.message); } }

// ---------- Início do app ----------
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !token || !me) return;
  carregar().then(() => { if (tab === "inicio") R(); }).catch(() => {});
});
(async () => {
  if (!token) { R(); }
  else {
    let cached = null; try { cached = JSON.parse(localStorage.getItem("ser_cache") || "null"); } catch (_) {}
    if (cached && cached.me) { S = cached.S; me = cached.me; R(); }   // abre na hora com os últimos dados
    else document.getElementById("app").innerHTML = '<div class="lg"><header class="hero"><img src="logo.jpg" alt="Ser" width="230" height="230"></header><main><p class="muted" style="text-align:center">Carregando...</p></main></div>';
    try { await carregar(); }
    catch (e) {
      if (e.status === 401) { token = null; me = null; try { localStorage.removeItem(TK); localStorage.removeItem("ser_cache"); } catch (_) {} }
      else if (e.net && cached && cached.me) { offline = true; }
      else if (e.cfg) err = e.message;
      else if (!cached) err = e.message;
    }
    R();
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
