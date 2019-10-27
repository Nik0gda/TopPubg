const mongoose = require('mongoose');

let Schema = mongoose.Schema;
let Profile = new Schema({
  serverId: mongoose.Schema.Types.Mixed,
  id: mongoose.Schema.Types.Mixed,
  username: mongoose.Schema.Types.Mixed,
  nickname: mongoose.Schema.Types.Mixed,
  previous_nicknames: [mongoose.Schema.Types.Mixed],
  premInfo: mongoose.Schema.Types.Mixed,
  stats: {
    updated: mongoose.Schema.Types.Mixed,
    inGameUsername: mongoose.Schema.Types.Mixed,
    availableUsername:mongoose.Schema.Types.Mixed,
    inGameId: mongoose.Schema.Types.Mixed,
    publicStats:mongoose.Schema.Types.Mixed,
    gllStats: mongoose.Schema.Types.Mixed,
    faceitStats:mongoose.Schema.Types.Mixed
    
  },
  report: {
    sent_reports: [mongoose.Schema.Types.Mixed],
    gain_reports: [mongoose.Schema.Types.Mixed],
    total_bans: mongoose.Schema.Types.Mixed,
    mutes: [mongoose.Schema.Types.Mixed],
    bans: [mongoose.Schema.Types.Mixed],
    bansGlobal: [mongoose.Schema.Types.Mixed]
  },
  time: mongoose.Schema.Types.Mixed,
  Coins: mongoose.Schema.Types.Mixed
});
module.exports = mongoose.model('Profile', Profile);