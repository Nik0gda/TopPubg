const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let constants = new Schema({
    season:mongoose.Schema.Types.Mixed
});
module.exports = mongoose.model('constants', constants);