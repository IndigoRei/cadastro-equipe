/**
 * CADASTRO DA EQUIPE ÍNDIGO REI
 * Página: https://equipe.indigorei.com.br (GitHub Pages, repositório IndigoRei/cadastro-equipe).
 * Ela envia para este servidor por doPost. O link antigo do Apps Script (doGet) só mostra o endereço novo.
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
 * Quem enviar de novo com o mesmo e-mail ganha uma linha nova: nada é substituído, porque o formulário
 * é público e o e-mail não prova quem é a pessoa (auditoria de 20/10/2026). A coordenação apaga a linha
 * antiga quando conferir, para a contagem do uniforme não dobrar.
 *
 * LIGAÇÃO COM O SISTEMA ÍNDIGO REI (sistema.indigorei.com.br):
 *   Cada envio também vai para a caixa "Cadastros recebidos" do sistema, só com os dados de trabalho
 *   (nome, contato, funções, áreas, formação). Bio, foto, uniforme e curiosidades ficam só na planilha.
 *   No sistema, em Cadastros recebidos > Ligação com os formulários, gere a chave e crie em
 *   Configurações do projeto > Propriedades do script: SISTEMA_URL, SISTEMA_CHAVE_PUBLICA e SISTEMA_CHAVE.
 *   Depois rode enviarHistoricoAoSistema() uma vez para mandar as respostas que já estão na planilha.
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
  ['declaracao', 'Confirmou a declaração'],
  ['horarios', 'Horários em que pode trabalhar']
];

// Dias e nomes dos horários de trabalho (o sistema usa os mesmos códigos: seg a sab).
const DIAS_TRABALHO = { seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', sab: 'sábado' };

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
  // Sem a página antiga: ela deixava as funções do editor (configurar, enviarHistoricoAoSistema) ao alcance de quem a abrisse.
  return ContentService.createTextOutput('O cadastro da equipe agora fica em https://equipe.indigorei.com.br');
}

// Envio vindo da página equipe.indigorei.com.br
function doPost(e) {
  try {
    const dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // Link curto equipe.indigorei.com.br/horarios: só nome, e-mail e horários (Davi, 25/10/2026).
    if (dados && dados.formulario === 'horarios') return json_(enviarHorarios(dados));
    return json_(enviarCadastro(dados));
  } catch (err) {
    return json_({ ok: false, erro: String(err && err.message ? err.message : err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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
    declaracao: dados.declaracao === true ? 'Sim' : '',
    horarios: horarios_(dados.horarios)
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
  if (!r.horarios.length) faltando.push('horários em que pode trabalhar');
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
    const v = c[0] === 'horarios' ? textoHorarios_(r.horarios) : r[c[0]];
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return protegerCelula_(v.join(', '));
    return protegerCelula_(v || '');
  });

  // Sempre uma linha nova: o e-mail não prova quem é a pessoa, então ninguém substitui a resposta de outra.
  let jaTinha = false;
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    const aba = planilha.getSheetByName('Respostas') || planilha.getSheets()[0];
    // Planilha montada antes da pergunta dos horários: ganha o título da coluna nova.
    if (!aba.getRange(1, COLUNAS.length).getValue()) aba.getRange(1, COLUNAS.length).setValue(COLUNAS[COLUNAS.length - 1][1]);
    const colEmail = indiceColuna_('email');
    const ultima = aba.getLastRow();
    if (ultima > 1) {
      const emails = aba.getRange(2, colEmail, ultima - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === r.email) { jaTinha = true; break; }
      }
    }
    const destino = Math.max(ultima, 1) + 1;
    // Formata a linha ANTES de gravar: texto puro (telefone e aniversário não viram número ou data) e data no padrão brasileiro.
    // (appendRow apaga essa formatação, por isso não é usado.)
    aba.getRange(destino, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    aba.getRange(destino, 2, 1, linha.length - 1).setNumberFormat('@');
    aba.getRange(destino, 1, 1, linha.length).setValues([linha]).setWrap(true).setVerticalAlignment('top');
  } finally {
    trava.releaseLock();
  }

  // Envio repetido vai ao sistema com chave própria: não troca o que já foi tratado lá.
  enviarAoSistema_(chaveNoSistema_(r.email, jaTinha, r.dataHora), dadosParaSistema_(r));
  // A mesma resposta exista ou não o e-mail: a página não revela quem já se cadastrou.
  return { ok: true, primeiroNome: r.nomeCompleto.split(/\s+/)[0] };
}


// Link curto dos horários: para quem já mandou o cadastro. Vai para a aba "Horários" da mesma planilha e para
// o sistema, onde a importação grava os horários na ficha do profissional (achado pelo e-mail).
function enviarHorarios(dados) {
  const r = {
    nomeCompleto: texto_(dados.nomeCompleto, 150),
    email: texto_(dados.email, 150).toLowerCase(),
    horarios: horarios_(dados.horarios)
  };
  if (r.nomeCompleto.split(/\s+/).filter(Boolean).length < 2) throw new Error('Escreva nome e sobrenome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('Confira o e-mail informado.');
  if (!r.horarios.length) throw new Error('Marque pelo menos um horário.');

  const planilha = pegarPlanilha_(PropertiesService.getScriptProperties().getProperty('PLANILHA_ID'));
  if (!planilha) throw new Error('O formulário ainda não está configurado. Avise a coordenação da Índigo.');
  const agora = new Date();
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);
  try {
    let aba = planilha.getSheetByName('Horários');
    if (!aba) {
      aba = planilha.insertSheet('Horários');
      aba.getRange(1, 1, 1, 4).setValues([['Data e hora do envio', 'Nome completo', 'E-mail', 'Horários em que pode trabalhar']]).setFontWeight('bold');
      aba.setFrozenRows(1);
    }
    const destino = Math.max(aba.getLastRow(), 1) + 1;
    aba.getRange(destino, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    aba.getRange(destino, 2, 1, 3).setNumberFormat('@');
    aba.getRange(destino, 1, 1, 4).setValues([[agora, protegerCelula_(r.nomeCompleto), protegerCelula_(r.email), textoHorarios_(r.horarios)]]);
  } finally {
    trava.releaseLock();
  }
  // Cada envio com chave própria: o mais novo aparece no sistema e nada já tratado é trocado.
  enviarAoSistema_(r.email + '.h' + Utilities.formatDate(agora, CONFIG.FUSO, 'yyMMddHHmmss'),
    { formulario: 'horarios', nomeCompleto: r.nomeCompleto, email: r.email, horarios: r.horarios });
  return { ok: true, primeiroNome: r.nomeCompleto.split(/\s+/)[0] };
}

// [{dia: 'seg', inicio: '08:00', fim: '12:00'}, ...]: dia de segunda a sábado, de meia em meia hora, até duas por dia.
function horarios_(v) {
  if (!Array.isArray(v)) return [];
  const hora = /^([01]\d|2[0-3]):(00|30)$/;
  const faixas = v.slice(0, 12).map(function (f) {
    return { dia: String(f && f.dia || ''), inicio: String(f && f.inicio || ''), fim: String(f && f.fim || '') };
  });
  faixas.forEach(function (f) {
    if (!DIAS_TRABALHO[f.dia] || !hora.test(f.inicio) || !hora.test(f.fim)) throw new Error('Confira os horários marcados.');
    if (f.fim <= f.inicio) throw new Error('Confira os horários de ' + DIAS_TRABALHO[f.dia] + ': o fim vem depois do começo.');
  });
  faixas.forEach(function (a, i) {
    faixas.forEach(function (b, j) {
      if (i < j && a.dia === b.dia && a.inicio < b.fim && b.inicio < a.fim) {
        throw new Error('Os dois horários de ' + DIAS_TRABALHO[a.dia] + ' se cruzam. Confira.');
      }
    });
  });
  return faixas;
}

// "segunda 08:00 às 12:00 e 14:00 às 18:00; quarta 13:30 às 19:00"
function textoHorarios_(faixas) {
  return Object.keys(DIAS_TRABALHO).map(function (d) {
    const doDia = (faixas || []).filter(function (f) { return f.dia === d; })
      .sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; })
      .map(function (f) { return f.inicio + ' às ' + f.fim; });
    return doDia.length ? DIAS_TRABALHO[d] + ' ' + doDia.join(' e ') : '';
  }).filter(String).join('; ');
}


/* ------------------------------------------------------------------ */
/* Sistema Índigo Rei                                                  */
/* ------------------------------------------------------------------ */

