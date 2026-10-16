/**
 * CADASTRO DA EQUIPE ÍNDIGO REI
 * Página: https://equipe.indigorei.com.br (GitHub Pages, repositório IndigoRei/cadastro-equipe).
 * Ela envia para este servidor por doPost. O link antigo do Apps Script (doGet) continua funcionando.
 *
 * Respostas: planilha "Cadastro da Equipe Índigo Rei (respostas)"
 * Fotos:     pasta "Cadastro da Equipe Índigo Rei" > "Fotos da equipe"
 * As duas ficam no Drive da conta que implantar o app (institutoindigorei@gmail.com).
 *
 * PRIMEIRA VEZ (uma vez só):
 *   1. No menu de funções do editor, escolha "configurar" e clique em Executar. Autorize.
 *   2. Implantar > Nova implantação > Tipo: App da Web
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *   3. Copie o link do app da Web e mande para a equipe.
 *
 * Quem enviar de novo com o mesmo e-mail substitui a resposta anterior
 * (uma linha por pessoa na planilha).
 */

const CONFIG = {
  NOME_PASTA: 'Cadastro da Equipe Índigo Rei',
  NOME_PASTA_FOTOS: 'Fotos da equipe',
  NOME_PLANILHA: 'Cadastro da Equipe Índigo Rei (respostas)',
  // "logo indigo.png" no Drive. Para usar outra versão da logo, troque o ID aqui e rode configurar() de novo.
  LOGO_ID_ORIGINAL: '14d-PAMhKAxQ78yzhp3sOZ2SulrqBL_Jl',
  FOTO_MAX_MB: 15,
  FUSO: 'America/Sao_Paulo'
};

