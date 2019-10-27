const Discord = require('discord.io');
const request = require('request'),
      Jimp    = require('jimp'),
      fs      = require('fs'),
      _       = require('lodash'),
      mysql   = require('mysql2'),
      { pluralize } = require('numeralize-ru'),
      i18     = require('./helpers/i18next.js'),
      reg     = require('./const.js'),
      gll     = require('./plugins/gll.js'),
      vars    = require('./vars.js'),
      Pubg    = require('./plugins/PubgApi.js');
      

const dbConfig = {
  connectionLimit : 4,
  host            : '176.31.56.177',
  user            : 'remote',
  password        : 'cs16Go2019DiscordzZ',
  database        : 'discord',
  supportBigNumbers  : true,
  multipleStatements : true,
};

let pool, pool2;

function handleDisconnect() {
  pool = mysql.createPool(dbConfig);
  pool2 = pool.promise();
  pool.getConnection((error, dbConnection) => {
    if (error) {
      setTimeout(handleDisconnect, 2000);
      return console.log("First ERROR db: ", error);
    }
    dbConnection.query("SELECT 1", function(err) {
      dbConnection.release();
      if (err) return console.error("Second ERROR db: ", err);
      console.log('MySQL is connected!');
    });
  });
}

handleDisconnect();

const bot = new Discord.Client({
  token: vars.token,
  autorun: true
});

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  bot.setPresence({game: {name: 'toppubg.top | !info', type: 0, url: null}});
  bot.getAllUsers();
  chMessages.initialize();
});

const allUsers = {
	date: 0,
	get() {
		const time = Date.now();
		if (time - this.date > 300000) {
			this.date = time;
			bot.getAllUsers();
			console.log(`Updating members of our server...`);
		} else {
      console.log(`allUsers -> too fast`);
    }
	}
}

const Role = {
  i: 0,
  add(userID, roleID) {
    setTimeout(()=>{
      bot.addToRole({serverID: SERVER, roleID, userID}, (err) => {
      	if (err) {
      		console.log(`Role.add() error for role: ${roleID} and user: ${userID}`);
      		console.error(err);
      	}
      });
      this.i--;
    }, this.i++*1225);
  },
  remove(userID, roleID, roleAdd) {
    setTimeout(()=>{
      bot.removeFromRole({serverID: SERVER, roleID, userID}, (err) => {
      	if (err) {
      		console.log(`Role.remove() error for role: ${roleID} and user: ${userID}`);
      		console.error(err);
      	}
      });
      this.i--;
    }, this.i++*1025);
    if (roleAdd) this.add(userID, roleAdd);
  }
};

const getStats = new Pubg(pool2, vars);

const SERVER = vars.serverID;
const ch_ids = ["361968179704102923", "361968206770077716", "361968219596259328", "361968232631894017", "361968244107771905", "361968257269366785"];
const ch_names = [10, 50, 100, 250, 500, 1000];
const ch_ids_fpp = ["367092266201907210", "367092341351383042", "367092393352364042", "367092472410537984", "367092598558687242", "367092633882984468"];
const ch_names_fpp = [10, 50, 100, 250, 500, 1000];

const VoiceParties = [], kicks = [], voiceInvites = {};

const topTiers = {
  10: '445132553465364490',
  100: '445133112935055360',
  250: '445133352534802432',
  500: '445133606365560834',
};

const chMessages = {
  count: {},
  start: {},
  check(channelID) {
    if (!this.start[channelID]) return false;
    if (this.count[channelID]) this.count[channelID]++;
    else this.count[channelID] = 1;
    if (this.count[channelID] % parseInt(this.start[channelID].num, 10) === 0) {
      return this.send(channelID);
    } else {
      return false;
    }
  },
  send(channelID) {
    setTimeout(() => {
      bot.sendMessage({ to: channelID, message: chMessages.start[channelID].msg });
    }, 3000);
  },
  initialize() {
    const z = this;
    pool.query('SELECT messages FROM auto_mess WHERE guildID = ?', SERVER, (error, results) => {
      if (error) return console.error(error);
      if (results.length > 0) {
        try {
          let obj = JSON.parse(decodeURIComponent(results[0].messages));
          z.start = obj || {};
        } catch (e) {
          return console.error(e);
        }        
      } else {
        console.log("There's no auto-messages 👌");
      }
    });
  },
  save() {
    const obj = {
      guildID: SERVER,
      messages: encodeURIComponent(JSON.stringify(this.start))
    };
    pool.query('INSERT INTO auto_mess SET ? ON DUPLICATE KEY UPDATE ?', [obj, obj], (error) => {
      if (error) return console.error(error);
    });
  }
};

function channelBans () {
  const fDate = new Date();
  for (let i = kicks.length - 1; i >= 0; i--) {
    if (fDate - kicks[i].date > 1800000) {
      if (!kicks[i].first) bot.deleteChannelPermission({channelID: kicks[i].voiceID, userID: kicks[i].banned});
      kicks.splice(i, 1);
    }
  }
}

bot.on("guildMemberAdd", member => {
  const userID = member.id;
  let suspect = "";
  if (dateFromID(userID, true) < 2592000000) {
    suspect = " :warning:";
    Role.add(userID, vars.role.suspect);
  }
  const nickName = bot.users[userID].username;
  let gameNick = (nickName).replace(/\[.*?]/, "");
  gameNick = reg.b1.exec(gameNick) || `${nickName} :octagonal_sign:`;
  setTimeout (() => {
    bot.sendMessage({to: vars.ch.logsEnterExit, message: ` :white_check_mark: <@${userID}> присоединился -> Ник в игре: **${gameNick}** [${dateFromID(userID)}]${suspect}`});
    setRole(userID);
  }, 3000);
  pool.getConnection(function(err, connection) {
    if (err) return console.log(err);
    connection.query('SELECT * FROM bans WHERE `userID` = ? AND server = 1', [userID], function (error, results) {
      connection.release();
      if (error) console.log(error);
      if (results.length > 0) {
        const date = new Date();
        if (results[0].ban && results[0].ban - date > 0)
          Role.add(userID, "381507374248361984");
        if (results[0].chatmute && results[0].chatmute - date > 0)
          Role.add(userID, "365835519915196417");
        if (results[0].voicemute && results[0].voicemute - date > 0)
          bot.mute({ serverID: SERVER, userID });
      }
    });
  });
});

bot.on('guildMemberUpdate', (oldMember, newMember) => {
  if (!oldMember || !newMember) return;
  if (oldMember.roles.length != newMember.roles.length) {
    bot._req('get', Discord.Endpoints.SERVERS(SERVER) + "/audit-logs?limit=1", function (err, res) {
      if (err) return console.log(err);
      let auditLogs = res.body.audit_log_entries;
      let msgLog, bool = true;
      if (!auditLogs) return console.log(res.body.message);
      auditLogs.forEach((item) => {
        if (item.action_type === 25 && item.user_id != bot.id && !msgLog) {
          if (item.target_id == newMember.id) {
            if (item.changes[0].key == "$add") bool = false
            msgLog  = {user_id: item.user_id, target_id: item.target_id, roleName: item.changes[0].new_value[0].name, roleID: item.changes[0].new_value[0].id};
          }
        }
      });
      if (msgLog) {
        if (bool) {
          banLogs(msgLog.roleName.toLowerCase(), msgLog);
          let action = "";
          for (let key in vars.role.action) {
            if (vars.role.action[key] == msgLog.roleID) {
              action = key;
            }
          }
          let banList = vars.ch.logs;
          if (action.includes("premium")) banList = vars.ch.premiumLogs;
          unban(action, msgLog.target_id, banList, "silent", msgLog.user_id);
        } else {
          addLogs(msgLog.roleName.toLowerCase(), msgLog);
        }
      }
    })
  }
  if (oldMember.nick != newMember.nick) {
    const userID = oldMember.id;
    const userNick = bot.users[userID].username;
    const prevNick = oldMember.nick || userNick;
    const newNick = newMember.nick || userNick;
    if (prevNick.charAt(0) === "#" || newNick.charAt(0) === "#") ;
    else {
      // setRole(userID);
      bot.sendMessage({to: vars.ch.logsEnterExit, message: ` :pencil: @**${userNick}** changed his nick from \`${prevNick}\` to \`${newNick}\``});
    }
  }
});

bot.on("guildMemberRemove", member => {
  const userID = member.id;
  const nickName = bot.users[userID].username;
  bot.sendMessage({to: vars.ch.logsEnterExit, message: ` :rage: <@${userID}> ливнул, падла -> Ник в дискорде: **${nickName}**`});
  const index = autoUpdate.users.indexOf(userID);
  if (index !== -1) autoUpdate.users.splice(index, 1);
});

bot.on("messageDelete", message => {
	const msgID = message.d.id;
	if (dateFromID(msgID, true) < 2000) return;
  pool.query('SELECT * FROM messages WHERE id = ?', msgID, function (error, results) {
    if (error) return console.log(error);
    if (results.length > 0) {
      bot._req('get', Discord.Endpoints.SERVERS(SERVER) + "/audit-logs?limit=20", function (err, res) {
        if (err) return console.log(err);
        const auditLogs = res.body.audit_log_entries;
        if (!auditLogs) return console.log(res.body.message);
        let msgLog, userID = results[0].userID, target = userID, color = 0xf1c40f;
        auditLogs.forEach((item, i) => {
          if (item.action_type === 72 && !msgLog) {
            if (item.target_id == results[0].userID)
              msgLog = {user_id: item.user_id, target_id: item.target_id};
          }
        });
        if (msgLog) {
        	userID = msgLog.user_id;
        	target = msgLog.target_id;
        	color = 0xe74c3c;
        }
        let nickName, ava, preAva;
        try {
          nickName = bot.servers[SERVER].members[userID].nick || bot.users[userID].username;
          preAva = bot.users[userID].avatar;
          if (preAva) ava = 'https://cdn.discordapp.com/avatars/' + userID + '/' + preAva + '.png';
          else ava = 'https://i.imgur.com/b6r6jtn.png';
        } catch (e) {
          nickName = userID;
          ava = 'https://i.imgur.com/b6r6jtn.png';
        }
        bot.sendMessage({to: vars.ch.spy, message: '',
          embed: {
            author: {
              name: nickName,
              icon_url: ava
            },
            color,
            description: `**Сообщение от ** <@${target}> **удалено в канале** <#${results[0].channelID}>:\n${results[0].message}`
          }
        });
      })
    }
  });
});

// function lfgHandler(userID, channelID, message) {
// 	const member = bot.servers[SERVER].members[userID];
// 	if (!member) {
// 		console.error(`Can't find a member with userID: ${userID}`);
// 		return allUsers.get();
// 	}
// 	if (message.length === 1 && message[0] === '!') message = '!!';
// 	else if (message[0] !== '!') message = '!' + message;
// 	const params = message.substring(1).split(' ');
//   const cmd = params.splice(0, 1)[0].toLowerCase();
//   let note = params.join(' ').trim();
//   if (note.length > 2) note = `\n<:vnimanie:563961425937170432> ${note}`;
//   else note = '';
//   let prem;
//   if (member.roles.includes(vars.role.premium)) prem = true;
//   const args = [userID, channelID, true, "", false, "", prem, {}];

//   if (cmd === 'event') {
//   	args[7] = {event: true};
//   }

// 	// body...
// }

