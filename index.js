// language: JavaScript | file: index.js | runtime: Node.js 18+ | target: Discord Bot

const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

// ─── Cliente ────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();

// ─── Carregar comandos ───────────────────────────────────────────────────────
const commandsPath  = path.join(__dirname, 'commands');
const commandFiles  = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`  ✅ Comando carregado: /${command.data.name}`);
    }
}

// ─── Pronto ──────────────────────────────────────────────────────────────────
client.once('ready', () => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  🤖  Bot online: ${client.user.tag}`);
    console.log(`  📡  Servidores: ${client.guilds.cache.size}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    client.user.setActivity('📩 /ticketcriar para configurar', { type: ActivityType.Watching });
});

// ─── Logs de entrada / saída ─────────────────────────────────────────────────
const { handleMemberAdd, handleMemberRemove } = require('./handlers/logHandler');

client.on('guildMemberAdd',    member => handleMemberAdd(member, client).catch(console.error));
client.on('guildMemberRemove', member => handleMemberRemove(member, client).catch(console.error));

// ─── Interações ──────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {

    // Slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[ERRO] Comando /${interaction.commandName}:`, error);
            const msg = { content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
    }

    // Botões
    if (interaction.isButton()) {
        const { handleButton } = require('./handlers/ticketHandler');
        try {
            await handleButton(interaction, client);
        } catch (error) {
            console.error('[ERRO] Botão:', error);
            const msg = { content: '❌ Erro ao processar ação.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
    }

    // Modal — clonar servidor
    if (interaction.isModalSubmit() && interaction.customId === 'clonar_modal') {
        const { handleClonar } = require('./handlers/clonarHandler');
        try {
            await handleClonar(interaction, client);
        } catch (error) {
            console.error('[ERRO] Modal clonar:', error);
            const msg = { content: '❌ Erro ao processar clonagem.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg).catch(() => {});
            } else {
                await interaction.reply(msg).catch(() => {});
            }
        }
    }
});

// ─── Login ───────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
