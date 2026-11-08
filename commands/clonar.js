// language: JavaScript | file: commands/clonar.js
// Clona a estrutura de um servidor para outro

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clonar')
        .setDescription('Clona a estrutura de um servidor para outro')
        .setDefaultMemberPermissions(0),

    async execute(interaction, client) {
        const isOwner = interaction.user.id === process.env.OWNER_ID;
        if (!isOwner) {
            return interaction.reply({ content: '❌ Apenas o dono do bot pode usar este comando.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('clonar_modal')
            .setTitle('🔁 Clonar Servidor');

        const origemInput = new TextInputBuilder()
            .setCustomId('origem_id')
            .setLabel('ID do servidor de ORIGEM')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 1234567890123456789')
            .setRequired(true);

        const destinoInput = new TextInputBuilder()
            .setCustomId('destino_id')
            .setLabel('ID do servidor de DESTINO')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 9876543210987654321')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(origemInput),
            new ActionRowBuilder().addComponents(destinoInput),
        );

        await interaction.showModal(modal);
    },
};