bot.on('message', async function(user, userID, channelID, message, event) {
	if (event.d.author.bot || event.d.guild_id !== SERVER) return;
	if (event.d.type == 0) {
    const username = (user + "#" + event.d.author.discriminator).slice(0,30);
    let img = "";
    if (event.d.attachments[0]) {
    	const split = event.d.attachments[0].url.split("/");
			img = `[${split[split.length - 1]}] `;
    }
    const post = {id: event.d.id, server: 1, userID, username, channelID, message: (img + message).slice(0,255)}
    pool.query('INSERT IGNORE INTO messages SET ?', post, function (error) {
      if (error) console.log(error);
    });
    chMessages.check(channelID);
  }
  const messageID = event.d.id;
  const params = message.substring(1).split(' ');
  const cmd = params.splice(0, 1)[0].toLowerCase();
  const { member } = event.d;
  if (!member) return allUsers.get();
  const { roles } = member; // maybe delete la
  member.id = event.d.author.id;
  if (message === '!help') {
    return bot.sendMessage({to: channelID, message: `Извините, но на канале <#${channelID}> не предусмотрено использование служебных команд :pensive:`});
  }
  if (isStaff(member.roles)) {
    if (message.startsWith("!startmes")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let num = message.match(/\b\d{1,4}\b/);
      if (num) num = num[0];
      else return pm(userID, channelID, "После команды !startmes укажите количество сообщений :envelope:");
      let msg = message.replace(/^.+?\d{1,4} /, "");
      if (msg) {
        chMessages.start[channelID] = { msg: msg, num: num };
        pm(userID, channelID, "Автоматическая отправка сообщений начата! :timer:");
        chMessages.save();
      } else {
        pm(userID, channelID, "Вы не ввели текст сообщения! :warning:");
      }
    } else if (message.startsWith("!stopmes")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      delete chMessages.start[channelID];
      pm(userID, channelID, "Автоматическая отправка сообщений остановлена :octagonal_sign:");
      chMessages.save();
    }
  }
  if (channelID === vars.ch.premium) {
    if (isStaff(member.roles)) {
      const un = message.match(/\bun\b/i);
      const command = message.slice(0,12).match(/\b(premium|stats)\b/i);
      if (command) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let action = command[0].toLowerCase();
        let a = message.match(reg.e1);
        if (a) a = a[0];
        else return bot.sendMessage({to: channelID, message: "Укажите пользователя через @. Пример: `@Angelus#5785`"});
        let b = message.match(reg.e2);
        if (!b) b = ""; else b = b[1];
        if (un) return unban(action, a, channelID, b, userID)
        let now = Date.now();
        let hours = message.match(/\b(\d{1,3})([dhm])?\b/);
        if (hours) {
          if (hours[2] === "d") hours = hours[1]*24;
          else if (hours[2] === "m") hours = hours[1]/60;
          else hours = hours[1];
        } else {
          hours = 24;
        }
        let banTime = hours * 60 * 60000;
        let time = now + banTime;
        let zNumber, zID;
        if (action == "premium") {
          let roles = bot.servers[SERVER].members[a].roles;
          addLogs(action, {user_id: userID, target_id: a, roleID: vars.role.action[action]}, b);
          let c = message.match(/[#№](\d{1,3})/);
          if (c) {
            c = parseInt(c[1], 10);
            for (let ids in bot.servers[SERVER].roles) {
              let regExp, item = bot.servers[SERVER].roles[ids];
              if (action == "premium") regExp = /PREM \d{1,3} - свободно/i;
              if (item.name.search(regExp) != -1) {
                let number = item.name.match(/ (\d{1,3}) - свободно/i);
                if (number) {
                  number = parseInt(number[1], 10);
                  if (c === number) {
                    zNumber = number;
                    zID = item.id;
                  }
                }
              }
            }
            if (!zID) return pm(0, channelID, `К сожалению, ${action.toUpperCase()} комната №${c} не свободна :lock:`);
          }
          pool.getConnection(function(err, connection) {
            if (err) return console.log(err);
            connection.query('SELECT ?? FROM bans WHERE userID = ? AND server = 1', [action, a], function (error, results) {
              if (error) {
                connection.release();
                return console.log(error);
              }
              let fresh = true;
              if (results.length > 0) {
                let prevTime = parseInt(results[0][action], 10);
                if (prevTime) {
                  time = prevTime + banTime;
                  fresh = false;
                }
              }
              let roomNumber, freeRoom, date = new Date(time);
              if (action == "premium") {
                if (fresh) bot.addToRole({serverID: SERVER, roleID: vars.role.premium, userID: a});
                if (fresh) {
                  if (zID) {
                    freeRoom = {roleID: zID, number: zNumber};
                  } else {
                    for (let ids in bot.servers[SERVER].roles) {
                      let item = bot.servers[SERVER].roles[ids];
                      if (/Prem \d{1,3} - свободно/i.test(item.name)) {
                        let number = item.name.match(/PREM (\d{1,3})/i);
                        if (number) {
                          number = parseInt(number[1], 10);
                          if (freeRoom) {
                            if (number < freeRoom.number) freeRoom = { roleID: item.id, number: number };
                          } else {
                            freeRoom = {roleID: item.id, number: number};
                          }
                        }
                      }
                    }
                  }
                  if (freeRoom) {
                    bot.editRole({serverID: SERVER,
                      roleID: freeRoom.roleID,
                      name: `Prem ${freeRoom.number} - ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear().toString().slice(-2)}`
                    });
                    Role.add(a, freeRoom.roleID);
                    roomNumber = freeRoom.number;
                  } else {
                    return bot.sendMessage({to: channelID, message: ':warning: Нет свободных **PREM** ролей! :x:'})
                  }
                } else {
                  const { roleID, roomNumber: premRoom } = getPremRoom(roles);
                  roomNumber = premRoom;
                  if (roleID) return bot.sendMessage({to: channelID, message: `У пользователя <@${a}> отсутсвует необходимая Premium роль! :warning:`})
                  bot.editRole({
                    serverID: SERVER,
                    roleID,
                    name: `Prem ${roomNumber} - ${date.getDate()}.${date.getMonth()+1}.${date.getYear().toString().slice(-2)}`
                  });
                }
                let myMessage = `<@${a}> приобрёл Premium роль!\n\nПрисвоена личная комната: **PREM Room ${roomNumber}**\n`;
                if (!fresh) myMessage = `<@${a}> продлил **Premium** привилегии!\n\nЛичная Premium комната: **PREM Room ${roomNumber}**`;
                let embed = {
                  color: 0xf1c40f,
                  description: myMessage,
                  author: {
                    name: fresh ? 'Поздравляем нового Premium пользователя!' : 'Продление Premium подписки!',
                    icon_url: 'https://i.imgur.com/2eSWDlK.png'
                  },
                  timestamp: date,
                  thumbnail: { url: reg.prem_thumb },
                  footer: { icon_url: "https://i.imgur.com/mJXjnYW.png", text: 'Premium до:' }
                };
                bot.sendMessage({to: channelID, message: '', embed: embed});
                bot.sendMessage({to: a, embed: embed});
              }
              let post = [{server: 1, userID: a, [action]: time}, {[action]: time}];
              connection.query('INSERT INTO bans SET ? ON DUPLICATE KEY UPDATE ?', [post[0], post[1]], function (error) {
                connection.release();
                if (error) return console.log(error);
              });
            });
          });
        } else if (action === "stats") {
          addLogs(action, {user_id: userID, target_id: a, roleID: vars.role[action]}, b);
          pool.getConnection((err, connection) => {
            if (err) return console.error(err);
            connection.query("SELECT * FROM subscriptions WHERE userID = ? AND sub = 'stats' AND server = ?", [a, SERVER], function (error, results) {
              if (error) {
                connection.release();
                return console.error(error);
              }
              let fresh = true;
              if (results.length > 0) {
                let prevTime = parseInt(results[0].end, 10);
                if (prevTime) {
                  time = prevTime + banTime;
                  fresh = false;
                }
              }
              let date = new Date(time);
              if (fresh) Role.add(a, vars.role.stats);
              let myMessage = `<@${a}> приобрёл <@&${vars.role.stats}> роль!`;
              if (!fresh) myMessage = `<@${a}> продлил действие <@&${vars.role.stats}> роли!`;
              let embed = {
                color: 0x00be00,
                description: myMessage,
                author: {
                  name: fresh ? 'Поздравляем нового обладателя роли!' : 'Продление Stats подписки!',
                  icon_url: 'https://i.imgur.com/Jdphds7.png'
                },
                timestamp: date,
                thumbnail: { url: 'https://i.imgur.com/Jdphds7.png' },
                footer: { icon_url: "https://i.imgur.com/mJXjnYW.png", text: 'STATS роль до:' }
              };
              bot.sendMessage({to: channelID, embed: embed});
              bot.sendMessage({to: a, embed: embed});
              let post = [{userID: a, sub: 'stats', end: time}, {end: time}];
              connection.query('INSERT INTO subscriptions SET ? ON DUPLICATE KEY UPDATE ?', [post[0], post[1]], (error) => {
                connection.release();
                if (error) return console.error(error);
              });
            });
          });
        }
      }
    }
    if (member.roles.includes(vars.role.premium)) {
      if (message.includes("stats on")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myMessage = `Поздравляю! Вам была присвоена роль расширенной статистики :)`;
        if (roles.includes(vars.role.stats)) {
          myMessage = `У вас уже есть роль расширенной статистики :)`;
        } else {
          Role.add(userID, vars.role.stats);
        }
        pm(userID, channelID, myMessage);
      } else if (message.includes("stats off")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myMessage = `Роль расширенной статистики успешно снята :upside_down:`;
        if (roles.includes(vars.role.stats)) {
          Role.remove(userID, vars.role.stats);
        } else {
          myMessage = `У вас нет роли расширенной статистики :ok_hand:`;
        }
        pm(userID, channelID, myMessage);
      } else if (message.includes("hide on")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID, ch } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        hideMenu[voiceID] = true;
        bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, deny: [10]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Ваша комната **${ch.name}** скрыта от других пользователей :spy: `
          }
          pm(userID, channelID, "", myEmbed)
        });
      } else if (message.includes("unfriend")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        let a = message.match(reg.e1);
        if (a) a = a[0];
        else return pm(userID, channelID, "После команды укажите пользователя через @. Пример: `!unfriend @user#1234`");
        bot.editChannelPermissions({channelID: voiceID, userID: a, default: [10, 20, 21, 24]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Теперь у пользователя <@${a}> нет дополнительных привилегий`
          }
          pm(userID, channelID, "", myEmbed)
        });
      } else if (message.includes("friend")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        let a = message.match(reg.e1);
        if (a) a = a[0];
        else return pm(userID, channelID, "После команды укажите пользователя через @. Пример: `!friend @user#1234`");
        const un = /\bun\b/i.test(message);
        if (un) {
          bot.editChannelPermissions({channelID: voiceID, userID: a, default: [10, 20, 21, 24]}, (err) => {
            if (err) return console.log(err);
            let myEmbed = {
              color: 0x00cccc,
              description: `Теперь у пользователя <@${a}> нет дополнительных привилегий`
            }
            pm(userID, channelID, "", myEmbed)
          });
        } else {
          bot.editChannelPermissions({channelID: voiceID, userID: a, allow: [10, 20, 21, 24]}, (err) => {
            if (err) return console.log(err);
            let myEmbed = {
              color: 0x00cccc,
              description: `Теперь у пользователя <@${a}> есть доп. привилегий к вашей комнате :smiley:`
            }
            pm(userID, channelID, "", myEmbed)
          });
        }
      } else if (message.includes("hide off")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID, ch } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        delete hideMenu[voiceID];
        bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [10]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Ваша комната **${ch.name}** теперь видна всем пользователям :bulb:`
          }
          pm(userID, channelID, "", myEmbed);
        });
      } else if (message.includes("voice on")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID, ch } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [25]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x9b59b6,
            description: `:speaking_head: включен режим **Активация-По-Голосу** для комнаты **${ch.name}**`
          }
          pm(userID, channelID, "", myEmbed)
        });
      } else if (message.includes("voice off")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let { roomNumber, voiceID, ch } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, deny: [25]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x9b59b6,
            description: `:black_square_button: включен режим **Push-To-Talk** для комнаты **${ch.name}**`
          }
          pm(userID, channelID, "", myEmbed);
        });
      } else if (message.slice(0,4) == "!ban") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let a = message.match(reg.e1);
        if (a) {
          a = a[0];
        } else {
          let myMessage = `Укажите, пожалуйста, игрока (через @). Пример: \`!kick @Angelus#5785\``;
          return pm(userID, channelID, myMessage);
        }
        if (a != userID) banMe(userID, channelID, a);
      } else if (message.includes("un ban") || message.includes("unban")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let a = message.match(reg.e1);
        if (a) a = a[0];
        else {
          let myMessage = `Укажите, пожалуйста, игрока (через @). Пример: \`!kick @Angelus#5785\``
          return pm(userID, channelID, myMessage);
        }
        if (a != userID) unbanMe(userID, channelID, a);
      } else if (message.includes("help")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myMessage = "** Команды для  канала <#" + vars.ch.premium + ">:**\n        * `!help` - напомнить список команд\n        * `!voice on\\off` (on - активация по голосу, off - активация по кнопке) - активация микрофона по голосу;\n        * `!hide on\\off` (оn - скрыть, off - показывать) -  скрыть комнату, чтобы был вход по приглашению;\n        * `!ban @AngeIus`   `!unban @AngeIus` (ban- добавить, unban- удалить) - Добавить в ЧС (чёрный список) пользователя\n\nC ув. **Администрация.**";
        pm(userID, channelID, myMessage);
      } else if (message.slice(0, 6) == "!limit") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myNum = parseInt(message.slice(6, 10), 10);
        if (!myNum) myNum = null;
        let { roomNumber, voiceID } = getPremRoom(member);
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь VIP или Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelInfo({ channelID: voiceID, user_limit: myNum }, function(err) {
          let myMessage = `:white_check_mark: Лимит вашей комнаты успешно изменён на: **${myNum}**`;
          if (!err) pm(userID, channelID, myMessage);
        });
      } else if (cmd === "move" || cmd === "ьщму") {
        const voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
        if (!voiceID) {
          bot.deleteMessage({channelID, messageID});
          return bot.sendMessage({to: channelID, message: `Вы должны находиться в голосовой комнате, чтобы воспользоваться командой \`move\``});
        }
        if (event.d.mentions[0]) {
          const a = event.d.mentions[0].id;
          const chID = bot.servers[SERVER].members[a].voice_channel_id;
          if (!chID) return bot.sendMessage({ to: channelID, message: `Пользователь <@${a}> не находится в голосовом канале :warning:` });
          return bot.moveUserTo({serverID: SERVER, userID: a, channelID: voiceID}, function(err) {
            if (err) return console.error(err);
            bot.sendMessage({to: channelID, embed: { color: 0xe67e22, description: `<@${userID}> перекинул <@${a}> к себе в комнату <#${voiceID}>` }});
          });
        } else {
          bot.deleteMessage({channelID, messageID: event.d.id});
          bot.sendMessage({ to: channelID, message: `Укажите пользователя (через @), которого хотите переместить к себе в комнату. Пример: \`!move @fkajkeee#7431\`` });
        }
      } else if (cmd === "join" || cmd === "ощшт") {
        let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
        if (!voiceID) {
          bot.deleteMessage({ channelID, messageID: event.d.id });
          return bot.sendMessage({to: channelID, message: `Вы должны находиться в голосовой комнате, чтобы воспользоваться командой \`join\``});
        }
        let ch = params.join(' ');
        if (isNaN(ch)) {
          let chID, chID2;
          if (event.d.mentions[0]) {
            let a = event.d.mentions[0].id;
            chID = bot.servers[SERVER].members[a].voice_channel_id;
            if (!chID) return bot.sendMessage({ to: channelID, message: `Пользователь <@${a}> не находится в голосовом канале :warning:` });
            return bot.moveUserTo({serverID: SERVER, userID, channelID: chID}, function(err) {
              if (err) return console.error(err);
              bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${chID}>` }});
            });
          }
          const nameReg = new RegExp(`\\b${ch}\\b`, 'i');
          for (const channelID in bot.servers[SERVER].channels) {
            let item = bot.servers[SERVER].channels[channelID];
            if (item.type === 2 && item.name === ch) {
              chID = channelID;
              break;
            } else if (item.type === 2 && nameReg.test(item.name)) {
              chID2 = channelID;
            }
          }
          if (!chID) {
            if (!chID2) return bot.sendMessage({to: channelID, embed: { color: 0xe74c3c, description: `<@${userID}> голосовой канал с именем **${ch}** не найден!` }});
            chID = chID2;
          }
          bot.moveUserTo({serverID: SERVER, userID, channelID: chID}, function(err) {
            if (err) return console.error(err);
            bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${chID}>` }});
          });
        } else {
          bot.moveUserTo({serverID: SERVER, userID, channelID: ch}, function(err) {
            if (err) return console.error(err);
            bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${ch}>` }});
          });
        }
      }
    }
  } else if (channelID === vars.ch.premMenu) {
  	bot.deleteMessage({ channelID, messageID });
  	const member = bot.servers[SERVER].members[userID];
  	if (!member) return allUsers.get();
  	if (message[0] === '#') {
  		if (!member.roles.includes(vars.role.premiumPlus)) return pm(userID, channelID, `Вам необходимо иметь **👑Premium+** роль, чтобы пользоваться этой командой :point_up:`);
  		const hex = message.match(/[0-9a-fA-F]{6}/);
  		if (hex) {
  			const color = parseInt(hex[0], 16);
  			if (!color) return console.log(`Wrong color: ${hex[0]}`);
  			let roomNumber, voiceID, premRole;
	      member.roles.forEach((roleID) => {
	        const roleName = bot.servers[SERVER].roles[roleID].name;
	        const room = roleName.match(/PREM (\d{1,3})/i);
	        if (room) {
	        	premRole = roleID;
	          roomNumber = parseInt(room[1], 10);
	          voiceID = vars.ch.premRooms[roomNumber];
	          // ch = bot.servers[SERVER].channels[voiceID];
	        }
	      });
	      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
	      bot.editRole({ serverID: SERVER,	roleID: premRole,	color }, (err, res) => {
					if (err) return console.error(err);
					pm(null, channelID, `<@${userID}>, цвет Вашей роли <@&${premRole}> был успешно изменён!`);
				});
  		}
  	} else if (cmd === "move" || cmd === "ьщму") {
      const voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
      if (!voiceID) {
        bot.deleteMessage({channelID, messageID});
        return bot.sendMessage({to: channelID, message: `Вы должны находиться в голосовой комнате, чтобы воспользоваться командой \`move\``});
      }
      if (event.d.mentions[0]) {
        const a = event.d.mentions[0].id;
        const chID = bot.servers[SERVER].members[a].voice_channel_id;
        if (!chID) return bot.sendMessage({ to: channelID, message: `Пользователь <@${a}> не находится в голосовом канале :warning:` });
        return bot.moveUserTo({serverID: SERVER, userID: a, channelID: voiceID}, function(err) {
          if (err) return console.error(err);
          bot.sendMessage({to: channelID, embed: { color: 0xe67e22, description: `<@${userID}> перекинул <@${a}> к себе в комнату <#${voiceID}>` }});
        });
      } else {
        bot.deleteMessage({channelID, messageID: event.d.id});
        bot.sendMessage({ to: channelID, message: `Укажите пользователя (через @), которого хотите переместить к себе в комнату. Пример: \`!move @fkajkeee#7431\`` });
      }
    } else if (cmd === "join" || cmd === "ощшт") {
      let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
      if (!voiceID) {
        bot.deleteMessage({ channelID, messageID: event.d.id });
        return bot.sendMessage({to: channelID, message: `Вы должны находиться в голосовой комнате, чтобы воспользоваться командой \`join\``});
      }
      let ch = params.join(' ');
      if (isNaN(ch)) {
        let chID, chID2;
        if (event.d.mentions[0]) {
          let a = event.d.mentions[0].id;
          chID = bot.servers[SERVER].members[a].voice_channel_id;
          if (!chID) return bot.sendMessage({ to: channelID, message: `Пользователь <@${a}> не находится в голосовом канале :warning:` });
          return bot.moveUserTo({serverID: SERVER, userID, channelID: chID}, function(err) {
            if (err) return console.error(err);
            bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${chID}>` }});
          });
        }
        const nameReg = new RegExp(`\\b${ch}\\b`, 'i');
        for (const channelID in bot.servers[SERVER].channels) {
          let item = bot.servers[SERVER].channels[channelID];
          if (item.type === 2 && item.name === ch) {
            chID = channelID;
            break;
          } else if (item.type === 2 && nameReg.test(item.name)) {
            chID2 = channelID;
          }
        }
        if (!chID) {
          if (!chID2) return bot.sendMessage({to: channelID, embed: { color: 0xe74c3c, description: `<@${userID}> голосовой канал с именем **${ch}** не найден!` }});
          chID = chID2;
        }
        bot.moveUserTo({serverID: SERVER, userID, channelID: chID}, function(err) {
          if (err) return console.error(err);
          bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${chID}>` }});
        });
      } else {
        bot.moveUserTo({serverID: SERVER, userID, channelID: ch}, function(err) {
          if (err) return console.error(err);
          bot.sendMessage({to: channelID, embed: { color: 0xf1c40f, description: `<@${userID}> ворвался в <#${ch}>` }});
        });
      }
    } else if (message.includes("unfriend")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let { roomNumber, voiceID } = getPremRoom(member);
      if (!roomNumber) {
        let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
        return pm(userID, channelID, myMessage);
      }
      let a = message.match(reg.e1);
      if (a) a = a[0];
      else return pm(userID, channelID, "После команды укажите пользователя через @. Пример: `!unfriend @user#1234`");
      bot.editChannelPermissions({channelID: voiceID, userID: a, default: [10, 20, 21, 24]}, (err) => {
        if (err) return console.log(err);
        let myEmbed = {
          color: 0x00cccc,
          description: `Теперь у пользователя <@${a}> нет дополнительных привилегий`
        }
        pm(userID, channelID, "", myEmbed)
      });
    } else if (message.includes("friend")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let { roomNumber, voiceID } = getPremRoom(member);
      if (!roomNumber) {
        let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
        return pm(userID, channelID, myMessage);
      }
      let a = message.match(reg.e1);
      if (a) a = a[0];
      else return pm(userID, channelID, "После команды укажите пользователя через @. Пример: `!friend @user#1234`");
      const un = /\bun\b/i.test(message);
      if (un) {
        bot.editChannelPermissions({channelID: voiceID, userID: a, default: [10, 20, 21, 24]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Теперь у пользователя <@${a}> нет дополнительных привилегий`
          }
          pm(userID, channelID, "", myEmbed)
        });
      } else {
        bot.editChannelPermissions({channelID: voiceID, userID: a, allow: [10, 20, 21, 24]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Теперь у пользователя <@${a}> есть доп. привилегий к вашей комнате :smiley:`
          }
          pm(userID, channelID, "", myEmbed)
        });
      }
    }
  } else if (channelID === vars.ch.top_clips) {
    bot.addReaction({channelID, messageID: event.d.id, reaction: "👍"});
    setTimeout(() => bot.addReaction({channelID, messageID: event.d.id, reaction: "👎"}), 1050)
  } else if (channelID === vars.ch.report) {
  	let m = message.toLowerCase();
  	let cmd = m.slice(1).split(' ').splice(0, 1)[0];
    if (cmd === "kick") {
      // bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
      if (!voiceID) {
        bot.deleteMessage({channelID, messageID: event.d.id}); // позже удалить
        return bot.sendMessage({to: userID, message: `Вы не находитесь в голосовой комнате :raised_hand:`});
      }
      let a = message.match(reg.e1);
      let b = message.match(reg.e2);
      if (a) a = a[0];
      else {
        bot.deleteMessage({channelID, messageID: event.d.id}); // позже удалить
        return bot.sendMessage({to: userID, message: `Укажите, пожалуйста, игрока (через @). Пример: \`!kick @kyborg#1944\``});
      }
      if (b) b = "\n" + b[1]; else b = "";
      let ch = bot.servers[SERVER].channels[voiceID];
      let chMembers = Object.keys(ch.members).map(function(key) {
        return key;
      });
      if (ch.user_limit > 4 || !ch.user_limit) {
        if (ch.parent_id != "371230249398173708") return bot.sendMessage({to: userID, message: `Данная команда работает только в Squad/Duo комнатах.`});
      }
      let roles = bot.servers[SERVER].members[userID].roles;
      if (ch.parent_id === "371230249398173708") {
        if (roles.includes(vars.role.premium)) {
          let chPremiums = Object.keys(ch.permissions.user).map(function(key) {return key;});
          if (!chPremiums.includes(userID)) return bot.sendMessage({to: userID, message: `Данную команду можно использовать только находясь в своей Premium комнате :innocent:`});
          bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
            if (err) return console.log(err);
            if (voiceID === bot.servers[SERVER].members[a].voice_channel_id)
              bot.moveUserTo({serverID: SERVER, userID: a, channelID: "372491862100934658"});
          });
        } else {
          return bot.sendMessage({to: userID, message: `:no_entry_sign: Вы должны быть премиум пользователем, чтобы использовать команду в ${ch.name}`});
        }
      }
      if (voiceID != bot.servers[SERVER].members[a].voice_channel_id)
        return bot.sendMessage({to: userID, message: `Пользователь <@${a}> не находится в вашей комнате :warning: `});
      if (roles.includes(vars.role.premium)) {
        bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
          if (err) return console.log(err);
          kicks.push({userID, banned: a, voiceID, date: new Date()});
          bot.moveUserTo({serverID: SERVER, userID: a, channelID: "372491862100934658"});
          bot.sendMessage({to: channelID, message: "", embed: {
            color: 0x894ea2,
            description: `:no_pedestrians: <@${a}> был кикнут с ${ch.name} :small_blue_diamond: by <@${userID}>${b}`
          }});
        });
        return;
      }
      let j = 0;
      for (let i = kicks.length - 1; i >= 0; i--) {
        if (userID === kicks[i].userID) {
          if (kicks[i].banned === a)
            return bot.sendMessage({to: userID, message: `Вы уже отправляли жалобу на <@${a}>. Попробуйте еще раз через 30 минут.`});
          if (kicks[i].voiceID != voiceID)
            return bot.sendMessage({to: userID, message: `Вы уже использовали данную команду в другой комнате ${kicks[i].voiceID}. Попробуйте еще раз через 30 минут.`});
        }
        if (a === kicks[i].banned) j++;
      }
      if (j === 0) {
        let text = "";
        if (chMembers.length > 2) {
          chMembers.forEach(function (item){
            if (item != userID && item != a) {
              text = text + "<@" + item + ">, ";
            }
          });
          text = text.slice(0, -2) + " вы согласны кикнуть <@" + a + "> с вашей комнаты? Если да, нажмите на значок **BAN** ниже"
        }
        bot.sendMessage({to: channelID, message: text, "embed": {
          color: 0x894ea2,
          description: `<@${a}> получил 1 жалобу в ${ch.name} :small_orange_diamond: by <@${userID}>${b}`
        }}, function(err, res) {
          if (err) return console.log(err);
          kicks.push({ userID, banned: a, voiceID, date: new Date(), first: true, messageID: res.id });
          bot.addReaction({channelID, messageID: res.id, reaction: "ban:421732266616553477"}, function (err) {
            if (err) console.log(err);
          });
        });
      } else {
        bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
          if (err) return console.log(err);
          kicks.push({ userID, banned: a, voiceID, date: new Date() });
          bot.moveUserTo({serverID: SERVER, userID: a, channelID: "372491862100934658"});
          bot.sendMessage({to: channelID, message: "", "embed": {
            color: 0x894ea2,
            description: `:no_pedestrians: <@${a}> был кикнут с ${ch.name} :small_orange_diamond: by <@${userID}>${b}`
          }});
        });
        return;
      }
    } else if (cmd === 'report') {
    	if (!event.d.mentions[0]) {
    		let text = ":warning: Пожалуйста, укажите пользователя через @, на которого отправляете репорт. Пример: `!report @k1ker#5297 причина`";
    		return replyAndClear(channelID, text);
    	}
    	let a = event.d.mentions[0].id;
      let b = message.match(reg.e2);
      if (!b) {
      	let text = ":warning: Пожалуйста, укажите причину после репорта (желательно предоставив доказательства).";
    		return replyAndClear(channelID, text);
      }
      bot.addReaction({channelID, messageID, reaction: "📨"});
      // setTimeout(() => {bot.removeAllReactions({channelID, messageID})}, 180000);
      let vRoom = "";
      let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
      if (voiceID) vRoom = `[<#${voiceID}>]`;
      bot.sendMessage({to: vars.ch.report_logs, message: `<@${userID}> жалуется на <@${a}> причина: ${b[1]} @here ${vRoom}`}, function(err, res) {
        if (err) return console.error(err);
        let obj = { userID, accused: a, reason: b[1].slice(0,500), messageID, logsID: res.id};
        let index = pool.query('INSERT IGNORE INTO reports SET ?', obj, function(err) {
          if (err) console.error(err);
        });
      });
    }
    let roles = bot.servers[SERVER].members[userID].roles;
    if (roles.includes("317322435751837697") || roles.includes("365485162466770956") || roles.includes("437199859313803267")) {
    let command = message.match(/\b(voicemute|chatmute|ban|flood)\b/i);
    if (command) {
      bot.deleteMessage({ channelID, messageID: event.d.id });
      let a, b;
      a = message.match(reg.e1);
      b = message.match(reg.e2);
      if (a) {
        a = a[0];
      } else return;
      if (!b) {
        return bot.sendMessage({to: channelID, message: "<@" + userID + "> укажите, пожалуйста, причину репорта :warning: "});
      } else {
        b = b[1];
      }
      let action = command[0].toLowerCase();
      let now = new Date();
      let hours = message.match(/\b(\d{1,3})([dh])?\b/);
      if (hours) {
        if (hours[2] === "d") hours = hours[1]*24;
        else hours = hours[1];          
      } else {
        hours = 24;
      }
      let banTime = hours * 60 * 60000;
      let time = +now + banTime;
      let footerIcon = getAva(userID);
      if (hours == 999 && action === 'ban') {
        if (!bot.servers[SERVER].members[a]) return;
        let nickName = bot.servers[SERVER].members[a].nick || bot.users[a].username;
        bot.ban({serverID: SERVER, userID: a, reason: encodeURIComponent(b), lastDays: 1});
        let myMessage = "**" + nickName + "** забанен навсегда.\n\nby <@" + userID + ">: " + b;
        bot.sendMessage({to: channelID, message: '',
          embed: {
            color: 0xff1f26,
            description: myMessage,
            author: {
              name: 'Забанен!',
              icon_url: 'https://i.imgur.com/QykygCB.png'
            },
            thumbnail: { url: "https://i.imgur.com/VpzbDx0.png" },
            footer: { icon_url: footerIcon, text: 'Разбанен не будет' }
          }
        });
        return;
      }
      let post = [{server: 1, userID: a, [action]: time}, {[action]: time}];
      pool.query('INSERT INTO bans SET ? ON DUPLICATE KEY UPDATE ?', [post[0], post[1]], function (error) {
        if (error) return console.log(error);
        if (action === 'ban') {
          Role.add(a, "381507374248361984");
          let banTime = time - now;
          let myMessage = "<@" + a + "> забанен на " + sklonHours(hours) + ".\n\nby <@" + userID + ">: " + b;
          bot.sendMessage({to: channelID, message: '',
            embed: {
              color: 0xff1f26,
              description: myMessage,
              author: {
                name: 'Забанен!',
                icon_url: 'https://i.imgur.com/QykygCB.png'
              },
              timestamp: new Date(time),
              thumbnail: { url: "https://i.imgur.com/OgpizNc.png" },
              footer: { icon_url: footerIcon, text: 'Будет разбанен:' }
            }
          });
          setTimeout (() => Role.remove(a, "381507374248361984"), banTime);
        } else if (action === 'chatmute') {
          Role.add(a, "365835519915196417");
          let banTime = time - now;
          let myMessage = "<@" + a + "> отправлен в мут на " + sklonHours(hours) + ".\n\nby <@" + userID + ">: " + b;
          bot.sendMessage({to: channelID, message: '',
            embed: {
              color: 0xe67e22,
              description: myMessage,
              author: {
                name: 'Chat Mute!',
                icon_url: 'https://i.imgur.com/dDQ05tH.png'
              },
              timestamp: new Date(time),
              thumbnail: { url: "https://i.imgur.com/wEvM3In.png" },
              footer: { icon_url: footerIcon, text: 'Будет разбанен:' }
            }
          });
          setTimeout (() => Role.remove(a, "365835519915196417"), banTime);
        } else if (action === 'voicemute') {
          bot.mute({serverID: SERVER, userID: a});
          let banTime = time - now;
          let myMessage = "<@" + a + "> отправлен в мут на " + sklonHours(hours) + ".\n\nby <@" + userID + ">: " + b;
          bot.sendMessage({to: channelID, message: '',
            embed: {
              color: 0xf2e643,
              description: myMessage,
              timestamp: new Date(time),
              thumbnail: { url: "https://i.imgur.com/nXYyLHU.jpg" },
              footer: { icon_url: footerIcon, text: 'Будет разбанен:' },
              author: {
                name: 'Voice Mute!',
                icon_url: 'https://i.imgur.com/7hUR78s.png'
              }
            }
          });
          setTimeout (() => {bot.unmute({serverID: SERVER, userID: a})}, banTime);
        } else if (action === 'flood') {
          Role.add(a, "381508442537590815");
          let banTime = time - now;
          let myMessage = "<@" + a + "> будет молчать " + sklonHours(hours) + ".\n\nby <@" + userID + ">: " + b;
          bot.sendMessage({to: channelID, message: '',
            embed: {
              color: 0xe67e22,
              description: myMessage,
              author: {
                name: 'Не умеет общаться!',
                icon_url: 'https://i.imgur.com/dDQ05tH.png'
              },
              timestamp: new Date(time),
              thumbnail: { url: "http://i.imgur.com/gm0QYdG.png" },
              footer: { icon_url: footerIcon, text: 'Будет разбанен:' }
            }
          });
          setTimeout (() => Role.remove(a, "381508442537590815"), banTime);
        }
      });
    }
  }
  } else if (channelID === vars.ch.search) {
  	bot.deleteMessage({channelID: channelID, messageID: event.d.id});
    let x = message.toLowerCase();
    let y = x.substr(0,3);
    let y1 = x.substr(0,2);
    let y2 = x.substr(0,5);
    if (y2 === "event" || y2 === "!even") {
      let obj = {event: true, test: false};
      let note = "", prem = false;
      if (message.length > 8) note = "\n<:vnimanie:563961425937170432>" + message.slice(6);
      lfg (userID, channelID, false, note, false, false, prem, obj, false, event.d.id);
    }	else if (y === "tpp" || y === "ttp" || y === "!tp" || y === "езз") {
    	let roles = bot.servers[SERVER].members[userID].roles;
    	// let region = roles.includes(regions.ru) ? 'ru' : 'eu';
      let obj = {};
      if (message.search(/event|ив[еэ]нт/i) != -1) obj = {event: true, test: false};
      message = message.replace(/event/i, "");
    	let note = "", prem = false;
  		if (roles.includes(vars.role.premium)) prem = true;
      if (message.length > 6) note = "\n<:vnimanie:563961425937170432>" + message.slice(4);
      lfg (userID, channelID, false, note, false, false, prem, obj, false, event.d.id); 
    } else if (y === "fpp" || y === "ffp" || y === "!fp" || y === "азз") {
      let roles = bot.servers[SERVER].members[userID].roles;
      // let region = roles.includes(regions.ru) ? 'ru' : 'eu';
      let obj = {};
      if (message.search(/event|ив[еэ]нт/i) != -1) obj = {event: true, test: false};
      message = message.replace(/event/i, "");
    	let note = "", prem = false;
    	if (roles.includes(vars.role.premium)) prem = true;
      if (message.length > 6) note = "\n<:vnimanie:563961425937170432>" + message.slice(4);
      lfg (userID, channelID, true, note, false, false, prem, obj, false, event.d.id);
    } else if (x.startsWith("!faceit") || x.startsWith("faceit")) {
      let note = "";
      if (message.length > 10) note = "\n<:vnimanie:563961425937170432>" + message.slice(7);
      lfg (userID, channelID, true, note, false, false, false, {test: "faceit", event: false}, false, event.d.id);
    } else if (x.startsWith("!gll") || x.startsWith("gll")) {
      let note = "";
      if (message.length > 6) note = "\n<:vnimanie:563961425937170432>" + message.slice(7);
      lfg (userID, channelID, true, note, false, false, false, {test: "gll", event: false}, false, event.d.id);
    } else {
    	let add = message.length > 19 ? " ```" + message + "```" : "";
    	bot.sendMessage({to: userID, message: "В канале <#" + channelID + "> доступны только след. команды:\n:black_small_square:**!fpp**:black_small_square:**!tpp**:black_small_square:**!faceit**:black_small_square:**!gll**\nЧерез пробел, можно указать требования: `!fpp кд 2+, на победу`" + add});
    }
  }
  if (channelID != vars.ch.botStats) return;
  let lowMessage = message.toLowerCase();
  let command = lowMessage.match(/\b(update|info|stats|last|faceit|reg|regdel)\b/);
  if (command) {
    command = command[0].replace(" ", "");
    if (command === "update") {
      if (event.d.mentions[0] && isStaff(member.roles)) {
        return megaUpdate(event.d.mentions[0].id, channelID);
      }
      megaUpdate(userID, channelID);
    } else if (command === "info") {
      let serverLevel = 0;
      let money = 0;
      let mins = 0;
      const [[results]] = await pool2.query(`SELECT * from time WHERE userID = ? AND id = ?`, [userID, SERVER]);
      if (results) {
        mins = results.mins;
        money = results.mins + results.money;
      }
      giveUniqRole(userID, undefined, mins, vars.serverLevel, false);
      const keys = Object.keys(vars.serverLevel);
      for (let i = 0; i < keys.length; i++) {
        if (mins >= keys[i]) {
          serverLevel = i;
        } else {
          break;
        }
      }
      const embed = {
        description: `  <:player:563454876441378825> **Пользователь** <@${userID}>\n  <:serverLevel:568477902367358977> **Server Level** [${serverLevel}]\n  <:gold_per_min:457307640322588672> **Баланс**: ${money}`,
        thumbnail: {
          url: getAva(userID)
        },
        image: {
          url: "https://i.imgur.com/1CaBbxC.png"
        },
        author: {
          name: `Личное дело №${event.d.author.discriminator}`,
          "icon_url": vars.img.footer
        },
        timestamp: new Date(),
        footer: {
          text: `♻ Обновлено:`
        },
      };
      bot.sendMessage({ to: channelID, embed }, e => e ? console.error(e) : 0 );
      // let arr = ["r0of3r", "n0fun", "ToT_CaMblu_D3n", "houstonrdy", "MarKelo"];
      // let rand = Math.floor(Math.random() * arr.length);
      // bot.sendMessage({to: channelID, message: `<@${userID}>, ` + "чтобы получить/обновить роль, воспользуйтесь командой: `!update` (**ник в дискорде должен совпадать с игровым**; учитывается только Duo и Squad статистика.\n :small_blue_diamond: Для получения общей статистики команда: `!stats`. Дополнительно можно указать ник игрока (если не указывать, будет показана Ваша статистика)\n :small_blue_diamond: Для получения детальной статистики определенного режима, просто напишите этот режим в чат: `!solo-fpp` или любой другой [`solo`, `duo`, `squad`, `solo-fpp`, `duo-fpp`, `squad-fpp`].\n :small_orange_diamond: Любые предложения/замечания отправляйте в ЛС <@226360808077131777> :incoming_envelope:"});
    } else if (command === "reg") {
      const nickName = pubgName(message.slice(4));
      if (!nickName) bot.sendMessage({to: channelID, message: "<@" + userID + ">, некорректно указан никнейм :warning: После команды **!reg** указывайте никнейм как в игре."});
      getStats.registration(nickName).then(() => {
        const obj = { serverID: SERVER, userID: userID, pubg: nickName };
        pool2.query(`INSERT into registrations SET ? ON DUPLICATE KEY UPDATE ?`, [obj, obj]);
        bot.sendMessage({to: channelID, embed: {
          // color: 0xf1c40f,
          description: `**Ув. <@${userID}>**\n\nВы успешно прошли регистрацию на сервере как:\n<:PUBG:564375036954279946> [**${nickName}**](https://pubg.op.gg/user/${nickName})!`,
          thumbnail: {
            url: "https://i.imgur.com/9QlHgUa.gif"
          },
          timestamp: new Date(),
          footer: {
            text: `Регистрация`
          },
        }});
        faceit(nickName, true);
      }).catch(e => {
        console.log(e);
        bot.sendMessage({to: channelID, message: `<@${userID}>, игрок с ником **${nickName}** не найден :disappointed_relieved: Проверьте правильность написания`});
      });
    } else if (command === 'faceit') {
      let nickname = pubgName(message.replace("faceit", ""));
      if (!nickname) nickname = await getPubgName(userID);
      if (!nickname) return bot.sendMessage({to: channelID, message: `<@${userID}>, укажите правильный ник (как в PUBG) после команды !faceit, либо пройдите регистрацию :warning:`});
      bot.simulateTyping(channelID);
      faceit(nickname).then((obj, onRejected) => {
        if (!obj || onRejected) return bot.sendMessage({to: channelID, message: `<@${userID}>, нет данных FACEIT для игрока **${nickname}**. Указывайте ник, как в PUBG :warning:`});
        faceitIMG(obj).then((file) => {
          file.to = channelID;
          bot.uploadFile(file);
        }).catch(err => {
          console.error(err);
          bot.sendMessage({to: channelID, message: err});
        });
      });
    } else if (command === "last") {
      let b0 = lowMessage.replace(/\b(last)\b/gi, "");
      let nickname = reg.b1.exec(b0);
      if (nickname) {
        nickname = nickname[0];
      } else {
        nickname = await getPubgName(userID);
      }
      getStats.lastGames(nickname).then(data => {
        bot.sendMessage({to: channelID, embed: data.embed});
      }).catch(e => {
        if (typeof e === 'string' && channelID) bot.sendMessage({to: channelID, message: e});
        else if (channelID) bot.sendMessage({to: channelID, message: e.message});
        else if (e instanceof Error) console.error(e);
      })
    } else if (command === 'stats') {
      if (event.d.mentions[0]) {
        return megaStats(event.d.mentions[0].id, channelID);
      }
      const nickname = pubgName(message.replace("stats", ""));
      megaStats(userID, channelID, nickname);
    } else if (command === 'regdel') {
      if (isStaff(member.roles)) {
        const mention = event.d.mentions[0];
        if (mention) {
          pool2.query(`DELETE FROM registration WHERE serverID = ? AND userID = ? `, [SERVER, mention.id]);
          bot.sendMessage({to: channelID, message: `Регистрация аккаунта ${mention.id} обнулена`});
        } else {
          bot.sendMessage({to: channelID, message: 'После команды **!regdel** укажите пользователя через @ :warning:'});
        }
      }
    }
  } else {
    bot.addReaction({channelID, messageID, reaction: "🚫"});
    setTimeout(() => bot.deleteMessage({ channelID, messageID }), 15000);
  }
});

