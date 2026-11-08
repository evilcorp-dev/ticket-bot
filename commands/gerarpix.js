// language: JavaScript | file: commands/gerarpix.js
// Envia a chave PIX fixa com embed bonito no ticket

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CHAVE_PIX = 'b579efd6-412e-4fab-979e-10f47f12199a';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gerarpix')
        .setDescription('Envia a cobrança PIX no ticket')
        .setDefaultMemberPermissions(0)
        .addNumberOption(opt =>
            opt
                .setName('valor')
                .setDescription('Valor em R$ (ex: 29.90)')
                .setRequired(true)
                .setMinValue(0.01)
                .setMaxValue(10000)
        )
        .addStringOption(opt =>
            opt
                .setName('descricao')
                .setDescription('Descrição do pagamento (opcional)')
                .setRequired(false)
                .setMaxLength(100)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const valor     = interaction.options.getNumber('valor');
        const descricao = interaction.options.getString('descricao') ?? 'Pagamento via ticket';
        const valorFmt  = valor.toFixed(2).replace('.', ',');
        const geradoTs  = Math.floor(Date.now() / 1000);

        // ── Embed principal ───────────────────────────────────────────────────
        const pixEmbed = new EmbedBuilder()
            .setColor('#00B140')
            .setTitle('💸  Cobrança PIX')
            .setDescription(
                '> Copie a **chave PIX** abaixo e realize o pagamento\n' +
                '> no aplicativo do seu banco.\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '**📋 Como pagar:**\n' +
                '`1.` Abra o app do seu banco\n' +
                '`2.` Vá em **Pix → Pagar → Chave Pix**\n' +
                '`3.` Cole a chave abaixo e confirme o valor\n' +
                '`4.` Envie o **comprovante** aqui no ticket\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )
            .addFields(
                {
                    name:   '💰 Valor a pagar',
                    value:  `\`\`\`R$ ${valorFmt}\`\`\``,
                    inline: false,
                },
                {
                    name:   '📋 Descrição',
                    value:  `\`${descricao}\``,
                    inline: true,
                },
                {
                    name:   '📅 Gerado em',
                    value:  `<t:${geradoTs}:F>`,
                    inline: true,
                },
            )
            .setFooter({
                text:    `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        // ── Embed chave PIX ───────────────────────────────────────────────────
        const chaveEmbed = new EmbedBuilder()
            .setColor('#009EE3')
            .setTitle('🔑  Chave PIX')
            .setDescription(
                '**Copie a chave abaixo:**\n\n' +
                `\`\`\`\n${CHAVE_PIX}\n\`\`\`` +
                '\n> ⚡ O pagamento é identificado **instantaneamente**.\n' +
                '> Após pagar, envie o comprovante aqui no ticket.'
            )
            .addFields(
                {
                    name:   '📌 Tipo da chave',
                    value:  '`Chave Aleatória`',
                    inline: true,
                },
                {
                    name:   '✅ Status',
                    value:  '`⌛ Aguardando pagamento`',
                    inline: true,
                },
            );

        // ── Aviso para o cliente ──────────────────────────────────────────────
        const avisoEmbed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setDescription(
                '⚠️ **Atenção:** Após realizar o pagamento, envie o **comprovante** ' +
                'aqui no ticket para que possamos confirmar e liberar seu acesso.'
            );

        return interaction.editReply({
            content: `${interaction.user} — seu PIX foi gerado! 👇`,
            embeds:  [pixEmbed, chaveEmbed, avisoEmbed],
        });
    },
};
