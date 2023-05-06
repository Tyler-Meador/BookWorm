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
		await interaction.deferReply();

		const target =
			interaction.options.getString('title') ??
			'No title provided, cannot revoke';

		if (target === 'No title provided, cannot revoke') {
			await interaction.editReply({ content: `Failed to revoke: ${target}` });
			return;
		} else {
			const nominatedQuery = nominated.findOne({ _title: target });
			nominatedQuery.select('userSubmitted');

			const book = await nominatedQuery.exec();

			const userQuery = discordUser.findOne({ _user: interaction.user.id });
			userQuery.select('_user');

			const user = await userQuery.exec();

			if (book === undefined) {
				await interaction.editReply(
					'Book does not exist. Make sure your input is spelled correctly and case sensitive'
				);
				return;
			} else if (user === undefined) {
				await interaction.editReply(
					'User does not exist, please register to begin using the bot.'
				);
				return;
			} else if (book.userSubmitted !== user._user) {
				await interaction.editReply(
					'User did not nominate this book, you can only revoke books you personally have nominated.'
				);
				return;
			} else {
				await user.updateOne({ $inc: { numNominated: -1, points: 1 } });

				await book.deleteOne({ _title: target });
				await interaction.editReply({
					content: `${target} deleted, your point was returned to you.`,
				});
			}
		}
	},
};
