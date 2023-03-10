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
		const target =
			interaction.options.getString('title') ?? 'No title provided';

		if (target === 'No title provided') {
			await interaction.reply({ content: `Failed: ${target}` });
		} else {
			await interaction.reply('Thinking...');

			library.findOne({ _title: target }, async function (err, item) {
				if (item === null) {
					await interaction.editReply('Book not found');
					return;
				}
				discordUser.findOne(
					{ _user: item.userSubmitted },
					async function (err2, user) {
						if (err2) {
							interaction.editReply('Book not found');
							return;
						}

						const ISBN = item.isbn;

						const bookEmbed = new EmbedBuilder()
							.setColor(0x0099ff)
							.setTitle(item._title)
							.setURL('https://openlibrary.org/isbn/' + ISBN)
							.setAuthor({ name: item.author })
							.addFields(
								{ name: 'Submitted By:', value: user.name },
								{ name: 'Genre:', value: item.genre }
							)
							.setImage(
								'https://covers.openlibrary.org/b/isbn/' + ISBN + '-M.jpg'
							);

						await interaction.editReply({
							embeds: [bookEmbed],
						});
					}
				);
			});
		}
	},
};
