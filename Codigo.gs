/**
 * Ser: servidor no Google Apps Script.
 * Dados na planilha, arquivos no Google Drive, lembretes e código de login por e-mail.
 * Como instalar: veja GUIA-PASSO-A-PASSO.md
 */
const TZ = "America/Sao_Paulo";
const SHEETS = {
  Membros: ["id", "nome", "telefone", "email", "nascimento", "funcao", "ministerios", "aceite"],
  Eventos: ["data", "titulo", "publicado", "obs"],
  Disponibilidade: ["membro", "data"],
  Escala: ["data", "cargo", "membro"],
  Enviados: ["data", "membro", "tipo"],
  Reunioes: ["id", "titulo", "inicio", "ministerio"],
  Sugestoes: ["id", "texto", "membro", "data"],
  Arquivos: ["id", "nome", "tipo", "kb", "membro", "data", "drive", "holyrics"],
};
const CARGOS = { "Projeção": "follow", "Fotografia": "follow", "Vídeo": "follow", "Story": "follow", "Técnico de Som": "som", "Técnico de Iluminação": "ilum" };
const MINS = ["follow", "som", "ilum"];
const ROLES = ["admin", "pastor", "lider", "member"];
const NUM = ["id", "membro", "kb"];
const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// ---------- Instalação (rode a função setup uma vez) ----------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Abra o script pela planilha: Extensões > Apps Script.");
  P_().setProperty("SSID", ss.getId());
  Object.keys(SHEETS).forEach(n => {
    const h = SHEETS[n], s = ss.getSheetByName(n) || ss.insertSheet(n);
    s.getRange(1, 1, s.getMaxRows(), h.length).setNumberFormat("@");
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight("bold");
    s.setFrozenRows(1);
  });
  ["Sheet1", "Página1", "Planilha1"].forEach(n => { const s = ss.getSheetByName(n); if (s && ss.getSheets().length > 1) ss.deleteSheet(s); });
  secret_();
  if (!P_().getProperty("DIR_ARQ")) P_().setProperty("DIR_ARQ", DriveApp.createFolder("Ser - Arquivos").getId());
  if (!P_().getProperty("DIR_HOL")) {
    const f = DriveApp.createFolder("Ser - Holyrics");
    ["Imagens", "Vídeos", "Áudios"].forEach(n => f.createFolder(n));
    P_().setProperty("DIR_HOL", f.getId());
  }
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("lembreteD1").timeBased().atHour(9).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger("lembreteD0").timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();
  Logger.log("Pronto! Agora publique: Implantar > Nova implantação > App da Web.");
}

