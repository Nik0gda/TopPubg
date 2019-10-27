const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let Profile = new Schema({
  id: String,
  mutes: [mongoose.SchemaTypes.Mixed],
  bans: [mongoose.SchemaTypes.Mixed],
  bansGlobal: [mongoose.Schema.Types.Mixed]
});
module.exports = mongoose.model('Report', Profile );