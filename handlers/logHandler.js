// language: JavaScript | file: handlers/logHandler.js
// Logs de entrada e saída de membros — dois canais distintos

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

const ENTRADA_GUILD_ID = '1542578484289740922';

// Canal de boas-vindas — exibe ao público (sem IP)
const BOAS_VINDAS_CHANNEL = '1546256688279986186';

// Canal de logs interno — exibe tudo, incluindo IP
const LOGS_CHANNEL = '1568897771048800396';

// Canal de saída
const SAIDA_CHANNEL = '1568898011050811504';

// ─── Entrada ─────────────────────────────────────────────────────────────────
// ip é opcional — Discord não entrega nativamente; passe via sistema externo de verificação
async function handleMemberAdd(member, client, ip = null) {
    if (member.guild.id !== ENTRADA_GUILD_ID) return;

    const user        = member.user;
    const criado      = Math.floor(user.createdTimestamp / 1000);
    const entrou      = Math.floor(Date.now() / 1000);
    const memberCount = member.guild.memberCount;
    const avatarURL   = user.displayAvatarURL({ dynamic: true, size: 512 });

    // ── Embed de boas-vindas (canal público) ─────────────────────────────────
    const canalBoasVindas = member.guild.channels.cache.get(BOAS_VINDAS_CHANNEL);
    if (canalBoasVindas) {
        const embedBV = new EmbedBuilder()
            .setColor(0x5865F2)                              // azul Discord
            .setAuthor({
                name:    `✦ ${user.username} chegou ao servidor`,
                iconURL: avatarURL,
            })
            .setDescription(
                `### Seja bem-vindo(a), ${member}! 🎉\n` +
                `> Estamos felizes em ter você aqui.\n` +
                `> Leia as regras e aproveite o servidor.`
            )
            .addFields(
                {
                    name:   '🪪 ID do usuário',
                    value:  `\`\`\`${user.id}\`\`\``,
                    inline: false,
                },
                {
                    name:   '📅 Conta criada',
                    value:  `<t:${criado}:D> (<t:${criado}:R>)`,
                    inline: true,
                },
                {
                    name:   '👥 Membro nº',
                    value:  `**#${memberCount}**`,
                    inline: true,
                },
            )
            .setImage(avatarURL)                             // foto grande = a "imagem branca" que aparece
            .setFooter({ text: `${user.tag}  •  ${user.id}` })
            .setTimestamp();

        await canalBoasVindas.send({ embeds: [embedBV] }).catch(console.error);
    }

    // ── Embed de logs (canal interno — inclui IP) ─────────────────────────────
    const canalLogs = member.guild.channels.cache.get(LOGS_CHANNEL);
    if (canalLogs) {
        const embedLog = new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({
                name:    `[ENTRADA] ${user.tag}`,
                iconURL: avatarURL,
            })
            .setThumbnail(avatarURL)
            .setDescription(`<@${user.id}> entrou no servidor.`)
            .addFields(
                { name: '🪪 ID',              value: `\`${user.id}\``,                             inline: true },
                { name: '🌐 IP',              value: ip ? `\`${ip}\`` : '`N/A`',                   inline: true },
                { name: '📅 Conta criada',    value: `<t:${criado}:F>\n(<t:${criado}:R>)`,         inline: true },
                { name: '🕐 Entrou em',       value: `<t:${entrou}:F>`,                             inline: true },
                { name: '👥 Membro nº',       value: `\`#${memberCount}\``,                         inline: true },
            )
            .setImage(avatarURL)
            .setFooter({ text: `LOG ENTRADA  •  ID: ${user.id}` })
            .setTimestamp();

        await canalLogs.send({ embeds: [embedLog] }).catch(console.error);
    }
}

// ─── Saída ────────────────────────────────────────────────────────────────────
async function handleMemberRemove(member, client) {
    if (member.guild.id !== ENTRADA_GUILD_ID) return;

    const canal = member.guild.channels.cache.get(SAIDA_CHANNEL);
    if (!canal) return;

    const user   = member.user;
    const saiu   = Math.floor(Date.now() / 1000);
    const entrou = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    // Tentar pegar motivo de kick/ban via audit log
    let motivo = null;
    try {
        await new Promise(r => setTimeout(r, 1500));
        const logs = await member.guild.fetchAuditLogs({ limit: 5 });
        const entry = logs.entries.find(e =>
            (e.action === AuditLogEvent.MemberKick || e.action === AuditLogEvent.MemberBanAdd) &&
            e.target?.id === user.id &&
            Date.now() - e.createdTimestamp < 5000
        );
        if (entry) {
            motivo = entry.action === AuditLogEvent.MemberBanAdd
                ? `🔨 Banido — ${entry.reason ?? 'sem motivo'}`
                : `👢 Kickado — ${entry.reason ?? 'sem motivo'}`;
        }
    } catch { /* sem permissão para audit log */ }

    const roles = [...member.roles.cache.values()]
        .filter(r => r.id !== member.guild.roles.everyone.id)
        .map(r => r.toString())
        .join(', ') || 'Nenhum';

    const avatarURL = member.user.displayAvatarURL({ dynamic: true, size: 256 });

    const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({
            name:    `✦ ${user.username} saiu do servidor`,
            iconURL: avatarURL,
        })
        .setThumbnail(avatarURL)
        .setDescription(motivo
            ? `> ⚠️ **${motivo}**`
            : `> 👋 **${user.tag}** deixou o servidor.`
        )
        .addFields(
            { name: '🪪 ID',          value: `\`${user.id}\``,                                            inline: true },
            { name: '🕐 Saiu em',     value: `<t:${saiu}:F>`,                                              inline: true },
            { name: '📅 Entrou em',   value: entrou ? `<t:${entrou}:F>\n(<t:${entrou}:R>)` : 'Desconhecido', inline: true },
            { name: '🏷️ Cargos',     value: roles.length > 1000 ? roles.slice(0, 997) + '...' : roles,    inline: false },
        )
        .setFooter({ text: `LOG SAÍDA  •  ID: ${user.id}` })
        .setTimestamp();

    await canal.send({ embeds: [embed] }).catch(console.error);
}

module.exports = { handleMemberAdd, handleMemberRemove };
