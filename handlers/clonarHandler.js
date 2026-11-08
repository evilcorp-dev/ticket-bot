// language: JavaScript | file: handlers/clonarHandler.js
// Executa a clonagem de servidor após submissão do modal

const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

async function handleClonar(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const origemId  = interaction.fields.getTextInputValue('origem_id').trim();
    const destinoId = interaction.fields.getTextInputValue('destino_id').trim();

    const origem  = client.guilds.cache.get(origemId);
    const destino = client.guilds.cache.get(destinoId);

    if (!origem)  return interaction.editReply({ content: `❌ Servidor de origem \`${origemId}\` não encontrado. O bot precisa estar nele.` });
    if (!destino) return interaction.editReply({ content: `❌ Servidor de destino \`${destinoId}\` não encontrado. O bot precisa estar nele.` });

    const log = [];
    const push = msg => { log.push(msg); console.log(`[CLONAR] ${msg}`); };

    push(`Iniciando clonagem: ${origem.name} → ${destino.name}`);

    await interaction.editReply({ content: `⏳ Clonando **${origem.name}** → **${destino.name}**...` });

    try {
        // ── 1. Apagar canais e cargos existentes no destino ──────────────────
        push('Removendo canais do destino...');
        for (const ch of destino.channels.cache.values()) {
            await ch.delete().catch(() => {});
        }

        push('Removendo cargos do destino (exceto @everyone)...');
        for (const role of destino.roles.cache.values()) {
            if (role.id === destino.roles.everyone.id) continue;
            if (role.managed) continue;
            await role.delete().catch(() => {});
        }

        // ── 2. Clonar cargos ─────────────────────────────────────────────────
        push('Clonando cargos...');
        const roleMap = new Map(); // origemId → novoRole
        const sortedRoles = [...origem.roles.cache.values()]
            .filter(r => r.id !== origem.roles.everyone.id && !r.managed)
            .sort((a, b) => a.position - b.position);

        for (const role of sortedRoles) {
            try {
                const novo = await destino.roles.create({
                    name:        role.name,
                    color:       role.color,
                    hoist:       role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions,
                });
                roleMap.set(role.id, novo.id);
                push(`  Cargo: ${role.name}`);
            } catch (e) { push(`  ⚠️ Cargo falhou: ${role.name} — ${e.message}`); }
        }

        // ── 3. Clonar categorias e canais ─────────────────────────────────────
        push('Clonando categorias e canais...');
        const catMap = new Map(); // origemCatId → novoCanal

        const categorias = [...origem.channels.cache.values()]
            .filter(c => c.type === ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position);

        for (const cat of categorias) {
            try {
                const permOverwrites = cat.permissionOverwrites.cache.map(ow => ({
                    id:    roleMap.get(ow.id) ?? ow.id,
                    allow: ow.allow,
                    deny:  ow.deny,
                    type:  ow.type,
                }));
                const novacat = await destino.channels.create({
                    name:                 cat.name,
                    type:                 ChannelType.GuildCategory,
                    position:             cat.position,
                    permissionOverwrites: permOverwrites,
                });
                catMap.set(cat.id, novacat.id);
                push(`  Categoria: ${cat.name}`);
            } catch (e) { push(`  ⚠️ Categoria falhou: ${cat.name}`); }
        }

        const canais = [...origem.channels.cache.values()]
            .filter(c => c.type !== ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position);

        for (const ch of canais) {
            try {
                const permOverwrites = ch.permissionOverwrites.cache.map(ow => ({
                    id:    roleMap.get(ow.id) ?? ow.id,
                    allow: ow.allow,
                    deny:  ow.deny,
                    type:  ow.type,
                }));
                const opts = {
                    name:                 ch.name,
                    type:                 ch.type,
                    position:             ch.position,
                    topic:                ch.topic ?? undefined,
                    nsfw:                 ch.nsfw ?? false,
                    permissionOverwrites: permOverwrites,
                };
                if (ch.parentId && catMap.has(ch.parentId)) {
                    opts.parent = catMap.get(ch.parentId);
                }
                if (ch.type === ChannelType.GuildVoice) {
                    opts.bitrate   = ch.bitrate;
                    opts.userLimit = ch.userLimit;
                }
                await destino.channels.create(opts);
                push(`  Canal: ${ch.name}`);
            } catch (e) { push(`  ⚠️ Canal falhou: ${ch.name}`); }
        }

        push('Clonagem concluída!');

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅  Clonagem Concluída')
            .addFields(
                { name: '📤 Origem',  value: `${origem.name} (\`${origemId}\`)`,  inline: true },
                { name: '📥 Destino', value: `${destino.name} (\`${destinoId}\`)`, inline: true },
                { name: '📋 Log',     value: `\`\`\`\n${log.slice(-20).join('\n')}\n\`\`\`` },
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });

    } catch (err) {
        console.error('[CLONAR] Erro fatal:', err);
        return interaction.editReply({ content: `❌ Erro durante a clonagem: ${err.message}` });
    }
}

module.exports = { handleClonar };