bot.on('disconnect', (errMsg, code) => {
  console.error(`Disconnected [${code}]. errMsg: ${errMsg}`);
  if (errMsg && errMsg.includes("429")) {
    setTimeout(()=>bot.connect(), 65000);
  } else {
    setTimeout(()=>bot.connect(), 10250);
  }
});

setInterval(()=>autoUpdate.botWork(), 15125);

setInterval(() => {
  bot.sendMessage({to: vars.ch.botStats, message: "", embed: {
    "description": "Таблица игроков: <http://toppubg.top/>"
  }});
}, 14400000);

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/[ft]pp/i, function (match) {
    return match.toUpperCase();
  });
}

function getTier(rating) {
  let tier;
  for (const key in vars.tierList) {
    if (rating >= key) tier = vars.tierList[key];
    else break;
  }
  return tier;
}

async function megaUpdate (userID, channelID) {
  const nickname = await getPubgName(userID);
  if (!nickname) {
    return bot.sendMessage({to: channelID, message: `<@${userID}>, некорректный никнэйм :warning: Зарегистрируйтесь с помощью команды \`!reg ВашPubgНик\``});
  }
  const promises = [getStats.getPlace(nickname), faceit(nickname), gll(nickname, pool2)];
  const [pubgStats, faceitStats, gllStats] = await Promise.all(promises.map(p => p.catch((e) => { console.error(e); return null })));
  // <:nick:563463703861919754> Nickname: [**${nickname}**](https://pubg.op.gg/user/${nickname})
  const embed = {
    description: `<:player:563454876441378825> Пользователь: <@${userID}>\n`,
    fields: [],
    thumbnail: {
      url: getAva(userID)
    },
    image: {
      url: "https://i.imgur.com/1CaBbxC.png"
    },
    timestamp: new Date(),
    footer: {
      text: `♻ Обновлено:`
    },
  };
  // console.log(`nickname: ${nickname}`);
  // console.log(`pubg: `, pubgStats);
  // console.log(`faceit: `, faceitStats);
  // console.log(`gll: `, gllStats);
  if (pubgStats && typeof pubgStats === "object") {
    const { kdTpp, kdFpp, adrTpp, adrFpp, info } = pubgStats;
    const icon = giveUniqRole(undefined, undefined, info.rating, vars.emojiRating, "icon");
    const discordNickname = pubgName(userID);
    const add = discordNickname == nickname ? '<:verified:563822684186738690>' : '';
    embed.fields.push({
      name: `<:PUBG:564375036954279946> PUBG (${info.mode})`,
      inline: true,
      value: `**Nickname:** [${nickname}](https://pubg.op.gg/user/${nickname})${add}\n${icon.roleID || '<:tier:564074474362765315>'}**Rank:** ${info.tier}\n<:elo:573245802269638686>**Elo:** ${info.rating}\n<:KD:563087403410128951>**K/D:** ${info.kd}\n<:ADR:563094124010405898>**ADR:** ${info.adr}\n<:plane:563447674368688128>**Matches:** ${info.matches}`
    });
    giveUniqRole(userID, undefined, kdTpp, vars.tppKD, false);
  	giveUniqRole(userID, undefined, kdFpp, vars.fppKD, false);
  	giveUniqRole(userID, undefined, adrTpp, vars.tppADR, false);
    giveUniqRole(userID, undefined, adrFpp, vars.fppADR, false);
    giveUniqRole(userID, undefined, info.rating, vars.ratingRoles, false);
  }
  if (gllStats) {
    embed.fields.push({
      name: `<:gll:564378907080392743> GLL`,
      inline: true,
      value: `**Nickname:** ${nickname}\n<:KD:563087403410128951>**K/D:** ${gllStats.kd}\n<:ADR:563094124010405898>**ADR:** ${gllStats.adr}\n<:Avg_Rank:563959519936249887>**Top5:** ${gllStats.top5}% [${gllStats.matches}]`
    });
    giveUniqRole(userID, undefined, gllStats.kd, vars.gllKD, false);
    giveUniqRole(userID, undefined, gllStats.adr, vars.gllADR, false);
  }
  if (faceitStats) {
    embed.fields.push({
      name: `<:faceit:564377863973896192> Faceit`,
      inline: true,
      value: `**Nickname:** [${faceitStats.nick}](https://www.faceit.com/en/players/${faceitStats.nick})\n${vars.emoji['skill' + faceitStats.skill]}**Rank:** ${faceitStats.skill} lvl\n<:elo:573245802269638686>**Elo:** ${faceitStats.elo}\n<:KD:563087403410128951>**K/D:** ${faceitStats.kd}\n<:ADR:563094124010405898>**ADR:** ${faceitStats.adr}\n<:Avg_Rank:563959519936249887>**AVG Rank:** ${faceitStats.rank_avg} [${faceitStats.matches}]`
    });
    giveUniqRole(userID, undefined, faceitStats.kd, vars.faceitKD, false);
    giveUniqRole(userID, undefined, faceitStats.adr, vars.faceitADR, false);
    giveUniqRole(userID, undefined, faceitStats.skill, vars.role.elo, false);
  }
  bot.sendMessage({ to: channelID, embed });
};

function pubgTemplate(mode, info) {
  if (info) {
    const icon = giveUniqRole(undefined, undefined, info.rating, vars.emojiRating, "icon");
    return {
      name: ` :black_small_square: ${mode}`,
      inline: true,
      value: `${icon.roleID || '<:tier:564074474362765315>'} **Rank:** ${getTier(info.rating)}\n<:elo:573245802269638686>**Elo:** ${info.rating}\n<:KD:563087403410128951>**K/D:** ${info.kd}\n<:ADR:563094124010405898>**ADR:** ${info.adr}\n<:plane:563447674368688128>**Matches:** ${info.matches}`
    };
  }
  return {
    name: ` :black_small_square: ${mode}`,
    inline: true,
    value: `<:tier:564074474362765315>**Rank:** 0\n<:elo:573245802269638686>**Elo:** 0\n<:KD:563087403410128951>**K/D:** 0\n<:ADR:563094124010405898>**ADR:** 0\n<:plane:563447674368688128>**Matches:** 0`
  }
}

