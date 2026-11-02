# Ser: passo a passo (100% gratuito, sem cartão)

Resumo: o app fica no GitHub Pages, os dados numa planilha Google, os arquivos no Google Drive, e o Google Apps Script faz o papel de servidor (login e lembretes por e-mail).

## Antes de começar
- Crie um Gmail só para o Ser (ex.: ser.suaigreja@gmail.com). Tudo fica nessa conta e os e-mails de lembrete saem dela.
- Tenha sua conta do GitHub.
- Use um computador. Depois de pronto, tudo funciona pelo celular.

## 1. GitHub
1. github.com > botão **+** > **New repository**. Nome: `ser`. Marque **Public**. Create repository.
2. **uploading an existing file**: arraste para a página as pastas `docs` e `apps-script` e os arquivos `README.md` e `GUIA-PASSO-A-PASSO.md` (extraia o zip antes). Aguarde terminar e clique em **Commit changes**.
3. **Settings > Pages**. Em Source escolha **Deploy from a branch**. Em Branch escolha **main** e a pasta **/docs**. Save.
4. Em 1 a 2 minutos o endereço do app aparece na mesma tela (algo como `https://SEU_USUARIO.github.io/ser/`). Anote.

## 2. Planilha e servidor (logado no Gmail do Ser)
1. Abra sheets.google.com > **Planilha em branco**. Dê o nome **Ser - Dados**.
2. Menu **Extensões > Apps Script**. Apague o código que aparece.
3. Abra `apps-script/Codigo.gs` (no GitHub ou no zip), copie tudo e cole no editor. Clique no ícone de salvar.
4. Engrenagem **Configurações do projeto**: em **Fuso horário** escolha **(GMT-03:00) Brasília**. Volte ao editor (ícone `<>`).
5. No topo, na lista de funções, escolha **setup** e clique em **Executar**.
6. Na primeira vez pede permissão: **Revisar permissões** > escolha a conta > **Avançado** > **Acessar Ser (não seguro)** > **Permitir**. É normal o aviso, o código é seu.
7. Quando o registro mostrar "Pronto!", confira: a planilha ganhou abas (Membros, Eventos...) e o Drive tem as pastas **Ser - Arquivos** e **Ser - Holyrics**.

## 3. Publicar o servidor
1. **Implantar > Nova implantação**. Clique na engrenagem ao lado de "Selecionar tipo" e escolha **App da Web**.
2. **Executar como**: Eu. **Quem pode acessar**: Qualquer pessoa. Clique em **Implantar**.
3. Copie o **URL do app da Web** (termina em `/exec`).

## 4. Ligar o app ao servidor
1. No GitHub, abra `docs/config.js`, clique no lápis.
2. Troque `COLE_AQUI_O_ENDERECO` pelo URL copiado (mantenha as aspas). Commit changes.
3. Espere 1 a 2 minutos.

## 5. Primeiro acesso
1. Abra o endereço do GitHub Pages no celular.
2. Digite seu WhatsApp. Como é novo, aparece o cadastro. **Faça você mesmo o primeiro**: ele vira ADM.
3. O código de 6 dígitos chega no e-mail cadastrado (veja o spam). Digite e entre.
4. iPhone: Safari > Compartilhar > **Adicionar à Tela de Início**. Android: menu do Chrome > Instalar app.
5. Compartilhe o endereço com a equipe. Cada um se cadastra sozinho. Em **Mais**, o ADM define quem é líder e pastor e ajusta os ministérios.

## 6. Lembretes por e-mail
O `setup` já criou os horários: um e-mail 1 dia antes (entre 9h e 10h) e outro no dia (entre 7h e 8h), só para escalas **finalizadas**. Se finalizar depois do horário, o e-mail sai na hora.
Para o e-mail trazer o link do app: Apps Script > Configurações do projeto > **Propriedades do script** > adicionar `APP_URL` com o endereço do GitHub Pages.

## 7. Holyrics
1. No computador do culto, instale o **Google Drive para computador** e entre com o Gmail do Ser.
2. Deixe a pasta **Ser - Holyrics** disponível offline (clique com o botão direito na pasta).
3. No Holyrics, adicione essa pasta (ou suas subpastas Imagens, Vídeos e Áudios) à biblioteca de mídia.
4. No app, o líder toca em **Enviar ao Holyrics** no arquivo. Ele é copiado para a pasta e aparece no PC.

## 8. Manutenção
- **Atualizar o servidor** (depois de mudar o Codigo.gs): Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar. O endereço continua o mesmo.
- **Atualizar o app**: envie os arquivos novos para a pasta `docs` do GitHub.
- **Cópia de segurança**: na planilha, Arquivo > Fazer download > Excel. Faça de vez em quando.

## Limites e cuidados
- 100 e-mails por dia (códigos de login + lembretes).
- Arquivos de até 10 MB. Vídeos grandes não cabem.
- Cada ação leva de 1 a 3 segundos.
- O endereço do app é público: qualquer pessoa com ele consegue se cadastrar como membro. Compartilhe só com a igreja e confira a lista em Mais > Equipe.
- Os e-mails podem cair no spam nas primeiras vezes. Peça para marcarem como "não é spam".

## Problemas comuns
- **"O endereço do servidor ainda não foi configurado"**: faltou o passo 4.
- **"Sessão inválida"** ou erros depois de mudar o código: refaça a implantação como nova versão (passo 8).
- **Código não chega**: veja o spam e se o e-mail do cadastro está certo (Mais > Meu perfil).
