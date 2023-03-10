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
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'nominated') {
			let bookArray = [];

			await interaction.reply('Thinking...');

			nominated.find({}, async (err, nominatedBooks) => {
				if (nominatedBooks.length === 0) {
					await interaction.editReply(
						'There are 0 books nominated... Nominate a book using "/nominate" '
					);
					return;
				}
				nominatedBooks.forEach((book) => {
					discordUser.find(
						{ _user: book.userSubmitted },
						async (err, nominatedUser) => {
							let combinedBookUser = '';
							if (nominatedUser === 0) {
								combinedBookUser =
									book._title + ' - Submitted by: User Not Found';
							}
							combinedBookUser =
								book._title + ' - Submitted by: ' + nominatedUser[0].name;
							bookArray.push(combinedBookUser);

							if (bookArray.length === nominatedBooks.length) {
								await interaction.editReply({
									content:
										'The Following Books Are Nominated: \n' +
										bookArray.join('\n'),
								});
							}
						}
					);
				});
			});
		} else if (interaction.options.getSubcommand() === 'library') {
			let bookArray = [];

			await interaction.reply('Thinking...');

			library.find({}, async (err, libraryBooks) => {
				if (libraryBooks.length === 0) {
					await interaction.editReply(
						'The library is currently empty! Please check back at a later date.'
					);
					return;
				}
				libraryBooks.forEach((book) => {
					bookArray.push(book._title);
				});
				await interaction.editReply({
					content:
						'The Library contains the following books: \n' +
						bookArray.join('\n'),
				});
			});
		} else if (interaction.options.getSubcommand() === 'current') {
			let bookArray = [];

			await interaction.reply('Thinking...');

			currentlyReading.find({}, async (err, current) => {
				if (current.length === 0) {
					await interaction.editReply(
						'A book has not yet been chosen, reach out to Tyler for assistance!'
					);
					return;
				}

				const ISBN = current[0].isbn;

				const bookEmbed = new EmbedBuilder()
					.setColor(0x0099ff)
					.setTitle(current[0]._title)
					.setURL('https://openlibrary.org/isbn/' + ISBN)
					.setAuthor({ name: current[0].author })
					.addFields({ name: 'Genre:', value: current[0].genre })
					.setImage('https://covers.openlibrary.org/b/isbn/' + ISBN + '-M.jpg');

				await interaction.editReply({ embeds: [bookEmbed] });
			});
		} else if (interaction.options.getSubcommand() === 'stats') {
			discordUser.find({ _user: interaction.user.id }, async (err, user) => {
				if (user.length === 0) {
					await interaction.reply({
						content:
							'User does not exist, please register using command "/register newuser"',
					});
					return;
				}
				await interaction.reply({
					content: `${user[0].name}\n-------\nPoints: ${
						user[0].points
					}\nBooks Nominated: ${user[0].numNominated}\nRaffles Won: ${
						user[0].rafflesWon
					}\nCompleted Books: ${user[0].bookCompleted.join(' | ')}`,
				});
			});
		} else if (interaction.options.getSubcommand() === 'registered') {
			let readerArray = [];

			await interaction.reply('Thinking...');

			currentlyReading.find({}, async (err, current) => {
				if (current.length === 0) {
					await interaction.editReply(
						'A book has not yet been chosen, reach out to Tyler for assistance!'
					);
					return;
				}

				if (current[0].registeredReaders === undefined) {
					await interaction.editReply(
						'There are no registered readers yet! use "/register to register!"'
					);
					return;
				}

				current[0].registeredReaders.forEach((reader) => {
					readerArray.push(reader.name);
				});

				await interaction.editReply({
					content:
						'The following users are reading the current book: \n' +
						readerArray.join('\n'),
				});
			});
		} else if (interaction.options.getSubcommand() === 'completed') {
			let readerArray = [];
			await interaction.reply('Thinking...');

			currentlyReading.find({}, async (err, current) => {
				if (current.length === 0) {
					await interaction.editReply(
						'A book has not yet been chosen, reach out to Tyler for assistance!'
					);
					return;
				}

				if (current[0].completedReaders.size === 0) {
					await interaction.editReply('Nobody has completed the current book.');
					return;
				}

				current[0].completedReaders.forEach((reader) => {
					readerArray.push(reader);
				});

				await interaction.editReply({
					content:
						'The following users have completed the current book: \n' +
						readerArray.join('\n'),
				});
			});
		}
	},
};