// ---------- Entrada da API ----------
function doGet() { return ContentService.createTextOutput("Ser: servidor ativo"); }
function doPost(e) {
  let out;
  try { out = { ok: true, data: route_(JSON.parse(e.postData.contents)) }; }
  catch (err) { out = { ok: false, erro: err.message, status: err.status || 500 }; if (!err.status) console.error(err.stack || err); }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function route_(r) {
  switch (r.a) {
    case "register": return register_(r);
    case "code": return code_(r);
    case "verify": return verify_(r);
  }
  const me = who_(r.t);
  if (!me) fail_("Sessão inválida. Entre de novo.", 401);
  switch (r.a) {
    case "state": return state_(me);
    case "avail.set": return locked_(() => availSet_(me, r));
    case "event.put": return locked_(() => eventPut_(me, r));
    case "event.del": return locked_(() => eventDel_(me, r));
    case "member.role": return locked_(() => memberRole_(me, r));
    case "member.min": return locked_(() => memberMin_(me, r));
    case "me.update": return locked_(() => meUpdate_(me, r));
    case "meeting.add": return locked_(() => meetingAdd_(me, r));
    case "suggestion.add": return locked_(() => suggestionAdd_(me, r));
    case "file.upload": return fileUpload_(me, r);
    case "file.get": return fileGet_(me, r);
    case "file.holyrics": return locked_(() => fileHolyrics_(me, r));
  }
  fail_("Ação desconhecida", 400);
}

// ---------- Utilitários ----------
const P_ = () => PropertiesService.getScriptProperties();
function fail_(msg, status) { const e = new Error(msg); e.status = status; throw e; }
function locked_(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }
function need_(me, roles) { if (!roles.includes(me.funcao)) fail_("Sem permissão", 403); }
function today_(add) { return Utilities.formatDate(new Date(Date.now() + (add || 0) * 864e5), TZ, "yyyy-MM-dd"); }
function phone_(v) { return String(v || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); }
function mask_(e) { const [u, d] = e.split("@"); return u.slice(0, 1) + "***@" + d; }
function fmtBr_(d) { const x = new Date(d + "T12:00:00"); return DIAS[x.getDay()] + ", " + x.getDate() + " de " + MESES[x.getMonth()]; }
function kindOf_(n) { return /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(n) ? "Vídeos" : /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(n) ? "Áudios" : /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(n) ? "Imagens" : null; }
const validDate_ = d => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const validEmail_ = e => /^\S+@\S+\.\S+$/.test(String(e || "").trim());

function sh_(n) { return SpreadsheetApp.openById(P_().getProperty("SSID")).getSheetByName(n); }
function rows_(n) {
  const v = sh_(n).getDataRange().getValues(), h = v.shift() || [];
  return v.filter(r => r.some(c => c !== "")).map(r => {
    const o = {};
    h.forEach((k, i) => {
      let x = r[i];
      if (x instanceof Date) x = Utilities.formatDate(x, TZ, "yyyy-MM-dd");
      o[k] = NUM.includes(k) ? (x === "" ? "" : Number(x)) : String(x);
    });
    return o;
  });
}
function fit_(s, n) { if (n > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), n - s.getMaxRows() + 200); }
function write_(n, objs) {
  const s = sh_(n), h = SHEETS[n];
  const out = [h].concat(objs.map(o => h.map(k => (o[k] === undefined || o[k] === null) ? "" : String(o[k]))));
  fit_(s, out.length);
  s.clearContents();
  s.getRange(1, 1, out.length, h.length).setNumberFormat("@").setValues(out);
}
function add_(n, o) {
  const s = sh_(n), h = SHEETS[n], r = s.getLastRow() + 1;
  fit_(s, r);
  s.getRange(r, 1, 1, h.length).setNumberFormat("@").setValues([h.map(k => (o[k] === undefined || o[k] === null) ? "" : String(o[k]))]);
}