function lastUpdate(array) {
  let date = array.find(x => x.date);
  return date ? date.date : new Date();
}

const megaStatsID = {};

async function megaStats (userID, channelID, nickname) {
  if (!nickname) {
    nickname = await getPubgName(userID);
    if (!nickname) {
      return bot.sendMessage({to: channelID, message: `<@${userID}>, некорректный никнэйм :warning: Зарегистрируйтесь с помощью команды \`!reg ВашPubgНик\``});
    }
  }
  const connection = await pool2.getConnection();
  const season = +vars.SEASON.slice(-2);
  const promises = [connection.query(`SELECT * from s${season} WHERE name = ?`, nickname), connection.query(`SELECT * from gll WHERE name = ?`, nickname), connection.query(`SELECT * from faceit WHERE nickname = ?`, nickname)];
  const [[pubgStats], [gllStats], [faceitStats]] = await Promise.all(promises.map(p => p.catch(() => [[]])));
  connection.release();
  const gll = gllStats[0] || { kd: 0, adr: 0, top5: 0, matches: 0 };
  const faceit = faceitStats[0] || { nick: 0, skill: 0, elo: 0, kd: 0, adr: 0, rank_avg: 0, matches: 0 };
  const data = {
    fpp: {
      fields: [
        // pubgTemplate('Solo-FPP', pubgStats.find(x => x.mode === 'solofpp')),
        pubgTemplate('Duo-FPP', pubgStats.find(x => x.mode === 'duofpp')),
        pubgTemplate('Squad-FPP', pubgStats.find(x => x.mode === 'squadfpp')),
      ],
      timestamp: lastUpdate(pubgStats),
    },
    tpp: {
      fields: [
        // pubgTemplate('Solo-TPP', pubgStats.find(x => x.mode === 'solo')),
        pubgTemplate('Duo-TPP', pubgStats.find(x => x.mode === 'duo')),
        pubgTemplate('Squad-TPP', pubgStats.find(x => x.mode === 'squad')),
      ],
      timestamp: lastUpdate(pubgStats),
    },
    gll: {
      fields: [{
        name: `<:gll:564378907080392743> GLL`,
        inline: true,
        value: `<:KD:563087403410128951>**K/D:** ${gll.kd}\n<:ADR:563094124010405898>**ADR:** ${gll.adr}\n<:Avg_Rank:563959519936249887>**Top5:** ${gll.top5}% [${gll.matches}]`
      }],
      timestamp: lastUpdate(gllStats),
    },
    faceit: {
      fields: [{
        name: `<:faceit:564377863973896192> Faceit`,
        inline: true,
        value: `**Nickname:** [${faceit.nick}](https://www.faceit.com/en/players/${faceit.nick})\n${vars.emoji['skill' + faceit.skill]}**Rank:** ${faceit.skill} lvl\n<:elo:573245802269638686>**Elo:** ${faceit.elo}\n<:KD:563087403410128951>**K/D:** ${faceit.kd}\n<:ADR:563094124010405898>**ADR:** ${faceit.adr}\n<:Avg_Rank:563959519936249887>**AVG Rank:** ${faceit.rank_avg} [${faceit.matches}]`
      }],
      timestamp: lastUpdate(faceitStats),
    },
    embed: {
      description: `<:player:563454876441378825> Пользователь: <@${userID}>\n<:nick:563463703861919754> Nickname: [**${nickname}**](https://pubg.op.gg/user/${nickname})`,
      thumbnail: {
        url: 'https://i.imgur.com/WA6dLq4.gif'
      },
      image: {
        url: "https://i.imgur.com/1CaBbxC.png"
      },
      footer: {
        text: `♻ Обновлено:`
      },
    }
  };
  const { embed } = data;
  embed.fields = data.fpp.fields;
  embed.timestamp = data.fpp.timestamp;

  bot.sendMessage({ to: channelID, embed }, (err, res) => {
    if (err) return console.error(err);
    megaStatsID[res.id] = { data, time: Date.now() };
    ['FPP:567081951182192660', 'TPP:567082478062403609', 'gll:564378907080392743', 'faceit:564377863973896192'].forEach((reaction, i) => {
      setTimeout(() => bot.addReaction({ channelID, messageID: res.id, reaction }), i*525);
    });
    for (const key in megaStatsID) {
      if (megaStatsID[key].time - Date.now() > 3600000) {
        delete megaStatsID[key];
      }
    }
  });
}

async function autoReg(userID, channelID) {
  serverRole(userID);
  let nickname = await getPubgName(userID);
  if (!nickname) {
    nickname = pubgName(userID);
    if (nickname) {
      getStats.registration(nickname).then(() => {
        const obj = { serverID: SERVER, userID: userID, pubg: nickname };
        pool2.query(`INSERT into registrations SET ? ON DUPLICATE KEY UPDATE ?`, [obj, obj]);
        bot.sendMessage({to: userID, embed: {
          // color: 0xf1c40f,
          description: `**Ув. <@${userID}>**\n\nВы успешно прошли регистрацию на сервере как:\n<:PUBG:564375036954279946> [**${nickname}**](https://pubg.op.gg/user/${nickname})!\n\n*Если это не Вы, введите корректные данные в канале <#${vars.ch.botStats}>*`,
          thumbnail: {
            url: "https://i.imgur.com/9QlHgUa.gif"
          },
          timestamp: new Date(),
          footer: {
            text: `Регистрация`
          },
        }});
        faceit(nickname, true);
      }).catch(console.error);
    }
  } else {
    if (nickname === pubgName(userID)) {
      const member = bot.servers[SERVER] && bot.servers[SERVER].members[userID];
      if (member && !member.roles.includes(vars.role.verified)) {
        Role.add(userID, vars.role.verified);
      }
    }
    setRole(userID);
  }
}

async function serverRole(userID) {
  const [results] = await pool2.query(`SELECT mins from time WHERE userID = ? AND id = ?`, [userID, SERVER]);
  if (results[0] && results[0].mins) {
    giveUniqRole(userID, undefined, results[0].mins, vars.serverLevel, false);
  } else {
    giveUniqRole(userID, undefined, 0, vars.serverLevel, false);
  }
}

async function setRole (userID, channelID) {
	let nickname = await getPubgName(userID);
	gll(nickname, pool2).then(data => {
    if (data) {
      giveUniqRole(userID, undefined, data.kd, vars.gllKD, false);
      giveUniqRole(userID, undefined, data.adr, vars.gllADR, false);
    }
  });
	getStats.getPlace(nickname).then(({ rankTpp, rankFpp, kdTpp, kdFpp, adrTpp, adrFpp, info = {} }) => {
		if (channelID) {
      faceit(nickname).then(obj => {
        if (!obj) return giveUniqRole(userID, undefined, -1, vars.role.elo, false);
        bot.sendMessage({to: channelID, embed: {
          color: 0xff560f,
          description: `[${vars.emoji['skill' + obj.skill]}](https://www.faceit.com/en/players/${obj.nick}/stats/pubg) [**${obj.nickname}**](https://pubg.op.gg/user/${obj.nickname}):black_small_square:Elo: **${obj.elo}**, Avg Rank: **${obj.rank_avg}** [${obj.matches} games], KD: **${obj.kd}**, ADR: **${obj.adr}**`
        }});
        giveUniqRole(userID, undefined, obj.skill, vars.role.elo, false);
        giveUniqRole(userID, undefined, obj.kd, vars.faceitKD, false);
        giveUniqRole(userID, undefined, obj.adr, vars.faceitADR, false);
      }).catch(e => giveUniqRole(userID, undefined, -1, vars.role.elo, false));
    } else {
      faceit(nickname).then(obj => {
      	if (!obj) return giveUniqRole(userID, undefined, -1, vars.role.elo, false);
        giveUniqRole(userID, undefined, obj.skill, vars.role.elo, false);
        giveUniqRole(userID, undefined, obj.kd, vars.faceitKD, false);
        giveUniqRole(userID, undefined, obj.adr, vars.faceitADR, false);
      }).catch(e => giveUniqRole(userID, undefined, -1, vars.role.elo, false));
    }
    giveUniqRole(userID, undefined, kdTpp, vars.tppKD, false);
  	giveUniqRole(userID, undefined, kdFpp, vars.fppKD, false);
  	giveUniqRole(userID, undefined, adrTpp, vars.tppADR, false);
  	giveUniqRole(userID, undefined, adrFpp, vars.fppADR, false);

		if (!rankFpp && channelID) return bot.sendMessage({to: channelID, message: "<@" + userID + ">, готово! Учтите, чтобы получить роли, необходимо сыграть как минимум 10 игр в сквадах или дуо [!info]."});

		const place = giveUniqRole(userID, undefined, rankFpp, vars.ratingRoles, false);
		if (channelID) {
			let n = `\n**Режим:** ${info.mode}, **Рейтинг:** ${info.rating}, **Звание:** ${info.tier}, **K/D:** ${info.kd}`;
			bot.sendMessage({to: channelID, message: place.text + n});
		}
	}).catch(e => {
		if (typeof e === 'string' && channelID) bot.sendMessage({to: channelID, message: e});
		else if (channelID) bot.sendMessage({to: channelID, message: e.message});
		else if (e instanceof Error) console.error(e);
	})
}

const autoUpdate = {
  on: true,
  date: Date.now(),
  bigDate: Date.now(),
  users: [],
  done: [],
  getUsers() {
    if (!bot.servers[SERVER]) {
      if (Math.random() < 0.1) throw new Error('RESTART THE APP!');
      else return console.log("SERVER isn't loaded");
    }
    let online = [];
    for (let ids in bot.servers[SERVER].members) {
    	this.users.push(ids);
    	if (bot.servers[SERVER].members[ids].voice_channel_id) online.push(ids);
    }
    this.users = _.shuffle(this.users);
    this.users = online.concat(this.users);
  },
  botWork() {
  	const fDate = Date.now();
    if (fDate - this.date > 55000) {
    	if (!bot.servers[SERVER]) {
	      if (Math.random() < 0.1) throw new Error('RESTART THE APP!');
	      else return console.log("SERVER isn't loaded");
	    }
      this.date = fDate;
      channelBans();
      bans();
    } else if (fDate - this.bigDate > 14400000) {
    	this.bigDate = fDate;
    	this.done = [];
    }
    if (!this.on) return;
    const userID = this.users.pop();
    if (this.users.length === 5) allUsers.get();
    if (userID) {
      if (this.users.length % 50 === 0) console.log("bot is working [" + this.users.length + "]: " + userID);
      autoReg(userID);
    } else {
      console.log("bot crashed -> getUsers first");
      this.getUsers();
    }
  },
  join(vChannel) {
    let voiceMembers = 0;
    for (const voiceID in bot.servers[SERVER].channels) {
      const ch = bot.servers[SERVER].channels[voiceID];
      if (ch.type === 2) {
        voiceMembers += Object.keys(ch.members).length;
      }
    }
    if (this.voiceMembers !== voiceMembers) {
      this.voiceMembers = voiceMembers;
      bot.editChannelInfo({
        channelID: vars.ch.voiceMembersCounter,
        name: `• В войсах: ${voiceMembers}`,
      });
    }
    if (!this.on) return;
    const userID = vChannel.d.user_id;
    if (vChannel.d.guild_id !== SERVER) return console.error("Wrong GUILD");
    if (this.done.includes(userID)) return;
    const index = this.users.indexOf(userID);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.users.push(userID);
    } else {
      this.users.push(userID);
    }
    this.done.push(userID);
  }
}

function upIMG({
  nickname, mode, rating, rank, kd, headshots, tier,
  adr, win_rate, top10_rate, matches, rank_avg, image,
}) {
  return new Promise((resolve, reject) => {
  	if (!/fpp/i.test(mode)) mode = mode+'-TPP';
    request(image).pipe(fs.createWriteStream('./temp/ava.png').on('finish', () => {
      const p1 = Jimp.read('./temp/temp.png');
      const p2 = Jimp.read('./temp/ava.png');
      const p3 = Jimp.loadFont('./temp/mon80.fnt');
      const p4 = Jimp.loadFont('./temp/font.fnt');
      Promise.all([p1, p2, p3, p4]).then((images) => {
        const mon = images[2];
        // images[1].resize(106,106);
        images[0].print(images[3], 172, 60, nickname)
          .print(mon, 87, 178, mode.toUpperCase())
          .print(mon, 520, 178, 'PC')
          .print(mon, 252, 300, ''+rating)
          .print(mon, 252, 389, ''+kd)
          .print(mon, 252, 473, win_rate+'%')
          .print(mon, 252, 562, ''+matches)
          .print(mon, 716, 300, tier.replace("Grandmaster", "GM"))
          .print(mon, 716, 389, ''+adr)
          .print(mon, 716, 473, top10_rate+'%')
          .print(mon, 716, 562, headshots+'%')
          .composite(images[1], 22, 18)
          .getBuffer(Jimp.MIME_PNG, (error, result) => {
            if (error) {
              console.error(error);
              return reject("Can't save the img");
            }
            resolve({
              file: result,
              filename: 'top-pubg.png',
            });
          });
      }).catch((err) => {
      	console.log('omg ->');
        console.error(err);
        reject("Can't load all images");
      });
    }));
  });
}

async function parseStats (userID, channelID, message) {
  let m = message; let a, b, c, image;
  a = m.match(/\b(solo|duo|squad)([-\ ]?fpp|\b)?/i);
  if (a) {
    a = a[0];
  } else {
    a = "squad";
  }
  m = m.replace(/\b(solo|duo|squad|krjp|kakao)([-\ ]?[tf]pp|\b)?/gi, " ");
  b = reg.b1.exec(m);
  if (b) b = b[0]; else b = await getPubgName(userID);
  a = a.replace(/ /g, '-').replace(/tpp/i, '');
  getStats.getStats(b, a).then(item => {
    upIMG(item).then((file) => {
      file.to = channelID;
      bot.uploadFile(file);
    }).catch(err => {
      bot.sendMessage({to: channelID, message: err});
    });
  }).catch(err => {
    bot.sendMessage({to: channelID, message: err});
  });
}

