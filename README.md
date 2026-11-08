# 🎫 Ticket Bot

Bot de tickets para Discord com pagamento PIX integrado.

---

## ⚡ Setup rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o `.env`
Copie `.env.example` para `.env` e preencha **todos** os campos:

```env
TOKEN=         # Token do bot (Portal do Developer)
CLIENT_ID=     # ID do bot (Portal do Developer → General Information → Application ID)
GUILD_ID=      # ID do seu servidor (clique direito no servidor → Copiar ID)

STAFF_ROLE_ID= # ID do cargo de Staff
OWNER_ID=      # Seu ID de usuário Discord
```

**Como pegar o CLIENT_ID:**
1. https://discord.com/developers/applications
2. Clique no seu bot → General Information
3. Copie o **Application ID**

---

### 3. ⚠️ Registrar os comandos (OBRIGATÓRIO)
Sem este passo os comandos NÃO aparecem no Discord.

```bash
node deploy-commands.js
```

Você verá algo como:
```
✅ 5 comando(s) registrado(s) com sucesso!
   → /ticketcriar
   → /fecharticket
   → /gerarpix
   → /adduser
```

> Rode este comando **sempre que adicionar ou renomear um comando**.

---

### 4. Iniciar o bot
```bash
node index.js
```

---

## 📋 Comandos

| Comando | Descrição | Permissão |
|---|---|---|
| `/ticketcriar` | Cria o painel de tickets no canal | Administrador |
| `/fecharticket` | Fecha o ticket atual | Staff / Dono do ticket |
| `/gerarpix [valor]` | Gera cobrança PIX no ticket | Qualquer membro |
| `/adduser [@usuário]` | Adiciona alguém ao ticket | Staff |

---

## ❓ Comandos não aparecem?

1. Verifique se rodou `node deploy-commands.js` com o `.env` preenchido
2. Confirme que `CLIENT_ID` é o **Application ID** (não o ID do usuário bot)
3. Confirme que `GUILD_ID` é o ID do servidor correto
4. Aguarde até 1 minuto após o deploy (geralmente é instantâneo para guild commands)
5. Teste digitando `/ticket` no Discord — deve aparecer o autocompletar

---

## 🗂️ Estrutura
```
ticket-bot/
├── commands/
│   ├── ticketcriar.js    ← Cria o painel de tickets
│   ├── fecharticket.js   ← Fecha ticket via comando
│   ├── gerarpix.js       ← Gera PIX no ticket
│   └── adduser.js        ← Adiciona usuário ao ticket
├── handlers/
│   └── ticketHandler.js  ← Lógica de abertura/fechamento via botões
├── data/
│   └── tickets.json      ← Persistência dos tickets
├── deploy-commands.js    ← Registra comandos no Discord (rodar 1x)
├── index.js              ← Entry point do bot
└── .env                  ← Suas credenciais (nunca commitar)
```
