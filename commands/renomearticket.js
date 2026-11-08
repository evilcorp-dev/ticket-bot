// language: JavaScript | file: commands/renomearticket.js
// Renomeia o canal do ticket atual

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadTickets } = require('../handlers/ticketHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('renomear')
        .setDescription('Renomeia este ticket')
        .setDefaultMemberPermissions(0)
        .addStringOption(opt =>
            opt
                .setName('nome')
                .setDescription('Novo nome para o ticket')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(50)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const tickets = loadTickets();
        const ticket  = tickets[interaction.channel.id];

        if (!ticket || !ticket.open) {
            return interaction.editReply({ content: '❌ Este canal não é um ticket aberto.' });
        }

        const isStaff       = process.env.STAFF_ROLE_ID && interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
        const isOwner       = interaction.member.id === process.env.OWNER_ID;
        const isTicketOwner = ticket.userId === interaction.member.id;

        if (!isStaff && !isOwner && !isTicketOwner) {
            return interaction.editReply({ content: '❌ Apenas o dono do ticket ou o Staff pode renomeá-lo.' });
        }

        const nome     = interaction.options.getString('nome');
        const nomeSafe = nome.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'ticket';

        await interaction.channel.setName(nomeSafe);

        return interaction.editReply({ content: `✅ Ticket renomeado para \`${nomeSafe}\`.` });
    },
};
