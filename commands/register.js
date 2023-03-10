const {
	SlashCommandBuilder,
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js');
const { discordUser } = require('../schema/user-schema');
const { currentlyReading } = require('../schema/current-reading-schema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register for the current book!')
		.addSubcommand((subcommand) =>
			subcommand.setName('newuser').setDescription('Register as a new user')
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('current').setDescription('Register for current book!')
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'newuser') {
			const modal = new ModalBuilder()
				.setCustomId('newUserModal')
				.setTitle('Register New User!');

			const newuserInput = new TextInputBuilder()
				.setCustomId('newuserInput')
				.setLabel('Enter your name: ')
				.setStyle(TextInputStyle.Short);

			const actionRowOne = new ActionRowBuilder().addComponents(newuserInput);

			modal.addComponents(actionRowOne);

			await interaction.showModal(modal);

			const submitted = await interaction
				.awaitModalSubmit({
					time: 60000,
					filter: (i) => i.user.id === interaction.user.id,
				})
				.catch((error) => {
					console.error(error);
					return null;
				});

			if (submitted) {
				const newUser = submitted.fields.getTextInputValue('newuserInput');

				await discordUser.findOneAndUpdate(
					{
						_user: interaction.user.id,
					},
					{
						_user: interaction.user.id,
						name: newUser,
						points: 1,
						numNominated: 0,
						rafflesWon: 0,
					},
					{
						upsert: true,
					}
				);

				await submitted.reply({
					content:
						'Your account has been created, you may now use all functions!',
				});
			}
		} else {
			await interaction.reply('Thinking...');

			discordUser.find(
				{ _user: interaction.user.id },
				async (err, foundUser) => {
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

							currentlyReading.findOneAndUpdate(
								{ _title: bookTitle },
								{
									$set: {
										[`registeredReaders.${foundUser[0].name}`]: foundUser[0],
									},
								},
								{ new: true },
								async (err, res) => {
									if (err) console.log(err);

									await interaction.editReply({
										content: 'Successfully Registered!',
									});
								}
							);
						});
					}
				}
			);
		}
	},
};
