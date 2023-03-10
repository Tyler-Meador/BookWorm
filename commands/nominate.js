const {
	SlashCommandBuilder,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nominate')
		.setDescription('Nominate A Book!'),
	async execute(interaction) {
		discordUser.find({ _user: interaction.user.id }, async (err, foundUser) => {
			if (foundUser.length === 0) {
				await interaction.reply({
					content:
						'User not found, please submit the following command: "/register newuser"',
				});
			} else {
				if (foundUser[0].points === 0) {
					await interaction.reply({
						content:
							'No Points available.',
					});
					return null;
				}

				await discordUser.findOneAndUpdate(
					{ _user: interaction.user.id },
					{ $inc: { numNominated: 1 } }
				);

				// create modal
				const modal = new ModalBuilder()
					.setCustomId('nominateModal')
					.setTitle('Nominate A Book!');

				// add components to modal
				// create the text input components
				const bookTitleInput = new TextInputBuilder()
					.setCustomId('bookTitleInput')
					.setLabel('What is the title of the book?')
					.setStyle(TextInputStyle.Short)
					.setRequired(true);

				const bookAuthorInput = new TextInputBuilder()
					.setCustomId('bookAuthorInput')
					.setLabel('Who is the Author?')
					.setStyle(TextInputStyle.Short)
					.setRequired(true);

				const bookGenreInput = new TextInputBuilder()
					.setCustomId('bookGenreInput')
					.setLabel('What Genre?')
					.setStyle(TextInputStyle.Short);

				const bookPageCountInput = new TextInputBuilder()
					.setCustomId('bookPageCountInput')
					.setLabel('Page Count?')
					.setStyle(TextInputStyle.Short);

				const isbnInput = new TextInputBuilder()
					.setCustomId('isbnInput')
					.setLabel('ISBN #? (Found at: www.openlibrary.org)')
					.setStyle(TextInputStyle.Short);

				const actionRowOne = new ActionRowBuilder().addComponents(
					bookTitleInput
				);
				const actionRowTwo = new ActionRowBuilder().addComponents(
					bookAuthorInput
				);
				const actionRowThree = new ActionRowBuilder().addComponents(
					bookGenreInput
				);
				const actionRowFour = new ActionRowBuilder().addComponents(
					bookPageCountInput
				);
				const actionRowFive = new ActionRowBuilder().addComponents(isbnInput);

				modal.addComponents(
					actionRowOne,
					actionRowTwo,
					actionRowThree,
					actionRowFour,
					actionRowFive
				);

				await interaction.showModal(modal);

				const submitted = await interaction
					.awaitModalSubmit({
						time: 240000,
						filter: (i) => i.user.id === interaction.user.id,
					})
					.catch(async (error) => {
						await interaction.followUp({
							content: 'Request timed out, please try again.',
						});
						return null;
					});

				if (submitted) {
					const bookTitle =
						submitted.fields.getTextInputValue('bookTitleInput');
					const bookAuthor =
						submitted.fields.getTextInputValue('bookAuthorInput');
					const bookGenre =
						submitted.fields.getTextInputValue('bookGenreInput');

					if (
						isNaN(+submitted.fields.getTextInputValue('bookPageCountInput'))
					) {
						await submitted.reply({
							content: 'Page Count must be a number! Please submit again.',
						});
						return null;
					} else if (isNaN(+submitted.fields.getTextInputValue('isbnInput'))) {
						await submitted.reply({
							content: 'ISBN # must be a number! Please submit again.',
						});
						return null;
					}

					const bookPageCount =
						submitted.fields.getTextInputValue('bookPageCountInput');
					const bookISBN = submitted.fields.getTextInputValue('isbnInput');

					await nominated.create({
						_title: bookTitle,
						userSubmitted: interaction.user.id,
						author: bookAuthor,
						genre: bookGenre,
						pageCount: bookPageCount,
						isbn: bookISBN,
					});

					await library.findOneAndUpdate(
						{
							_title: bookTitle,
						},
						{
							_title: bookTitle,
							userSubmitted: interaction.user.id,
							author: bookAuthor,
							genre: bookGenre,
							pageCount: bookPageCount,
							isbn: bookISBN,
						},
						{
							upsert: true,
						}
					);

					await submitted.reply({
						content: 'Your submission was received successfully!',
					});

					await discordUser.updateOne(
						{ _user: interaction.user.id },
						{ $inc: { points: -1 } }
					);
				}
			}
		});
	},
};