// ---------- Login por código enviado ao e-mail ----------
function secret_() { let s = P_().getProperty("SECRET"); if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); P_().setProperty("SECRET", s); } return s; }
function sign_(t) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(t, secret_())); }
function token_(id) { const p = id + "." + (Date.now() + 30 * 864e5); return p + "." + sign_(p); }
function who_(tok) {
  const [id, exp, sig] = String(tok || "").split(".");
  if (!id || !exp || !sig || sig !== sign_(id + "." + exp) || Date.now() > Number(exp)) return null;
  return rows_("Membros").find(m => m.id === Number(id)) || null;
}
function register_(r) {
  return locked_(() => {
    const phone = phone_(r.phone), name = String(r.name || "").trim(), email = String(r.email || "").trim().toLowerCase();
    const mins = (r.ministries || []).filter(x => MINS.includes(x));
    if (!name || phone.length < 10 || !mins.length) fail_("Dados incompletos", 400);
    if (!validDate_(r.birth) || r.birth < "1900-01-01" || r.birth > today_()) fail_("Data de nascimento inválida", 400);
    if (!validEmail_(email)) fail_("E-mail inválido", 400);
    if (!r.optin) fail_("É preciso aceitar receber as mensagens", 400);
    const mem = rows_("Membros");
    if (mem.some(m => m.telefone === phone)) fail_("Número já cadastrado", 409);
    const id = mem.reduce((a, m) => Math.max(a, m.id), 0) + 1;
    add_("Membros", { id, nome: name, telefone: phone, email, nascimento: r.birth, funcao: mem.length ? "member" : "admin", ministerios: mins.join(","), aceite: "1" });
    return true;
  });
}
function code_(r) {
  const phone = phone_(r.phone), m = rows_("Membros").find(x => x.telefone === phone);
  if (!m) fail_("Número não cadastrado", 404);
  const c = CacheService.getScriptCache();
  if (c.get("rl:" + phone)) fail_("Aguarde 1 minuto para pedir outro código", 429);
  const code = String(parseInt(Utilities.getUuid().replace(/-/g, "").slice(0, 8), 16) % 900000 + 100000);
  c.put("code:" + phone, code, 600); c.put("rl:" + phone, "1", 60); c.remove("try:" + phone);
  try {
    MailApp.sendEmail({ to: m.email, subject: "Seu código de acesso ao Ser", htmlBody: "<p>Olá, " + m.nome.split(" ")[0] + "!</p><p>Seu código de acesso ao Ser é <b style='font-size:22px'>" + code + "</b>.</p><p>Ele vale por 10 minutos. Se não foi você, ignore este e-mail.</p>" });
  } catch (e) { console.error(e.message); fail_("Não foi possível enviar o e-mail com o código", 502); }
  return { email: mask_(m.email) };
}
function verify_(r) {
  const phone = phone_(r.phone), c = CacheService.getScriptCache();
  const tries = Number(c.get("try:" + phone) || 0);
  if (tries >= 5) fail_("Muitas tentativas. Peça outro código.", 429);
  const code = c.get("code:" + phone);
  if (!code || code !== String(r.code || "").trim()) { c.put("try:" + phone, String(tries + 1), 600); fail_("Código inválido ou vencido", 401); }
  c.remove("code:" + phone);
  const m = rows_("Membros").find(x => x.telefone === phone);
  return { token: token_(m.id) };
}

// ---------- Estado completo (uma chamada só) ----------
function state_(me) {
  const see = me.funcao !== "member", today = today_();
  const mem = rows_("Membros"), scale = rows_("Escala"), av = rows_("Disponibilidade"), mins = me.ministerios.split(",");
  const nome = id => (mem.find(m => m.id === id) || {}).nome || "";
  const mins_ = m => m.ministerios.split(",").filter(Boolean);
  const full = m => ({ id: m.id, name: m.nome, role: m.funcao, ministries: mins_(m), phone: m.telefone, email: m.email, birth: m.nascimento });
  const basic = m => ({ id: m.id, name: m.nome, role: m.funcao, ministries: mins_(m) });
  return {
    me: full(me),
    members: mem.map(see ? full : basic),
    events: rows_("Eventos").filter(e => e.data >= today).map(e => {
      const open = see || e.publicado === "1";
      return { date: e.data, title: e.titulo, published: e.publicado === "1", note: open ? e.obs : "",
        scale: open ? Object.fromEntries(scale.filter(s => s.data === e.data).map(s => [s.cargo, s.membro])) : {} };
    }),
    mine: av.filter(a => a.membro === me.id).map(a => a.data),
    availability: see ? av.filter(a => a.data >= today).map(a => ({ membro: a.membro, data: a.data })) : [],
    meetings: rows_("Reunioes").filter(x => see || x.ministerio === "geral" || mins.includes(x.ministerio))
      .sort((a, b) => a.inicio < b.inicio ? -1 : 1).map(x => ({ id: x.id, title: x.titulo, date: x.inicio, min: x.ministerio })),
    files: rows_("Arquivos").map(f => ({ id: f.id, name: f.nome, kind: f.tipo, kb: f.kb, by: nome(f.membro), holyrics: f.holyrics })),
    suggestions: see ? rows_("Sugestoes").map(s => ({ text: s.texto, by: s.membro === "" ? null : nome(s.membro) })) : [],
  };
}

