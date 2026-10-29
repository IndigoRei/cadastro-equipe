// Autoteste do Codigo.gs com os serviços do Google simulados (dados fictícios). Rodar: node servidor/autoteste.cjs
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const src = fs.readFileSync(__dirname + '/Codigo.gs', 'utf8');
const PROPS = { PLANILHA_ID: 'p', PASTA_FOTOS_ID: 'f', SISTEMA_URL: 'https://x.supabase.co', SISTEMA_CHAVE_PUBLICA: 'pub', SISTEMA_CHAVE: 'k' };
const linhas = [[]]; const chamadas = []; const cache = {};
const faixa = (r, ls = linhas) => ({ setNumberFormat: () => faixa(r, ls), setWrap: () => faixa(r, ls), setVerticalAlignment: () => faixa(r, ls),
  setFontWeight: () => faixa(r, ls), getValue: () => '', setValue: () => faixa(r, ls),
  setValues: (v) => { ls[r - 1] = v[0]; return faixa(r, ls); },
  getValues: () => ls.slice(1).map((l) => [l[colEmail - 1]]), getDisplayValues: () => ls.slice(1) });
let colEmail;
const aba = { getLastRow: () => linhas.length, getRange: (r) => faixa(r) };
const linhasH = []; let abaH = null;
const novaAbaH = () => (abaH = { getLastRow: () => linhasH.length, getRange: (r) => faixa(r, linhasH), setFrozenRows() {} });
const ctx = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => PROPS[k] }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => (n === 'Horários' ? abaH : aba), getSheets: () => [aba], insertSheet: novaAbaH }) },
  DriveApp: { getFolderById: () => ({ isTrashed: () => false, createFile: () => ({ getUrl: () => 'u' }) }), getFileById: () => ({ isTrashed: () => false }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { base64Decode: (b) => (b === 'NAOJPEG' ? [1, 2, 3, 4] : [-1, -40, -1, 1]), newBlob: () => ({}), formatDate: (d, z, f) => f === 'yyMMddHHmmss' ? '261021180000' : 'x' },
  UrlFetchApp: { fetch: (u, o) => { chamadas.push(JSON.parse(o.payload)); return { getResponseCode: () => 204, getContentText: () => '' }; } },
  ContentService: { createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }), MimeType: { JSON: 'j' } },
  CacheService: { getScriptCache: () => ({ get: (k) => cache[k] || null, put: (k, v) => { cache[k] = v; } }) },
  console, Logger: { log() {} }, Date,
};
vm.createContext(ctx); vm.runInContext(src + '\nthis.__t = { enviarCadastro, enviarHorarios, doGet, indiceColuna_ };', ctx);
colEmail = ctx.__t.indiceColuna_('email');
const base = { nomeCompleto: 'Ana Vitima Ficticia', nomeProfissional: 'Prof. Ana', funcoes: ['Professor(a)'], whatsapp: '61900000001',
  email: 'ana.vitima@example.test', graduacao: 'X', experiencia: ctx.__t ? undefined : undefined, areas: ['A'], bioCurta: 'b',
  modelagem: 'Tradicional', tamanho: 'M', autorizaImagem: true, declaracao: true, foto: { base64: 'AA' },
  horarios: [{ dia: 'seg', inicio: '08:00', fim: '12:00' }] };
const OP = vm.runInContext('OPCOES', ctx); base.experiencia = OP.experiencia[0]; base.modelagem = OP.modelagem[0]; base.tamanho = OP.tamanho[0];
const r1 = ctx.__t.enviarCadastro(base);
const r2 = ctx.__t.enviarCadastro({ ...base, nomeCompleto: 'Terceiro Anonimo', whatsapp: '61999990000', email: ' ANA.vitima@example.test ' });
assert.deepStrictEqual(Object.keys(r1), ['ok', 'primeiroNome']);
assert.deepStrictEqual(Object.keys(r2), ['ok', 'primeiroNome']);
assert.strictEqual(linhas.length, 3, 'duas linhas de resposta');
assert.ok(linhas[1].some((v) => String(v).includes('Ana Vitima Ficticia')), 'primeira linha intacta');
assert.strictEqual(chamadas[0].p_envio, 'ana.vitima@example.test');
assert.strictEqual(chamadas[1].p_envio, 'ana.vitima@example.test.261021180000');
assert.ok(/equipe\.indigorei\.com\.br/.test(ctx.__t.doGet({ parameter: {} }).texto));
assert.deepStrictEqual(JSON.parse(JSON.stringify(chamadas[0].p_dados.horarios)), [{ dia: 'seg', inicio: '08:00', fim: '12:00' }]);
assert.ok(linhas[1].includes('segunda 08:00 às 12:00'), 'horários na planilha');
assert.throws(() => ctx.__t.enviarCadastro({ ...base, horarios: [] }), /horários em que pode trabalhar/);

// Link curto: só nome, e-mail e horários, na aba Horários e no sistema com chave própria.
const h = [{ dia: 'qua', inicio: '13:30', fim: '19:00' }, { dia: 'seg', inicio: '14:00', fim: '18:00' }, { dia: 'seg', inicio: '08:00', fim: '12:00' }];
const r3 = ctx.__t.enviarHorarios({ formulario: 'horarios', nomeCompleto: 'Ana Vitima', email: 'Ana.Vitima@example.test', horarios: h });
assert.deepStrictEqual(Object.keys(r3), ['ok', 'primeiroNome']);
assert.strictEqual(linhasH.length, 2, 'título e uma linha');
assert.strictEqual(linhasH[1][3], 'segunda 08:00 às 12:00 e 14:00 às 18:00; quarta 13:30 às 19:00');
const ultima = chamadas[chamadas.length - 1];
assert.strictEqual(ultima.p_envio, 'ana.vitima@example.test.h261021180000');
assert.deepStrictEqual(JSON.parse(JSON.stringify(ultima.p_dados)), { formulario: 'horarios', nomeCompleto: 'Ana Vitima', email: 'ana.vitima@example.test', horarios: h });
const curto = (o) => () => ctx.__t.enviarHorarios({ formulario: 'horarios', nomeCompleto: 'Ana Vitima', email: 'a@b.co', horarios: h, ...o });
assert.throws(curto({ horarios: [{ dia: 'seg', inicio: '12:00', fim: '08:00' }] }), /fim vem depois/);
assert.throws(curto({ horarios: [{ dia: 'seg', inicio: '08:00', fim: '12:00' }, { dia: 'seg', inicio: '11:00', fim: '13:00' }] }), /se cruzam/);
assert.throws(curto({ horarios: [{ dia: 'dom', inicio: '08:00', fim: '12:00' }] }), /Confira os horários/);
assert.throws(curto({ horarios: [{ dia: 'seg', inicio: '08:15', fim: '12:00' }] }), /Confira os horários/);
assert.throws(curto({ horarios: [] }), /pelo menos um horário/);
assert.throws(curto({ nomeCompleto: 'Ana' }), /nome e sobrenome/);
// Foto que não é JPEG (auditoria de 29/10/2026) é recusada.
assert.throws(() => ctx.__t.enviarCadastro({ ...base, foto: { base64: 'NAOJPEG' } }), /foto não abriu/);
console.log('ok: reenvio não substitui, resposta igual, chave própria no sistema, doGet sem página antiga, horários no cadastro e no link curto');
