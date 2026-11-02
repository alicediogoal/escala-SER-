# Ser: aplicativo de escala para ministérios

Sistema de escala, cadastro e lembretes automáticos por e-mail para equipes de voluntários. Funciona 100% gratuito (sem necessidade de cartão de crédito) utilizando **GitHub Pages**, **Google Apps Script** e **Google Sheets**.

---

## 🚀 Como Funciona

- **Interface (Frontend):** Hospedada no **GitHub Pages** (pasta `/docs`).
- **Servidor (Backend):** Script do **Google Apps Script** (executado via URL `/exec`).
- **Banco de Dados:** **Google Sheets** (planilha para guardar cadastros e escalas).
- **Notificações:** Envio automático de e-mails pelo **Gmail** integrado ao Apps Script.

---

## 🔑 Funções e Permissões

- **Admin (ADM):** Acesso total ao sistema. Define quem são os líderes, pastores e membros.
- **Líder:** Organiza e finaliza a escala, seleciona voluntários, cria eventos e agenda reuniões.
- **Pastor:** Acompanha escalas, sugestões e reuniões (sem permissão de edição da escala).
- **Membro:** Declara disponibilidade de datas e visualiza as escalas finalizadas.

> 💡 **Primeiro acesso:** O primeiro número de WhatsApp cadastrado no sistema torna-se o **Administrador (ADM)** automaticamente.

---

## 📱 Autenticação e Notificações

1. **Login de Acesso:**
   - O usuário informa o número do seu **WhatsApp (com DDD)** no aplicativo como identificador de acesso.
   - O servidor gera um **código de segurança de 6 dígitos** enviado para o e-mail cadastrado do voluntário (verifique sempre a caixa de entrada e spam).

2. **Lembretes de Escala:**
   - Os lembretes e confirmações das escalas são enviados diretamente por e-mail quando o ADM ou Líder finaliza a programação.

---

## 📋 Passo a Passo de Instalação

1. **Google Apps Script e Planilha:**
   - Crie uma planilha no Google Sheets para armazenar os dados.
   - Configure o código no Google Apps Script e faça a publicação selecionando:
     - **Executar como:** *Eu* (sua conta do Google).
     - **Quem pode acessar:** *Qualquer pessoa*.
   - Copie a **URL do App da Web** que termina com `/exec`.

2. **Repositório no GitHub:**
   - Crie um repositório público chamado `escala-SER-`.
   - Adicione os arquivos da aplicação na pasta `/docs`.
   - Abra o arquivo `docs/config.js` e insira o seu link do Apps Script:
     ```javascript
     const API_URL = "[https://script.google.com/macros/s/SUA_CHAVE_AQUI/exec](https://script.google.com/macros/s/SUA_CHAVE_AQUI/exec)";
     ```
   - Salve as alterações (**Commit changes**).

3. **Publicação com GitHub Pages:**
   - Acesse **Settings > Pages** no seu repositório GitHub.
   - Em **Source**, selecione *Deploy from a branch*.
   - Em **Branch**, selecione `main` (ou `principal`) e defina a pasta como `/docs`.
   - Salve e aguarde o link do site ser liberado (exemplo: `https://SEU_USUARIO.github.io/escala-SER-/`).

4. **Instalação no Celular (PWA):**
   - **Android (Chrome):** Acesse o link no navegador, toque no menu de 3 pontos no canto superior direito e selecione **Instalar aplicativo** (ou **Adicionar à tela inicial**).
   - **iPhone (Safari):** Acesse o link, toque no ícone de **Compartilhar** e escolha **Adicionar à Tela de Início**.
