const { Schema, model } = require('mongoose');

const userSchema = new Schema({
	_user: {
		type: Number,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	points: {
		type: Number,
		required: true,
		max: 5,
	},
	numNominated: {
		type: Number,
		required: true,
	},
	rafflesWon: {
		type: Number,
		required: true,
	},
	bookCompleted: {
		type: [String],
	},
	userRatings: {
		type: [String],
	},
});

const discordUser = model('users', userSchema);

module.exports = { discordUser };