// Só dados de trabalho. Bio, foto, uniforme, aniversário e curiosidades ficam na planilha.
function dadosParaSistema_(r) {
  const juntar = function (v) { return Array.isArray(v) ? v.join(', ') : String(v || ''); };
  const d = {
    nomeCompleto: r.nomeCompleto, nomeProfissional: r.nomeProfissional, funcoes: juntar(r.funcoes),
    whatsapp: String(r.whatsapp || '').replace(/\D/g, ''), email: String(r.email || '').toLowerCase(),
    areas: juntar(r.areas), etapas: juntar(r.etapas), idiomas: r.idiomas, registro: r.registro,
    graduacao: r.graduacao, posGraduacao: r.posGraduacao, experiencia: r.experiencia
  };
  // Só a lista do envio vai ao sistema. Do histórico da planilha os horários voltam como texto e ficam de fora,
  // para o reenvio do histórico continuar igual ao que o sistema já tratou.
  if (Array.isArray(r.horarios) && r.horarios.length) d.horarios = r.horarios;
  return d;
}

// Primeiro envio de um e-mail usa o próprio e-mail como chave (como sempre foi); os seguintes, e-mail + data e hora.
function chaveNoSistema_(email, repetido, dataHora) {
  return repetido && dataHora instanceof Date ? email + '.' + Utilities.formatDate(dataHora, CONFIG.FUSO, 'yyMMddHHmmss') : email;
}