// [chave usada no formulário, título da coluna na planilha]
const COLUNAS = [
  ['dataHora', 'Data e hora do envio'],
  ['nomeCompleto', 'Nome completo'],
  ['nomeProfissional', 'Nome para a publicação'],
  ['funcoes', 'Função na Índigo'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['instagram', 'Instagram profissional'],
  ['aniversario', 'Aniversário (dia/mês)'],
  ['graduacao', 'Graduação'],
  ['posGraduacao', 'Pós-graduação, mestrado, doutorado'],
  ['registro', 'Registro profissional'],
  ['cursos', 'Cursos e certificações'],
  ['experiencia', 'Tempo de experiência'],
  ['areas', 'Áreas de atuação'],
  ['etapas', 'Etapas que atende'],
  ['idiomas', 'Idiomas'],
  ['bioCurta', 'Mini bio (divulgação)'],
  ['apresentacao', 'Apresentação completa (banco interno)'],
  ['frase', 'Frase sobre o trabalho'],
  ['curiosidade', 'Curiosidade ou hobby'],
  ['fotoLink', 'Foto (link no Drive)'],
  ['modelagem', 'Camisa: modelagem'],
  ['tamanho', 'Camisa: tamanho'],
  ['obsUniforme', 'Observação sobre o uniforme'],
  ['autorizaImagem', 'Autorizou uso de imagem'],
  ['declaracao', 'Confirmou a declaração']
];

const OPCOES = {
  modelagem: ['Tradicional', 'Baby look'],
  tamanho: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  experiencia: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos']
};

const COLUNAS_LARGAS = ['graduacao', 'posGraduacao', 'cursos', 'areas', 'bioCurta', 'apresentacao'];


/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

function doGet(e) {
  // A página equipe.indigorei.com.br chama ?acordar=1 enquanto a pessoa preenche, para o envio ser rápido.
  if (e && e.parameter && e.parameter.acordar) return ContentService.createTextOutput('ok');
  const pagina = HtmlService.createTemplateFromFile('Index');
  pagina.logo = obterLogoDataUri_();
  return pagina.evaluate()
    .setTitle('Cadastro da Equipe | Índigo Rei')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Envio vindo da página equipe.indigorei.com.br
function doPost(e) {
  try {
    const dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return json_(enviarCadastro(dados));
  } catch (err) {
    return json_({ ok: false, erro: String(err && err.message ? err.message : err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function obterLogoDataUri_() {
  const id = PropertiesService.getScriptProperties().getProperty('LOGO_ID') || CONFIG.LOGO_ID_ORIGINAL;
  try {
    const blob = DriveApp.getFileById(id).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return ''; // sem logo, a página mostra o nome "Índigo Rei" no lugar
  }
}


/* ------------------------------------------------------------------ */
/* Configuração (rodar uma vez pelo editor)                            */
/* ------------------------------------------------------------------ */

function configurar() {
  const props = PropertiesService.getScriptProperties();

  let pasta = pegarPasta_(props.getProperty('PASTA_ID'));
  if (!pasta) {
    pasta = DriveApp.createFolder(CONFIG.NOME_PASTA);
    props.setProperty('PASTA_ID', pasta.getId());
  }

  let pastaFotos = pegarPasta_(props.getProperty('PASTA_FOTOS_ID'));
  if (!pastaFotos) {
    pastaFotos = pasta.createFolder(CONFIG.NOME_PASTA_FOTOS);
    props.setProperty('PASTA_FOTOS_ID', pastaFotos.getId());
  }

  let planilha = pegarPlanilha_(props.getProperty('PLANILHA_ID'));
  if (!planilha) {
    planilha = SpreadsheetApp.create(CONFIG.NOME_PLANILHA);
    DriveApp.getFileById(planilha.getId()).moveTo(pasta);
    props.setProperty('PLANILHA_ID', planilha.getId());
    montarPlanilha_(planilha);
  }

  // Copia a logo para a pasta do instituto, para o formulário não depender do Drive de outra pessoa.
  let avisoLogo = 'Logo: OK.';
  const logoAtual = props.getProperty('LOGO_ID');
  const logoAtualValida = logoAtual && logoAtual !== CONFIG.LOGO_ID_ORIGINAL && arquivoExiste_(logoAtual);
  if (!logoAtualValida) {
    try {
      const copia = DriveApp.getFileById(CONFIG.LOGO_ID_ORIGINAL).makeCopy('Logo Índigo Rei (formulário)', pasta);
      props.setProperty('LOGO_ID', copia.getId());
    } catch (e) {
      avisoLogo = 'ATENÇÃO: esta conta não tem acesso à "logo indigo.png". ' +
        'Suba a logo na pasta "' + CONFIG.NOME_PASTA + '", copie o ID do arquivo (o trecho do link entre /d/ e /view), ' +
        'cole em LOGO_ID_ORIGINAL no topo do código e rode configurar() de novo.';
    }
  }

  const resumo = [
    'Tudo pronto.',
    'Planilha de respostas: ' + planilha.getUrl(),
    'Pasta de fotos: ' + pastaFotos.getUrl(),
    avisoLogo,
    'Próximo passo: Implantar > Nova implantação > App da Web (Executar como: Eu; Quem pode acessar: Qualquer pessoa).'
  ].join('\n');
  Logger.log(resumo);
  return resumo;
}

function montarPlanilha_(planilha) {
  planilha.setSpreadsheetTimeZone(CONFIG.FUSO);
  planilha.setSpreadsheetLocale('pt_BR');

  // Aba de respostas
  const aba = planilha.getSheets()[0];
  aba.setName('Respostas');
  const titulos = COLUNAS.map(function (c) { return c[1]; });
  aba.getRange(1, 1, 1, titulos.length).setValues([titulos])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#062D56')
    .setWrap(true).setVerticalAlignment('middle');
  aba.setRowHeight(1, 52);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(3);
  aba.setColumnWidths(1, titulos.length, 170);
  COLUNAS_LARGAS.forEach(function (chave) { aba.setColumnWidth(indiceColuna_(chave), 320); });
  // Tudo como texto (menos a data), para telefone e aniversário não virarem número ou data.
  aba.getRange(2, 2, aba.getMaxRows() - 1, titulos.length - 1).setNumberFormat('@').setWrap(true).setVerticalAlignment('top');
  aba.getRange(2, 1, aba.getMaxRows() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm').setVerticalAlignment('top');

  // Aba do uniforme: contagem para o fornecedor e lista por pessoa para a entrega
  const uni = planilha.insertSheet('Uniforme');
  const cMod = colLetra_(indiceColuna_('modelagem'));
  const cTam = colLetra_(indiceColuna_('tamanho'));
  const cNome = colLetra_(indiceColuna_('nomeCompleto'));
  const ultimaCol = colLetra_(COLUNAS.length);

  uni.getRange('A1').setValue('Camisas para produção').setFontSize(14).setFontWeight('bold').setFontColor('#062D56');
  uni.getRange('A2').setValue('Atualiza sozinho. Uma linha por pessoa: quem envia de novo com o mesmo e-mail substitui a resposta anterior.')
    .setFontColor('#5E6876');

  uni.getRange(4, 1, 1, 4).setValues([['Tamanho', 'Tradicional', 'Baby look', 'Total']])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#062D56');
  OPCOES.tamanho.forEach(function (tam, i) {
    const lin = 5 + i;
    uni.getRange(lin, 1).setValue(tam).setFontWeight('bold');
    uni.getRange(lin, 2).setFormula('=COUNTIFS(Respostas!' + cMod + ':' + cMod + ',"Tradicional",Respostas!' + cTam + ':' + cTam + ',A' + lin + ')');
    uni.getRange(lin, 3).setFormula('=COUNTIFS(Respostas!' + cMod + ':' + cMod + ',"Baby look",Respostas!' + cTam + ':' + cTam + ',A' + lin + ')');
    uni.getRange(lin, 4).setFormula('=B' + lin + '+C' + lin);
  });
  const linTotal = 5 + OPCOES.tamanho.length;
  uni.getRange(linTotal, 1).setValue('Total');
  ['B', 'C', 'D'].forEach(function (c, i) {
    uni.getRange(linTotal, 2 + i).setFormula('=SUM(' + c + '5:' + c + (linTotal - 1) + ')');
  });
  uni.getRange(linTotal, 1, 1, 4).setFontWeight('bold').setBackground('#F5EBD3');
  uni.getRange(4, 1, linTotal - 3, 4).setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#E2DCCF', SpreadsheetApp.BorderStyle.SOLID);

  uni.getRange('F4').setFormula('=QUERY(Respostas!A1:' + ultimaCol + ',"select ' + cNome + ', ' + cMod + ', ' + cTam +
    ' where ' + cNome + ' is not null order by ' + cNome + '",1)');
  uni.getRange('F4:H4').setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#062D56');
  uni.setColumnWidth(1, 90);
  uni.setColumnWidths(2, 3, 100);
  uni.setColumnWidth(5, 30);
  uni.setColumnWidth(6, 260);
  uni.setColumnWidths(7, 2, 165);
}


/* ------------------------------------------------------------------ */
/* Recebimento das respostas                                           */
/* ------------------------------------------------------------------ */

function enviarCadastro(dados) {
  if (!dados || typeof dados !== 'object') throw new Error('Envio inválido. Recarregue a página e tente de novo.');

  const props = PropertiesService.getScriptProperties();
  const planilha = pegarPlanilha_(props.getProperty('PLANILHA_ID'));
  const pastaFotos = pegarPasta_(props.getProperty('PASTA_FOTOS_ID'));
  if (!planilha || !pastaFotos) throw new Error('O formulário ainda não está configurado. Avise a coordenação da Índigo.');

  const r = {
    nomeCompleto: texto_(dados.nomeCompleto, 150),
    nomeProfissional: texto_(dados.nomeProfissional, 120),
    funcoes: lista_(dados.funcoes),
    whatsapp: texto_(dados.whatsapp, 40),
    email: texto_(dados.email, 150).toLowerCase(),
    instagram: texto_(dados.instagram, 80),
    aniversario: texto_(dados.aniversario, 5),
    graduacao: texto_(dados.graduacao, 400),
    posGraduacao: texto_(dados.posGraduacao, 1500),
    registro: texto_(dados.registro, 80),
    cursos: texto_(dados.cursos, 1500),
    experiencia: texto_(dados.experiencia, 40),
    areas: lista_(dados.areas),
    etapas: lista_(dados.etapas),
    idiomas: texto_(dados.idiomas, 150),
    bioCurta: texto_(dados.bioCurta, 300),
    apresentacao: texto_(dados.apresentacao, 1500),
    frase: texto_(dados.frase, 120),
    curiosidade: texto_(dados.curiosidade, 150),
    modelagem: texto_(dados.modelagem, 20),
    tamanho: texto_(dados.tamanho, 5),
    obsUniforme: texto_(dados.obsUniforme, 300),
    autorizaImagem: dados.autorizaImagem === true ? 'Sim' : '',
    declaracao: dados.declaracao === true ? 'Sim' : ''
  };

  const faltando = [];
  if (!r.nomeCompleto) faltando.push('nome completo');
  if (!r.nomeProfissional) faltando.push('nome para a publicação');
  if (!r.funcoes.length) faltando.push('função');
  if (!r.whatsapp) faltando.push('WhatsApp');
  if (!r.email) faltando.push('e-mail');
  if (!r.graduacao) faltando.push('graduação');
  if (!r.experiencia) faltando.push('tempo de experiência');
  if (!r.areas.length) faltando.push('áreas de atuação');
  if (!r.bioCurta) faltando.push('mini bio');
  if (!r.modelagem) faltando.push('modelagem da camisa');
  if (!r.tamanho) faltando.push('tamanho da camisa');
  if (!r.autorizaImagem) faltando.push('autorização de uso de imagem');
  if (!r.declaracao) faltando.push('declaração');
  if (!dados.foto || !dados.foto.base64) faltando.push('foto');
  if (faltando.length) throw new Error('Faltou preencher: ' + faltando.join(', ') + '.');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('Confira o e-mail informado.');
  if (r.whatsapp.replace(/\D/g, '').length < 10) throw new Error('Confira o WhatsApp (com DDD).');
  if (OPCOES.modelagem.indexOf(r.modelagem) < 0) throw new Error('Escolha a modelagem da camisa.');
  if (OPCOES.tamanho.indexOf(r.tamanho) < 0) throw new Error('Escolha o tamanho da camisa.');
  if (OPCOES.experiencia.indexOf(r.experiencia) < 0) throw new Error('Escolha o tempo de experiência.');
  if (r.funcoes.indexOf('Psicólogo(a)') >= 0 && !r.registro) throw new Error('Psicólogas e psicólogos precisam informar o CRP.');
  if (r.aniversario && !/^\d{2}\/\d{2}$/.test(r.aniversario)) r.aniversario = '';

  // Foto
  const bytes = Utilities.base64Decode(String(dados.foto.base64));
  if (bytes.length > CONFIG.FOTO_MAX_MB * 1024 * 1024) throw new Error('A foto ficou grande demais. Tente outra imagem.');
  const carimbo = Utilities.formatDate(new Date(), CONFIG.FUSO, 'yyyy-MM-dd HH.mm');
  const nomeArquivo = nomeArquivo_(r.nomeProfissional || r.nomeCompleto) + ' ' + carimbo + '.jpg';
  const arquivo = pastaFotos.createFile(Utilities.newBlob(bytes, 'image/jpeg', nomeArquivo));
  r.fotoLink = arquivo.getUrl();
  r.dataHora = new Date();

  const linha = COLUNAS.map(function (c) {
    const v = r[c[0]];
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return protegerCelula_(v.join(', '));
    return protegerCelula_(v || '');
  });

  // Uma linha por pessoa: mesmo e-mail substitui a resposta anterior
  let linhaExistente = 0;
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const aba = planilha.getSheetByName('Respostas') || planilha.getSheets()[0];
    const colEmail = indiceColuna_('email');
    const ultima = aba.getLastRow();
    if (ultima > 1) {
      const emails = aba.getRange(2, colEmail, ultima - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === r.email) { linhaExistente = i + 2; break; }
      }
    }
    const destino = linhaExistente || Math.max(ultima, 1) + 1;
    // Formata a linha ANTES de gravar: texto puro (telefone e aniversário não viram número ou data) e data no padrão brasileiro.
    // (appendRow apaga essa formatação, por isso não é usado.)
    aba.getRange(destino, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    aba.getRange(destino, 2, 1, linha.length - 1).setNumberFormat('@');
    aba.getRange(destino, 1, 1, linha.length).setValues([linha]).setWrap(true).setVerticalAlignment('top');
  } finally {
    trava.releaseLock();
  }

  return { ok: true, primeiroNome: r.nomeCompleto.split(/\s+/)[0], atualizado: linhaExistente > 0 };
}


/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

function pegarPasta_(id) {
  if (!id) return null;
  try { const p = DriveApp.getFolderById(id); return p.isTrashed() ? null : p; } catch (e) { return null; }
}

function pegarPlanilha_(id) {
  if (!id) return null;
  try {
    if (DriveApp.getFileById(id).isTrashed()) return null;
    return SpreadsheetApp.openById(id);
  } catch (e) { return null; }
}

function arquivoExiste_(id) {
  try { return !DriveApp.getFileById(id).isTrashed(); } catch (e) { return false; }
}

function texto_(v, max) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\r\n/g, '\n').trim().slice(0, max || 200);
}

function lista_(v) {
  if (!Array.isArray(v)) return [];
  return v.map(function (x) { return texto_(x, 120); }).filter(String).slice(0, 30);
}

// Impede que um texto começado por = + - @ vire fórmula na planilha
function protegerCelula_(s) {
  s = String(s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function nomeArquivo_(s) {
  return String(s).replace(/[\\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Sem nome';
}

function indiceColuna_(chave) {
  for (let i = 0; i < COLUNAS.length; i++) if (COLUNAS[i][0] === chave) return i + 1;
  throw new Error('Coluna desconhecida: ' + chave);
}

function colLetra_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
