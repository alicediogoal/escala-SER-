# Servidor gratuito para o Ser (Google Cloud)

O Render grátis dorme e apaga os dados. A saída gratuita é uma máquina virtual sempre ligada. Este guia usa o Google Cloud (e2-micro, Always Free). A Oracle também serve, mas exige mais passos de rede.

## 1. Conta e faturamento
1. Entre em console.cloud.google.com com sua conta Google.
2. Ative o faturamento com cartão (verificação). Você ganha um crédito de teste de 90 dias. Perto do fim, o Google pede para ativar a conta completa. Faça isso, senão a máquina pode parar. Dentro dos limites Always Free não deve haver cobrança, mas confira os limites em cloud.google.com/free.
3. Em Faturamento > Orçamentos e alertas, crie um orçamento de US$ 1 com alertas de 50% e 100%.

## 2. Criar a máquina
Compute Engine > Instâncias de VM > Criar instância:
- Nome: `ser`
- Região: `us-central1` (ou `us-east1` / `us-west1`). Só essas são grátis.
- Série E2, tipo **e2-micro**
- Disco de inicialização: **Ubuntu 24.04 LTS**, tipo **Disco permanente padrão**, 30 GB
- Modelo de provisionamento: **Padrão** (não use Spot)
- Firewall: marque **Permitir tráfego HTTP** e **Permitir tráfego HTTPS**
- Não reserve IP estático (pode gerar cobrança). O script cuida do endereço.

## 3. Endereço gratuito (DuckDNS)
1. Entre em duckdns.org, crie um nome (ex.: `igreja-ser`) e copie o **token** do topo da página.
2. No campo de IP do nome criado, cole o **IP externo** da máquina (aparece na lista de instâncias) e clique em update.

## 4. Instalar (um comando)
Na lista de instâncias, clique em **SSH**. Cole (troque o nome e o token):
```
curl -fsSL https://raw.githubusercontent.com/alicediogoal/SERAPK/main/docs/instalar-servidor.sh | REPO=https://github.com/alicediogoal/SERAPK.git DOMINIO=igreja-ser.duckdns.org DUCK_TOKEN=COLE_O_TOKEN bash
```
Leva alguns minutos. No final aparece o endereço do app.

## 5. Usar
Abra o endereço, faça o primeiro cadastro (vira ADM). No iPhone: Safari > Compartilhar > Adicionar à Tela de Início.

## Depois
- **Atualizar o app:** `cd ~/ser && git pull && npm install --omit=dev && sudo systemctl restart ser`
- **Ligar o WhatsApp:** `sudo nano /etc/ser.env`, preencha `WA_TOKEN` e `WA_PHONE_ID`, troque `DEV_LOGIN=true` para `false`, salve e rode `sudo systemctl restart ser`.
- **Ver erros:** `sudo journalctl -u ser -n 50 --no-pager`
- **Backup:** baixe a pasta `~/ser-dados` (banco e arquivos) com frequência.

## Limites a vigiar
O plano grátis inclui cerca de 1 GB de saída de dados por mês. O app em si é leve, mas muitos vídeos ou imagens grandes baixados pelos membros podem passar disso e gerar cobrança.