function lfg (userID, channelID, fpp = false, note = "", update = false, invite = "", prem = false, obj = {}, myAva, msgID) {
  let voiceID;
  let { event, test, extended } = obj; // change?
  try {
    if (update) voiceID = update;
    else voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
  } catch (err) {
    return console.log(err);
  }
  if (voiceID) {
    let ch = bot.servers[SERVER].channels[voiceID];
    let guest = 0;
    if (ch.parent_id === "411468218448740352" || ch.parent_id === "411478080310345728") guest = 1;
    if (ch.parent_id === "371230249398173708") prem = true;
    else if (ch.name.includes("Guest")) guest = 1;
    else if (ch.name.includes("Top")) guest = 2;
    let chMembers = Object.keys(ch.members);
    let limit = ch.user_limit;
    if (limit > 10 && !update) {
      setTimeout(() => {bot.sendMessage({to: userID, message: ":thinking: <@" + userID + ">, ты в какой-то неправильной комнате. Количество мест, должно быть не больше 10, в твоей - " + limit})}, 100)
      return;
    }
    let c = limit - chMembers.length;
    let mode = ""; let tier = "low"; let duo = false; let restrictions = "";
    if ((c >= 1 && c < 10)||(c >= 0 && update)) {
      let fDate = new Date();
      if (!update) {
        for (let i = VoiceParties.length - 1; i >= 0; i--) {
          if (voiceID === VoiceParties[i].voiceID && fDate - VoiceParties[i].date < 180000) return;
          else if (voiceID === VoiceParties[i].voiceID && fDate - VoiceParties[i].date >= 180000) {
            let uu = VoiceParties[i].messageID;
            setTimeout(() => { bot.deleteMessage({channelID: channelID, messageID: uu}); }, 750);
            VoiceParties.splice(i, 1);
          }
        }
        const member = bot.servers[SERVER].members[userID];
        if (member && member.roles.includes(vars.role.stats)) {
          extended = true;
        }
      }
      // extended = true;  // delete later
      obj.extended = extended;
      if (limit === 2 && fpp) mode = "duofpp";
      else if (limit === 2 && !fpp) mode = "duo";
      else if (!fpp) mode = "squad";
      else mode = "squadfpp";

      if (mode.includes("duo")) duo = true;

      let myMessage = ""; let nickNames = []; let stream = false;
      for (let i = 0; i < chMembers.length; i++) {
        let nickName, myID = chMembers[i];
        try {
          const member = bot.servers[SERVER].members[myID];
          if (member.roles.includes(vars.role.stats)) extended = true;
          nickName = (member.nick || bot.users[myID].username).replace(/\[.*?]/, "");
          nickName = reg.b1.exec(nickName);
        } catch (err) {
        	console.log(`lfg_userError: ${myID} :: ${err.message}`);
        	delete ch.members[myID];
        	allUsers.get();
          continue;
        }
        if (bot.users[myID].game) stream = bot.users[myID].game.url;
        if (nickName) nickNames.push(nickName[0]);
        else nickNames.push("????");
      }
      if (nickNames.length === 0) return console.log("Nobody here");
      if (ch.permissions.role[SERVER] && ch.permissions.role[SERVER].deny & 1048576) {
        restrictions = "\n<:ogranichenie:563962399334596608> Ограничение по ADR: ";
        const pubg = [];
        const gll = [];
        const faceit = [];
        for (const roleID in ch.permissions.role) {
          if (ch.permissions.role[roleID].allow & 1048576) {
            const role = bot.servers[SERVER].roles[roleID];
            if (!role) continue;
            const roleName = role.name.toUpperCase();
            if (roleName.startsWith('FPP ADR') || roleName.startsWith('TPP ADR')) {
              const number = role.name.match(/\d+/);
              if (number) pubg.push(parseInt(number[0], 10));
            } else if (roleName.startsWith('FACEIT ADR')) {
              const number = role.name.match(/\d+/);
              if (number) faceit.push(parseInt(number[0], 10));
            } else if (roleName.startsWith('GLL ADR')) {
              const number = role.name.match(/\d+/);
              if (number) gll.push(parseInt(number[0], 10));
            }
          }
        }
        if (pubg.length) restrictions += `**PUBG** от ${Math.min.apply(null, pubg)}, `;
        if (faceit.length) restrictions += `**Faceit** от ${Math.min.apply(null, faceit)}, `;
        if (gll.length) restrictions += `**GLL** от ${Math.min.apply(null, gll)}, `;
        if (restrictions.endsWith(', ')) restrictions = restrictions.slice(0, -2);
      }
      let num = +vars.SEASON.slice(-2);
      let sql = `SELECT a.userID, b.name, b.kd, b.rating, b.adr, b.matches, b.date FROM registrations a INNER JOIN s${num} b ON a.pubg = b.name WHERE a.userID IN (?) AND b.mode = '${mode}'`;
      // let sql = `(SELECT name, kd, rating, adr, date FROM s${num} WHERE mode = '${mode}' AND matches > 9 AND name in (?)) UNION (SELECT name, kd, rating, adr, date FROM s${num-1} WHERE mode = ? AND name in (?)) ORDER BY date DESC`;
      if (test === 'faceit') sql = `SELECT a.userID, b.nickname AS name, b.nick, b.elo, b.skill, b.kd, b.adr, b.rank_avg, b.matches FROM registrations a INNER JOIN faceit b ON a.pubg = b.nickname WHERE a.userID IN (?)`;
      // if (test === 'faceit') sql = `SELECT b.nickname as name, b.nick, b.elo, b.skill, b.kd, b.adr, b.rank_avg, b.matches FROM faceit WHERE nickname in (?) UNION SELECT name, 0, 0, 0, kd, adr, rating, winrate FROM s${num} WHERE mode = ? AND name in (?)`;
      else if (test === 'gll') sql = `SELECT a.userID, b.name, b.kd, b.adr, b.matches, b.top5 FROM registrations a INNER JOIN gll b ON a.pubg = b.name WHERE a.userID IN (?)`;
      pool.query(sql, [chMembers], (error, results) => {
        if (error) return console.error(error);
        if (results.length) {
          results = _.uniqBy(results, item => item.name.toLowerCase());
          let myNames = results.map(x => x.name.toLowerCase());
          const myIds = results.map(x => '' + x.userID);
          let kdArray = results.map(x => x.kd);
          let kdAvarage = kdArray.reduce((a, b) => a + b) / results.length;
          // if (kdAvarage >= 4) tier = "high";
          // else if (kdAvarage >= 2) tier = "mid";
          // if (tier != "high") {
          //   let i = 0, j = 0;
          //   results.forEach(function (item) {
          //     if (item.rating) {
          //       if (item.rating > 5000) i++;
          //       if (item.myRank > 4000) j++;
          //     }
          //   });
          //   if (i/results.length > 0.6) tier = "high";
          //   else if (tier === "low" && j/results.length > 0.6) tier = "mid";
          // }
          let final = results.map(x => {
            const original = pubgName(x.userID);
            const verified = original === x.name ? '<:verified:563822684186738690>' : '<:info:563955024024174612>';
            if (test === 'faceit') {
              // if (x.elo) {
                // [**${x.name.replace('_', '\_')}**](https://pubg.op.gg/user/${x.name})
                // <:elo:573245802269638686>${x.elo} 
                if (extended) {
                  return `[${vars.emoji['skill' + x.skill]}](https://www.faceit.com/en/players/${x.nick}/stats/pubg)<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})<:KD:563087403410128951>${Math.round(x.kd*10)/10} <:ADR:563094124010405898>${Math.round(x.adr/10)*10} <:Avg_Rank:563959519936249887>${x.rank_avg} [${x.matches}]`;
                } else {
                  return `[${vars.emoji['skill' + x.skill]}](https://www.faceit.com/en/players/${x.nick}/stats/pubg)<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})`;
                }
              // } else {
              //   return `[**${x.name.replace('_', '\_')}**](https://pubg.op.gg/user/${x.name}) - ${x.rank_avg}, KD ${Math.floor(x.kd*10)/10}+, ADR ${Math.round(x.adr/10)*10}, WR ${Math.round(x.matches)}%`;
              // }
            } else if (test === 'gll') {
              // if (x.rating == 0) {
                if (extended) {
                  return `<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})<:KD:563087403410128951>${Math.round(x.kd*10)/10} <:ADR:563094124010405898>${Math.round(x.adr/10)*10} <:Avg_Rank:563959519936249887>${x.top5}% [${x.matches}]`;
                } else {
                  return `<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})`;
                }
              // } else {
                // let icon = giveUniqRole(undefined, undefined, x.rating, vars.emojiRating, "icon");
                // return `[**${x.name.replace('_', '\_')}**](https://pubg.op.gg/user/${x.name}) - ${icon.roleID || ''}${x.rating}, KD ${Math.floor(x.kd*10)/10}+, ADR ${Math.round(x.adr/10)*10}, WR ${Math.round(x.top5)}%`;
              // }
            } else {
              // <:elo:573245802269638686>${x.rating} 
              if (extended) {
                const icon = giveUniqRole(undefined, undefined, x.rating, vars.emojiRating, "icon");
                return `${icon.roleID || ''}<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})<:KD:563087403410128951>${Math.floor(x.kd*10)/10}+ <:ADR:563094124010405898>${Math.round(x.adr/10)*10} <:plane:563447674368688128>${x.matches}`;
              } else {
                const icon = giveUniqRole(undefined, undefined, x.rating, vars.emojiRating, "icon");
                return `${icon.roleID || ''}<@${x.userID}>[${verified}](https://pubg.op.gg/user/${x.name})`;
              }
            }
          });
          if (chMembers.length - results.length > 0) {
            console.log('not equal: ', myIds, chMembers);
            chMembers.forEach(playerID => {
              if (!myIds.includes(playerID)) {
                const original = pubgName(playerID);
                // <:nothing:573534078196776980>
                if (original) {
                  final.push(`<:badge:563466759689207808><@${playerID}>[<:infoOFF:563955540401717258>](https://pubg.op.gg/user/${original})`);
                } else {
                  final.push(`<:badge:563466759689207808><@${playerID}><:infoOFF:563955540401717258>`);
                }
              }
            });
          }
          myMessage = final.join("\n") + "\n";
        } else {
          const final = [];
          chMembers.forEach(playerID => {
            const original = pubgName(playerID);
            if (original) {
              final.push(`<:badge:563466759689207808><@${playerID}>[<:infoOFF:563955540401717258>](https://pubg.op.gg/user/${original})`);
            } else {
              final.push(`<:badge:563466759689207808><@${playerID}><:infoOFF:563955540401717258>`);
            }
          });
          myMessage = final.join("\n") + "\n";
        }
        if (limit > 5) tier = "event";
        else if (event) tier = "event";
        new Promise((resolve) => {
          if (update) {
            resolve(invite);
          } else if (voiceInvites[voiceID]) {
            resolve(voiceInvites[voiceID]);
          } else {
            bot.getChannelInvites(voiceID, function(err, invites){
              let myInv;
              if (!err) {
                invites.forEach((item) => {
                  if (!myInv && item.max_age === 0 && !item.temporary && item.max_uses === 0) {
                    if (item.channel.id === voiceID) {
                      myInv = "https://discord.gg/" + item.code;
                      voiceInvites[voiceID] = myInv;
                      resolve(myInv);
                    }
                  }
                })
              }
              if (!myInv) {
                bot.createInvite({channelID: voiceID, max_users: 0, max_age: 0, temporary: false}, (err, res) => {
                  if (err) return console.log("createInvite Error", err);
                  myInv = "https://discord.gg/" + res.code;
                  voiceInvites[voiceID] = myInv;
                  resolve(myInv);
                });
              }
            });
          }
        }).then(myInvite => {
          let img, ava, myUrl, myColor;
          if (update) ava = myAva;
          else {
            let preAva = bot.users[userID].avatar;
            if (preAva) ava = 'https://cdn.discordapp.com/avatars/' + userID + '/' + bot.users[userID].avatar + '.png';
            else ava = 'https://i.imgur.com/COZzfm4.png';
          }
          myUrl = myInvite;
          const d = c;
          const clFull = 'https://i.imgur.com/EqbyRFG.png';
          const cl1 = 'https://res.cloudinary.com/k1ker/image/upload/v1556813173/lfg/';
          if (c === 0) {
            img = clFull;
            myMessage = myMessage.replace(/<:verified:563822684186738690>/g, '<:off:566904871568146442>').replace(/<:info:563955024024174612>/g, '<:infoOFF:563955540401717258>');
          } else if (fpp) {
            if (c === 1) {
              if (duo) img = 'https://i.imgur.com/ziB4qzb.png';
              else img = 'https://i.imgur.com/ziB4qzb.png';
            }
            else if (c === 2) img = 'https://i.imgur.com/KosLxMq.png';
            else if (c === 3) img = 'https://i.imgur.com/fAliTHC.png';
            else img = 'https://i.imgur.com/vew2HHb.png';
            if (!test) c += " FPP";
            myColor = 0xded7d7;
          } else {
            if (c === 1) {
              if (duo) img = 'https://i.imgur.com/yw2CHon.png';
              else img = 'https://i.imgur.com/yw2CHon.png';
            }
            else if (c === 2) img = 'https://i.imgur.com/cApFrDH.png';
            else if (c === 3) img = 'https://i.imgur.com/4boTzHU.png';
            else img = 'https://i.imgur.com/8Lfgw66.png';
            if (!test) c += " TPP";
            myColor = 0xded7d7;
          }
          const cl2 = 'https://res.cloudinary.com/k1ker/image/upload/v1556814065/lfg/prem/';
          if (prem && fpp) {
            if (d === 0) img = clFull;
            else if (d === 1 && duo) img = 'https://i.imgur.com/kviU5Do.gif';
            else if (d === 1) img = 'https://i.imgur.com/kviU5Do.gif';
            else if (d === 2) img = 'https://i.imgur.com/8W4KGPh.gif';
            else if (d === 3) img = 'https://i.imgur.com/sEa4HjL.gif';
            else img = 'https://i.imgur.com/mfj91Hr.gif';
          } else if (prem) {
            if (d === 0) img = clFull;
            else if (d === 1 && duo) img = 'https://i.imgur.com/Zy3zHGT.gif';
            else if (d === 1) img = 'https://i.imgur.com/Zy3zHGT.gif';
            else if (d === 2) img = 'https://i.imgur.com/0lyUzzI.gif';
            else if (d === 3) img = 'https://i.imgur.com/prDSxNn.gif';
            else img = 'https://i.imgur.com/NqqMwSs.gif';
          }
          if (test === 'faceit') {
            if (c === 0) img = clFull;
            else if (c === 1) img = 'https://i.imgur.com/BauRLME.png';
            else if (c === 2) img = 'https://i.imgur.com/qZS2BIv.png';
            else if (c === 3) img = 'https://i.imgur.com/hIaf6CU.png';
            else img = 'https://i.imgur.com/CMquKwL.png';
            if (prem) {
              if (c === 0) img = clFull;
              else if (c === 1) img = 'https://i.imgur.com/BzrZXbX.gif';
              else if (c === 2) img = 'https://i.imgur.com/WFs8ZMA.gif';
              else if (c === 3) img = 'https://i.imgur.com/WupHzpz.gif';
              else img = 'https://i.imgur.com/QUrDEjP.gif';
            }
            myColor = 0xfb6b20;
            c += " FaceIT";
          } else if (test === 'gll') {
            if (c === 0) img = clFull;
            else if (c === 1 && duo) img = 'https://i.imgur.com/rLD8ZEy.png';
            else if (c === 1) img = 'https://i.imgur.com/rLD8ZEy.png';
            else if (c === 2) img = 'https://i.imgur.com/DOhX1UQ.png';
            else if (c === 3) img = 'https://i.imgur.com/V68LFsU.png';
            else img = 'https://i.imgur.com/sVDofig.png';
            if (prem) {
              if (c === 0) img = clFull;
              else if (c === 1 && duo) img = 'https://i.imgur.com/fGELn7r.gif';
              else if (c === 1) img = 'https://i.imgur.com/fGELn7r.gif';
              else if (c === 2) img = 'https://i.imgur.com/QhieRP8.gif';
              else if (c === 3) img = 'https://i.imgur.com/dhRi09I.gif';
              else img = 'https://i.imgur.com/FKu2Gcy.gif';
            }
            myColor = 0xb52b2a;
            c += " GLL";
          }
          if (prem) myColor = 0xf6c40c;
          c += "";
          if (c.startsWith("0")) myColor = undefined;
          let sICO = " :ballot_box_with_check:";
          if (test === 'blackops') sICO = " :zap:";
          else if (test === 'gll') sICO = " :zap:";
          else if (guest === 1) sICO = " :white_check_mark:";
          else if (guest === 2) sICO = " :star:";
          if (tier === "event") sICO = " <a:CoolDog:427779715156410378>";
          let embedPart = note + restrictions + "\nЗайти: " + myUrl + sICO;
          let embedTitle = `В поисках +${c} в ${ch.name}`;
          let twitch;
          if (c.startsWith("0")) {
            ava = "https://i.imgur.com/zhNa0WM.png";
            if (stream) {
              myColor = 0xe67e22;
              embedPart = " :white_small_square: " + stream;
              twitch = {url: "https://i.imgur.com/3JuNkmo.png"};
              ava = "https://i.imgur.com/LI43d7L.png";
            } else {
              if (prem) ava = "https://i.imgur.com/RGfhPLe.png";
              embedPart = "";
            }
            embedTitle = "Играют в " + ch.name;
          }
          const lfgEmbed = {
            color: myColor,
            description: myMessage + embedPart,
            thumbnail:
            {
              url: img
            },
            author: {
              name: embedTitle,
              icon_url: ava
            },
            image: twitch || {url: "https://i.imgur.com/1CaBbxC.png"},
            title: '',
            url: ''
          };
          if (update) {
            bot.editMessage({channelID: channelID, messageID: userID, message: '', embed: lfgEmbed});
            for (let i = VoiceParties.length - 1; i >= 0; i--) {
              if (VoiceParties[i].voiceID === voiceID) {
                VoiceParties[i].chMembers = chMembers;
              }
            }
          } else {
            bot.sendMessage({ to: channelID, message: '', embed: lfgEmbed }, function(err, res) {
              if (err) return console.error(err);
              VoiceParties.push(new VoiceGroup(voiceID, res.id, channelID, fpp, note, myUrl, prem, chMembers, obj, ava));
            });
          }
        });
      });
    } else {
    	console.log("Количество людей? Переменная c");
    	for (let i = 0; i < chMembers.length; i++) {
        let myID = chMembers[i];
        if (!bot.servers[SERVER].members[myID]) {
        	delete ch.members[myID];
        	allUsers.get();
        	console.log(`invisiblePlayer deleted!`);
          break;
        }
      }
    }
  } else {
    bot.sendMessage({to: userID, message: "<@" + userID + ">, чтобы воспользоваться командой `fpp` и `tpp`, для начала нужно зайти в Squad или Duo комнату."});
  }
}

class VoiceGroup {
  constructor(voiceID, messageID, channelID, fpp, note, invite, prem, chMembers, test, myAva) {
    this.voiceID = voiceID;
    this.messageID = messageID;
    this.channelID = channelID;
    this.fpp = fpp;
    this.myAva = myAva;
    this.note = note;
    this.invite = invite;
    this.prem = prem;
    this.chMembers = chMembers;
    this.date = new Date();
    this.test = test;
    this.ava = function() {
      if (new Date() - this.date < 1800000) return this.myAva;
      else return "https://i.imgur.com/Hm2MtDG.png";
    }
  }
};

let finders = [], senders = [];

class Sender {
  constructor(userID, recipient) {
    this.userID = userID;
    this.recipients = [{recipient: recipient, date: Date.now()}];
  }
  up(recipient) {
    this.recipients.push({recipient: recipient, date: Date.now()});
  }
  check(recipient) {
    let index = 0;
    let date = Date.now();
    for (let i = this.recipients.length - 1; i >= 0; i--) {
      if (this.recipients[i].recipient === recipient) {
        if (date - this.recipients[i].date < 1200000) index = 1;
        else this.recipients.splice(i, 1);
      } else if (date - this.recipients[i].date >= 300000) {
        this.recipients.splice(i, 1);
      }
    }
    if (this.recipients.length >= 10) index = 4;
    return index;
  }
  length() {
    let date = Date.now();
    for (let i = this.recipients.length - 1; i >= 0; i--) {
      if (date - this.recipients[i].date >= 300000) {
        this.recipients.splice(i, 1);
      }
    }
    return this.recipients.length;
  }
};

setInterval(() => {
  for (let i = senders.length - 1; i >= 0; i--) {
    let item = senders[i];
    if (item.length() === 0) senders.splice(i, 1);
  }
}, 360000);

bot.on("channelDelete", channel => {
	if (channel.type === 2) hideCh.getChannels();
})
bot.on("channelCreate", channel => {
	if (channel.type === 2) hideCh.getChannels();
})

bot.on("voiceStateUpdate", vChannel => {
  autoUpdate.join(vChannel);
  let userID = vChannel.d.user_id;
  let channelID = vChannel.d.channel_id;
  hideCh.check(channelID); // прячем неиспользуемые каналы
  let fDate = new Date();
  for (let i = VoiceParties.length - 1; i >= 0; i--) {
    if (channelID === VoiceParties[i].voiceID) {
      if (VoiceParties[i].chMembers.includes(userID)) continue;
      lfg (VoiceParties[i].messageID, VoiceParties[i].channelID, VoiceParties[i].fpp, VoiceParties[i].note, VoiceParties[i].voiceID, VoiceParties[i].invite, VoiceParties[i].prem, VoiceParties[i].test, VoiceParties[i].ava());
      continue;
    } else if (!channelID) {
      if (VoiceParties[i].chMembers.indexOf(userID) >= 0) {
        if (VoiceParties[i].chMembers.length === 1) {
          bot.deleteMessage({channelID: VoiceParties[i].channelID, messageID: VoiceParties[i].messageID});
          VoiceParties.splice(i, 1);
          continue;
        } else {
          lfg (VoiceParties[i].messageID, VoiceParties[i].channelID, VoiceParties[i].fpp, VoiceParties[i].note, VoiceParties[i].voiceID, VoiceParties[i].invite, VoiceParties[i].prem, VoiceParties[i].test, VoiceParties[i].ava());
        }
      }
    } else if (VoiceParties[i].chMembers.includes(userID)) {
      if (VoiceParties[i].chMembers.length === 1) {
        bot.deleteMessage({channelID: VoiceParties[i].channelID, messageID: VoiceParties[i].messageID});
        VoiceParties.splice(i, 1);
        continue;
      } else {
        lfg (VoiceParties[i].messageID, VoiceParties[i].channelID, VoiceParties[i].fpp, VoiceParties[i].note, VoiceParties[i].voiceID, VoiceParties[i].invite, VoiceParties[i].prem, VoiceParties[i].test, VoiceParties[i].ava());
      }
    }
    if (fDate - VoiceParties[i].date > 780000) {
    	if (VoiceParties[i].chMembers.length >= 4) {
    		VoiceParties.splice(i, 1);
    	} else if (fDate - VoiceParties[i].date > 2700000) {
        VoiceParties.splice(i, 1);
    	}
    }
  }
});

bot.on("channelUpdate", (oldChannel, ch) => {
  for (let userID in ch.permissions.user) {
    if (ch.permissions.user[userID].allow & 4194304 || ch.permissions.user[userID].allow & 8388608) {
      console.log(`Permission delete! voiceID: ${ch.id}, userID: ${userID}`);
      bot.editChannelPermissions({ channelID: ch.id, userID: userID, default: [22, 23] }, logger);
    }
  }
  for (let roleID in ch.permissions.role) {
    if (ch.permissions.role[roleID].allow & 4194304 || ch.permissions.role[roleID].allow & 8388608) {
      console.log(`Permission delete! voiceID: ${ch.id}, roleID: ${roleID}`);
      bot.editChannelPermissions({ channelID: ch.id, roleID: roleID, default: [22, 23] }, logger);
    }
  }
});

// setInterval(onlineStream, 290000);
let streamMessage = "428032923980267520", coachMessage = "";

