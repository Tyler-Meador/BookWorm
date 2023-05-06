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
			const userQuery = discordUser.findOne({ _user: interaction.user.id });
			const user = await userQuery.exec();

			if (user !== undefined) {
				interaction.reply(
					'User already exists. Creation of new user not necessary.'
				);
				return;
			}

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
					return;
				});

			if (submitted) {
				const newUser = submitted.fields.getTextInputValue('newuserInput');

				await discordUser.create({
					_user: interaction.user.id,
					name: newUser,
					points: 1,
					numNominated: 0,
					rafflesWon: 0,
				});

				await submitted.reply({
					content:
						'Your account has been created, you may now use all functions!',
				});
			}
		} else {
			await interaction.deferReply();

			const userQuery = discordUser.findOne({ _user: interaction.user.id });
			const user = await userQuery.exec();

			if (user === undefined) {
				await interaction.editReply({
					content:
						'User not found, please register a new user using "/register newuser"',
				});
				return;
			} else {
				const currentlyReadingQuery = currentlyReading.findOne({});
				currentlyReadingQuery.select('_title');

				const current = await currentlyReadingQuery.exec();

				if (current === undefined) {
					await interaction.editReply({
						content:
							'A book has not yet been chosen, reach out to Tyler for assistance!',
					});
					return;
				}

				await current.updateOne(
					{ _title: current._title },
					{
						$set: {
							[`registeredReaders.${user.name}`]: user,
						},
					}
				);

				await interaction.editReply('successfully Registered!');
			}
		}
	},
};
