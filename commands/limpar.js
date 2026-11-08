// language: JavaScript | file: commands/limpar.js
// Limpa mensagens do canal — disponível apenas para o cargo autorizado

const { SlashCommandBuilder } = require('discord.js');

const CARGO_AUTORIZADO = '1568407635001081957';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limpar')
        .setDescription('Limpa mensagens do canal')
        .addIntegerOption(opt =>
            opt
                .setName('quantidade')
                .setDescription('Quantas mensagens apagar (máx 2000)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(2000)
        )
        .setDefaultMemberPermissions(null),  // visível para todos, cargo checado no execute
    // Visível para todos — a checagem de cargo é feita no execute
    async execute(interaction, client) {
        const temCargo = interaction.member.roles.cache.has(CARGO_AUTORIZADO);
        if (!temCargo) {
            return interaction.reply({
                content: '❌ Você não tem permissão para usar este comando.',
                ephemeral: true,
            });
        }

        const quantidade = interaction.options.getInteger('quantidade');
        const canal      = interaction.channel;

        await interaction.deferReply({ ephemeral: true });

        let deletadas = 0;
        let restante  = quantidade;

        try {
            while (restante > 0) {
                const lote    = Math.min(restante, 100); // API limita 100 por bulk
                const msgs    = await canal.messages.fetch({ limit: lote });

                if (msgs.size === 0) break;

                // bulk delete só funciona em mensagens com menos de 14 dias
                const recentes = msgs.filter(m => Date.now() - m.createdTimestamp < 12_096_000_000);
                const antigas  = msgs.filter(m => Date.now() - m.createdTimestamp >= 12_096_000_000);

                if (recentes.size > 0) {
                    const apagadas = await canal.bulkDelete(recentes, true);
                    deletadas += apagadas.size;
                }

                // mensagens antigas: apaga uma por uma (mais lento mas funciona)
                for (const msg of antigas.values()) {
                    await msg.delete().catch(() => {});
                    deletadas++;
                    await new Promise(r => setTimeout(r, 300)); // evita rate limit
                }

                restante -= msgs.size;

                // se vieram menos mensagens do que pedimos, não tem mais
                if (msgs.size < lote) break;

                await new Promise(r => setTimeout(r, 1000)); // pausa entre lotes
            }

            await interaction.editReply({
                content: `✅ **${deletadas}** mensagem(ns) apagada(s) com sucesso.`,
            });

        } catch (err) {
            console.error('[ERRO] /limpar:', err);
            await interaction.editReply({
                content: '❌ Erro ao apagar mensagens. Verifique se o bot tem permissão de **Gerenciar Mensagens** no canal.',
            });
        }
    },
};