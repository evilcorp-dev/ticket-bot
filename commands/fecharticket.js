// language: JavaScript | file: commands/fecharticket.js
// Fecha o ticket atual via slash command

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { loadTickets, saveTickets } = require('../handlers/ticketHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fecharticket')
        .setDescription('Fecha o ticket atual'),

    async execute(interaction, client) {
        await interaction.deferReply();

        const tickets = loadTickets();
        const ticket  = tickets[interaction.channel.id];

        if (!ticket || !ticket.open) {
            return interaction.editReply({ content: '❌ Este canal não é um ticket aberto.' });
        }

        const isStaff       = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
        const isOwner       = interaction.member.id === process.env.OWNER_ID;
        const isTicketOwner = ticket.userId === interaction.member.id;

        if (!isStaff && !isOwner && !isTicketOwner) {
            return interaction.editReply({
                content: '❌ Apenas o dono do ticket ou a equipe de suporte pode fechá-lo.',
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔒  Ticket Encerrado')
            .setDescription(
                `**Fechado por:** ${interaction.member}\n` +
                `**Ticket:** \`#${ticket.number}\`\n\n` +
                '> Este canal será deletado em **5 segundos**.'
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        tickets[interaction.channel.id].open     = false;
        tickets[interaction.channel.id].closedAt = new Date().toISOString();
        tickets[interaction.channel.id].closedBy = interaction.member.id;
        saveTickets(tickets);

        // ── Transcript ────────────────────────────────────────────────────────
        try {
            const fetched  = await interaction.channel.messages.fetch({ limit: 100 });
            const sorted   = [...fetched.values()].reverse();
            const lines    = sorted.map(m => {
                const time = new Date(m.createdTimestamp).toLocaleString('pt-BR');
                const text = m.content || (m.embeds.length ? '[embed]' : '[anexo]');
                return `[${time}] ${m.author.tag}: ${text}`;
            });

            const header = [
                `═══════════════════════════════════════`,
                `  TRANSCRIPT — Ticket #${ticket.number}`,
                `  Aberto por: ${ticket.userId}`,
                `  Fechado por: ${interaction.member.user.tag}`,
                `  Data: ${new Date().toLocaleString('pt-BR')}`,
                `═══════════════════════════════════════`,
                '',
                ...lines,
            ].join('\n');

            const transcriptEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📄  Transcript do Ticket')
                .addFields(
                    { name: '🔢 Ticket',      value: `\`#${ticket.number}\``,               inline: true },
                    { name: '👤 Aberto por',  value: `<@${ticket.userId}>`,                 inline: true },
                    { name: '🔒 Fechado por', value: `${interaction.member}`,               inline: true },
                    { name: '📅 Data',        value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
                )
                .setTimestamp();

            // PV do dono do ticket
            try {
                const ticketOwner = await client.users.fetch(ticket.userId);
                const a1 = new AttachmentBuilder(Buffer.from(header, 'utf8'), { name: `transcript-${ticket.number}.txt` });
                await ticketOwner.send({ embeds: [transcriptEmbed], files: [a1] });
            } catch { /* PV fechado */ }

            // Canal de log
            const LOG_CHANNEL_ID = process.env.TRANSCRIPT_CHANNEL_ID || '1568894632430014504';
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const a2 = new AttachmentBuilder(Buffer.from(header, 'utf8'), { name: `transcript-${ticket.number}.txt` });
                await logChannel.send({ embeds: [transcriptEmbed], files: [a2] });
            }
        } catch (err) {
            console.error('[TRANSCRIPT] Erro:', err);
        }

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    },
};
