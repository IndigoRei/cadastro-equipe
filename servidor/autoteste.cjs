// Autoteste do Codigo.gs com os serviços do Google simulados (dados fictícios). Rodar: node servidor/autoteste.cjs
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const src = fs.readFileSync(__dirname + '/Codigo.gs', 'utf8');
const PROPS = { PLANILHA_ID: 'p', PASTA_FOTOS_ID: 'f', SISTEMA_URL: 'https://x.supabase.co', SISTEMA_CHAVE_PUBLICA: 'pub', SISTEMA_CHAVE: 'k' };
const linhas = [[]]; const chamadas = [];
const faixa = (r) => ({ setNumberFormat: () => faixa(r), setWrap: () => faixa(r), setVerticalAlignment: () => faixa(r),
  setValues: (v) => { linhas[r - 1] = v[0]; return faixa(r); },
  getValues: () => linhas.slice(1).map((l) => [l[colEmail - 1]]), getDisplayValues: () => linhas.slice(1) });
let colEmail;
const aba = { getLastRow: () => linhas.length, getRange: (r) => faixa(r) };
const ctx = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => PROPS[k] }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => aba, getSheets: () => [aba] }) },
  DriveApp: { getFolderById: () => ({ isTrashed: () => false, createFile: () => ({ getUrl: () => 'u' }) }), getFileById: () => ({ isTrashed: () => false }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { base64Decode: () => [1, 2, 3], newBlob: () => ({}), formatDate: (d, z, f) => f === 'yyMMddHHmmss' ? '261021180000' : 'x' },
  UrlFetchApp: { fetch: (u, o) => { chamadas.push(JSON.parse(o.payload)); return { getResponseCode: () => 204, getContentText: () => '' }; } },
  ContentService: { createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }), MimeType: { JSON: 'j' } },
  console, Logger: { log() {} }, Date,
};
vm.createContext(ctx); vm.runInContext(src + '\nthis.__t = { enviarCadastro, doGet, indiceColuna_ };', ctx);
colEmail = ctx.__t.indiceColuna_('email');
const base = { nomeCompleto: 'Ana Vitima Ficticia', nomeProfissional: 'Prof. Ana', funcoes: ['Professor(a)'], whatsapp: '61900000001',
  email: 'ana.vitima@example.test', graduacao: 'X', experiencia: ctx.__t ? undefined : undefined, areas: ['A'], bioCurta: 'b',
  modelagem: 'Tradicional', tamanho: 'M', autorizaImagem: true, declaracao: true, foto: { base64: 'AA' } };
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
console.log('ok: reenvio não substitui, resposta igual, chave própria no sistema, doGet sem página antiga');