function onlineStream () {
  bot.getAllUsers();
  let streamList = [], coachList = [], streamDB = [];
  bot.once("allUsers", function() {
    let i = 0, j = 0, x = 0;
    if (!bot.servers[SERVER]) return;
    for (let ids in bot.servers[SERVER].members) {
      j++;
      let stream, streamName, coach, userName = "", icon = "", role = 9999, roleFPP = 9999;
      let nickname = (bot.servers[SERVER].members[ids].nick || bot.users[ids].username).replace(/\[.*?]/, "");
      nickname = reg.b1.exec(nickname);
      if (bot.servers[SERVER].members[ids].status) {
	      let roles = bot.servers[SERVER].members[ids].roles;
	      if (bot.users[ids].game) {
	        stream = bot.users[ids].game.url;
          streamName = bot.users[ids].game.name;
	        for (let i = 0; i < roles.length; i++) {
	          let check = ch_ids.indexOf(roles[i]);
	          if (check >= 0) role = ch_names[check];
	          check = ch_ids_fpp.indexOf(roles[i]);
	          if (check >= 0) roleFPP = ch_names_fpp[check];
	        }
	        if (roleFPP < role) role = roleFPP;
	        if (roles.indexOf(premiumvars.role.premium) >= 0) {
	          icon = ":small_orange_diamond: ";
	          role = role/9.8;
	        }
	      }
	      if (roles.includes("383211617183203328")) {
	      	coach = true;
	      	userName = "https://pubg.op.gg/user/" + nickname;
	      	for (let i = 0; i < roles.length; i++) {
	          let check = ch_ids.indexOf(roles[i]);
	          if (check >= 0) role = ch_names[check];
	          check = ch_ids_fpp.indexOf(roles[i]);
	          if (check >= 0) roleFPP = ch_names_fpp[check];
	        }
	        if (roleFPP < role) role = roleFPP;
	    	}
	    }
      if (stream) {
        i++;
        streamList.push({"id": ids, "url": stream, "role": role, "icon": icon});
        streamDB.push({userID: ids, server: 1, name: nickname, streamURL: stream, streamName: streamName.trim()});
      }
      // if (coach) { // включить для обновления списка коучей
      // 	x++;
      // 	coachList.push({"id": ids, "url": userName, "role": role});
      // }
    }
    streamList.sort(function(a, b) {
      return ((a.role < b.role) ? -1 : ((a.role == b.role) ? 0 : 1));
    });
    // coachList.sort(function(a, b) { // включить для обновления списка коучей
    //   return ((a.role < b.role) ? -1 : ((a.role == b.role) ? 0 : 1));
    // });
    let myMessage = "", secMessage = "";
    for (let k = 0; k < streamList.length; k++) {
      myMessage = myMessage + streamList[k].icon + "<@" + streamList[k].id + "> - " + streamList[k].url + "\n";
    }
    // for (let k = 0; k < coachList.length; k++) { // включить для обновления списка коучей
    //   secMessage = secMessage + "<@" + coachList[k].id + "> - " + "[подробная статистика](" + coachList[k].url + ")\n\n";
    // }
    if (!streamMessage && i >= 1) {
      bot.sendMessage({to: "377214296435720202", message: '',
        embed: {
          color: 0x6444a0,
          description: myMessage,
          timestamp: new Date(),
          thumbnail:
          {
            url: "https://i.imgur.com/B8X2Nia.png"
          },
          footer: { 
            icon_url: "https://i.imgur.com/bH5eGam.png",
            text: 'PUBG [bot]'
          },
          author: {
            name: "Список активных стримеров с нашего дискорда:",
            icon_url: "https://i.imgur.com/LI43d7L.png"
          }
        }
      }, function (err, res) {
      	if (err) return console.log(err);
      	streamMessage = res.id;
      });
    } else if (i > 0 && streamMessage) {
      bot.editMessage({channelID: "377214296435720202", messageID: streamMessage, message: '',
        embed: {
          color: 0x6444a0,
          description: myMessage,
          timestamp: new Date(),
          thumbnail:
          {
            url: "https://i.imgur.com/B8X2Nia.png"
          },
          footer: { 
            icon_url: "https://i.imgur.com/bH5eGam.png",
            text: 'PUBG [bot]'
          },
          author: {
            name: "Список активных стримеров с нашего дискорда:",
            icon_url: "https://i.imgur.com/LI43d7L.png"
          }
        }
      });
    }
    if (!coachMessage && x > 0) {
      bot.sendMessage({to: "383255704406065152", message: '',
        embed: {
          color: 0x4681a6,
          description: secMessage,
          timestamp: new Date(),
          thumbnail:
          {
            url: "https://i.imgur.com/YYt6Sb9.png"
          },
          author: {
            name: "Список коучей онлайн:",
            icon_url: "https://i.imgur.com/jCCZG5d.png"
          }
        }
      }, function (err, res) {
      	if (err) return console.log(err);
      	coachMessage = res.id;
      });
    } else if (x > 0 && coachMessage) {
      bot.editMessage({channelID: "383255704406065152", messageID: coachMessage, message: '',
        embed: {
          color: 0x4681a6,
          description: secMessage,
          timestamp: new Date(),
          thumbnail:
          {
            url: "https://i.imgur.com/YYt6Sb9.png"
          },
          author: {
            name: "Список коучей онлайн:",
            icon_url: "https://i.imgur.com/jCCZG5d.png"
          }
        }
      });
    }
    pool.getConnection(function(err, connection) {
      if (err) return console.log(err);
      connection.query("DELETE FROM streams WHERE server = 1", function (error) {
        if (error) {
          connection.release();
          return console.log(error);
        }
        if (streamDB.length >= 1) {
          streamDB.forEach(function(item) {
            connection.query('INSERT INTO streams SET ?', item, function (error) {
              if (error) console.log("Streams INSERT ODKU mySQL mistake:" + error);
            });
          });
        }
        connection.release();
      });
    });
  });
}

function bans() {
  let now = Date.now();
  pool.getConnection(function(err, connection) {
    if (err) return console.log(err);
    connection.query('SELECT * FROM bans WHERE server = 1', function (error, results) {
      if (error) {
        connection.release();
        if (error.fatal) {
          console.trace('fatal error: ' + err.message);
          handleDisconnect();
        }
        return console.log(">> bans eRrOr" + error);
      }
      if (results.length > 0) {
      	let premium = [];
        results.forEach(function(item) {
          let userID = item.userID;
          let uu = Math.floor(Math.random() * 15000) + 500;
          if (!item.ban && !item.voicemute && !item.chatmute && !item.flood && !item.premium) {
            connection.query('DELETE FROM bans WHERE `userID` = ?', [userID], function (error) {
              if (error) console.log(error);
              console.log("Deleted from bans: " + userID);
            });
          } else if (item.ban && item.ban < now) {
            connection.query('UPDATE bans SET ban = NULL WHERE `userID` = ? AND `server` = 1', [userID], function (error) {
              if (error) console.log(error);
              Role.remove(userID, "381507374248361984");
              console.log("- ban: " + userID);
            });
          } else if (item.voicemute && item.voicemute < now) {
            connection.query('UPDATE bans SET voicemute = NULL WHERE `userID` = ? AND `server` = 1', [userID], function (error) {
              if (error) console.log(error);
              setTimeout(() => {bot.unmute({serverID: SERVER, userID: userID})}, uu);
              console.log("- voicemute: " + userID);
            });
          } else if (item.chatmute && item.chatmute < now) {
            connection.query('UPDATE bans SET chatmute = NULL WHERE `userID` = ? AND server = 1', [userID], function (error) {
              if (error) console.log(error);
              Role.remove(userID, "365835519915196417");
              console.log("- chatmute: " + userID);
            });
          } else if (item.flood && item.flood < now) {
            connection.query('UPDATE bans SET flood = NULL WHERE `userID` = ? AND server = 1', [userID], function (error) {
              if (error) console.log(error);
              Role.remove(userID, "381508442537590815");
              console.log("- flood: " + userID);
            });
          } else if (item.premium) {
          	if (item.premium < now) {
          		connection.query('UPDATE bans SET premium = NULL WHERE `userID` = ? AND server = 1', [userID], function (error) {
	              if (error) console.log(error);
	              Role.remove(userID, "370673159588020236");
	              console.log("- Premium: " + userID);
	            });
          	} else {
          		premium.push({userID, time: item.premium - now});
          	}
          }
        });
        connection.release();
        let smiles = ["🏆 ", "🥈 ", "🥉 ", ":clap: ", ":clap: "];
        let embed = {
          color: 0xffd700,
          title: 'Спасибо за поддержку:',
          description: '',
          thumbnail: {
            url: 'https://i.imgur.com/R8y8vj5.png'
          }
        }
        let j = 1;
        premium.sort((a,b)=>b.time-a.time).forEach((item, i) => {
          if (i < 20) {
            let member = bot.servers[SERVER].members[item.userID];
            if (!member) return;
            let nick = member.nick || bot.users[item.userID].username;
            let pr = Math.round((item.time / 86400000));
            if (pr < 30) return;
            embed.description += `${smiles[j-1]||''}${j++}. **${nick}** :crown: ${pr} ${pluralize(pr, 'день', 'дня', 'дней')}\n`;
          }
        })
        bot.editMessage({channelID: '488891499040210954', messageID: '489132164710006806', embed});
      }
    });
  });
}

function timeSince(date) {
  let seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years ago";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months ago";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    if (interval >= 5) return interval + " дней назад";
    return interval + " дня назад";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    let n = interval.toString();
    if (interval >= 5) {
      if (interval > 20) {
        if (n.slice(-1) == "1") {
          return interval + " час назад";
        } else if (n.slice(-1) <= 4) {
          if (n.slice(-1) === 0) return interval + " часов назад";
          return interval + " часа назад";
        }
      }
      return interval + " часов назад";
    }
    return interval + " часа назад";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    let n = interval.toString();
    if (interval >= 5) {
      if (interval > 20) {
        if (n.slice(-1) == "1") {
          return interval + " минуту назад";
        } else if (n.slice(-1) <= 4) {
          if (n.slice(-1) === 0) return interval + " минут назад";
          return interval + " минуты назад";
        }
      }
      return interval + " минут назад";

    }
    return interval + " минуты назад";
  }
  return Math.floor(seconds) + " секунд";
}

function sklonHours (interval) {
  let n = interval.toString();
  let n1 = n.slice(-1);
  if (interval > 1) {
    if (interval >= 5) {
      if (interval > 20) {
        if (n1 === "1") {
          return interval + " час";
        } else if (n1 <= 4) {
          if (n1 === "0") return interval + " часов";
          return interval + " часа";
        }
      }
      return interval + " часов";
    } else {
      return interval + " часа"
    }
  } else {
    return interval + " час";
  }
}

// const textFile = "spam.csv";
// let x = 0;
// function getLine () {
//   fs.readFile(textFile, 'utf8', function(err, data) {
//     if (err) {
//         console.log("Oh, no! FILE READ Error :(");
//         return;
//     }
//     let lines = data.split('\n');
//     let firstLine = lines.slice(0,1).toString();
//     let linesExceptFirst = data.split('\n').slice(1).join('\n');
//     let userID = firstLine.match(/\d{16,19}/);
//     fs.writeFile(textFile, linesExceptFirst, function(err) { // write file
//         if (err) { // if error, report
//             console.log(err);
//         }
//     });
//     if (userID) {
//       userID = userID[0];
//       timeNow = new Date();
//       x++;
//       console.log("New " + x + " message sent [ " + userID + " ] | " + timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds());
//       letter(userID);
//     } else {
//       timeNow = new Date();
//       console.log("NoBoDy HERE -//- Time: " + timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds());
//     }
//   });
// }

// function letter (userID, userIDname) {
//   bot.sendMessage({to: userID, message: "Yo!"});
// }

// setInterval(getLine, 60527);

function groupInfo (userID, channelID, fpp = true) {
  let voiceID;
  try {
    voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
  } catch (err) {
    return console.log(err);
  }
  if (voiceID) {
    let ch = bot.servers[SERVER].channels[voiceID];
    let chMembers = ch.members;
    chMembers = Object.keys(chMembers).map(function(key) {
      return key;
    });
    if (chMembers.length < 7) {
      let mode = "squad";
      if (fpp) mode = "squadfpp";
      let sql = `SELECT * FROM s8 WHERE mode = '${mode}' AND name = "`;
      for (let i = 0; i < chMembers.length; i++) {
      	if (!bot.servers[SERVER].members[chMembers[i]]) return; // just in case
        let nick = (bot.servers[SERVER].members[chMembers[i]].nick || bot.users[chMembers[i]].username).replace(/\[.*?]/, "");
        nick = reg.b1.exec(nick);
        if (i === 0) sql += nick + '"';
        else sql += ' OR name = "' + nick + '"';
      }
      pool.getConnection(function(err, connection) {
        if (err) return console.log(err);
        connection.query(sql, function (error, results) {
          connection.release();
          if (error) console.log(error);
          if (results.length > 0) {
            let allStats = [];
            results.forEach(function(item, i) {
              allStats[i] = { name: ':black_small_square:' + item.name,
                value: `**Рейтинг:** ${item.rating}\n**Место:** ${item.rank}\n**K/D:** ${item.kd}\n**Ср. урон:** ${item.adr}\n**% побед:** ${item.winrate}%\n**Сыграно игр:** ${item.matches}`,
                inline: true
              }
            });
            let myColor;
            if (fpp) {
              fpp = "Squad-FPP";
              myColor = 0xadaeaf;
            } else {
              fpp = "Squad";
              myColor = 0x77b255;
            }

            bot.sendMessage({to: channelID, message: '',
              embed: {
                color: myColor,
                fields: allStats,
                thumbnail:
                {
                  url: "https://i.imgur.com/K1Gqbrg.png"
                },
                title: ':chart_with_upwards_trend: ' + fpp + ' статистика для ' + ch.name + ':',
                url: ''
              }
              });
          } else {
            bot.sendMessage({to: channelID, message: 'Всё сложно'});
          }
        });
      });
    } else { bot.sendMessage({to: channelID, message: ':no_entry: Ошибка! В комнате больше 6 человек'}) }
  } else {
    bot.sendMessage({to: channelID, message: 'Данная команда, создана для показа групповой статистики. Как будешь собирать сквад или зайдёшь к кому-то, тогда и пиши эту команду :wink: '});
  }
}

bot.on('presence', function(user, userID, status, game, event) {
  const { streamRole, premium, streamSpotlight } = vars.role;
  let roles = event.d.roles;
  let stream = false;
  if ((roles.includes(streamRole)||roles.includes(premium)) && game) {
    stream = game.url;
    if (stream && !roles.includes(streamSpotlight)) {
      Role.add(userID, streamSpotlight);
    }
  }
  if (roles.includes(streamSpotlight) && !stream) {
  	Role.remove(userID, streamSpotlight);
  }
});

bot.on("messageReactionRemove", function(event) {
  if (event.d.user_id === bot.id) return;
  reactionHandler(event);
});

bot.on("messageReactionAdd", async function(event) {
  if (event.d.user_id === bot.id) return;
  reactionHandler(event);
  let channelID = event.d.channel_id;
  let userID = event.d.user_id;
  let messageID = event.d.message_id;
  let emoji = event.d.emoji.name;
  if (channelID === vars.ch.botStats) {
    const reaction = event.d.emoji.id ? `${emoji}:${event.d.emoji.id}` : emoji;
    bot.removeReaction({ channelID, messageID, userID, reaction });
  }
  if (megaStatsID[messageID]) {
    const { data } = megaStatsID[messageID];
    if (emoji === 'faceit') {
      const { embed } = data;
      embed.fields = data.faceit.fields;
      embed.timestamp = data.faceit.timestamp;
      bot.editMessage({ channelID, messageID, embed });
    } else if (emoji === 'gll') {
      const { embed } = data;
      embed.fields = data.gll.fields;
      embed.timestamp = data.gll.timestamp;
      bot.editMessage({ channelID, messageID, embed });
    } else if (emoji === 'TPP') {
      const { embed } = data;
      embed.fields = data.tpp.fields;
      embed.timestamp = data.tpp.timestamp;
      bot.editMessage({ channelID, messageID, embed });
    } else if (emoji === 'FPP') {
      const { embed } = data;
      embed.fields = data.fpp.fields;
      embed.timestamp = data.fpp.timestamp;
      bot.editMessage({ channelID, messageID, embed });
    }
  } else if (channelID === vars.ch.report && emoji === "ban") {
    let a = false;
    kicks.forEach(function (item, i){
      if (item.messageID === messageID) a = item;
    });
    if (!a) return console.log("noSuchMessage");
    let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
    if (!voiceID || voiceID != a.voiceID) {
      return bot.sendMessage({to: userID, message: "<@" + userID + ">, чтобы кикнуть, необходимо находиться в одной голосовой комнате."});
    } else {
      let ch = bot.servers[SERVER].channels[voiceID];
      for (let i = kicks.length - 1; i >= 0; i--) {
        if (userID === kicks[i].userID) {
          if (kicks[i].banned === a.banned)
            return bot.sendMessage({to: userID, message: `Вы уже отправляли жалобу на <@${a.banned}>. Попробуйте еще раз через 30 минут.`});
          if (kicks[i].voiceID != a.voiceID)
            return bot.sendMessage({to: userID, message: `Вы уже использовали данную команду в другой комнате ${kicks[i].voiceID}. Попробуйте еще раз через 30 минут.`});
        }
      }
      bot.editChannelPermissions({channelID: voiceID, userID: a.banned, deny: [20, 21]}, (err) => {
        if (err) return console.log(err);
        kicks.push({userID: userID, banned: a.banned, voiceID: voiceID, date: new Date()});
        bot.moveUserTo({serverID: SERVER, userID: a.banned, channelID: "372491862100934658"});
        bot.editMessage({channelID: channelID, messageID: messageID, message: "", "embed": {
          color: 0x894ea2,
          description: `:no_pedestrians: <@${a.banned}> был кикнут с ${ch.name}. by <@${userID}>`
        }});
        setTimeout(() => {bot.removeAllReactions({channelID: channelID, messageID: messageID})}, 1050);
      });
    }
  } else if (channelID === vars.ch.report_logs) {
  	if (emoji === "👌") {
  		let embed = {
		    "description": "Спасибо за предоставленную информацию!\nПри повторных нарушениях пользователь будет наказан.\n\n\nС уважением, администрация TOP PUBG.",
		    "thumbnail": {
		      "url": "https://i.imgur.com/yj4Nj7w.png"
		    },
		    "color": 5226160
		  }
  		reportAnswer(userID, channelID, messageID, embed, emoji);
  	} else if (emoji === "👎") {
  		let embed = {
		    "description": "К сожалению, ваш репорт был отклонён.\nСкорее всего, ваши доказательства были неубедительными.\n\n\nС уважением, администрация TOP PUBG.",
		    "thumbnail": {
		      "url": "https://i.imgur.com/yj4Nj7w.png"
		    },
		    "color": 15844367
		  }
  		reportAnswer(userID, channelID, messageID, embed, emoji);
  	} else if (emoji === "👍") {
			let embed = {
		    "description": "Спасибо за обращение, к нарушителю приняты меры.\nБлагодарим вас за бдительность!\n\n\nС уважением, администрация TOP PUBG.",
		    "thumbnail": {
		      "url": "https://i.imgur.com/X4fgIkr.png"
		    },
		    "color": 3066993
		  }
		  reportAnswer(userID, channelID, messageID, embed, emoji);
  	} else if (emoji === "💯") {
  		reportAnswer(userID, channelID, messageID, undefined, emoji);
  	}
  }
});

function getPremRoom(member) {
  if (Array.isArray(member)) member = { roles: member };
  let roomNumber, voiceID, ch, premRoleID;
  member.roles.forEach(roleID => {
    const roleName = bot.servers[SERVER].roles[roleID].name;
    const room = roleName.match(/PREM (\d{1,3})/i);
    if (room) {
      roomNumber = parseInt(room[1], 10);
      voiceID = vars.ch.premRooms[roomNumber];
      premRoleID = roleID;
      ch = bot.servers[SERVER].channels[voiceID];
    }
  });
  return { roomNumber, roleID: premRoleID, voiceID, ch };
}

function banMe(userID, channelID, a) {
  const member = bot.servers[SERVER].members[userID];
  if (!member.roles.includes(vars.role.premium))
    return pm(userID, channelID, `Вам необходимо иметь **Premium** роль, чтобы пользоваться этой командой :point_up:`);
  const { voiceID, ch } = getPremRoom(member);
  if (!voiceID) return pm(userID, channelID, `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`);
  bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
    if (err) return console.log(err);
    if (voiceID == bot.servers[SERVER].members[a].voice_channel_id) {
      bot.moveUserTo({serverID: SERVER, userID: a, channelID: vars.ch.kickRoom});
    }
    pm(userID, channelID, "", {
      color: 0xe74c3c,
      description: `:no_pedestrians: <@${a}> был заблокирован доступ в комнату **${ch.name}**`
    });
  });
}

const banMenu = {};
const friendMenu = {};
const hideMenu = {};

