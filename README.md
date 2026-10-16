# Cadastro da equipe · Índigo Rei

Formulário em **https://equipe.indigorei.com.br**, publicado pelo GitHub Pages a partir da branch `main`.

Este repositório tem só o código. **Nenhum dado da equipe fica aqui.**

## Como funciona

- `index.html` é a página (logo, cores e textos da Índigo Rei). Ela envia o cadastro para o servidor em Apps Script.
- `servidor/Codigo.gs` é o servidor. Ele roda na conta institutoindigorei@gmail.com, no projeto "Cadastro da Equipe Índigo Rei" do Apps Script, e grava:
  - Planilha **Cadastro da Equipe Índigo Rei (respostas)**: aba Respostas (uma linha por pessoa) e aba Uniforme (contagem de camisas).
  - Pasta **Fotos da equipe**: uma foto por envio.
- Quem envia de novo com o mesmo e-mail substitui a resposta anterior.
- O link antigo do Apps Script continua funcionando e grava na mesma planilha.

## Para mudar

- **Texto ou perguntas da página:** editar `index.html` e enviar para `main`. O site atualiza sozinho em cerca de um minuto. Se mudar um campo, mudar também `servidor/Codigo.gs`.
- **Servidor:** colar o novo `servidor/Codigo.gs` no editor do Apps Script e ir em Implantar > Gerenciar implantações > editar > Versão: Nova versão > Implantar. Assim o endereço continua o mesmo.

## Regras de texto

Sem travessões e sem citar nomes de alunos ou famílias.