// ---------- Ações ----------
function availSet_(me, r) {
  const today = today_(), dates = [...new Set((r.dates || []).filter(d => validDate_(d) && d >= today))];
  const keep = rows_("Disponibilidade").filter(a => !(a.membro === me.id && a.data >= today));
  write_("Disponibilidade", keep.concat(dates.map(d => ({ membro: me.id, data: d }))));
  return true;
}
function eventPut_(me, r) {
  need_(me, ["admin", "lider"]);
  const d = r.date;
  if (!validDate_(d)) fail_("Data inválida", 400);
  const evs = rows_("Eventos").filter(e => e.data !== d);
  evs.push({ data: d, titulo: String(r.title || ""), publicado: r.published ? "1" : "", obs: String(r.note || "") });
  write_("Eventos", evs);
  const sc = rows_("Escala").filter(s => s.data !== d);
  Object.keys(r.scale || {}).forEach(c => { if (CARGOS[c] && r.scale[c]) sc.push({ data: d, cargo: c, membro: Number(r.scale[c]) }); });
  write_("Escala", sc);
  if (r.published) {   // escala finalizada depois do horário padrão: avisa na hora
    const h = Number(Utilities.formatDate(new Date(), TZ, "H"));
    if (d === today_(1) && h >= 9) remind_(1, "D-1");
    if (d === today_() && h >= 7) remind_(0, "D0");
  }
  return true;
}
function eventDel_(me, r) {
  need_(me, ["admin", "lider"]);
  const d = r.date, md = String(d).slice(5), wd = new Date(d + "T12:00:00").getDay();
  if (wd === 0 || wd === 3 || md === "12-25" || md === "01-01") {
    write_("Eventos", rows_("Eventos").map(e => e.data === d ? Object.assign(e, { titulo: "" }) : e));
  } else {
    write_("Eventos", rows_("Eventos").filter(e => e.data !== d));
    write_("Escala", rows_("Escala").filter(s => s.data !== d));
    write_("Disponibilidade", rows_("Disponibilidade").filter(a => a.data !== d));
  }
  return true;
}
function memberRole_(me, r) {
  need_(me, ["admin"]);
  if (!ROLES.includes(r.role)) fail_("Função inválida", 400);
  if (Number(r.id) === me.id) fail_("Você não pode mudar a sua própria função", 400);
  write_("Membros", rows_("Membros").map(m => m.id === Number(r.id) ? Object.assign(m, { funcao: r.role }) : m));
  return true;
}
function memberMin_(me, r) {
  need_(me, ["admin", "lider"]);
  const m = (r.ministries || []).filter(x => MINS.includes(x));
  if (!m.length) fail_("Informe ao menos um ministério", 400);
  write_("Membros", rows_("Membros").map(x => x.id === Number(r.id) ? Object.assign(x, { ministerios: m.join(",") }) : x));
  return true;
}
function meUpdate_(me, r) {   // o membro NÃO altera os próprios ministérios
  const name = String(r.name || "").trim(), email = String(r.email || "").trim().toLowerCase();
  if (!name) fail_("Informe o nome", 400);
  if (!validDate_(r.birth) || r.birth < "1900-01-01" || r.birth > today_()) fail_("Data de nascimento inválida", 400);
  if (!validEmail_(email)) fail_("E-mail inválido", 400);
  write_("Membros", rows_("Membros").map(m => m.id === me.id ? Object.assign(m, { nome: name, nascimento: r.birth, email }) : m));
  return true;
}
function meetingAdd_(me, r) {
  need_(me, ["admin", "lider", "pastor"]);
  const min = r.min || "geral";
  if (!r.title || !r.date || !(min === "geral" || MINS.includes(min))) fail_("Dados incompletos", 400);
  add_("Reunioes", { id: rows_("Reunioes").reduce((a, x) => Math.max(a, x.id), 0) + 1, titulo: String(r.title).trim(), inicio: r.date, ministerio: min });
  return true;
}
function suggestionAdd_(me, r) {
  const t = String(r.text || "").trim();
  if (!t) fail_("Escreva a sugestão", 400);
  add_("Sugestoes", { id: rows_("Sugestoes").reduce((a, x) => Math.max(a, x.id), 0) + 1, texto: t.slice(0, 2000), membro: r.anon ? "" : me.id, data: today_() });
  return true;
}

