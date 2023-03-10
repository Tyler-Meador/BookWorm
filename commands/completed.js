const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('complete')
		.setDescription('Designates you have completed the current book.'),
	async execute(interaction) {
		await interaction.reply('Thinking...');

		discordUser.find({ _user: interaction.user.id }, async (err, foundUser) => {
			if (foundUser.length === 0) {
				await interaction.editReply({
					content:
						'User not found, please submit the following command: "/register newuser"',
				});
			} else {
				let bookTitle = '';

				currentlyReading.find({}, async (err, current) => {
					if (current.length === 0) {
						await interaction.editReply(
							'A book has not yet been chosen, reach out to Tyler for assistance!'
						);
						return;
					}

					bookTitle = current[0]._title;

					await discordUser.updateOne(
						{ _user: interaction.user.id },
						{ $push: { bookCompleted: current[0]._title } }
					);

					currentlyReading.findOneAndUpdate(
						{ _title: bookTitle },
						{
							$push: { completedReaders: foundUser[0].name },
						},
						async (err, res) => {
							if (err) console.log(err);

							await interaction.editReply(
								'Your status has been set as completed! Thanks for reading!'
							);
						}
					);
				});
			}
		});
	},
};
