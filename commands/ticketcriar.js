// language: JavaScript | file: commands/ticketcriar.js
// Envia o painel de tickets no canal atual

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketcriar')
        .setDescription('Cria o painel de tickets no canal atual')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        const panelEmbed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('🎫  Central de Atendimento')
            .setDescription(
                '**Precisa de ajuda? Estamos aqui! 👋**\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '> 📌 Abra um ticket **somente se necessário**.\n' +
                '> 🔒 Suas mensagens são **privadas** — visíveis apenas para você e o Staff.\n' +
                '> ⚡ Respondemos o mais rápido possível.\n' +
                '> 🚫 Abuso do sistema resultará em punições.\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '**📋 Categorias de suporte:**\n\n' +
                '💳 **Pagamentos** → Problemas com pagamento ou PIX\n' +
                '📦 **Pedidos** → Status, rastreio ou dúvidas sobre pedidos\n' +
                '🛠️ **Suporte Técnico** → Problemas e erros no sistema\n' +
                '❓ **Dúvidas Gerais** → Perguntas diversas\n' +
                '🤝 **Parcerias** → Propostas e colaborações\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '*⬇️ Clique no botão abaixo para abrir seu ticket.*'
            )
            .setThumbnail(guild.iconURL({ dynamic: true }) ?? null)
            .setFooter({
                text: `${guild.name} • Suporte ao Cliente`,
                iconURL: guild.iconURL({ dynamic: true }) ?? undefined,
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('  Abrir Ticket')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary),
        );

        await interaction.channel.send({
            embeds: [panelEmbed],
            components: [row],
        });

        return interaction.editReply({ content: '✅ Painel de tickets criado neste canal!' });
    },
};
