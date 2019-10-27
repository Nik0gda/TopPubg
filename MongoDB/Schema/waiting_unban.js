const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let Profile = new Schema({
  id: String,
  unbanned_at: Date,
  banned_by: String,
  type: String
});
module.exports = mongoose.model('Waiting', Profile );