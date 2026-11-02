# Servidor no computador da igreja (sem custo, sem cartão)

O Ser roda no computador do culto (o do Holyrics). O Tailscale Funnel dá um endereço HTTPS público e fixo, grátis.

Limites: o computador precisa estar ligado e com internet nos horários dos lembretes (7h e 9h); o Funnel tem limite de banda não divulgado (evite vídeos grandes); o plano gratuito do Tailscale é para uso não comercial.

## 1. Instalar o Node.js
Baixe o Node.js **22 LTS** em nodejs.org (instalador .msi) e instale com as opções padrão.

## 2. Baixar o Ser
No GitHub, abra o repositório SERAPK > **Code > Download ZIP**. Extraia em `C:\Ser`. Copie o arquivo `iniciar-ser.bat` para dentro dessa pasta (se ele não estiver lá).

## 3. Ligar o servidor
Dê dois cliques em `iniciar-ser.bat`. Na primeira vez ele instala o que precisa (alguns minutos). Quando aparecer "Ser no ar na porta 3000", está funcionando. Deixe a janela aberta (pode minimizar).

## 4. Endereço público (Tailscale)
1. Instale o Tailscale (tailscale.com/download) e entre com uma conta Google.
2. Em login.tailscale.com/admin/dns, ative **HTTPS Certificates**.
3. Abra o PowerShell e rode: `tailscale funnel --bg 3000`
   Se aparecer um link pedindo para ativar o Funnel, abra e aprove, e rode o comando de novo.
4. O comando mostra o endereço, algo como `https://pc-igreja.nome-da-rede.ts.net`. Esse é o endereço do app.

## 5. Usar
Abra o endereço no celular e faça o primeiro cadastro (vira ADM). No iPhone: Safari > Compartilhar > Adicionar à Tela de Início.

## 6. Ligar sozinho com o computador
- Aperte Win+R, digite `shell:startup` e Enter. Coloque nessa pasta um atalho do `iniciar-ser.bat` (botão direito no arquivo > Criar atalho).
- Em Configurações > Sistema > Energia, deixe "Suspender" como **Nunca** quando ligado na tomada.

## Cuidados
- Antes de convidar a igreja, configure o login seguro. Com `DEV_LOGIN=true`, quem souber um número cadastrado consegue entrar com ele.
- Faça cópia da pasta `C:\Ser\dados` (banco e arquivos) de vez em quando.
- Atualizar o app: baixe o ZIP de novo, copie os arquivos por cima (sem apagar `dados`, `segredo.txt` e `chave-ponte.txt`) e reinicie o `iniciar-ser.bat`.
