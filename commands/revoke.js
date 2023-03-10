const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('revoke')
		.setDescription('Revoke an Item')

		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('The title of the book you wish to revoke.')
				.setRequired(true)
		),
	async execute(interaction) {
		const target =
			interaction.options.getString('title') ?? 'No title provided';

		if (target === 'No title provided') {
			await interaction.reply({ content: `Failed: ${target}` });
		} else {
			await interaction.reply('Thinking...');

			nominated.findOne({ _title: target }, async function (err, item) {
				discordUser.findOne(
					{ _user: interaction.user.id },
					async function (err2, user) {
						if (item.userSubmitted === user._user) {
							await discordUser.updateOne(
								{ _user: item.userSubmitted },
								{ $inc: { points: 1 }, $inc: { numNominated: -1 } }
							);

							await nominated.deleteOne({ _title: target });

							await interaction.editReply({
								content: `${target} deleted, your point was returned to you.`,
							});
						} else {
							await interaction.editReply(
								'User did not nominate this book, you can only revoke books you nominated'
							);
						}
					}
				);
			});
		}
	},
};
