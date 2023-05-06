const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('complete')
		.setDescription('Designates you have completed the current book.'),
	async execute(interaction) {
		await interaction.deferReply();

		//build and execute db query to find user
		const userQuery = discordUser.findOne({ _user: interaction.user.id });
		userQuery.select('name');

		const user = await userQuery.exec();

		//build and execute db query to find current book
		const currentReadingQuery = currentlyReading.findOne({});
		currentReadingQuery.select('_title');

		const currentBook = await currentReadingQuery.exec();

		//end interaction if there is no book selected
		if (currentBook === null) {
			await interaction.editReply(
				'A book has not yet been chosen, reach out to Tyler for assistance!'
			);
			return;
		}

		//build and update user
		await user.updateOne({ $push: { bookCompleted: currentBook._title } });

		//build and update current readers
		await currentBook.updateOne({ $push: { completedReaders: user.name } });

		await interaction.editReply(
			'Your status has been set as completed!\nPlease rate the book using /rate!'
		);
	},
};