// ---------- Arquivos no Google Drive ----------
function fileUpload_(me, r) {
  const name = String(r.name || "").replace(/[\\/]/g, "_").trim(), tipo = kindOf_(name);
  if (!name || !tipo || !r.data) fail_("Arquivo inválido (use imagem, vídeo ou áudio)", 400);
  const bytes = Utilities.base64Decode(r.data);
  if (bytes.length > 10 * 1024 * 1024) fail_("Arquivo maior que 10 MB", 413);
  const f = DriveApp.getFolderById(P_().getProperty("DIR_ARQ")).createFile(Utilities.newBlob(bytes, r.mime || "application/octet-stream", name));
  const id = locked_(() => {
    const nid = rows_("Arquivos").reduce((a, x) => Math.max(a, x.id), 0) + 1;
    add_("Arquivos", { id: nid, nome: name, tipo, kb: Math.round(bytes.length / 1024), membro: me.id, data: today_(), drive: f.getId(), holyrics: "" });
    return nid;
  });
  return { id };
}
function fileGet_(me, r) {
  const row = rows_("Arquivos").find(x => x.id === Number(r.id));
  if (!row) fail_("Arquivo não encontrado", 404);
  const blob = DriveApp.getFileById(row.drive).getBlob();
  return { name: row.nome, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}
function fileHolyrics_(me, r) {   // copia para a pasta "Ser - Holyrics", sincronizada no computador do culto
  need_(me, ["admin", "lider"]);
  const all = rows_("Arquivos"), row = all.find(x => x.id === Number(r.id));
  if (!row) fail_("Arquivo não encontrado", 404);
  if (row.holyrics === "ok") return true;
  const root = DriveApp.getFolderById(P_().getProperty("DIR_HOL")), it = root.getFoldersByName(row.tipo);
  const dest = it.hasNext() ? it.next() : root.createFolder(row.tipo);
  DriveApp.getFileById(row.drive).makeCopy(row.nome, dest);
  write_("Arquivos", all.map(x => x.id === row.id ? Object.assign(x, { holyrics: "ok" }) : x));
  return true;
}

// ---------- Lembretes por e-mail (1 dia antes e no dia) ----------
function lembreteD1() { locked_(() => remind_(1, "D-1")); }
function lembreteD0() { locked_(() => remind_(0, "D0")); }
function remind_(offset, kind) {
  const date = today_(offset), ev = rows_("Eventos").find(e => e.data === date && e.publicado === "1");
  if (!ev) return;
  const mem = rows_("Membros"), sent = rows_("Enviados"), por = {};
  rows_("Escala").filter(s => s.data === date).forEach(s => { (por[s.membro] = por[s.membro] || []).push(s.cargo); });
  const link = P_().getProperty("APP_URL");
  Object.keys(por).forEach(id => {
    const m = mem.find(x => x.id === Number(id));
    if (!m || m.aceite !== "1" || !m.email) return;
    if (sent.some(x => x.data === date && x.membro === m.id && x.tipo === kind)) return;
    const quando = kind === "D-1" ? "amanhã" : "hoje";
    const html = "<p>Olá, " + m.nome.split(" ")[0] + "!</p><p>Lembrete: " + quando + " (" + fmtBr_(date) + (ev.titulo ? " · " + ev.titulo : "") + ") você serve como <b>" + por[id].join(", ") + "</b>.</p>"
      + (ev.obs ? "<p>Observação do líder: " + ev.obs + "</p>" : "") + (link ? "<p><a href='" + link + "'>Abrir o Ser</a></p>" : "");
    try {
      MailApp.sendEmail({ to: m.email, subject: "Ser: você serve " + quando + " (" + fmtBr_(date) + ")", htmlBody: html });
      add_("Enviados", { data: date, membro: m.id, tipo: kind });
    } catch (e) { console.error("Falha ao enviar para " + m.email + ": " + e.message); }
  });
}
