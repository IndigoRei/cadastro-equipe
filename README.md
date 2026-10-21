# Cadastro da equipe · Índigo Rei

Formulário em **https://equipe.indigorei.com.br**, publicado pelo GitHub Pages a partir da branch `main`.

Este repositório tem só o código. **Nenhum dado da equipe fica aqui.**

## Como funciona

- `index.html` é a página (logo, cores e textos da Índigo Rei). Ela envia o cadastro para o servidor em Apps Script.
- `servidor/Codigo.gs` é o servidor. Ele roda na conta institutoindigorei@gmail.com, no projeto "Cadastro da Equipe Índigo Rei" do Apps Script, e grava:
  - Planilha **Cadastro da Equipe Índigo Rei (respostas)**: aba Respostas (uma linha por envio: quem envia de novo ganha linha nova, e a coordenação apaga a antiga) e aba Uniforme (contagem de camisas).
  - Pasta **Fotos da equipe**: uma foto por envio.
- Quem envia de novo com o mesmo e-mail substitui a resposta anterior.
- O link antigo do Apps Script só mostra o endereço novo (equipe.indigorei.com.br).
- **Sistema Índigo Rei:** cada envio também vai para a caixa "Cadastros recebidos" do sistema (sistema.indigorei.com.br), só com os dados de trabalho (nome, contato, funções, áreas, formação). Liga-se com três propriedades do script (`SISTEMA_URL`, `SISTEMA_CHAVE_PUBLICA`, `SISTEMA_CHAVE`), geradas no próprio sistema. A chave nunca vai para o repositório. As respostas antigas vão com a função `enviarHistoricoAoSistema()`, rodada uma vez pelo editor.

## Para mudar

- **Texto ou perguntas da página:** editar `index.html` e enviar para `main`. O site atualiza sozinho em cerca de um minuto. Se mudar um campo, mudar também `servidor/Codigo.gs`.
- **Servidor:** colar o novo `servidor/Codigo.gs` no editor do Apps Script e ir em Implantar > Gerenciar implantações > editar > Versão: Nova versão > Implantar. Assim o endereço continua o mesmo.

## Regras de texto

Sem travessões e sem citar nomes de alunos ou famílias.
