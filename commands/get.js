const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get')
		.setDescription('Fetch Data')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('nominated')
				.setDescription('Fetch all nominated books!')
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('library').setDescription('Fetch all read books!')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('current')
				.setDescription('Fetch the currently chosen book!')
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('stats').setDescription('See your stats!')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('registered')
				.setDescription('See who registered for the current book!')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('completed')
				.setDescription('See who has completed the current book!')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('leaderboard')
				.setDescription('See the top rated books!')
		),
	async execute(interaction) {
		await interaction.deferReply();

		if (interaction.options.getSubcommand() === 'nominated') {
			let bookArray = [];

			//build and grab list of all books nominated
			const nominatedQuery = nominated.find({});
			nominatedQuery.select('_title userSubmitted');

			const nominatedBooks = await nominatedQuery.exec();

			//return if no books nominated
			if (nominatedBooks.length === 0) {
				await interaction.editReply(
					'There are 0 books nominated... Nominate a book using "/nominate" '
				);
				return;
			}

			//cycle through all books, attach user who submitted and display string.
			nominatedBooks.forEach(async (book) => {
				const userQuery = discordUser.findOne({ _user: book.userSubmitted });
				userQuery.select('name');

				const user = await userQuery.exec();

				let nominatedString = '';
				if (user === undefined) {
					nominatedString = book._title + ' - Submitted by: User Not Found';
				} else {
					nominatedString = book._title + ' - Submitted by: ' + user.name;
					bookArray.push(nominatedString);
				}

				if (bookArray.length === nominatedBooks.length) {
					await interaction.editReply({
						content:
							'The Following Books Are Nominated: \n	- ' +
							bookArray.join('\n	- '),
					});
				}
			});
		} else if (interaction.options.getSubcommand() === 'library') {
			let bookArray = [];

			//grab all library books
			const libraryQuery = library.find({});
			libraryQuery.select('_title averageRating');

			const libraryBooks = await libraryQuery.exec();

			libraryBooks.forEach((book) => {
				let rating = '';
				if (book.averageRating === undefined) {
					rating = 'No score recorded';
				} else {
					rating = 'Average Score: ' + book.averageRating + '/5';
				}

				bookArray.push(book._title + ' | ' + rating);
			});

			await interaction.editReply({
				content:
					'The Library contains the following books: \n	- ' +
					bookArray.join('\n	- '),
			});
		} else if (interaction.options.getSubcommand() === 'current') {
			const currentQuery = currentlyReading.find({});
			currentQuery.select('isbn _title author genre userSubmitted');

			const currentBook = await currentQuery.exec();

			const userQuery = discordUser.findOne({
				_user: currentBook[0].userSubmitted,
			});
			userQuery.select('name');

			const user = await userQuery.exec();

			if (currentBook.length === 0) {
				await interaction.editReply(
					'A book has not yet been chosen, reach out to Tyler for assistance!'
				);
				return;
			} else {
				const bookEmbed = new EmbedBuilder()
					.setColor(0x0099ff)
					.setTitle(currentBook[0]._title)
					.setURL('https://openlibrary.org/isbn/' + currentBook[0].isbn)
					.setAuthor({ name: currentBook[0].author })
					.addFields(
						{ name: 'Submitted By:', value: user.name },
						{ name: 'Genre:', value: currentBook[0].genre }
					)
					.setImage(
						'https://covers.openlibrary.org/b/isbn/' +
							currentBook[0].isbn +
							'-M.jpg'
					);

				//reply with embed
				await interaction.editReply({
					embeds: [bookEmbed],
				});
			}
		} else if (interaction.options.getSubcommand() === 'stats') {
			const userQuery = discordUser.findOne({ _user: interaction.user.id });

			const user = await userQuery.exec();

			if (user === undefined) {
				await interaction.editReply({
					content:
						'User does not exist, please register using command "/register newuser"',
				});
				return;
			} else {
				await interaction.editReply({
					content: `${user.name}\n-------\nPoints: ${
						user.points
					}\nBooks Nominated: ${user.numNominated}\nRaffles Won: ${
						user.rafflesWon
					}\nCompleted Books: \n	- ${user.bookCompleted.join(
						'\n	- '
					)}\nPersonal Ratings: \n	- ${user.userRatings.join('\n	- ')}`,
				});
			}
		} else if (interaction.options.getSubcommand() === 'registered') {
			let readerArray = [];

			const currentReadingQuery = currentlyReading.findOne({});
			currentReadingQuery.select('registeredReaders');

			const current = await currentReadingQuery.exec();

			if (current === undefined) {
				await interaction.editReply(
					'A book has not yet been chosen, reach out to Tyler for assistance!'
				);
				return;
			} else if (current.registeredReaders === undefined) {
				await interaction.editReply(
					'There are no registered readers yet! use "/register to register!"'
				);
				return;
			}

			current.registeredReaders.forEach((reader) => {
				readerArray.push(reader.name);
			});

			await interaction.editReply({
				content:
					'The following users are reading the current book: \n	- ' +
					readerArray.join('\n	- '),
			});
		} else if (interaction.options.getSubcommand() === 'completed') {
			let readerArray = [];

			const currentReadingQuery = currentlyReading.findOne({});
			currentReadingQuery.select('completedReaders');

			const current = await currentReadingQuery.exec();

			if (current === undefined) {
				await interaction.editReply(
					'A book has not yet been chosen, reach out to Tyler for assistance!'
				);
				return;
			} else if (current.completedReaders.size === 0) {
				await interaction.editReply('Nobody has completed the current book.');
				return;
			}

			current.completedReaders.forEach((reader) => {
				readerArray.push(reader);
			});

			await interaction.editReply({
				content:
					'The following users have completed the current book: \n	- ' +
					readerArray.join('\n	- '),
			});
		} else if (interaction.options.getSubcommand() === 'leaderboard') {
			const libraryQuery = library
				.find({})
				.where('averageRating')
				.ne(undefined)
				.sort({ averageRating: -1 })
				.limit(10);

			const allRatings = await libraryQuery.exec();

			let leaderBoardArray = [];

			allRatings.forEach((rating) => {
				leaderBoardArray.push(
					rating._title + ': ' + rating.averageRating.toFixed(2) + '/5'
				);
			});

			await interaction.editReply({
				content:
					'The Current Top 10 Rated Books Are: \n	- ' +
					leaderBoardArray.join('\n	- '),
			});
		}
	},
};