function reactionHandler(event) {
  // let ch = bot.getChannel(message.channelID);
  const userID = event.d.user_id;
  const channelID = event.d.channel_id;
  const messageID = event.d.message_id;
  const emoji = event.d.emoji.name;
  if (channelID === vars.ch.premMenu) {
  	const member = bot.servers[SERVER].members[userID];
  	if (!member) return allUsers.get();
  	const list = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣'];
  	if (emoji === '🔗') {
  		let myMessage = `Роль расширенной статистики успешно снята :upside_down:`;
  		if (member.roles.includes(vars.role.stats)) {
  			Role.remove(userID, vars.role.stats);
  		} else {
  			myMessage = `Поздравляю! Вам была присвоена роль расширенной статистики :smiley:`;
  			Role.add(userID, vars.role.stats);
  		}
  		pm(userID, channelID, myMessage);
  	} else if (emoji === '🏠') {
      const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      if (ch.permissions.role[SERVER] && (ch.permissions.role[SERVER].deny & 1024)) {
      	delete hideMenu[voiceID];
      	bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [10]}, (err) => {
          if (err) return console.log(err);
          const embed = {
            color: 0x00cc00,
            description: `Ваша комната **${ch.name}** теперь видна всем пользователям :bulb:`
          };
          pm(userID, channelID, "", embed);
        });
      } else {
      	hideMenu[voiceID] = true;
      	bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, deny: [10]}, (err) => {
	        if (err) return console.log(err);
	        const embed = {
	          color: 0x00cccc,
	          description: `Ваша комната **${ch.name}** скрыта от других пользователей :spy: `
	        };
	        pm(userID, channelID, "", embed);
	      });
      }
  	} else if (emoji === '🗣') {
  		const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      if (ch.permissions.role[SERVER] && (ch.permissions.role[SERVER].deny & 33554432)) {
      	bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [25]}, (err) => {
          if (err) return console.log(err);
          const embed = {
            color: 0x9b59b6,
            description: `:speaking_head: включен режим **Активация-По-Голосу** для комнаты **${ch.name}**`
          };
          pm(userID, channelID, "", embed);
        });
      } else {
      	bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, deny: [25]}, (err) => {
          if (err) return console.log(err);
          const embed = {
            color: 0x9b59b6,
            description: `:black_square_button: включен режим **Push-To-Talk** для комнаты **${ch.name}**`
          }
          pm(userID, channelID, "", embed);
        });
      }
  	} else if (emoji === '📛') {
  		const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      const arr = Object.keys(ch.members).filter(x => x != userID);

      let text = 'Выберите, кого вы хотите забанить:no_entry::\n';
      if (arr.length > 0) {
      	arr.forEach((item, i) => {
      		if (i < list.length) {
      			text += `${list[i]}: <@${item}>\n`;
      		}
        });
        text += 'Или напишите `!ban @user#1234`';
      	bot.sendMessage({ to: channelID, message: text }, (err, res) => {
      		if (err) return console.error(err);
      		banMenu[res.id] = arr;
      		list.forEach((emoji, i) => {
      			if (i < arr.length) {
      				setTimeout(()=>bot.addReaction({channelID, messageID: res.id, reaction: emoji}), i*525);
      			}
      		});
      		setTimeout(()=>bot.deleteMessage({channelID, messageID: res.id}), 30000);
      	})
      } else {
        text = "Воспользуйтесь командой `!ban @user#1234`";
        bot.sendMessage({ to: channelID, message: text }, (err, res) => {
      		if (err) return console.error(err);
      		setTimeout(()=>bot.deleteMessage({channelID, messageID: res.id}), 30000);
      	});
      	// console.log(`NoUsers in ${member.voice_channel_id} || userID: ${userID}`);
      }
  	} else if (emoji === '⚜') {
      if (!member.roles.includes(vars.role.premiumPlus)) return pm(userID, channelID, `Вам необходимо иметь **👑Premium+** роль, чтобы пользоваться этой командой :point_up:`);
  		pm('', channelID, `Укажите ник игрока или название комнаты, после команды: \`!join @user#1234\``);
    } else if (emoji === '🔃') {
      if (!member.roles.includes(vars.role.premiumPlus)) return pm(userID, channelID, `Вам необходимо иметь **👑Premium+** роль, чтобы пользоваться этой командой :point_up:`);
  		pm('', channelID, `Укажите ник друга, после команды: \`!move @user#1234\``);
    } else if (emoji === '🔅') {
  		if (!member.roles.includes(vars.role.premiumPlus)) return pm(userID, channelID, `Вам необходимо иметь **👑Premium+** роль, чтобы пользоваться этой командой :point_up:`);
  		pm('', channelID, `Укажите 6ти значный Hex-код после #. Пример: \`#${Math.floor(Math.random()*16777215).toString(16)}\``);
  	} else if (emoji === '🛑') {
      const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      const banned = Object.entries(ch.permissions.user).filter(([uID, perm]) => perm.deny === 3145728);
      const banList = banned.reduce((acc, curr) => {
        const [ uID ] = curr;
        const user = bot.users[uID];
        let string = "????#????";
        if (user) string = `${user.username}#${user.discriminator}`;
        return `${acc}${string}\n`;
      }, "");
      pm(userID, channelID, ` :no_pedestrians: Список забаненных игроков:\n${banList}\nДля разбана напишите \`!un ban @user#1234\` в канале <#${vars.ch.premMenu}>`);
    } else if (emoji === '🚷') {
      const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      const friends = Object.entries(ch.permissions.user).filter(([uID, perm]) => perm.allow === 19923968);
      const friendsList = friends.reduce((acc, curr) => {
        const [ uID ] = curr;
        const user = bot.users[uID];
        let string = "????#????";
        if (user) string = `${user.username}#${user.discriminator}`;
        return `${acc}${string}\n`;
      }, "");
      pm(userID, channelID, ` :clipboard: Список добавленных друзей:\n${friendsList}\nЧтобы удалить друга из друзей, напишите \`!un friend @user#1234\` в канале <#${vars.ch.premMenu}>`);
    } else if (emoji === '✅') {
  		if (!member.roles.includes(vars.role.premiumPlus)) return pm(userID, channelID, `Вам необходимо иметь **👑Premium+** роль, чтобы пользоваться этой командой :point_up:`);
  		if (!member.voice_channel_id) return pm(userID, channelID, `Вы не находитесь в голосовой комнате.`);
  		const { voiceID, ch } = getPremRoom(member);
      if (!voiceID) return console.log(`No Prem Room for ${userID}`);
      const arr = Object.keys(ch.members).filter(x => x != userID);
      let text = 'Выберите, кому вы хотите дать права :white_check_mark::\n';
      if (arr.length > 0) {
      	arr.forEach((item, i) => {
      		if (i < list.length) {
      			text += `${list[i]}: <@${item}>\n`;
      		}
        });
        text += '*Или укажите с помощью команды: `!ban @user#1234`*';
      	bot.sendMessage({to: channelID, message: text}, (err, res) => {
      		if (err) return console.error(err);
      		friendMenu[res.id] = arr;
      		list.forEach((emoji, i) => {
      			if (i < arr.length) {
      				setTimeout(()=>bot.addReaction({channelID, messageID: res.id, reaction: emoji}), i*525);
      			}
      		});
      		setTimeout(()=>bot.deleteMessage({channelID, messageID: res.id}), 30000);
      	})
      } else {
      	console.log(`NoUsers in ${member.voice_channel_id} || userID: ${userID}`);
      }
  	} else if (list.includes(emoji)) {
  		if (banMenu[messageID]) {
  			const index = list.indexOf(emoji);
  			const banned = banMenu[messageID][index];
  			console.log(`user ${userID} banned ${banned}`);
  			banMe(userID, '', banned);
  		} else if (friendMenu[messageID]) {
  			const index = list.indexOf(emoji);
  			const friend = friendMenu[messageID][index];
  			const { voiceID, ch } = getPremRoom(member);
        if (!voiceID) return console.log(`No Prem Room for ${userID}`);
        const friends = Object.entries(ch.permissions.user).filter(([uID, perm]) => perm.allow === 19923968);
        if (friends.length >= 3) {
          pm(null, channelID, "Достигнут лимит по количеству друзей в Premium room :yum: Список добавленных друзей отправлен в ЛС :incoming_envelope:");
          const friendsList = friends.reduce((acc, curr) => {
            const [ uID ] = curr;
            const user = bot.users[uID];
            let string = "????#????";
            if (user) string = `${user.username}#${user.discriminator}`;
            return `${acc}${string}\n`;
          }, "");
          pm(userID, channelID, ` :clipboard: Список добавленных друзей:\n${friendsList}\nЧтобы удалить друга из друзей, напишите \`!un friend @user#1234\` в канале <#${vars.ch.premMenu}>`);
        } else {
          bot.editChannelPermissions({channelID: voiceID, userID: friend, allow: [10, 20, 21, 24]}, (err) => {
            if (err) return console.log(err);
            const embed = {
              color: 0x00cccc,
              description: `Теперь у пользователя <@${friend}> есть доп. привилегий к вашей комнате ${ch.name} :smiley:`
            };
            pm(null, channelID, "", embed);
          });
        }
  		}
  	}
  }
}

function reportAnswer(userID, channelID, messageID, embed, emoji) {
  pool.query("SELECT * from `reports` WHERE logsID = ?", messageID, function (error, results) {
    if (error) return console.error(error);
    if (results.length > 0) {
      let x = results[0];
      if (embed) bot.sendMessage({to: x.userID, embed});
      let message = `<@${x.userID}> жалуется на <@${x.accused}> причина: ${x.reason} :white_check_mark: <@${userID}>: ${emoji}`;
      bot.editMessage({channelID, messageID, message}, e => e ? console.error(e) : 0);
      let reaction = "✅";
      if (emoji === "💯" || emoji === "👎") reaction = "☑";
      bot.addReaction({channelID: vars.ch.report, messageID: x.messageID, reaction});
    } else {
      bot.sendMessage({to: userID, message: `Сообщение с ID ${messageID} не найдено в БД :disappointed_relieved:`});
    }
  });
	setTimeout(() => {bot.removeAllReactions({channelID, messageID})}, 1500);
}

// function getHistory (userID, channelID, seas = '8') {
//   let role;
//   let urlName = getPubgName(userID);
//   if (!urlName) {
//   	bot.sendMessage({to: channelID, message: `<@${userID}>, твой ник в дискорде должен совпадать с ником в игре PUBG :warning:`});
//   	return console.log(`no nickname | getHistory`);
//   }

//   let URL = 'https://pubg.op.gg/user/' + urlName;

//   new Promise((resolve, reject) => {
//     pool.getConnection(function(err, connection) {
//       if (err) return console.log(err);
//       connection.query('SELECT id FROM opgg WHERE nickname = ?', [urlName], function (error, results) {
//         if (error) console.log(error);
//         if (results.length > 0) {
//           connection.release();
//           if (results[0].id) resolve(results[0].id);
//           else reject(userID + " doesn't have ID: " + urlName);
//         } else {
//           let options = {url: URL, headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36'}};
//           request(options, function (err, res, body) {
//             if (!err && res.statusCode === 200) {
//               const api = body.match(/data-user_id="(\w{20,30})"/);
//               const nick = body.match(/data-user_nickname="([\w-]{4,22})"/);
//               if (api) {
//                 if (nick) urlName = nick[1];
//                 let packet = {nickname: urlName, id: api[1]};
//                 connection.query('INSERT INTO `opgg` SET ? ON DUPLICATE KEY UPDATE ?', [packet, packet]);
//                 resolve(api[1]);
//               } else {
//                 connection.query('INSERT IGNORE INTO `opgg` SET `nickname` = ?, `id` = ?', [urlName, null]);
//                 reject("Didn't find ID for url: " + URL);
//               }
//             } else {
//               if (!err) console.log(res.statusCode);
//               reject("some request mistake" + err);
//             }
//             connection.release();
//           });
//         }
//       });
//     });
//   }).then(api => {
//     let preApi = `https://pubg.op.gg/api/users/${api}/ranked-stats?season=2018-0${seas}&queue_size=`;
//     let squadURL = preApi + "4&mode=fpp";
//     let duoURL = preApi + "2&mode=fpp";
//     let soloURL = preApi + "1&mode=fpp";
//     let squadURLtpp = preApi + "4&mode=tpp";
//     let duoURLtpp = preApi + "2&mode=tpp";
//     let soloURLtpp = preApi + "1&mode=tpp";
//     let p1 = new Promise((resolve) => {
//       request(squadURL, function (err, res, body) {
//         let k;
//         try {
//           k = JSON.parse(body);
//         } catch (err) {
//           return console.log("_BAD_JSON: " + squadURL + "   err: " + err);
//         }
//         if (k.ranks) resolve(k.ranks.rating);
//         else resolve();
//       })
//     });
//     let p2 = new Promise((resolve) => {
//       request(duoURL, function (err, res, body) {
//         let k;
//         try {
//           k = JSON.parse(body);
//         } catch (err) {
//           return console.log("_BAD_JSON: " + squadURL + "   err: " + err);
//         }
//         if (k.ranks) resolve(k.ranks.rating);
//         else resolve();
//       })
//     });
//     let p3 = new Promise((resolve) => {
//       request(duoURLtpp, function (err, res, body) {
//         let k;
//         try {
//           k = JSON.parse(body);
//         } catch (err) {
//           return console.log("_BAD_JSON: " + squadURL + "   err: " + err);
//         }
//         if (k.ranks) resolve(k.ranks.rating);
//         else resolve();
//       })
//     });
//     let p4 = new Promise((resolve) => {
//       request(squadURLtpp, function (err, res, body) {
//         let k;
//         try {
//           k = JSON.parse(body);
//         } catch (err) {
//           return console.log("_BAD_JSON: " + squadURL + "   err: " + err);
//         }
//         if (k.ranks) resolve(k.ranks.rating);
//         else resolve();
//       })
//     });
//     Promise.all([p1, p2, p3, p4]).then(values => {
//       let num, arr = [];
//       values.forEach(item => {
//         if (!item) return;
//         arr.push(item);
//       });
//       if (arr.length > 0) {
//         num = Math.min.apply(null, arr);
//         let info = giveUniqRole(userID, false, num, topTiers, true);
//         if (info && info.roleID) {
//           bot.sendMessage({to: channelID, embed: {
//             color: 0x2ecc71,
//             description: `Поздравляем! Ты получил роль <@&${info.roleID}> :gem:\nНик: **${urlName}**, Сезон: **${seas}**`
//           }});
//         } else {
//           bot.sendMessage({to: channelID, embed: {
//             color: 0xe67e22,
//             description: `Ты не закончил ${seas} сезон в Top 500 :boom:\nНик: **${urlName}**, Режимы: **Duo & Squad**`
//           }});
//         }
//       } else {
//         bot.sendMessage({to: channelID, embed: {
//           color: 0xe67e22,
//           description: `Ты не закончил ${seas} сезон в Top 500 :disappointed_relieved:\nНик: **${urlName}**, Режимы: **Duo & Squad**`
//         }});
//       }
//     });
//   })
//   .catch(error => {
//     console.log(error);
//   });
// }

function giveUniqRole (userID, roles, num, obj = {}, bool = true) {
  const double = Object.entries(obj).sort((a, b) => (+a[0]) - (+b[0]));
  const keys = double.map(item => item[0]);
  const arr = double.map(item => item[1]);
  let j = 0, y = false, text = '', index, color, changed, changedColor, roleID = '';
  if (bool === "icon") {
    for (let i = 0; i < keys.length; i++) {
      if (num >= keys[i]) {
        roleID = arr[i];
        index = i;
      } else {
        break;
      }
    }
    return { roleID, index, text };
  }

  if (!roles) {
    try {
      roles = bot.servers[SERVER].members[userID].roles;
    } catch (err) {
      allUsers.get();
      return console.error(`ERROR! I can't take roles for ${userID} cuz: ${err.message}`);
    }
  }

  if (!num || double.length < 1) {
    for (let i = 0; i < roles.length; i++) {
      const check = arr.indexOf(roles[i]);
      if (check != -1) {
        Role.remove(userID, arr[check]);
        console.log(`Role was removed -> UserID: ${userID}, Role: ${keys[check]}`);
      }
    }
    return { roleID, index, text };
  }
  if (bool === "uniq") {
    for (let i = 0; i < keys.length; i++) {
      if (num == keys[i]) {
        roleID = arr[i];
        index = i;
        y = true;
        break;
      }
    }
  } else if (bool) {
    if (num <= keys[keys.length - 1]) {
      y = true;
      for (let i = 0; i < keys.length; i++) {
        if (num <= keys[i]) {
          roleID = arr[i];
          index = i;
          break;
        }
      }
    } else {
      y = false;
    }
  } else if (num >= keys[0]) {
    y = true;
    for (let i = 0; i < keys.length; i++) {
      if (num >= keys[i]) {
        roleID = arr[i];
        index = i;
      } else {
        break;
      }
    }
  } else {
    y = false;
  }
  if (y) {
    let check;
    for (let i = 0; i < roles.length; i++) {
      check = arr.indexOf(roles[i]);
      if (check === index) {
        j++;
        text = `Извини **<@${userID}>**, но твоя роль по-прежнему <@&${arr[index]}>`;
        color = 0x4f545c;
      } else if (check != -1) {
        if (j === 0) {
          text = `**<@${userID}>** твоя роль изменилась с <@&${arr[check]}> на <@&${arr[index]}>`;
          color = 0x49bd1a;
          Role.remove(userID, arr[check], roleID);
          console.log(`Role changed -> UserID: ${userID}, from ${keys[check]} to ${keys[index]}`);
        } else {
          Role.remove(userID, arr[check]);
        }
        j++;
      }
    }
    if (j === 0) {
      text = `Поздравляю **<@${userID}>**! Тебе присвоена роль <@&${arr[index]}>`;
      color = 0x49bd1a;
      Role.add(userID, roleID);
      console.log(`UserID: ${userID}, New Role: ${keys[index]} / ${num}`);
    }
  } else {
    if (bool === "uniq") text = `<@${userID}>, ты получил новую роль.`;
    else if (!bool) text = `<@${userID}>, у тебя должно быть больше 10 игр в командном режиме.`;
    else text = `<@${userID}>, твой ранг должен быть ниже <@&${arr[arr.length - 1]}>. Сейчас ты на #${num} месте.`;
    for (let i = 0; i < roles.length; i++) {
      const check = arr.indexOf(roles[i]);
      if (check != -1) {
        Role.remove(userID, arr[check]);
        console.log(`Role was removed -> UserID: ${userID}, Role: ${keys[check]}`);
      }
    }
  }
  return { roleID, index, text, color, changed, changedColor, name: keys[index] };
}

function dateFromID (id, num = false) {
  let sec = (+id).toString(2).slice(0, -22);
  sec = parseInt(sec, 2) + 1420070400000;
  if (num) {
    return Date.now()-sec;
  } else {
    let date = formatDate(sec);
    return date;
  }
}

function formatDate(date, time) {
  if (!(typeof date.getMonth === 'function')) date = new Date(date);
  let monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
  let month = monthNames[date.getMonth()];
  if (time) return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ' [' + date.getDate() + ' ' + month + ' ' + date.getFullYear() + ']';
  return date.getDate() + ' ' + month + ' ' + date.getFullYear();
}

const hideCh = {
  parents: ['361971372194398228', '361971765330837505', '564686665541484554', '564686556556689409', '564685943945297930'],
  parentsPrem: ['371230249398173708'],
  channels: {},
  getChannels() {
    console.log('Getting all voiceChannels');
    this.channels = {};
    let arr = [];
    for (let channelID in bot.servers[SERVER].channels) {
    	let ch = bot.servers[SERVER].channels[channelID];
    	if (this.parents.includes(ch.parent_id)) arr.push({ name: ch.name, position: ch.position, parentID: ch.parent_id, channelID: ch.id });
    }
    arr.sort((a,b) => a.position-b.position);
    arr.forEach((item)=>{
      let name = item.name.match(/.+(?=\b\d+$)/);
      if (name) {
        name = name[0].trim() + item.parentID.slice(-3);
        if (this.channels[name]) this.channels[name].push(item.channelID);
        else this.channels[name] = [item.channelID];
      }
    });
    for (let key in this.channels) {
      if (this.channels[key].length < 2) delete this.channels[key];
    }
  },
  check(channelID) {
  	if (channelID) {
      let ch = bot.servers[SERVER].channels[channelID];
      if (ch && this.parentsPrem.includes(ch.parent_id)) {
        if (ch.permissions.role[SERVER] && (ch.permissions.role[SERVER].deny & 1024)) {
          bot.editChannelPermissions({ channelID: channelID, roleID: SERVER, default: [10] }, logger);
        }
      }
    } else {
      for (let channelID in bot.servers[SERVER].channels) {
        let ch = bot.servers[SERVER].channels[channelID];
        if (this.parentsPrem.includes(ch.parent_id)) {
          if (Object.values(ch.members).length === 0) {
            if (ch.permissions.role[SERVER] && (ch.permissions.role[SERVER].deny & 1024)) ;
            else bot.editChannelPermissions({ channelID: ch.id, roleID: SERVER, deny: [10] }, logger);
          }
        }
      }
    }
    if (Object.keys(this.channels).length === 0) return this.getChannels();
    for (let arr of Object.values(this.channels)) {
      let i = 0, j = 0, free = arr.length > 7 ? (arr.length > 20 ? 3 : 2) : 1;
      arr.forEach(item => {
        let ch = bot.servers[SERVER].channels[item];
        if (!ch) {
          this.getChannels();
          return console.error("NoChannel: " + item);
        }
        if (Object.values(ch.members).length === 0) {
          let bool = 0;
          if (ch.permissions.role[SERVER] && (ch.permissions.role[SERVER].deny & 1024)) bool = 1;
          if (i < free) {
            if (bool) {
              bot.editChannelPermissions({ channelID: item, roleID: SERVER, default: [10] }, logger);
            }
            i++;
          } else if (!bool) {
            bot.editChannelPermissions({ channelID: item, roleID: SERVER, deny: [10] }, logger);
          }
        }
      })
    }
  },
}

