const { Schema, model } = require('mongoose');

const bookSchema = new Schema({
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
});

const nominated = model('nominated', bookSchema);
const library = model('library', bookSchema);

module.exports = { nominated, library };