// Entrega ao sistema. Nunca atrapalha o cadastro: se falhar, só registra no log de execuções.
function enviarAoSistema_(email, dados) {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SISTEMA_URL');
  const publica = props.getProperty('SISTEMA_CHAVE_PUBLICA');
  const chave = props.getProperty('SISTEMA_CHAVE');
  if (!url || !publica || !chave || !email) return false;
  try {
    const resposta = UrlFetchApp.fetch(url.replace(/\/+$/, '') + '/rest/v1/rpc/cadastro_receber', {
      method: 'post',
      contentType: 'application/json',
      headers: { apikey: publica },
      payload: JSON.stringify({ p_chave: chave, p_tipo: 'equipe', p_envio: email, p_dados: dados }),
      muteHttpExceptions: true
    });
    if (resposta.getResponseCode() >= 300) {
      console.warn('Falha ao enviar ao sistema: HTTP ' + resposta.getResponseCode() + ' ' + resposta.getContentText().slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Falha ao enviar ao sistema: ' + (err && err.message || err));
    return false;
  }
}

// Rodar uma vez pelo editor, depois de criar as propriedades. Pode rodar de novo: envio igual ao que o sistema
// já tratou não muda nada lá. Cada linha vai com a mesma chave do envio original.
function enviarHistoricoAoSistema() {
  const planilha = pegarPlanilha_(PropertiesService.getScriptProperties().getProperty('PLANILHA_ID'));
  if (!planilha) throw new Error('Planilha não encontrada. Rode configurar() primeiro.');
  const aba = planilha.getSheetByName('Respostas') || planilha.getSheets()[0];
  if (aba.getLastRow() < 2) return 'Nada para enviar.';
  const valores = aba.getRange(2, 1, aba.getLastRow() - 1, COLUNAS.length).getDisplayValues();
  const datas = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getValues();
  const vistos = {};
  let ok = 0, falhas = 0;
  valores.forEach(function (linha, n) {
    const r = {};
    COLUNAS.forEach(function (c, i) { r[c[0]] = String(linha[i] || '').replace(/^'/, ''); });
    if (!r.email) return;
    const email = r.email.trim().toLowerCase();
    const chave = chaveNoSistema_(email, !!vistos[email], datas[n][0]);
    vistos[email] = true;
    if (enviarAoSistema_(chave, dadosParaSistema_(r))) ok++; else falhas++;
  });
  const resumo = 'Enviados ao sistema: ' + ok + '. Falhas: ' + falhas + (falhas ? ' (veja o log de execuções).' : '.');
  Logger.log(resumo);
  return resumo;
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