function logger (err, res) {
  if (err) console.error(err);
}

function parseResponse(response = {}) {
  const content = {
    message: response.content || response.message || '',
  };
  if (response.embed) content.embed = response.embed;
  else if (typeof response === 'string' || typeof response === 'number') content.message = response;
  return content;
}

async function faceit(nickname, manual) {
  const connection = await pool2.getConnection();
  return connection.query('SELECT pubg.*, faceit.region, faceit.avatar from `pubg` LEFT JOIN faceit on pubg.name = faceit.nickname WHERE pubg.name = ?', nickname).then(([results]) => {
    if (results.length > 0) {
      let {faceit, pubg, name, id, region, avatar} = results[0];
      if (name) nickname = name;
      if (faceit && !manual) {
        return {faceit, region, avatar, pubg: id, nickname};
      } else if (pubg) {
        return {pubg, nickname};
      } else if (id) {
        let options = {
          url: `https://api.pubg.com/shards/pc-na/players?filter[playerNames]=${nickname}`,
          headers: {
            'accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${vars.apiKey}`
          }
        };
        return new Promise((resolve, reject) => {
          request(options, (err, res, body) => {
            if (!err && res.statusCode == 200) {
              let k = JSON.parse(body);
              if (k.data && k.data[0].id) {
                pubg = k.data[0].id;
                connection.query('UPDATE opgg SET ? WHERE ?', [{pubg}, {nickname}]);
                return resolve({pubg, nickname});
              } else {
                console.log(`No PUBG API ID for ${nickname}: `, k);
              }
            } else {
              if (res) return reject(`api.pubg error: ${res.statusCode} for ${nickname}`);
              return reject(`api.pubg request ERROR for ${nickname}`);
            }
          });
        });
      } else {
        reject(`There's no user with nickname: ${nickname}`);
      }
    } else {
      return Promise.reject(`There's no ${nickname} in table opgg!`);
    }
  }).then((data = {}) => {
    let {faceit, pubg, nickname, region, avatar} = data;
    if (!pubg) return Promise.reject(`PUBG player ID is required`);
    let options = {
      url: `https://open.faceit.com/data/v4/players?game=pubg&game_player_id=${pubg}`,
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${vars.faceitKey}`,
      }
    };

    if (faceit && region) options.url = `https://open.faceit.com/data/v4/rankings/games/pubg/regions/${region}/players/${faceit}?limit=2`;
    else if (faceit) options.url = `https://open.faceit.com/data/v4/players/${faceit}`;

    return new Promise((resolve, reject) => {
      request(options, (err, res = {}, body) => {
        if (!err && res.statusCode == 200) {
          let k = JSON.parse(body);
          if (faceit && region) {
          	if (k.items) k = k.items[0]
          	else return reject(`BIG MISTAKE ${nickname}`);
          }
          if (!k || k.player_id == null) return reject(`No faceit id for ${nickname}`);
          if (k.avatar) avatar = k.avatar;
          let nick = k.nickname;
          if (!faceit) {
            faceit = k.player_id;
            connection.query('UPDATE pubg SET ? WHERE ?', [{faceit}, {name: nickname}]);
          }
          let elo = 0, skill = 0, place = 0, country = "";
          if (k.games && k.games.pubg) {
            elo = Math.round(k.games.pubg.faceit_elo) || 0;
            skill = Math.round(k.games.pubg.skill_level) || 0;
            if (k.games.pubg.region) region = k.games.pubg.region;
          } else if (k.faceit_elo) {
          	elo = Math.round(k.faceit_elo) || 0;
            skill = Math.round(k.game_skill_level) || 0;
            place = parseInt(k.position) || 0;
            if (k.region) region = k.region;
            country = k.country;
          }
          options.url = `https://open.faceit.com/data/v4/players/${faceit}/stats/pubg`;
          request(options, (err, res, body) => {
            if (!err && res.statusCode == 200) {
              let k = JSON.parse(body) || {};
              let {lifetime} = k;
              if (!lifetime) return reject(`No lifetime stats for ${nickname}`);
              let adr = Math.round(lifetime["Average Damage Dealt"]);
              let rank_avg = parseFloat(lifetime["Average Placement"]);
              let kd = parseFloat(lifetime["K/D Ratio"]);
              let matches = parseInt(lifetime["Total Matches"].replace(",", ""), 10);
              let wins = parseInt(lifetime["Wins"], 10);
              let top10 = parseInt(lifetime["Top 10 Finish"].replace(",", ""), 10);
              let obj = {nick, avatar, nickname, elo, place, skill, region, country, kd, adr, rank_avg, matches, wins, top10};
              connection.query("INSERT INTO faceit SET ? ON DUPLICATE KEY UPDATE ?", [obj, obj]).catch(e => {
                console.error(e);
                console.log(obj);
              });
              connection.release();
              if (!place) obj.recent = lifetime["Recent Placements"].filter(a => a).slice(0,3).join(", ");
              return resolve(obj);
            } else {
            	let tex = '';
            	if (res) text = res.statusCode;
              return reject(`2nd faceit error: ${tex} for ${nickname}`);
            }
          });
        } else {
        	let tex = '';
          if (res) text = res.statusCode;
          return reject(`1st faceit error: ${tex} for ${nickname}`);
        }
      })
    })
  }).catch(e => {
    connection.release();
    if (e instanceof Error) console.error(e);
    // else console.log(e);
  })
}

function getPubgName(userID) {
  return pool2.query('SELECT pubg from registrations WHERE serverID = ? AND userID = ?', [SERVER, userID])
    .then(([results]) => {
      console.log(`getPubgName: ${results[0] && results[0].pubg} [${userID}]`);
      return results[0] && results[0].pubg;
    }).catch(e => {
      console.error('getPubgName error: ', e);
    });
}

function pubgName(event) {
	let nickname;
	if (/^\d{16,}$/.test(event)) {
		const userID = event;
		try {
			nickname = (bot.servers[SERVER].members[userID].nick || bot.users[userID].username).replace(/\[.*?]/, "");
		} catch (e) {
			nickname = "?";
		}
		nickname = reg.b1.exec(nickname) || undefined;
		if (nickname) nickname = nickname[0];
	}	else if (typeof event === 'string') {
		nickname = reg.b1.exec(event) || undefined;
		if (nickname) nickname = nickname[0];
	} else {
		if (event.d.mentions[0]) {
			const userID = event.d.mentions[0].id;
			try {
				nickname = (bot.servers[SERVER].members[userID].nick || bot.users[userID].username).replace(/\[.*?]/, "");
			} catch (e) {
				nickname = "?";
			}
			nickname = reg.b1.exec(nickname) || undefined;
			if (nickname) nickname = nickname[0];
		} else if (event.d) {
			const userID = event.d.author.id;
			try {
				nickname = (bot.servers[SERVER].members[userID].nick || bot.users[userID].username).replace(/\[.*?]/, "");
			} catch (e) {
				nickname = "?";
			}
			nickname = reg.b1.exec(nickname) || undefined;
			if (nickname) nickname = nickname[0];
		}
	}
	return nickname;
}

function pm(userID, channelID, message = '', embed) {
  if (!message && !embed || !userID && !channelID) return console.error("PM exception");
  if (!userID) {
    return bot.sendMessage({to: channelID, message, embed}, function(err, res) {
      if (err) return console.error(err);
      setTimeout(() => bot.deleteMessage({channelID: channelID, messageID: res.id}), 30000);
    });
  }
  bot.sendMessage({to: userID, message, embed}, function(err) {
    if (err) {
      if (channelID) bot.sendMessage({to: channelID, message, embed}, function(err, res) {
        if (err) return console.error(err);
        setTimeout(() => bot.deleteMessage({channelID: channelID, messageID: res.id}), 30000);
      });
    }
  });
}

function getAva(userID) {
	const user = bot.users[userID];
	if (!user) return 'https://i.imgur.com/dAHtZyb.png';
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${userID}/${user.avatar}.png`;
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator, 10) % 5}.png`;
}

function faceitIMG({
  nickname, nick, region, avatar, elo, kd, skill = 0,
  adr, wins, top10, matches, place, rank_avg, recent
}) {
  return new Promise((resolve, reject) => {
    const top10_rate = Math.round((top10/matches)*1000)/10 + '%';
    const wr = Math.round((wins/matches)*1000)/10 + '%';
    let template = './temp/faceit.png';
    if (!place) {
      template = './temp/faceit2.png';
      place = recent;
    }
    if (!region) region = "EU";
    if (!avatar) avatar = 'https://i.imgur.com/hEtD7xs.png';
    request(avatar).pipe(fs.createWriteStream('./temp/f_ava.png').on('finish', () => {
      let arr = [
        Jimp.read(template),
        Jimp.read('./temp/f_ava.png'),
        Jimp.loadFont('./temp/f48.fnt'),
        Jimp.loadFont('./temp/f36o.fnt'),
        Jimp.loadFont('./temp/f36g.fnt'),
        Jimp.loadFont('./temp/f24.fnt'),
        Jimp.read(`./temp/skill/${skill}.png`),
        Jimp.read(`./temp/ico/${region}.png`),
      ];
      Promise.all(arr).then(([img, ava, f48, f36o, f36g, f24, ico1, ico2]) => {
        ava.resize(160,160);
        img.print(f48, 299-3, 44-3, nickname)
          .print(f24, 353-2, 101-1, nick)
          .print(f36o, 351-measureText(f36o, elo), 215, ""+elo)
          .print(f36g, 351-measureText(f36g, kd), 300, ""+kd)
          .print(f36o, 351-measureText(f36o, wr), 385, wr)
          .print(f36g, 351-measureText(f36g, matches), 470, ""+matches)
          .print(f36o, 478+351-measureText(f36o, place), 215, ""+place)
          .print(f36g, 478+351-measureText(f36g, adr), 300, ""+adr)
          .print(f36o, 478+351-measureText(f36o, top10_rate), 385, top10_rate)
          .print(f36g, 478+351-measureText(f36g, rank_avg), 470, ""+rank_avg)
          .composite(ava, 0, 0)
          .composite(ico1, 177, 26)
          .composite(ico2, 299, 94)
          // .write('lena-small-bw.png');
          .getBuffer(Jimp.MIME_PNG, (error, result) => {
            if (error) {
              console.error(error);
              return reject("Can't save the img");
            }
            resolve({
              file: result,
              filename: `${nick}_faceit.png`,
            });
          });
      }).catch((err) => {
        console.error(err);
        reject("Can't load all images");
      });
    }));
  });
}

function isStaff(roles) {
  if (roles.includes(vars.role.staff) || roles.includes(vars.role.sun)) {
    return true;
  }
  return false;
}

function banLogs(action, msgLog, note = "") {
  if (note) note = ":" + note;
  let banList = vars.ch.logs;
  if (/vip|premium|stats/.test(action)) banList = vars.ch.premiumLogs;
  setTimeout(() => bot.sendMessage({to: banList, message: `:heavy_minus_sign: <@${msgLog.user_id}> убрал роль <@&${msgLog.roleID}> c пользователя <@${msgLog.target_id}>${note}`}), 2100);
}

function unban(action, userID, channelID, note, byUser) {
  let roles = [];
  try {
    roles = bot.servers[SERVER].members[userID].roles;
  } catch (err) {
    console.error("UnBan ERROR: ", err.message);
    bot.sendMessage({to: vars.ch.logs, message: ` -> Пользователь <@${userID}> покинул сервер :door: `});
    note = "silent";
    channelID = "";
    let newAction = action;
    if (newAction === 'mute') newAction = 'chatmute';
    else if (newAction === 'bangood') newAction = 'flood';
    else if (newAction === 'banwtf') newAction = 'voicemute';
    else if (newAction === 'banall') newAction = 'ban_all';
    pool.query('UPDATE IGNORE bans SET ?? = NULL WHERE userID = ? AND server = 1', [newAction, userID], function (error) {
      if (error) return console.error(error);
    });
  }
  if (note != "silent") banLogs(action, {user_id: byUser, target_id: userID, roleID: vars.role.action[action]}, note);
  if (action === "banall") action = "ban_all";
  if (action === "ban") {
      if (roles.includes(vars.role.action[action])) bot.removeFromRole({serverID: SERVER, roleID: vars.role.action[action], userID: userID});
      if (channelID) bot.sendMessage({to: channelID, message: `:white_check_mark: Бан успешно снят с <@${userID}>. Надеемся на твою добропорядочность :upside_down: [by <@${byUser}>]`});
      pool.query('UPDATE IGNORE bans SET ban = NULL WHERE userID = ? AND server = 1', userID, function (error) {
        if (error) return console.error(error);
      });
  } if (action === "ban_all") {
    if (roles.includes(vars.role.action[action])) bot.removeFromRole({serverID: SERVER, roleID: vars.role.action[action], userID: userID});
    if (channelID) bot.sendMessage({to: channelID, message: `:white_check_mark: Глобальный бан успешно снят с <@${userID}>. Надеемся на твою добропорядочность :upside_down: [by <@${byUser}>]`});
    pool.query('UPDATE IGNORE bans SET ban_all = NULL WHERE userID = ? AND server = 1', userID, function (error) {
      if (error) return console.error(error);
    });
  } else if (action === "bangood") {
      if (roles.includes(vars.role.action[action])) bot.removeFromRole({serverID: SERVER, roleID: vars.role.action[action], userID: userID});
      if (channelID) bot.sendMessage({to: channelID, message: `Бан в **Общение Good** для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
      pool.query('UPDATE IGNORE bans SET flood = NULL WHERE userID = ? AND server = 1', userID, function (error) {
        if (error) return console.error(error);
      });
  } else if (action === "banwtf") {
    if (roles.includes(vars.role.action[action])) bot.removeFromRole({serverID: SERVER, roleID: vars.role.action[action], userID: userID});
    if (channelID) bot.sendMessage({to: channelID, message: `Бан в **Общение WTF** для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
    pool.query('UPDATE IGNORE bans SET voicemute = NULL WHERE userID = ? AND server = 1', userID, function (error) {
      if (error) return console.error(error);
    });
  } else if (action === "mute") {
    if (roles.includes(vars.role.action[action])) bot.removeFromRole({serverID: SERVER, roleID: vars.role.action[action], userID: userID});
    if (channelID) bot.sendMessage({to: channelID, message: `Текстовый мут для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
    pool.query('UPDATE IGNORE bans SET chatmute = NULL WHERE userID = ? AND server = 1', userID, function (error) {
      if (error) return console.error(error);
    });
  } else if (action === "premium") {
    if (!roles) return console.error(`No roles for ${userID}`);
    const { roomNumber, voiceID, roleID, ch } = getPremRoom(roles);
    if (roomNumber) {
      bot.editRole({serverID: SERVER,
        roleID,
        name: `Prem ${roomNumber} - свободно`,
        color: 0,
      });
      if (!ch) return console.log(`PREM error: userID: ${userID}, room: ${roomNumber}`);
      let i = 1;
      for (let key in ch.permissions.user) {
        setTimeout(() => {
          bot.deleteChannelPermission({
            channelID: voiceID,
            userID: key
          });
          console.log(`Deleted permission for userID: ${key} in Prem Room ${roomNumber}`);
        }, i++*1100);
      }
      bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [10]}); // wtf is this?
      bot.editChannelInfo({channelID: voiceID, name: `👑Premium ${roomNumber}`, user_limit: 4}, e => e ? console.error(e) : 0);
      if (channelID) bot.sendMessage({to: channelID, message: `Игрок <@${userID}> больше не является **Premium** пользователем :disappointed_relieved: `});
    } else if (channelID) {
      bot.sendMessage({to: channelID, message: `:warning: Пользователь <@${userID}> не является **Premium** пользователем.`});
    }
    if (roleID) Role.remove(userID, roleID);
    pool.query('UPDATE IGNORE bans SET premium = NULL WHERE userID = ? AND server = 1', userID, function (error) {
      if (error) return console.error(error);
    });
    if (roles.includes(vars.role.premium)) Role.remove(userID, vars.role.premium);
    if (roles.includes(vars.role.premiumPlus)) Role.remove(userID, vars.role.premiumPlus);
    if (roles.includes(vars.role.stats)) Role.remove(userID, vars.role.stats);
  } else if (action === 'stats') {
    pool.query("DELETE FROM subscriptions WHERE userID = ? AND sub = 'stats' AND server = ?", [userID, SERVER]);
    if (roles.includes(vars.role.stats)) Role.remove(userID, vars.role.stats);
    // if (channelID) bot.sendMessage({to: channelID, message: `Игрок <@${userID}> больше не является **STATS** пользователем :disappointed_relieved: `});
  }
}

function addLogs(action, msgLog, note = "") {
  if (note) note = (": " + note).trim();
  let banList = vars.ch.logs;
  if (action.includes("premium") || action == 'stats') banList = vars.ch.premiumLogs;
  setTimeout(() => bot.sendMessage({to: banList, message: `:small_orange_diamond: <@${msgLog.user_id}> добавил роль <@&${msgLog.roleID}> пользователю <@${msgLog.target_id}>${note}`}), 2100);
}

function unbanMe(userID, channelID, a) {
  let member = bot.servers[SERVER].members[userID];
  // if (!roles.includes(actionRoles.premium))
  //   return bot.sendMessage({to: userID, message: `Вам необходимо иметь **Premium+** роль, чтобы пользоваться этой командой :point_up:`});
  let { roomNumber, voiceID, ch } = getPremRoom(member);
  if (!roomNumber) return bot.sendMessage({to: userID, message: `Вам необходимо иметь Premium роль, чтобы пользоваться этой командой :exclamation:`});
  if (ch.permissions.user[a]) {
    bot.deleteChannelPermission({channelID: voiceID, userID: a});
    bot.sendMessage({to: userID, embed: {
      color: 0x49bd1c,
      description: `<@${a}> был удалён из бан-листа вашей комнаты **${ch.name}**`
    }});
  } else {
    bot.sendMessage({to: userID, embed: {
      color: 0xe67e22,
      description: `У <@${a}> и так был доступ к комнате **${ch.name}**`
    }});
  }
}

function measureText(font, text) {
  text += "";
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    if (font.chars[text[i]]) {
      x += font.chars[text[i]].xoffset
        + (font.kernings[text[i]] && font.kernings[text[i]][text[i + 1]] ? font.kernings[text[i]][text[i + 1]] : 0)
        + (font.chars[text[i]].xadvance || 0);
    }
  }
  return x/2;
};

function replyAndClear(channelID, message, embed) {
	bot.sendMessage({to: channelID, message, embed}, function(err, res) {
    if (err) return console.error(err);
    setTimeout(() => bot.deleteMessage({channelID, messageID: res.id}), 30000);
  });
}

function getID (nickname, withRegion) {
  return new Promise((resolve, reject) => {
    if (!nickname) return reject(i18.t([`${vars.lng}:error.wrongnick`, 'error.wrongnick']));
    pool2.query('SELECT id from opgg WHERE ?', { nickname }).then(([results]) => {
      if (results.length > 0 && !withRegion) {
        if (results[0].id) resolve(results[0].id);
        else reject(i18.t([`${vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
      } else {
        request({
          url: `https://pubg.op.gg/user/${nickname}`,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36' },
        }, (err, res, body) => {
          if (!err && res.statusCode === 200) {
            const api = body.match(/data-user_id="(\w{20,30})"/);
            const nick = body.match(/data-user_nickname="([\w-]{4,22})"/);
            const mode = body.match(/data-status="([tf]pp)"/);
            if (api) {
              if (nick) nickname = nick[1];
              pool2.query('INSERT INTO `opgg` SET ? ON DUPLICATE KEY UPDATE ?', [{ nickname, id: api[1] }, {id: api[1]}]);
              if (withRegion) resolve({api: api[1], mode: mode[1], nickname});
              else resolve(api[1]);
            } else {
              pool2.query('INSERT IGNORE INTO `opgg` SET ?', { nickname, id: null });
              reject(i18.t([`${vars.lng}:error.nouser`, 'error.nouser'], { nickname }));
            }
          } else {
            const temp = res ? res.statusCode : 'null';
            reject(i18.t([`${vars.lng}:error.http.${temp}`, `error.http.${temp}`, 'error.http.null']));
          }
        });
      }
    }).catch(console.error);
  });
}
