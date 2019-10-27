
const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let vkPageSchema = new Schema({
  communityName: String,
  postID: Number
});
module.exports = mongoose.model('VkPage', vkPageSchema );