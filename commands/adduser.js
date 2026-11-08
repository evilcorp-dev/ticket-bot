// language: JavaScript | file: commands/adduser.js
// Adiciona um usuário ao ticket atual (apenas Staff/Owner)

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require('discord.js');
const { loadTickets } = require('../handlers/ticketHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adduser')
        .setDescription('Adiciona um usuário a este ticket')
        .setDefaultMemberPermissions(0)
        .addUserOption(opt =>
            opt
                .setName('usuario')
                .setDescription('Usuário a ser adicionado')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const isStaff = interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
        const isOwner = interaction.member.id === process.env.OWNER_ID;

        if (!isStaff && !isOwner) {
            return interaction.editReply({
                content: '❌ Apenas membros do Staff podem adicionar usuários a tickets.',
            });
        }

        const tickets = loadTickets();
        if (!tickets[interaction.channel.id]) {
            return interaction.editReply({ content: '❌ Este canal não é um ticket.' });
        }

        const target = interaction.options.getMember('usuario');
        if (!target) {
            return interaction.editReply({ content: '❌ Usuário não encontrado no servidor.' });
        }

        await interaction.channel.permissionOverwrites.edit(target.id, {
            [PermissionFlagsBits.ViewChannel]:       true,
            [PermissionFlagsBits.SendMessages]:      true,
            [PermissionFlagsBits.ReadMessageHistory]:true,
        });

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setDescription(`✅ ${target} foi adicionado ao ticket por ${interaction.member}.`)
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        return interaction.editReply({ content: `✅ ${target.user.tag} adicionado.` });
    },
};
