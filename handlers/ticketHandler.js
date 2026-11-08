// language: JavaScript | file: handlers/ticketHandler.js
// Gerencia abertura, fechamento e ações de tickets

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'tickets.json');

// ─── Helpers de persistência ─────────────────────────────────────────────────
function loadTickets() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch {
        return {};
    }
}

function saveTickets(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ─── Monta permissionOverwrites ignorando IDs inválidos ──────────────────────
function buildOverwrites(guild, memberId) {
    const overrides = [
        {
            id:   guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id:    memberId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
            ],
        },
        {
            id:    guild.members.me.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageMessages,
            ],
        },
    ];

    const staffId = process.env.STAFF_ROLE_ID;
    const ownerId = process.env.OWNER_ID;

    if (staffId && staffId.match(/^\d+$/) && guild.roles.cache.has(staffId)) {
        overrides.push({
            id:    staffId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ManageMessages,
            ],
        });
    }

    if (ownerId && ownerId.match(/^\d+$/) && ownerId !== staffId) {
        overrides.push({
            id:    ownerId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels,
            ],
        });
    }

    return overrides;
}

// ─── Manipulador de botões ───────────────────────────────────────────────────
async function handleButton(interaction, client) {
    const { customId, guild, member } = interaction;

    // ── Abrir ticket ──────────────────────────────────────────────────────────
    if (customId === 'open_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const tickets = loadTickets();

        // Checar ticket já aberto
        const existing = Object.entries(tickets).find(
            ([, t]) => t.userId === member.id && t.guildId === guild.id && t.open
        );
        if (existing) {
            const ch = guild.channels.cache.get(existing[0]);
            return interaction.editReply({
                content: ch
                    ? `❌ Você já possui um ticket aberto: ${ch}`
                    : '❌ Você já tem um ticket aberto (canal removido manualmente — avise um Staff).',
            });
        }

        
        // Categoria fixa configurada no .env
        const categoryId = process.env.TICKET_CATEGORY_ID || '1568891017778827385';
        const category   = guild.channels.cache.get(categoryId);
        if (!category) {
            return interaction.editReply({ content: '❌ Categoria de tickets não encontrada. Verifique o TICKET_CATEGORY_ID no .env.' });
        }

        // Número sequencial
        const ticketNumber = String(Object.keys(tickets).length + 1).padStart(4, '0');
        const safeName     = member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
        const channelName  = `ticket-${safeName}-${ticketNumber}`;

        // Criar canal privado
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Ticket de ${member.user.tag} | ID: ${member.id} | #${ticketNumber}`,
            permissionOverwrites: buildOverwrites(guild, member.id),
        });

        // Salvar no JSON
        tickets[ticketChannel.id] = {
            userId:    member.id,
            guildId:   guild.id,
            number:    ticketNumber,
            open:      true,
            createdAt: new Date().toISOString(),
        };
        saveTickets(tickets);

        // ── Ping de staff ─────────────────────────────────────────────────────
        const staffId = process.env.STAFF_ROLE_ID;
        const ownerId = process.env.OWNER_ID;
        const staffMention = (staffId && staffId.match(/^\d+$/) && guild.roles.cache.has(staffId))
            ? `<@&${staffId}> ` : '';
        const ownerMention = (ownerId && ownerId.match(/^\d+$/))
            ? `<@${ownerId}>` : '';
        const pingContent  = `${staffMention}${ownerMention}\n> 📬 Novo ticket aberto por ${member}!`.trim();

        const pingMsg = await ticketChannel.send({ content: pingContent });
        setTimeout(() => pingMsg.delete().catch(() => {}), 8000);

        // ── Embed de boas-vindas ──────────────────────────────────────────────
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📩  Novo Ticket Aberto')
            .setDescription(
                `Olá, ${member}! Seja bem-vindo ao seu ticket de suporte.\n\n` +
                '**🔹 Como funciona:**\n' +
                '> Descreva seu problema ou dúvida com o máximo de detalhes.\n' +
                '> Nossa equipe irá te responder em breve.\n' +
                '> Seja educado e claro para um atendimento mais rápido.\n\n' +

                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                '🔒 *As mensagens são privadas — apenas você e o Staff podem ver.*'
            )
            .addFields(
                { name: '👤 Usuário',  value: `${member} (\`${member.id}\`)`,                    inline: true },
                { name: '🕐 Aberto em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`,          inline: true },
                { name: '🔢 Ticket',   value: `\`#${ticketNumber}\``,                             inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text:    `${guild.name} • Suporte`,
                iconURL: guild.iconURL({ dynamic: true }) ?? undefined,
            })
            .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('  Fechar Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('  Assumir Atendimento')
                .setEmoji('✋')
                .setStyle(ButtonStyle.Secondary),
        );

        await ticketChannel.send({ embeds: [welcomeEmbed], components: [actionRow] });

        return interaction.editReply({
            content: `✅ Ticket aberto com sucesso! → ${ticketChannel}`,
        });
    }

    // ── Fechar ticket (botão) ─────────────────────────────────────────────────
    if (customId === 'close_ticket') {
        await interaction.deferReply();

        const tickets = loadTickets();
        const ticket  = tickets[interaction.channel.id];

        if (!ticket) {
            return interaction.editReply({ content: '❌ Este canal não é um ticket válido.' });
        }

        const isStaff       = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
        const isOwner       = interaction.member.id === process.env.OWNER_ID;
        const isTicketOwner = ticket.userId === interaction.member.id;

        if (!isStaff && !isOwner && !isTicketOwner) {
            return interaction.editReply({
                content: '❌ Você não tem permissão para fechar este ticket.',
            });
        }

        const closeEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔒  Ticket Encerrado')
            .setDescription(
                `**Fechado por:** ${interaction.member}\n` +
                `**Ticket:** \`#${ticket.number}\`\n\n` +
                '> Este canal será deletado em **5 segundos**.'
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [closeEmbed] });

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
                const name = m.author.tag;
                const text = m.content || (m.embeds.length ? '[embed]' : '[anexo]');
                return `[${time}] ${name}: ${text}`;
            });

            const header = [
                `═══════════════════════════════════════`,
                `  TRANSCRIPT — Ticket #${ticket.number}`,
                `  Aberto por: <@${ticket.userId}> (${ticket.userId})`,
                `  Fechado por: ${interaction.member.user.tag}`,
                `  Data: ${new Date().toLocaleString('pt-BR')}`,
                `═══════════════════════════════════════`,
                '',
                ...lines,
            ].join('\n');

            const { AttachmentBuilder } = require('discord.js');
            const buf        = Buffer.from(header, 'utf8');
            const attachment = new AttachmentBuilder(buf, { name: `transcript-${ticket.number}.txt` });

            const transcriptEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📄  Transcript do Ticket')
                .addFields(
                    { name: '🔢 Ticket',     value: `\`#${ticket.number}\``,              inline: true },
                    { name: '👤 Aberto por', value: `<@${ticket.userId}>`,                inline: true },
                    { name: '🔒 Fechado por',value: `${interaction.member}`,              inline: true },
                    { name: '📅 Data',       value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
                )
                .setTimestamp();

            // Envia PV para quem abriu o ticket
            try {
                const ticketOwner = await client.users.fetch(ticket.userId);
                await ticketOwner.send({ embeds: [transcriptEmbed], files: [attachment] });
            } catch { /* PV fechado — ignora */ }

            // Envia no canal de log
            const LOG_CHANNEL_ID = process.env.TRANSCRIPT_CHANNEL_ID || '1568894632430014504';
            const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const buf2        = Buffer.from(header, 'utf8');
                const attachment2 = new AttachmentBuilder(buf2, { name: `transcript-${ticket.number}.txt` });
                await logChannel.send({ embeds: [transcriptEmbed], files: [attachment2] });
            }
        } catch (transcriptErr) {
            console.error('[TRANSCRIPT] Erro ao gerar transcript:', transcriptErr);
        }

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // ── Assumir ticket ────────────────────────────────────────────────────────
    if (customId === 'claim_ticket') {
        const isStaff = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
        const isOwner = interaction.member.id === process.env.OWNER_ID;

        if (!isStaff && !isOwner) {
            return interaction.reply({
                content: '❌ Apenas membros da equipe de suporte podem assumir tickets.',
                ephemeral: true,
            });
        }

        const claimEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✋  Ticket Assumido')
            .setDescription(
                `${interaction.member} está cuidando deste ticket.\n` +
                '> Aguarde, você será atendido em breve!'
            )
            .setTimestamp();

        return interaction.reply({ embeds: [claimEmbed] });
    }
}

module.exports = { handleButton, loadTickets, saveTickets };
