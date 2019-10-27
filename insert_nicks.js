
const Top_Pubg = '303793341529718784'
const auth = require('./auth.json');
const Discord = require('discord.js');
const client = new Discord.Client();
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const mongoDB = `mongodb://localhost:27017/Top_PUBG`;
mongoose.connect(mongoDB, { useUnifiedTopology: true ,useNewUrlParser: true});
const db = mongoose.connection;
const Profile = require('./MongoDB/Schema/profile')
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
client.login(auth.token);
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  sleep(5000)
fs.createReadStream('reports.csv')
  .pipe(csv())
  .on('data', async (row) => {
    let response = await Profile.findOne({
        id: row.userID
    }).exec()
    if (response == null) {
      response = await Profile.findOne({
        id: row.accused
      }).exec()
      if(response != null){
      response.report.gain_reports.push({id:row.id, userId: row.userID, accused: row.accused, reason: row.reason, nessageId: row.messageID, panel:row.logsID})
      response.save().then(res => console.log(response.id + ' case 1')).catch(err => console.log(err))
      }
      
    }else{
      response.report.gain_reports.push({id:row.id, userId: row.userID, accused: row.accused, reason: row.reason, nessageId: row.messageID, panel:row.logsID})
      response.save().then(res => console.log(response.id + ' case 2')).catch(err => console.log(err))
      }
    })
  .on('end', () => {
    console.log('CSV members file successfully processed');
  });