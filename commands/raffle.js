const { SlashCommandBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('raffle')
		.setDescription('Choose which book to read for the month!'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.has('1071281065341223034')) {
			await interaction.reply({
				content: `Only admins can execute this command.`,
			});
			return null;
		}

		await currentlyReading.deleteMany({});

		await nominated.aggregate(
			[{ $sample: { size: 1 } }],
			async function (err, book) {
				if (book.length === 0) {
					await interaction.reply({
						content: `Cannot choose a book if there are none nominated.`,
					});
					return;
				}

				const chosenUser = book[0].userSubmitted;

				await discordUser.findOneAndUpdate(
					{ _user: chosenUser },
					{ $inc: { rafflesWon: 1 } }
				);

				const bookChosen = new currentlyReading({
					_title: book[0]._title,
					author: book[0].author,
					genre: book[0].genre,
					pageCount: book[0].pageCount,
					userSubmitted: book[0].userSubmitted,
					isbn: book[0].isbn,
				});

				const libraryBook = new library({
					_title: book[0]._title,
					author: book[0].author,
					genre: book[0].genre,
					pageCount: book[0].pageCount,
					userSubmitted: book[0].userSubmitted,
					isbn: book[0].isbn,
				});

				bookChosen.save(async (err, res) => {
					if (err) return console.log(err);
					await interaction.reply({
						content: `The Chosen book is: ${book[0]._title}`,
					});
				});

				let userIdArray = [];

				nominated.find({}, async (err, nominatedBooks) => {
					nominatedBooks.forEach((nomBook) => {
						if (chosenUser !== nomBook.userSubmitted) {
							userIdArray.push(nomBook.userSubmitted);
						}
					});

					userIdArray.forEach(async (userId) => {

						await discordUser.updateOne(
							{ _user: userId },
							{ $inc: { points: 1 } },
							{ runValidators: true }
						);
					});

					await nominated.deleteMany({});
				});
			}
		);
	},
};
