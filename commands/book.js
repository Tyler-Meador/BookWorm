const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { library } = require('../schema/book-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('book')
		.setDescription(
			'Supply a book title to fetch information related to the book.'
		)
		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('The title of the book you wish to get information on.')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply();

		const target =
			interaction.options.getString('title') ?? 'No title provided';

		if (target === 'No title provided') {
			await interaction.editReply({ content: `Lookup Failed: ${target}` });
		} else {
			//build and execute db query to find book
			const bookQuery = library.findOne({ _title: target });
			bookQuery.select(
				'userSubmitted isbn author _title genre dateChosen dateRead'
			);

			const book = await bookQuery.exec();

			//build and execute db query to find user
			const userQuery = discordUser.findOne({ _user: book.userSubmitted });
			userQuery.select('name');

			const user = await userQuery.exec();

			let read = 'Book has not been read yet.';
			let chosen = 'Book has not been chosen yet.';

			if (book.dateChosen !== undefined) {
				chosen = book.dateChosen;
			}

			if (book.dateRead !== undefined) {
				read = book.dateRead;
			}

			//construct embed
			const bookEmbed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(book._title)
				.setURL('https://openlibrary.org/isbn/' + book.isbn)
				.setAuthor({ name: book.author })
				.addFields(
					{ name: 'Submitted By:', value: user.name },
					{ name: 'Genre:', value: book.genre },
					{ name: 'Date Chosen:', value: chosen },
					{ name: 'Date Finished:', value: read }
				)
				.setImage(
					'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-M.jpg'
				);

			//reply with embed
			await interaction.editReply({
				embeds: [bookEmbed],
			});
		}
	},
};
