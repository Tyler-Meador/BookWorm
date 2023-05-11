const { SlashCommandBuilder } = require('discord.js');
const { nominated, library } = require('../schema/book-schema');
const { currentlyReading } = require('../schema/current-reading-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('raffle')
		.setDescription('Choose which book to read for the month!'),
	async execute(interaction) {
		await interaction.deferReply();

		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0');
		var yyyy = today.getFullYear();

		today = mm + '/' + dd + '/' + yyyy;

		if (!interaction.member.roles.cache.has('1071281065341223034')) {
			await interaction.editReply({
				content: `Only admins can execute this command.`,
			});
			return;
		}

		const finishBookQuery = currentlyReading.findOne({});
		finishBookQuery.select('_title');

		const finishedBook = await finishBookQuery.exec();

		const updateLibraryQuery = library.findOne({ _title: finishedBook._title });
		const libraryUpdater = await updateLibraryQuery.exec();

		if (libraryUpdater !== null) {
			await libraryUpdater.updateOne({ dateRead: today });
		}

		await currentlyReading.deleteMany({});

		const findNominatedQuery = nominated.findOne({});
		const book = await findNominatedQuery.exec();

		const chosenLibraryUpdateQuery = library.findOne({ _title: book._title });
		const chosenLibraryUpdater = await chosenLibraryUpdateQuery.exec();

		await chosenLibraryUpdater.updateOne({ dateChosen: today });

		//update chosen user
		const userQuery = discordUser.findOneAndUpdate(
			{ _user: book.userSubmitted },
			{ $inc: { rafflesWon: 1 }, points: 0 }
		);
		const user = await userQuery.exec();

		await currentlyReading.create({
			_title: book._title,
			author: book.author,
			genre: book.genre,
			pageCount: book.pageCount,
			userSubmitted: book.userSubmitted,
			isbn: book.isbn,
		});

		await interaction.editReply({
			content: `The Chosen book is: ${book._title}`,
		});

		const getAllNominated = nominated.find({});
		getAllNominated.select('userSubmitted');

		const allUsers = await getAllNominated.exec();

		const chosenIndex = allUsers.indexOf(book.userSubmitted);

		allUsers.splice(chosenIndex, 1);

		allUsers.forEach(async (userId) => {
			const updateUserQuery = discordUser.updateOne(
				{ _user: userId },
				{ $inc: { points: 1 } },
				{ runValidators: true }
			);
			await updateUserQuery.exec();
		});

		await nominated.deleteMany({});
	},
};
