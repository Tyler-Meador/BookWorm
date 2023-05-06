const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
} = require('discord.js');
const { library } = require('../schema/book-schema');
const { discordUser } = require('../schema/user-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rate')
		.setDescription('Give a book a rating')
		.addStringOption((option) =>
			option
				.setName('title')
				.setDescription('The title of the book you wish rate.')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply();

		const target =
			interaction.options.getString('title') ?? 'No title provided';

		if (target === 'No title provided') {
			await interaction.editReply({ content: `Lookup Failed: ${target}` });
			return;
		} else {
			//build and execute db query to find book
			const bookQuery = library.findOne({ _title: target });
			bookQuery.select('_title isbn author averageRating');

			const book = await bookQuery.exec();

			if (book === undefined) {
				await interaction.editReply('Book does not exist. Please try again.');
				return;
			}

			//build and execute db query to find user
			const userQuery = discordUser.findOne({ _user: interaction.user.id });
			const user = await userQuery.exec();

			const oneStar = new ButtonBuilder()
				.setCustomId('oneStar')
				.setLabel('1')
				.setStyle('Primary');

			const twoStar = new ButtonBuilder()
				.setCustomId('twoStar')
				.setLabel('2')
				.setStyle('Primary');

			const threeStar = new ButtonBuilder()
				.setCustomId('threeStar')
				.setLabel('3')
				.setStyle('Primary');

			const fourStar = new ButtonBuilder()
				.setCustomId('fourStar')
				.setLabel('4')
				.setStyle('Primary');

			const fiveStar = new ButtonBuilder()
				.setCustomId('fiveStar')
				.setLabel('5')
				.setStyle('Primary');

			const row = new ActionRowBuilder().addComponents(
				oneStar,
				twoStar,
				threeStar,
				fourStar,
				fiveStar
			);

			let ratingString = '';
			let newRating = 0;

			if (book.averageRating === undefined) {
				ratingString = 'No Ratings Recorded';
			} else {
				ratingString = book.averageRating;
				newRating = book.averageRating;
			}

			const bookEmbed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(book._title)
				.setURL('https://openlibrary.org/isbn/' + book.isbn)
				.setAuthor({ name: book.author })
				.addFields({
					name: 'Average Rating: ',
					value: ratingString.toString() + '/5',
				})
				.setImage(
					'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-M.jpg'
				);

			//reply with embed
			const response = await interaction.editReply({
				embeds: [bookEmbed],
				components: [row],
			});

			const collectorFilter = (i) => i.user.id === interaction.user.id;

			try {
				const confirmation = await response.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

				let ratingArray = [];
				ratingArray.push(
					'oneStar',
					'twoStar',
					'threeStar',
					'fourStar',
					'fiveStar'
				);

				let i = 0;
				while (ratingArray[i] !== confirmation.customId) {
					i++;
				}

				newRating = newRating === 0 ? 1 : (newRating + i + 1) / 2;

				await book.updateOne({ averageRating: newRating });

				await user.updateOne({
					$push: { userRatings: `${book._title}: ${i + 1}/5` },
				});

				await interaction.editReply({
					content: 'Your rating has been recorded.',
					components: [],
					embeds: [],
				});
			} catch (e) {
				await interaction.editReply({
					content: 'Confirmation not received within 1 minute, cancelling',
					components: [],
				});
			}
		}
	},
};
