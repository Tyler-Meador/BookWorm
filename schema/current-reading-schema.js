const { Schema, model } = require('mongoose');
const { discordUser } = require('./user-schema.js');

const currentReadingSchema = new Schema({
	_title: {
		type: String,
		required: true,
	},
	userSubmitted: {
		type: Number,
		required: true,
	},
	author: {
		type: String,
		required: true,
	},
	genre: {
		type: String,
		required: true,
	},
	pageCount: {
		type: Number,
		required: true,
	},
	isbn: {
		type: Number,
		required: true,
	},
	registeredReaders: {
		type: Map,
		of: discordUser.schema,
	},
	completedReaders: {
		type: [String],
	},
});

const currentlyReading = model('currently-reading', currentReadingSchema);

module.exports = { currentlyReading };
