// language: JavaScript | file: deploy-commands.js
// Registra os slash commands no Discord — rode ANTES de iniciar o bot

const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

// ─── Validação de env vars obrigatórias ──────────────────────────────────────
const required = ['TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missing  = required.filter(k => !process.env[k] || process.env[k].includes('_AQUI'));
if (missing.length) {
    console.error('❌ Variáveis de ambiente ausentes ou não preenchidas no .env:');
    missing.forEach(k => console.error(`   → ${k}`));
    process.exit(1);
}

// ─── Coleta de comandos ───────────────────────────────────────────────────────
const commands     = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`  📄 Encontrado: /${command.data.name}`);
    } else {
        console.warn(`  ⚠️  ${file} não exporta 'data' ou 'execute' — ignorado.`);
    }
}

// ─── Registro via REST ────────────────────────────────────────────────────────
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Registrando ${commands.length} comando(s) no servidor ${process.env.GUILD_ID}...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log(`\n✅ ${data.length} comando(s) registrado(s) com sucesso!\n`);
        data.forEach(c => console.log(`   → /${c.name}`));
        console.log('\n💡 Agora rode: node index.js\n');
    } catch (error) {
        console.error('\n❌ Erro ao registrar comandos:');
        if (error.code === 50035) console.error('   → Token ou CLIENT_ID inválido.');
        if (error.code === 50001) console.error('   → Bot sem acesso ao servidor. Verifique o GUILD_ID.');
        console.error(error);
        process.exit(1);
    }
})();
