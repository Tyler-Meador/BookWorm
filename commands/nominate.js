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
		const userQuery = discordUser.findOne({ _user: interaction.user.id });
		userQuery.select('points');

		const user = await userQuery.exec();

		if (user === undefined) {
			await interaction.reply({
				content:
					'User not found, please submit the following command: "/register newuser"',
			});
			return;
		} else if (user.points === 0) {
			await interaction.reply({
				content: 'No Points available. Cannot nominate without points',
			});
			return;
		}

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

		const actionRowOne = new ActionRowBuilder().addComponents(bookTitleInput);
		const actionRowTwo = new ActionRowBuilder().addComponents(bookAuthorInput);
		const actionRowThree = new ActionRowBuilder().addComponents(bookGenreInput);
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

		const modalSubmit = await interaction
			.awaitModalSubmit({
				time: 900000,
				filter: (i) => i.user.id === interaction.user.id,
			})
			.catch(async (error) => {
				await interaction.followUp({
					content: 'Request timed out, please try again.',
				});
				return;
			});

		if (modalSubmit) {
			if (isNaN(+modalSubmit.fields.getTextInputValue('bookPageCountInput'))) {
				await modalSubmit.reply({
					content: 'Page Count must be a number! Please submit again.',
				});
				return;
			} else if (isNaN(+modalSubmit.fields.getTextInputValue('isbnInput'))) {
				await modalSubmit.reply({
					content: 'ISBN # must be a number! Please submit again.',
				});
				return;
			}

			const bookTitle = modalSubmit.fields.getTextInputValue('bookTitleInput');
			const bookAuthor =
				modalSubmit.fields.getTextInputValue('bookAuthorInput');
			const bookGenre = modalSubmit.fields.getTextInputValue('bookGenreInput');
			const bookPageCount =
				modalSubmit.fields.getTextInputValue('bookPageCountInput');
			const bookISBN = modalSubmit.fields.getTextInputValue('isbnInput');

			await nominated.create({
				_title: bookTitle,
				userSubmitted: interaction.user.id,
				author: bookAuthor,
				genre: bookGenre,
				pageCount: bookPageCount,
				isbn: bookISBN,
			});

			const libraryUpdateQuery = library.findOneAndUpdate(
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

			await libraryUpdateQuery.exec();

			await modalSubmit.reply({
				content: 'Your submission was received successfully!',
			});

			await user.updateOne({ $inc: { numNominated: 1, points: -1 } });
		}
	},
};
