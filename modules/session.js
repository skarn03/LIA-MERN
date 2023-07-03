const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  topic: { type: String, required: true },
  users: [{ type: mongoose.Types.ObjectId, required: true, ref: 'User' }],
  isRequesting: { type: Boolean, required: true },
  image: { type: Object }
});

module.exports = mongoose.model('Session', sessionSchema);
