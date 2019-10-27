const Discord = require('discord.io');
const request = require('request'),
    reg = require('./const.js'),
    Jimp = require('jimp'),
    agentClass = require('socks5-https-client/lib/Agent'),
    mysql = require('mysql');

const dbConfig = {
  connectionLimit 	: 3,
  host            	: 'localhost',
  user            	: 'admin',
  password        	: 'cs16Go2019DiscordzZ',
  database        	: 'old',
  supportBigNumbers	: true,
};

const agentOptions = {
  socksHost: '217.29.63.159',
  socksPort: 29228,
  socksUsername: 'dD2Etj',
  socksPassword: 'dz05FM',
}

var pool;

function handleDisconnect() {
  pool = mysql.createPool(dbConfig);
  pool.getConnection(function(err, dbConnection) {
    if (err) {
      setTimeout(handleDisconnect, 2000);
      return console.log("First ERROR db");
    }
    dbConnection.query("SELECT 1", function(err) {
      dbConnection.release() // return to the pool
      if (err) { console.log("Second ERROR db"); return }
    });
  });
}

handleDisconnect();

const bot = new Discord.Client({
  token: "NDU3MjEyODM3MzIwOTgyNTM5.XSFdFA.ydIYdtuQdbSZt60Z7VtdYnIJdiE",
  autorun: true
});

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  bot.setPresence({game: {name: "Dota 2", type: 0, url: null}});
  bot.getAllUsers();
  chMessages.initialize();
});

bot.once("allUsers", function() {
  let i = Object.keys(bot.servers[SERVER].members).length;
  console.log("Number of users: " + i);
});

const allUsers = {
	data: Date.now(),
	get() {
		const time = Date.now();
		if (time - this.date > 300000) {
			this.date = time;
      bot.getAllUsers();
      console.log("allUsers query...");
		}
  },
  update() {
    console.log("Start: " + (new Date).toLocaleString())
    bot.getAllUsers();
    setTimeout(()=> {
      console.log("Received all users from " + SERVER);
      pool.query('SELECT * FROM bans_dota2', (error, results) => {
        if (error) return console.error(">> clear-bans ERROR: ", error.message);
        if (results.length > 0) {
          results.forEach((item, i) => {
            let userID = item.userID;
            if (!bot.servers[SERVER].members[userID]) {
              setTimeout(() => {
                pool.query('DELETE FROM bans_dota2 WHERE `userID` = ?', [userID], (error) => {
                  if (error) return console.log(error.message);
                  console.log("Deleted the whole record from bans: " + userID);
                });
              }, i*1015);
            }
          })
        }
      });
    }, 15000);
  }
}

const SERVER = "482619342131822592";

const steamKey = "A82A9996471552013B703731024C9136";
let onlineDota = [];

const actionRoles = {
  'ban': '457216866117746688',
  'bangood': '457217471674318849',
  'banwtf': '457217853569892352',
  'mute': '444801793634074624',
  'vip': '457225718729015316',
  'premium': '457224560190947339',
  'logs': '457229922776383488',
  'report_logi': '457230278679855114',
  'premiumlogs': '457230040778801162',
  'mod_channel': '456447384482873354',
  'stats_channel': '457228424810070016',
  'premTable': '457497327566061578',  // add later
  'banTable': '457238597297373185',   // add later
  'premium_room': '457233281876754432',
  'report_room': '445163145980542976',
  'mypubgrole': '000000000000000000', // deleted role
  'kick_room': '383744926317281300',
  'search_room': '444944160718323715',
  'wtf_room': '442728925689413634',
  'stream_role': '457224556906676240',
  'stream_live': '457224556344770560',
  'vip_parent1': '442734346126884894',
  'vip_parent2': '000000000000000000',
  'prem_parent1': '442734043562377216',
  'prem_parent2': '000000000000000000',
  'event_parent': '000000000000000000',
  'moderator': '457224554217996289',
  'admin': '369226949572165632',
  'flood_parent': '442728446255169536',
  'afk_parent': '380096429122781194',
  'rating_parent': '443427893738078222',
  'carry': '457225721576947712',
  'mider': '457225721509576727',
  'offlaner': '457225722046447638',
  'sup4': '457225724798042123',
  'sup5': '457225724798042123',
  'no_role': '457228318337531905',
  'bot_dm': '457230127240052746',
  'logi_enter_exit': '458566864881057802',
  'info_pravila': '379735520760168451',

}

const vars = {
  img: {
    footer: 'https://i.imgur.com/fNp6uEN.png',
    vip_thumb: "https://i.imgur.com/IdL7Evu.png",
    prem_thumb: "https://cdn.discordapp.com/attachments/356521538247458827/438658363178483713/premium.png",
    hideon_thumb: "https://i.imgur.com/BkChHf7.png",
    hideoff_thumb: "https://i.imgur.com/DRv3JHo.png",
    ban_thumb: "https://cdn.discordapp.com/attachments/439448610019737611/443504474049347584/ban.gif",
    mute_thumb: "https://cdn.discordapp.com/attachments/439448610019737611/443518510241546240/text_mute2.gif",
    bangood_thumb: "https://cdn.discordapp.com/attachments/439448610019737611/443771316655489024/good_WTF.png",
    banwtf_thumb: "https://cdn.discordapp.com/attachments/439448610019737611/443771316655489024/good_WTF.png",
  }
}

const rankTiers = {0: "Без ранга", 1: "Рекрут", 2: "Страж", 3: "Рыцарь", 4: "Герой", 5: "Легенда", 6: "Властелин", 7: "Божество", 8: "Титан"};
const dotaRoles = {0: '457228320069779497', 10: '457263640832245781', 11: '457263640265883658', 12: '457263546900676608', 13: '457263546217005068', 14: '457263544358928385', 15: '457263295536168960', 
20: '457227244675530773', 21: '457227244574605314', 22: '457227182817935370', 23: '457227182482128899', 24: '457227180938625035', 25: '457227169463009301', 
30: '457263294382866435', 31: '457263294005248001', 32: '457263185410392064', 33: '457263184206626819', 34: '457263182088765460', 35: '457263183837528064', 
40: '457227169429454858', 41: '457227169077395471', 42: '457227165969416204', 43: '457227165604380682', 44: '457227164803137537', 45: '457227164341895178', 
50: '457227164245557261', 51: '457227163968733195', 52: '457227162500595743', 53: '457227161871319091', 54: '457227161397362739', 55: '457227117235798016', 
60: '457227116640206848', 61: '457227115994284036', 62: '457227115230920716', 63: '457227114517889045', 64: '457227113997795358', 65: '457227113926492161', 
70: '457225728724041730', 71: '457225728501743646', 72: '457225728438829066', 73: '457225725192306688', 74: '457225724869345290', 75: '457225724860956673', 76: '457304951937302539',
80: '457484685346603008', 81: '457484766380294144', 82: '457484909871759370', 83: '457484936874688523', 84: '457484956139126784'};

const gpm_ids = ['457264562752847882', '457264001596915713', '457264007234060299', '457264005439029266', '457264014565703684', '457264132069261323', '457264016583163904', '457264012170756107', '457264009649979393', '457264003299934243', '457263996379201538', '457263988611350538'];
const gpm_names = [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700];

const epm_ids = ['457228021737193473', '457228021158510623', '457228019728252940', '457228019661275149', '457227247879847944', '457227247594635285', '457227247275737090', '457227245484769292', '457264660228603914', '457264661688090626', '457264665542656040', '457264660685520897'];
const epm_names = [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700];

const lineRoles = {
  'carry': '457225721576947712',
  'mider': '457225721509576727',
  'offlaner': '457225722046447638',
  'sup4': '457225724680470535',
  'sup5': '457225724798042123',
  'norole': '457228318337531905',
}

const dotaEmojis = {0: '🕵', 'slot': '<:slot:457308923821817859>', 'last_hits': '<:last_hits:457308406261350410>', 'gold': '<:gold_per_min:457307640322588672>', 'xp': '<:xexp_per_min:457307788100763648>', 20: '<:20:443104925984227330>', 10: '<:10:443104926541938718>', 12: '<:12:443104926650859521>', 11: '<:11:443104926684413962>', 15: '<:15:443104926726488075>', 40: '<:40:443104926751522817>', 14: '<:14:443104926755848202>', 22: '<:22:443104926990598144>', 
13: '<:13:443104926994792469>', 24: '<:24:443104927062163458>', 70: '<:70:443104927171215360>', 72: '<:72:443104927229804544>', 75: '<:75:443104927276072971>', 21: '<:21:443104927296913418>', 71: '<:71:443104927305433122>', 30: '<:30:443104927368216577>', 23: '<:23:443104927376736256>', 31: '<:31:443104927389319191>', 25: '<:25:443104927406096384>', 42: '<:42:443104927569543170>', 41: '<:41:443104927619743745>', 34: '<:34:443104927636783115>', 44: '<:44:443104927791972362>', 
61: '<:61:443104927812943903>', 50: '<:50:443104927833653250>', 45: '<:45:443104927842304000>', 73: '<:73:443104927917539348>', 43: '<:43:443104927921864704>', 74: '<:74:443104927930384394>', 63: '<:63:443104927955288075>', 33: '<:33:443104927984910336>', 64: '<:64:443104928064471041>', 62: '<:62:443104928081379339>', 32: '<:32:443104928093700114>', 60: '<:60:443104928148357120>', 35: '<:35:443104928185974784>', 51: '<:51:443104928337100829>', 65: '<:65:443104928341426186>', 
54: '<:54:443104928420855808>', 53: '<:53:443104928442089503>', 55: '<:55:443104928693747712>', 52: '<:52:443104928819445761>', 80: '<:titan:457485851111325706>', 81: '<:top1000:457485851543207938>', 82: '<:top100:457485852117827608>', 83: '<:top10:457485851346206722>', 84: '<:top1:457485852549971990>'};

const countEmojis = {
  0: '🔒',
  1: '<:1_:457317321774727168>',
  2: '<:2_:457317321883648000>',
  3: '<:3_:457317321862545459>',
  4: '<:4_:457317321841573898>',
  5: '<:5_:457317321959276545>',
  6: '<:6_:457317321577332748>',
  7: '<:7_:457317321367748609>',
  8: '<:8_:457317321195913227>',
  9: '<:9_:457317321665413141>',
  10: '<:__:457317321447571484>',
  11: '<:__:457317321447571484>',
  12: '<:__:457317321447571484>',
  13: '<:__:457317321447571484>',
  14: '<:__:457317321447571484>',
  15: '<:__:457317321447571484>',
  16: '<:__:457317321447571484>',
  17: '<:__:457317321447571484>',
  18: '<:__:457317321447571484>',
  19: '<:__:457317321447571484>',
  20: '<:__:457317321447571484>',
  21: '<:__:457317321447571484>',
  22: '<:__:457317321447571484>',
  23: '<:__:457317321447571484>',
  24: '<:__:457317321447571484>'
}

function getRankTier(rank) {
  if (rank) {
    rank += "";
    return rankTiers[rank[0]] + ` [${rank[1]}]`;
  } else {
    return "Без ранга";
  }
}

const vipRooms = {
  1: '457293536434585601',
  2: '457293580617252864',
  3: '457293618953191457',
  4: '457293666927640576',
  5: '457998562798731267',
  6: '457998612555890699',
  7: '457998651340488704',
  8: '457998724246011904',
  9: '457998757011783692',
  10: '457998791552008202',
}

const premRooms = {
  1: '457294387509067804',
  2: '457294446090780673',
  3: '457294493289283594',
  4: '457294525048553502',
  5: '457998958434975744',
  6: '457999030354575360',
  7: '457999251239206923',
  8: '457999333963464704',
  9: '457999360857341962',
  10: '457999400963276810',
}

let king = {
  date: new Date(),
  throttling: Date.now(),
  ch: "443109213925933056",
  bossRole: "442732235833999412",
  man: "",
  manMSG: "",
  start: false,
  nextStart: false,
  end: "",
  bool: false,
  msgID: "443132763994849300",
  orig: {},
  votes: {},
  smiles: ["🏆", "🥈", "🥉"],
  chMembers: [],
  voters: [],
  emoji: [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:", ":regional_indicator_a:", ":regional_indicator_b:", ":regional_indicator_c:", ":regional_indicator_d:", ":regional_indicator_e:", ":regional_indicator_f:", ":regional_indicator_g:", ":regional_indicator_j:", ":regional_indicator_k:"],
  check() {
    if (!this.start()) return true;
    if (this.end && this.end - Date.now() < 0) {
      let myArr = this.sort();
      if (myArr[0]) {
        this.man = myArr[0][0];
      } else {
        this.man = "226360808077131777";
      }
      this.newDate();
      this.end = "";
      bot.editMessage({channelID: this.ch, messageID: this.msgID, message: '',
        embed: {
          color: 0,
          description: `:crown: Поздравляем по результатом голосования <@${this.man}> теперь новый **BOSS** комнаты **Общение WTF** :sunglasses: `,
          timestamp: new Date(this.nextStart),
          author: {
            name: 'Выборы завершены!',
            icon_url: 'https://i.imgur.com/TtpTXoG.jpg'
          },
          thumbnail: { url: "https://cdn.discordapp.com/attachments/356521538247458827/440620972593119233/boss2.png" },
          footer: { icon_url: "https://i.imgur.com/oxyIvmq.png", text: 'След. выборы ( при достижении 10 чел.):' }
        }
      });
      pm(this.man, this.ch, `**Вы выиграли! теперь Вам доступно: **\n\n- На канале <#${actionRoles.search_room}> уникальная  картинка;\n- Ваша роль выделена уникальным цветом;\n- Ваша роль отделена от остальных участников;\n\nС ув. **Администрация**`)
      addRole(this.man, this.bossRole);
      return true;
    }
    return false;
  },
  post(userID, channelID, voter) {
    if (this.nextStart > Date.now()) {
      return bot.sendMessage({to: voter, message: `Голосование не активно :warning: След. выборы через ${howmuchtime(+this.nextStart - Date.now())}.`});
    } else if (this.nextStart && this.nextStart < Date.now()) {
      this.end = "";
      this.bool = true;
      this.nextStart = false;
      this.orig = {};
      this.votes = {};
      this.voters = [];
      bot.removeFromRole({serverID: SERVER, roleID: this.bossRole, userID: this.man});
      this.start();
      return;
    }
    if (this.check()) return;
    if (userID) {
      if (!this.voters.includes(voter)) {
        this.voters.push(voter);
        console.log("New voter: " + voter);
        this.orig[userID] ? this.orig[userID]++ : this.orig[userID] = 1;
        this.votes[userID] ? this.votes[userID].push(voter) : this.votes[userID] = [voter];
      } else {
        bot.sendMessage({to: voter, message: `Голосовать можно только 1 раз!`});
      }
    }
    let myArr = this.sort(), text = "";
    myArr.forEach((item, i) => {
      let end = "", add = this.emoji[i];
      if (i < 3) add = this.smiles[i] + " " + (i+1) + ".";
      else add = (i+1) + ".";
      text += `${add} <@${item[0]}> - **${sklonWord(item[1], "голос")}**\n`;
    });
    let myMessage = {to: channelID, channelID: channelID, messageID: this.msgID, message: '',
      embed: {
        color: Math.floor(Math.random()*16777215),
        description: text,
        timestamp: this.endDate(),
        author: {
          name: 'Выборы! Чтобы проголосовать напиши: + @ник',
          icon_url: 'https://i.imgur.com/TtpTXoG.jpg'
        },
        footer: { icon_url: "https://i.imgur.com/oxyIvmq.png", text: 'Конец голосования:' }
      }
    }
    this.msgID ? bot.editMessage(myMessage) : bot.sendMessage(myMessage, function(err, res) {
      if (err) return console.log(err);
      king.msgID = res.id;
    });
  },
  sort() {
    let sortable = [];
    for (let userID in this.orig) {
      sortable.push([userID, this.orig[userID]]);
    }
    sortable.sort(function(a, b) {
      return b[1] - a[1];
    });
    return sortable;
  },
  endDate() {
    if (this.end) {
      return this.end
    } else {
      let time = 15 * 60 * 1000; // 15 * 60 * 1000
      this.end = new Date(Date.now() + time);
      return this.end;
    }
  },
  newDate() {
    if (this.nextStart) {
      return this.nextStart
    } else {
      let time = 4 * 60 * 60 * 1000; // 4 * 60 * 60 * 1000
      let my = new Date(Date.now() + time);
      this.nextStart = +my;
      return this.nextStart;
    }
  },
  start() {
    if (this.end || this.nextStart) return true;
    let myDate = Date.now();
    if (myDate - this.throttling < 2500) return false;
    else this.throttling = myDate;
    let channelID = king.ch;
    let ch = bot.servers[SERVER].channels[actionRoles.wtf_room];
    let mention = "";
    this.chMembers = Object.keys(ch.members).map(function(key) {
      mention += `<@${key}>, `;
      return key;
    });
    if (this.chMembers.length > 9) {
      let text = "Запущены новые выборы!\nГолосовать можно только за участников из комнаты **Общение WTF**";
      let myMessage = {to: channelID, channelID: channelID, messageID: this.msgID, message: '',
        embed: {
          color: Math.floor(Math.random()*16777215),
          description: text,
          timestamp: this.endDate(),
          author: {
            name: 'Выборы! Чтобы проголосовать напиши: + @ник',
            icon_url: 'https://i.imgur.com/TtpTXoG.jpg'
          },
          footer: { icon_url: "https://i.imgur.com/oxyIvmq.png", text: 'Конец голосования:' }
        }
      }
      this.msgID ? bot.editMessage(myMessage) : bot.sendMessage(myMessage, function(err, res) {
        if (err) return console.log(err);
        king.msgID = res.id;
      });
      setTimeout(()=> {
        bot.sendMessage({to: channelID, message: mention.slice(0, -2) + " пришло время выбрать главного! :sunglasses:"}, function(err, res) {
          if (res) setTimeout(()=>bot.deleteMessage({channelID: channelID, messageID: res.id}), 10000);
        })
      }, 1000);
    } else {
      let text = `Как только наберётся 10 человек в голосовой комнате **Общение WTF** будет запущенно новое голосование!\n\nОсталось позвать **${10 - this.chMembers.length}** :slight_smile:`;
      let myMessage = {to: channelID, channelID: channelID, messageID: this.msgID, message: '',
        embed: {
          color: Math.floor(Math.random()*16777215),
          description: text,
          author: {
            name: 'Скоро выборы!',
            icon_url: 'https://i.imgur.com/TtpTXoG.jpg'
          },
          footer: { icon_url: "https://i.imgur.com/oxyIvmq.png", text: 'Ожидание старта выборов' }
        }
      }
      this.msgID ? bot.editMessage(myMessage) : bot.sendMessage(myMessage, (err, res) => {
        if (err) return console.log(err);
        king.msgID = res.id;
      });
    }
    return false;
  },
  new(userID, channelID) {
    if (!this.nextStart && !this.end) this.start();
    if (this.nextStart && this.nextStart < Date.now()) this.post("", this.ch, "");
    if (!this.end) return;
    let ch = bot.servers[SERVER].channels[actionRoles.wtf_room];
    if (channelID === actionRoles.wtf_room) {
      this.chMembers = Object.keys(ch.members).map(key => key);
    } else {
      if (!this.chMembers.includes(userID)) return;
      this.chMembers = Object.keys(ch.members).map(key => key);
      for (let ids in this.votes) {
        let index = this.votes[ids].indexOf(userID);
        if (index != -1) {
          this.votes[ids].splice(index, 1);
          this.orig[ids]--;
          if (this.orig[ids] == 0) delete this.orig[ids];
        }
        let vIndex = this.voters.indexOf(userID);
        if (vIndex != -1) this.voters.splice(vIndex, 1);
      }
      if (this.orig[userID]) {
        delete this.orig[userID];
        for (let i = this.votes[userID].length - 1; i >= 0; i--) {
          let index = this.voters.indexOf(this.votes[userID][i]);
          if (index != -1) this.voters.splice(index, 1);
        }
        delete this.votes[userID];
      }
    }
    let time = Date.now();
    if (time - this.throttling > 10000) {
      this.throttling = time;
      this.post("", this.ch, "");
    }
  }
}

let VoiceParties = [], kicks = [], senders = [], inbox = [];
let voiceInvites = {};

let chMessages = {
  count: {},
  start: {},
  check(channelID) {
    if (!this.start[channelID]) return false;
    if (this.count[channelID]) this.count[channelID]++;
    else this.count[channelID] = 1;
    if (this.count[channelID] % parseInt(this.start[channelID].num) === 0) return true;
    else return false;
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
    let obj = {
      guildID: SERVER,
      messages: encodeURIComponent(JSON.stringify(this.start))
    };
    pool.query('INSERT INTO auto_mess SET ? ON DUPLICATE KEY UPDATE ?', [obj, obj], (error, results) => {
      if (error) return console.error(error);
    });
  }
};

class Sender {
  constructor(userID, voiceID) {
    this.userID = userID;
    this.voiceID = voiceID;
    this.date = new Date();
  }
};

function channelBans () {
  let fDate = new Date();
  for (let i = kicks.length - 1; i >= 0; i--) {
    if (fDate - kicks[i].date > 1800000) {
      if (!kicks[i].first) bot.deleteChannelPermission({channelID: kicks[i].voiceID, userID: kicks[i].banned});
      kicks.splice(i, 1);
    }
  }
  bans();
}

setInterval(channelBans, 60000);

bot.on("guildMemberUpdate", (oldMember, newMember) => {
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
          for (let key in actionRoles) {
            if (actionRoles[key] == msgLog.roleID) {
              action = key;
            }
          }
          let banList = actionRoles.report_room;
          if (action.includes("vip") || action.includes("premium")) banList = actionRoles.premium_room;
          unban(action, msgLog.target_id, banList, "silent", msgLog.user_id);
        } else {
          addLogs(msgLog.roleName.toLowerCase(), msgLog);
        }
      }
    })
  }
});

bot.on("guildMemberAdd", member => {
  let userID = member.id;
  bot.sendMessage({to: actionRoles.logi_enter_exit, message: ` :white_check_mark: <@${userID}> присоединился -> Зарегистрирован: ${dateFromID(userID)}`});
  bot.sendMessage({to: userID, message: `Здравствуй, путник! Добро пожаловать в нашу уютную таверну **Dota2 RU Community**.
  Здесь ты сможешь найти себе пати для игры на рейтинге, абуза компендиума или Дота+ и просто хорошую компанию.
  
   **Для того, чтобы у тебя не возникло проблем**, рекомендуем прочесть информацию на канале <#${actionRoles.info_pravila}> 
  Так же советую тебе **зарегистрироваться**, чтобы участвовать в розыгрышах ключей и скинов. 
  Регистрация проходит через команду !reg \`ссылка на steam\` на канале  <#${actionRoles.stats_channel}> 
  
  Если у тебя возникнут дополнительные вопросы, то пиши в ЛС администраторам, они быстро ответят на все, что тебя интересует!`});
  pool.getConnection(function(err, connection) {
    if (err) return console.log(err);
    connection.query('SELECT * FROM bans_dota2 WHERE `userID` = ?', [userID], function (error, results) {
      connection.release();
      if (error) console.log(error);
      if (results.length > 0) {
        let user = results[0];
        let date = new Date();
        if (user.ban && user.ban - date > 0)
          addRole(userID, actionRoles.ban, 1);
        if (user.chatmute && user.chatmute - date > 0)
          addRole(userID, actionRoles.mute, 1025);
        if (user.voicemute && user.voicemute - date > 0)
          addRole(userID, actionRoles.banwtf, 2050);
        if (user.flood && user.flood - date > 0)
          addRole(userID, actionRoles.bangood, 3050);
        if (user.vip && user.vip - date > 0)
          addRole(userID, actionRoles.vip, 4050);
        if (user.premium && user.premium - date > 0)
          addRole(userID, actionRoles.premium, 4050);
      }
    });
  });
});

bot.on("guildMemberRemove", member => {
  let userID = member.id;
  let nickName = bot.users[userID].username;
  bot.sendMessage({to: actionRoles.logi_enter_exit, message: ` :rage: <@${userID}> ливнул, падла -> Ник в дискорде: **${nickName}**`});
});

bot.on('message', function(user, userID, channelID, message, event) {
  if (event.d.author.bot) return;
  if (chMessages.check(channelID)) {
    setTimeout(() => {
      if (chMessages.start[channelID]) {
        bot.sendMessage({to: channelID, message: chMessages.start[channelID].msg})
      }
    }, 3000);
  }
  if (!bot.servers[SERVER].members[userID]) return allUsers.get();
  let roles = bot.servers[SERVER].members[userID].roles;
  if (roles.includes(actionRoles.moderator) || roles.includes(actionRoles.admin)) {
    if (message.startsWith("!startmes")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let num = message.match(/\b\d{1,4}\b/);
      if (num) num = num[0];
      else return pm(userID, channelID, "После команды !startmes укажите количество сообщений :envelope:");
      let msg = message.replace(/^.+?\d{1,4} /, "");
      if (msg) {
        chMessages.start[channelID] = {
          msg: msg,
          num: parseInt(num)
        }
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
    } else if (message.startsWith("!banclear")) {
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      allUsers.update();
      pm(userID, channelID, "Список банов будет очищен через 3 минуты :warning:");
    }
  }
  if (channelID in bot.directMessages && !event.d.author.bot) {
    bot.sendMessage({to: actionRoles.bot_dm, message: `<@${userID}>: ${message}`});
  } else if (channelID === actionRoles.bot_dm) {
    let a = message.match(reg.e1);
    if (a) a = a[0];
    else return bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "❌"});
    bot.sendMessage({to: a, message: message.replace(/^.+?\d>/, "")}, function (err, res) {
      if (err) return console.log(err);
      bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "✅"});
    });
  } else if (channelID === king.ch) {
    if (userID === bot.id) return;
    setTimeout(()=>{
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
    }, 5000);
    let command = message.slice(0,10).toLowerCase().match(/\b(end\b|badboss)|\+/);
    if (command) command = command[0];
    if (command === "+") {
      let voteID = message.match(/[@!]\d{17,19}(?=>)/);
      if (voteID) {
        if (king.end && !king.chMembers.includes(userID)) return pm(userID, channelID, "Вы должны находится в комнате **Общение WTF**, чтобы проголосовать :warning:");
        uu = voteID[0] + "";
        uu = uu.substr(1);
        if (!king.chMembers.includes(uu)) return pm(userID, channelID, "Голосовать можно только за участников канала **Общение WTF** :warning:");
        king.post(uu, channelID, userID);
        // if (!king.voters.includes(userID))
          bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "✅"}); // doesn't work
      } else {
        bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "🚫"});
      }
    } else {
      bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "🚫"});
    }
    return;
  } else if (channelID === actionRoles.premium_room) { // #premium
    if (roles.includes(actionRoles.moderator) || roles.includes(actionRoles.admin)) { // moderators
      let un = message.match(/\bun\b/i);
      let command = message.slice(0,12).match(/\b(vip|premium)\b/i);
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
        if (action == "vip" || action == "premium") {
          let roles = bot.servers[SERVER].members[a].roles;
          if (action == "premium" && roles.includes(actionRoles.vip)) return bot.sendMessage({to: channelID, message: `:warning: Сначала уберите <@&${actionRoles.vip}> роль у пользователя <@${a}>`}, function(err, res) {
            if (err) return console.log(err);
            setTimeout(()=>bot.deleteMessage({channelID: channelID, messageID: res.id}), 15000);
          });
          else if (action == "vip" && roles.includes(actionRoles.premium)) return bot.sendMessage({to: channelID, message: `:warning: Сначала уберите <@&${actionRoles.premium}> роль у пользователя <@${a}>`}, function(err, res) {
            if (err) return console.log(err);
            setTimeout(()=>bot.deleteMessage({channelID: channelID, messageID: res.id}), 15000);
          });
          addLogs(action, {user_id: userID, target_id: a, roleID: actionRoles[action]}, b);
          let c = message.match(/[#№](\d{1,3})/);
          if (c) {
            c = parseInt(c[1]);
            for (let ids in bot.servers[SERVER].roles) {
              let regExp, item = bot.servers[SERVER].roles[ids];
              if (action == "vip") regExp = /VIP \d{1,3} - свободно/;
              else if (action == "premium") regExp = /PREM \d{1,3} - свободно/;
              if (item.name.search(regExp) != -1) {
                let number = item.name.match(/ (\d{1,3}) - свободно/i);
                if (number) {
                  number = parseInt(number[1]);
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
            connection.query('SELECT ?? FROM bans_dota2 WHERE userID = ?', [action, a], function (error, results) {
              if (error) return console.log(error);
              let fresh = true;
              if (results.length > 0) {
                let prevTime = parseInt(results[0][action]);
                if (prevTime) {
                  time = prevTime + banTime;
                  fresh = false;
                }
              }
              let roomNumber, freeRoom, date = new Date(time);
              if (action == "vip") {
                if (fresh) bot.addToRole({serverID: SERVER, roleID: actionRoles.vip, userID: a});
                if (fresh) {
                  if (zID) {
                    freeRoom = {roleID: zID, number: zNumber};
                  } else {
                    for (let ids in bot.servers[SERVER].roles) {
                      let item = bot.servers[SERVER].roles[ids];
                      if (item.name.includes("VIP") && item.name.includes("- свободно")) {
                        let number = item.name.match(/VIP (\d{1,3})/i);
                        if (number) {
                          number = parseInt(number[1]);
                          if (freeRoom) {
                            if (number < freeRoom.number) freeRoom = {roleID: item.id, number: number};
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
                      name: `VIP ${freeRoom.number} - ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear().toString().slice(-2)}`
                    });
                    setTimeout(()=>{bot.addToRole({serverID: SERVER, roleID: freeRoom.roleID, userID: a})}, 1025);
                    roomNumber = freeRoom.number;
                  } else {
                    return bot.sendMessage({to: channelID, message: ':warning: Нет свободных VIP ролей! :x:'})
                  }
                } else {
                  let vipRole;
                  roles.every((item)=>{
                    let roleName = bot.servers[SERVER].roles[item].name;
                    if (roleName.includes("VIP ")) {
                      let room = roleName.match(/VIP (\d{1,3})/);
                      if (room) roomNumber = room[1];
                      vipRole = bot.servers[SERVER].roles[item].id;
                      return false;
                    }
                    return true;
                  })
                  if (!vipRole) return bot.sendMessage({to: channelID, message: `У пользователя <@${a}> отсутсвует необходимая VIP роль! :warning:`})
                  bot.editRole({serverID: SERVER,
                    roleID: vipRole,
                    name: `VIP ${roomNumber} - ${date.getDate()}.${date.getMonth()+1}.${date.getYear().toString().slice(-2)}`
                  });
                }
                let myMessage = "<@" + a + "> приобрёл VIP роль!\n\nПрисвоена личная комната: **" + `VIP Room ${roomNumber}` + "**";
                if (!fresh) myMessage = "<@" + a + "> продлил VIP привилегии!\n\nЛичная VIP комната: **" + `VIP Room ${roomNumber}` + "**";
                let embed = {
                  color: 0x49bd1c,
                  description: myMessage,
                  author: {
                    name: fresh ? 'Поздравляем нового VIP пользователя!' : 'Продление VIP подписки!',
                    icon_url: 'https://i.imgur.com/2eSWDlK.png'
                  },
                  timestamp: date,
                  thumbnail: { url: vars.img.vip_thumb },
                  footer: { icon_url: vars.img.footer, text: 'VIP до:' }
                };
                bot.sendMessage({to: channelID, message: '', embed: embed});
                bot.sendMessage({to: a, message: '**Теперь Вам доступно:**\n- Отдельная VIP комната;\n- Возможность самостоятельно перемещать из комнаты пользователей;\n- В текстовом канале Никнейм выделен уникальным цветом;\n- Ваша роль выделена отдельно от остальных участников; \n- Устанавливать количество участников в вашей комнате (для этого введите команду !limit от 0 до 99 в канале <#' + actionRoles.premium_room +'>)\n  пример: `!limit  4`\n\nP.S. Спасибо, что поддержали наш сервер. C наилучшими пожеланиями **Администрация**.', embed: embed});
              } else if (action == "premium") {
                if (fresh) bot.addToRole({serverID: SERVER, roleID: actionRoles.premium, userID: a});
                if (fresh) {
                  if (zID) {
                    freeRoom = {roleID: zID, number: zNumber};
                  } else {
                    for (let ids in bot.servers[SERVER].roles) {
                      let item = bot.servers[SERVER].roles[ids];
                      if (item.name.includes("PREM") && item.name.includes("- свободно")) {
                        let number = item.name.match(/PREM (\d{1,3})/i);
                        if (number) {
                          number = parseInt(number[1]);
                          if (freeRoom) {
                            if (number < freeRoom.number) freeRoom = {roleID: item.id, number: number};
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
                      name: `PREM ${freeRoom.number} - ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear().toString().slice(-2)}`
                    });
                    setTimeout(()=>bot.addToRole({serverID: SERVER, roleID: freeRoom.roleID, userID: a}), 1025);
                    roomNumber = freeRoom.number;
                  } else {
                    return bot.sendMessage({to: channelID, message: ':warning: Нет свободных PREM ролей! :x:'})
                  }
                } else {
                  let vipRole;
                  roles.every((item)=>{
                    let roleName = bot.servers[SERVER].roles[item].name;
                    if (roleName.toUpperCase().includes("PREM ")) {
                      let room = roleName.match(/PREM (\d{1,3})/i);
                      if (room) roomNumber = room[1];
                      vipRole = bot.servers[SERVER].roles[item].id;
                      return false;
                    }
                    return true;
                  })
                  if (!vipRole) return bot.sendMessage({to: channelID, message: `У пользователя <@${a}> отсутсвует необходимая VIP роль! :warning:`})
                  bot.editRole({serverID: SERVER,
                    roleID: vipRole,
                    name: `PREM ${roomNumber} - ${date.getDate()}.${date.getMonth()+1}.${date.getYear().toString().slice(-2)}`
                  });
                }
                let myMessage = "<@" + a + "> приобрёл Premium роль!\n\nПрисвоена личная комната: **" + `PREM Room ${roomNumber}` + "**";
                if (!fresh) myMessage = "<@" + a + "> продлил **Premium** привилегии!\n\nЛичная Premium комната: **" + `PREM Room ${roomNumber}` + "**";
                let embed = {
                  color: 0xf1c40f,
                  description: myMessage,
                  author: {
                    name: fresh ? 'Поздравляем нового Premium пользователя!' : 'Продление Premium подписки!',
                    icon_url: 'https://i.imgur.com/2eSWDlK.png'
                  },
                  timestamp: date,
                  thumbnail: { url: vars.img.prem_thumb },
                  footer: { icon_url: vars.img.footer, text: 'Premium до:' }
                };
                bot.sendMessage({to: channelID, message: '', embed: embed});
                bot.sendMessage({to: a, message: '**Теперь Вам доступны функции:**\n\n- Устанавливать количество участников в вашей комнате\n- Личная premium комната, в которой вы можете изменить название;\n- Возможность самостоятельно перемещать из комнаты пользователей; \n- Ваша роль выделена уникальным цветом и находится отдельно от остальных участников;\n- В канале <#' + actionRoles.search_room +  '> уникальная  картинка; \n- Отдельный канал <#' + actionRoles.premium_room + '> c чатом и возможностью использования команд для управления своей комнатой: \n\n        * Возможность запретить активацию микрофона по голосу (Только кнопкой)\n       **пример:** `!voice on\\off` (on - режим активации голосом, off - только по кнопке);\n        * Возможность скрыть комнату, чтобы был вход по приглашению.\n       **пример:** `!hide on\\off` (оn - скрыть, off - показывать);\n        * Добавить в ЧС (чёрный список) пользователя, который не сможет подключиться к вашей комнате.\n       **пример:** `!ban @wmzx#7777`   `!unban @wmzx#7777` (ban- добавить, unban- удалить);\n       \n         * `!help` - напомнить список команд\n\nP.S. Спасибо, что поддержали наш сервер. C наилучшими пожеланиями, **Администрация**', embed: embed});
              }
              let post = [{userID: a, [action]: time}, {[action]: time}];
              connection.query('INSERT INTO bans_dota2 SET ? ON DUPLICATE KEY UPDATE ?', [post[0], post[1]], function (error) {
                connection.release();
                if (error) return console.log(error);
              });
            });
          });
        }
      }
    }
    if (roles.includes(actionRoles.premium)) {
      if (message.includes("hide on")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let roomNumber, voiceID, ch;
        roles.forEach((item) => {
          let roleName = bot.servers[SERVER].roles[item].name;
          let room = roleName.match(/PREM (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = premRooms[roomNumber];
            ch = bot.servers[SERVER].channels[voiceID];
          }
        });
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, deny: [10]}, (err) => {
          if (err) return console.log(err);
          let myEmbed = {
            color: 0x00cccc,
            description: `Ваша комната **${ch.name}** скрыта от других пользователей :spy: `
          }
          pm(userID, channelID, "", myEmbed)
        });
      } else if (message.includes("hide off")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let roomNumber, voiceID, ch;
        roles.forEach((item) => {
          let roleName = bot.servers[SERVER].roles[item].name;
          let room = roleName.match(/PREM (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = premRooms[roomNumber];
            ch = bot.servers[SERVER].channels[voiceID];
          }
        });
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
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
        let roomNumber, voiceID, ch;
        roles.forEach((item) => {
          let roleName = bot.servers[SERVER].roles[item].name;
          let room = roleName.match(/PREM (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = premRooms[roomNumber];
            ch = bot.servers[SERVER].channels[voiceID];
          }
        });
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
        let roomNumber, voiceID, ch;
        roles.forEach((item) => {
          let roleName = bot.servers[SERVER].roles[item].name;
          let room = roleName.match(/PREM (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = premRooms[roomNumber];
            ch = bot.servers[SERVER].channels[voiceID];
          }
        });
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
        if (a) a = a[0];
        else {
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
        let myMessage = "** Команды для  канала <#" + actionRoles.premium_room + ">:**\n        * `!help` - напомнить список команд\n        * `!voice on\\off` (on - активация по голосу, off - активация по кнопке) - активация микрофона по голосу;\n        * `!hide on\\off` (оn - скрыть, off - показывать) -  скрыть комнату, чтобы был вход по приглашению;\n        * `!ban @wmzx`   `!unban @wmzx` (ban- добавить, unban- удалить) - Добавить в ЧС (чёрный список) пользователя\n\nC ув. **Администрация.**";
        pm(userID, channelID, myMessage);
      } else if (message.slice(0, 6) == "!limit") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myNum = parseInt(message.slice(6, 10));
        if (!myNum) myNum = null;
        let roomNumber, voiceID;
        roles.forEach((item) => {
          let room, roleName = bot.servers[SERVER].roles[item].name;
          room = roleName.match(/PREM (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = premRooms[roomNumber];
          }
        });
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь VIP или Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelInfo({channelID: voiceID, user_limit: myNum}, function(err) {
          let myMessage = `:white_check_mark: Лимит вашей комнаты успешно изменён на: **${myNum}**`;
          if (!err) pm(userID, channelID, myMessage);
        });
      }
    } else if (roles.includes(actionRoles.vip)) {
      if (message.slice(0, 6) == "!limit") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myNum = parseInt(message.slice(6, 10));
        if (!myNum) myNum = null;
        let roomNumber, voiceID;
        roles.forEach((item) => {
          let room, roleName = bot.servers[SERVER].roles[item].name;
          room = roleName.match(/VIP (\d{1,3})/i);
          if (room) {
            roomNumber = parseInt(room[1]);
            voiceID = vipRooms[roomNumber];
          }
        });
        if (!roomNumber) {
          let myMessage = `Вам необходимо иметь VIP или Premium комнату, чтобы пользоваться этой командой :exclamation:`;
          return pm(userID, channelID, myMessage);
        }
        bot.editChannelInfo({channelID: voiceID, user_limit: myNum}, function(err) {
          let myMessage = `:white_check_mark: Лимит вашей комнаты успешно изменён на: **${myNum}**`;
          if (!err) pm(userID, channelID, myMessage);
        });
      } else if (message.slice(0, 6).includes("help")) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let myMessage = "Команды для **VIP** на канале <#" + actionRoles.premium_room + ">:\n         * `!help` - напомнить список команд;\n         * `!limit <число пользователей>` - установить количество пользователей в **VIP** комнате;\n\nКоманды для **Premium**:\n        * `!help` - напомнить список команд;\n        * `!voice on\\off` (on - активация по голосу, off - активация по кнопке) - активация микрофона по голосу;\n        * `!hide on\\off` (оn - скрыть, off - показывать) -  скрыть комнату, чтобы был вход по приглашению;\n        * `!ban @wmzx`   `!unban @wmzx` (ban- добавить, unban- удалить) - Добавить в ЧС (чёрный список) пользователя;\n\nC ув. **Администрация.**";
        pm(userID, channelID, myMessage);
      }
    }
  } else if (channelID === actionRoles.report_room) { // #report
    if (message.substr(0,5).toLowerCase().includes("kick")) {
      // bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      kickMe(userID, channelID, message, event.d.id);
    } else if (roles.includes(actionRoles.moderator) || roles.includes(actionRoles.admin)) { // moderators
      let un = message.match(/\b(un)\b/i);
      let command = message.match(/\b(ban|bangood|banwtf|mute)\b/i);
      if (command) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let action = command[0].toLowerCase();
        if (un) {
          let a = message.match(reg.e1);
          let b = message.match(reg.e2);
          if (a) a = a[0];
          else return bot.sendMessage({to: channelID, message: "Укажите пользователя через @. Пример: `@Angelus#5785`"});
          if (!b) b = ""; else b = b[1];
          unban(action, a, channelID, b, userID);
        } else if (command) {
          let a, b;
          a = message.match(reg.e1);
          b = message.match(reg.e2);
          if (a) a = a[0];
          else return bot.sendMessage({to: channelID, message: "Укажите пользователя через @. Пример: `@Angelus#5785`"});
          if (!b) {
            return bot.sendMessage({to: channelID, message: "<@" + userID + "> укажите, пожалуйста, причину репорта :warning: "}, function(err, res) {
              setTimeout(()=>bot.deleteMessage({channelID: channelID, messageID: res.id}), 15000)
            });
          } else {
            b = b[1];
          }
          let now = new Date();
          let hours = message.match(/\b(\d{1,3})([dhm])?\b/);
          if (hours) {
            if (hours[2] === "d") hours = hours[1]*24;
            else if (hours[2] === "m") hours = hours[1]/60;
            else hours = hours[1];
          } else {
            hours = 24;
          }
          let banTime = hours * 60 * 60000;
          let time = +now + banTime;
          addLogs(action, {user_id: userID, target_id: a, roleID: actionRoles[action]}, b);
          if (action === 'mute') action = 'chatmute';
          else if (action === 'bangood') action = 'flood';
          else if (action === 'banwtf') action = 'voicemute';
          pool.getConnection(function(err, connection) {
            if (err) return console.log(err);
            let post = [{userID: a, [action]: time}, {[action]: time}];
            connection.query('INSERT INTO bans_dota2 SET ? ON DUPLICATE KEY UPDATE ?', [post[0], post[1]], function (error) {
              connection.release();
              if (error) return console.log(error);
              if (action === 'ban') {
                bot.addToRole({serverID: SERVER, roleID: actionRoles.ban, userID: a});
                // let banTime = time - now;
                let myMessage = "<@" + a + "> забанен на " + sklonHours(hours) + ".\n\n**Модератор** <@" + userID + ">**:** " + b;
                let embed = {
                  color: 0xff1f26,
                  description: myMessage,
                  author: {
                    name: 'Забанен!',
                    icon_url: 'https://i.imgur.com/QykygCB.png'
                  },
                  timestamp: new Date(time),
                  thumbnail: { url: vars.img.ban_thumb },
                  footer: { icon_url: vars.img.footer, text: 'Будет разбанен:' }
                }
                bot.sendMessage({to: channelID, message: '', embed: embed});
                setTimeout(() => bot.sendMessage({to: a, message: '', embed: embed}), 1050)
                setTimeout (() => {bot.removeFromRole({serverID: SERVER, roleID: actionRoles.ban, userID: a})}, banTime);
              } else if (action === 'chatmute') {
                bot.addToRole({serverID: SERVER, roleID: actionRoles.mute, userID: a});
                let myMessage = "<@" + a + "> лишен возможности писать в чат на " + sklonHours(hours) + ".\n\n**Модератор** <@" + userID + ">**:** " + b;
                let embed = {
                  color: 0xe67e22,
                  description: myMessage,
                  author: {
                    name: 'Много лишнего текста!',
                    icon_url: 'https://i.imgur.com/dDQ05tH.png'
                  },
                  timestamp: new Date(time),
                  thumbnail: { url: vars.img.mute_thumb },
                  footer: { icon_url: vars.img.footer, text: 'Будет разбанен:' }
                }
                bot.sendMessage({to: channelID, message: '', embed: embed});
                setTimeout(() => bot.sendMessage({to: a, message: '', embed: embed}), 1050)
                setTimeout (() => {bot.removeFromRole({serverID: SERVER, roleID: actionRoles.mute, userID: a})}, banTime);
              } else if (action === 'flood') {
                bot.addToRole({serverID: SERVER, roleID: actionRoles.bangood, userID: a});
                let myMessage = "<@" + a + "> забанен в **\"💬Общение\"** на " + sklonHours(hours) + ".\n\n**Модератор** <@" + userID + ">**:** " + b;
                let embed = {
                  color: 0xe67e22,
                  description: myMessage,
                  author: {
                    name: 'Не умеет общаться!',
                    icon_url: 'https://i.imgur.com/dDQ05tH.png'
                  },
                  timestamp: new Date(time),
                  thumbnail: { url: vars.img.bangood_thumb },
                  footer: { icon_url: vars.img.footer, text: 'Будет разбанен:' }
                }
                bot.sendMessage({to: channelID, message: '', embed: embed});
                setTimeout(() => bot.sendMessage({to: a, message: '', embed: embed}), 1050)
                setTimeout (() => {bot.removeFromRole({serverID: SERVER, roleID: actionRoles.bangood, userID: a})}, banTime);
              } else if (action === 'voicemute') {
                bot.addToRole({serverID: SERVER, roleID: actionRoles.banwtf, userID: a});
                let myMessage = "<@" + a + "> забанен в **\"🔞Без правил🔞\"** на " + sklonHours(hours) + ".\n\n**Модератор** <@" + userID + ">**:** " + b;
                let embed = {
                  color: 0xe67e22,
                  description: myMessage,
                  author: {
                    name: 'Не умеет общаться!',
                    icon_url: 'https://i.imgur.com/dDQ05tH.png'
                  },
                  timestamp: new Date(time),
                  thumbnail: { url: vars.img.banwtf_thumb },
                  footer: { icon_url: vars.img.footer, text: 'Будет разбанен:' }
                }
                bot.sendMessage({to: channelID, message: '', embed: embed});
                setTimeout(() => bot.sendMessage({to: a, message: '', embed: embed}), 1050)
                setTimeout (() => {bot.removeFromRole({serverID: SERVER, roleID: actionRoles.banwtf, userID: a})}, banTime);
              }
            });
          });
        }
      }
    }
    if (message.substr(0,7).toLowerCase().includes("report")) {
      let a = message.match(reg.e1);
      let b = message.match(reg.e2);
      if (a && b) {
        a = a[0], b = b[1];
        bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "✅"});
        bot.sendMessage({to: userID, message: 'Ув. пользователь Ваша жалоба принята к рассмотрению.'});
        bot.sendMessage({to: actionRoles.report_logi, message: `<@${userID}> жалуется на <@${a}> причина: ${b}`});
      } else {
        bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "❌"});
      }
    }
  } else if (channelID === actionRoles.search_room) { // #search
    if (event.d.author.bot) return;
    let x = message.toLowerCase();
    let y = x.substr(0,2);
    // if (message.length > 140) {
    //   bot.deleteMessage({channelID: channelID, messageID: event.d.id});
    //   bot.sendMessage({to: userID, message: `Вы написали слишком длинное сообщения. Допустимое число знаков: **140**\n\`\`\`${message}\`\`\``});
    //   console.log("message > 140");
    // }
    let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
    if (!voiceID) {
      if (y == "!r" || y == "!a") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        bot.sendMessage({to: userID, message: `Вы не находитесь в голосовой комнате.`});
      }
      return;
    }
    let fDate = Date.now();
    for (let i = senders.length - 1; i >= 0; i--) {
      let time = fDate - senders[i].date;
      if (userID === senders[i].userID || voiceID === senders[i].voiceID) {
        if (time < 3000) {
          bot.deleteMessage({channelID: channelID, messageID: event.d.id});
          if (userID != senders[i].userID) bot.sendMessage({to: userID, message: `Запрос на поиск осуществляется не чаще 1 раза в 30 секунд для комнаты. <@${senders[i].userID}> только что отправлял сообщение. Попробуйте снова через ${Math.round(30 - (time/1000))} сек.`});
          else bot.sendMessage({to: userID, message: `Запрос на поиск осуществляется не чаще 1 раза в 30 секунд. Попробуйте снова через ${Math.round(30 - (time/1000))} сек.`});
          return;
        } else {
          senders.splice(i, 1);
        }
      } else if (time >= 30000) {
        senders.splice(i, 1);
      }
    }
    if (y == "!r" || y == "!a") {
      let rating = (y == "!r");
      let ch = bot.servers[SERVER].channels[voiceID];
      let chMembers = Object.keys(ch.members).map(function(key) {
        return key;
      });
      if (ch.user_limit - chMembers.length === 0) {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let limit = ch.user_limit;
        bot.sendMessage({to: userID, message: `Ваша комната заполнена (${limit}/${limit}), поиск отменён.`});
        console.log(`FULL ROOM (${limit}/${limit}); voiceID: ${voiceID}`);
      } else {
        senders.push(new Sender(userID, voiceID));
      }
      bot.deleteMessage({channelID: channelID, messageID: event.d.id});
      let note = "", prem = false;
      if (message.length > 2) {
        note = "\n :white_small_square:" + message.slice(2);
        note = note.replace(/https?:\/.+\s/i, "");
      }
      pool.query('SELECT * FROM gamers_dota2 WHERE userID = ?', [userID], function (error, results) {
        if (error) console.log(error);
        if (results.length > 0) {
          if (results[0].name) lfg(userID, channelID, false, note, false, false, prem, rating, false, event.d.id);
          else bot.sendMessage({to: userID, message: `Для использования команд, откройте свой профиль и пройдите регистрацию в канале <#${actionRoles.stats_channel}>!\n :white_small_square: **Команда:** !reg ВашSteamID\n :white_small_square: **Пример:** \`!reg 376037978\``});
        } else {
          bot.sendMessage({to: userID, message: `Для получения полного доступа к серверу, пройдите регистрацию на канале <#${actionRoles.stats_channel}>!\n:white_small_square: **Команда** \`!reg ВашSteamID\`\n:white_small_square: **Пример**\`!reg 123456789\`\n:white_small_square: **Пример**\`!reg https://steamcommunity.com/id/1234567890\``});
        }
      });
      senders.push(new Sender(userID, voiceID));
    }
  }
  if (channelID !== actionRoles.stats_channel) // #player-stats
    return;
  if (message.length < 64) {
    let lowMessage = message.toLowerCase();
    let command = lowMessage.match(/\b(reg|update|info|help|last|roles-server|channels-server|del|carry|mider|offlaner|no role|sup4|sup5)\b/);
    let stats = lowMessage.match(/!?(solo|duo|squad)([-\ ]?[ft]pp|\b)?/i);
    if (command) {
      command = command[0].replace(" ", "");
      if (command === "reg") {
        getSteamID(channelID, message.replace(/\bdota2?\b/gi, " ")).then(steam32 => {
          let rank_tier = 0, personaname = null;
          let options = {
            url: `https://api.opendota.com/api/players/${steam32}`,
            // agentClass,
            // agentOptions
          };
          request(options, function (err, res, body) {
            if (err) return console.log(err);
            let k = JSON.parse(body) || {};
            rank_tier = k.rank_tier;
            if (rank_tier && k.profile) {
              let rank = getRankTier(rank_tier);
              personaname = k.profile.personaname;
              bot.sendMessage({to: channelID, message: '',
                embed: {
                  title: ` :white_check_mark: Успешно зарегистрирован!`,
                  color: 0x49bd1a,
                  timestamp: new Date,
                  description: `**Пользователь**: <@${userID}>\n**Никнэйм:** ${k.profile.personaname}\n**Рейтинг:** ${dotaEmojis[rank_tier]} ${rank}\n**ID:** ${k.profile.account_id}\n**SteamID:** ${k.profile.steamid}\n**URL:** ${k.profile.profileurl}`,
                  thumbnail: {
                    url: k.profile.avatarfull
                  },
                  footer: {
                    icon_url: vars.img.footer,
                    text: "Dota2 Bot"
                  }
                }
              });
              let a = {userID: userID, dota: steam32, name: personaname, rank_tier: rank_tier};
              pool.query('INSERT INTO gamers_dota2 SET ? ON DUPLICATE KEY UPDATE ?', [a, a], function (error, results) {
                if (error) console.log(error);
              });
              getRankDota(userID, "", steam32, {rank_tier: rank_tier, roles: roles});
              setTimeout(()=>{
                bot.sendMessage({to: userID, message: `Доброе время суток! Вы успешно прошли регистрацию на сервере **Dota 2 RU Community**\n\nНа канале <#${actionRoles.stats_channel}>  теперь Вам доступны команды: \n:small_orange_diamond:\`!help\`        - перечень команд; \n:small_orange_diamond:\`!update\`   - обновление статистики в ручную;\n:small_orange_diamond:\`!carry\`       - выбор предпочитаемой роли;   \n:small_orange_diamond:\`!mider\`      - выбор предпочитаемой роли;\n:small_orange_diamond:\`!offlaner\`  - выбор предпочитаемой роли;\n:small_orange_diamond:\`!sup4\`       - выбор предпочитаемой роли;\n:small_orange_diamond:\`!sup5\`       - выбор предпочитаемой роли;\n:small_orange_diamond:\`!no role\`   - если не можете определиться или Вы универсал;\n\nC уважением **Администрация**`});
              }, 1000);
            } else {
              let steam64 = +steam32 + 61197960265728;
              request(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamKey}&steamids=765${steam64}`, function (err, res, body) {
                if (err) return console.log(err);
                let k = JSON.parse(body).response;
                if (k && k.players[0]) {
                  k = k.players[0];
                  if (k.personaname) personaname = k.personaname;
                  let add = "```Uncalibrated / Скрытый профиль```";
                  if (rank_tier) {
                    let myTier = rank_tier;
                    if (myTier[1] == 0) myTier[1] = 1;
                    let rank = getRankTier(rank_tier);
                    add = "```Профиль скрыт\nРейтинг: " + rank + "```";
                  }
                  bot.sendMessage({to: channelID, message: '',
                    embed: {
                      title: ` :ballot_box_with_check: Привязан новый steamID!`,
                      color: 0xe67e22,
                      timestamp: new Date,
                      description: `**Пользователь**: <@${userID}>\n**Никнэйм:** ${k.personaname}\n**ID:** ${steam32}\n**steamID:** ${k.steamid}\n**URL:** ${k.profileurl} ${add}`,
                      thumbnail: {
                        url: k.avatarfull
                      },
                      footer: {
                        icon_url: vars.img.footer,
                        text: "Dota2 Bot"
                      }
                    }
                  });
                  let a = {userID: userID, dota: steam32, name: personaname, rank_tier: rank_tier};
                  pool.query('INSERT INTO gamers_dota2 SET ? ON DUPLICATE KEY UPDATE ?', [a, a], function (error, results) {
                    if (error) console.log(error);
                  });
                } else {
                  bot.sendMessage({to: channelID, message: `:warning: Неизвестная ошибка => steamID_32: ${steam32}, steamID_64: 765${steam64}`});
                  console.log(body);
                }
              });
            }
            giveDotaRank(userID, rank_tier);
          });
        }).catch(err => {
          bot.sendMessage({to: channelID, message: `:warning: После команды **!reg** укажите Ваш SteamID. Пример: \`!reg 233531555\``});
          console.log(err);
        })
      } else if (command === "help" || command === "info") {
        bot.sendMessage({to: userID, message: `Доброе время суток! Вы запросили перечень команд для канала  <#${actionRoles.stats_channel}> :\n\n:small_orange_diamond:\`!help\`        - перечень команд; \n:small_orange_diamond:\`!update\`   - обновление статистики в ручную;\n:small_orange_diamond:\`!carry\`       - выбор предпочитаемой роли;   \n:small_orange_diamond:\`!mider\`      - выбор предпочитаемой роли;\n:small_orange_diamond:\`!offlaner\`  - выбор предпочитаемой роли;\n:small_orange_diamond:\`!sup4\`       - выбор предпочитаемой роли;\n:small_orange_diamond:\`!sup5\`       - выбор предпочитаемой роли;\n:small_orange_diamond:\`!no role\`   - если не можете определиться или Вы универсал;\n\nC уважением **Администрация**`});
        bot.addReaction({channelID: channelID, messageID: event.d.id, reaction: "✅"});
      } else if (command === "update") {
        pool.query('SELECT * FROM gamers_dota2 WHERE userID = ?', userID, function (err, res) {
          if (err) console.error(err);
          if (res.length == 0) return bot.sendMessage({to: channelID, message: "<@" + userID + ">, к сожалению, вас нет в нашей базе данных. Попробуйте зарегистрироваться с помощью команды !reg"});
          let dotaID = res[0].dota;
          if (!dotaID) return bot.sendMessage({to: channelID, message: "<@" + userID + ">, чтобы воспользоваться командой !update, необходимо зарегистрироваться с помощью команды `!reg ВашSteamID`"});
          else getRankDota(userID, channelID, dotaID);
        });
      } else if (command === "roles-server") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let list = [], text = `List of server ${SERVER} roles:\n`;
        for (ids in bot.servers[SERVER].roles) {
          let roleName = bot.servers[SERVER].roles[ids].name;
          if (roleName) list.push({'name': roleName, 'id': ids});
        }
        list.sort(function(a, b) {
          return ((a.name < b.name) ? -1 : ((a.name == b.name) ? 0 : 1));
        });
        for (let k = 0; k < list.length; k++) {
          text +=`${list[k].name}: ${list[k].id}\n`;
        }
        console.log(text);
      } else if (command === "channels-server") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        let list = [], text = `List of server ${SERVER} channels:\n`;
        for (ids in bot.servers[SERVER].channels) {
          let name = bot.servers[SERVER].channels[ids].name;
          let position = bot.servers[SERVER].channels[ids].position;
          let user_limit = bot.servers[SERVER].channels[ids].user_limit;
          if (name) list.push({name, 'id': ids, position, user_limit});
        }
        list.sort(function(a, b) {
          return parseFloat(a.position) - parseFloat(b.position);
        });
        for (let k = 0; k < list.length; k++) {
          let a = list[k].user_limit;
          text +=`${list[k].name}${a ? ` [${a}]` : ""}: ${list[k].id}\n`;
        }
        console.log(text);
      } else if (command === "del") {
        bot.deleteMessage({channelID: channelID, messageID: event.d.id});
        if (!roles.includes(actionRoles.admin)) return bot.sendMessage({to: channelID, message: `Недостаточно прав :raised_hand:`});
        let a = message.match(reg.e1);
        if (!a) {
          return bot.sendMessage({to: channelID, message: "<@" + userID + ">, после команды `!del`, укажите игрока через @. Пример: `!del @AngeIus#5785`"});
        } else {
          a = a[0];
        }
        giveDotaRank(a, false, {remove: "dota"});
        pool.query('DELETE FROM gamers_dota2 WHERE userID = ?', a, function (error) {
          if (error) console.log(error);
        });
        bot.sendMessage({to: channelID, message: `Пользователь <@${a}> был удален с БД :wastebasket:`});
      } else if (Object.keys(lineRoles).includes(command)) {
        if (roles.includes(lineRoles[command])) return bot.sendMessage({to: channelID, message: `У вас уже есть роль <@&${lineRoles[command]}> :ok_hand:`});
        bot.sendMessage({to: channelID, message: `Вам присвоена новая роль: <@&${lineRoles[command]}> 🔥`});
        bot.addToRole({serverID: SERVER, roleID: lineRoles[command], userID: userID});
        for (let key in lineRoles) {
          if (key == command) continue;
          if (roles.includes(lineRoles[key])) removeRole(userID, lineRoles[key]);
        }
      }
    }
  }
});

function getSteamID(channelID, message) {
  let pro = /\b\d{5,17}\b/;
  let oldStyle = /STEAM_\d:(\d):(\d{4,9})/i;
  let linkReg = /\/id\/(\w{3,22})/;
  let dotaName = reg.b1.exec(message);
  let steamOld = oldStyle.exec(message);
  let link = linkReg.exec(message);
  let steam32 = pro.exec(message);
  return new Promise((resolve, reject) => {
    if (steamOld) {
      resolve(steamOld[2]*2 + +steamOld[1]);
    } else if (link) {
      request(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${link[1]}`, function (err, res, body) {
        if (err) return console.log(err);
        let k = JSON.parse(body).response;
        if (k.steamid && k.steamid.length == 17) {
          steam32 = k.steamid.substr(3) - 61197960265728;
          resolve(steam32);
        } else if (k.success == 42) {
          bot.sendMessage({to: channelID, message: `Игрок с ником **${link[1]}** не найден :warning: `});
          reject(`Игрок с ником ${link[1]} не найден`);
        } else {
          reject("Error parsing SteamID: ", k);
        }
      });
    } else if (steam32) {
      steam32 = steam32[0];
      if (steam32.length == 17) {
        steam32 = steam32.substr(3) - 61197960265728;
        resolve(steam32);
      } else {
        resolve(steam32);
      }
    } else if (dotaName) {
      request(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${dotaName[0]}`, function (err, res, body) {
        if (err) return console.log(err);
        let k = JSON.parse(body).response;
        if (k.steamid && k.steamid.length == 17) {
          steam32 = k.steamid.substr(3) - 61197960265728;
          resolve(steam32);
        } else if (k.success == 42) {
          bot.sendMessage({to: channelID, message: `Игрок с ником **${dotaName[0]}** не найден :warning: `});
          reject(`Игрок с ником ${dotaName[0]} не найден`);
        } else {
          reject("Error parsing SteamID: ", k);
        }
      });
    } else {
      bot.sendMessage({to: channelID, message: "<@" + userID + ">, после команды `!reg`, укажите ваш dotaID или SteamID. Пример: `!reg 114102800`"});
      reject(`Empty message: ${message}`);
    }
  })
}

function getRankTier(rank) {
  if (rank) {
    rank = "" + rank;
    return rankTiers[rank[0]] + ` [${rank[1]}]`;
  } else {
    return "Без ранга";
  }
}

function giveDotaRank(userID, rank, vars = {}) {
  let {remove, roles} = vars;
  if (!roles) roles = bot.servers[SERVER].members[userID].roles;
  if (!rank) {
    let bool = false;
    for (let key in dotaRoles) {
      if (roles.includes(dotaRoles[key]))  {
        if (key == 0) bool = true;
        else removeRole(userID, dotaRoles[key]);
      }
    }
    if (remove == "dota") {
      for (let i = 0; i < roles.length; i++) {
        let myRole = roles[i];
        if (epm_ids.includes(myRole))
          removeRole(userID, myRole);
        else if (gpm_ids.includes(myRole))
          removeRole(userID, myRole);
      }
      if (bool) removeRole(userID, dotaRoles[0]);
      return;
    }
    if (!bool) addRole(userID, dotaRoles[0]);
  } else {
    let bool = false;
    for (let key in dotaRoles) {
      if (roles.includes(dotaRoles[key]))  {
        if (key == rank) bool = true;
        else removeRole(userID, dotaRoles[key]);
      }
    }
    if (!bool) addRole(userID, dotaRoles[rank]);
  }
}

function getRankDota (userID, channelID, steam32, vars = {}) {
  let {roles, rank_tier} = vars;
  if (!roles) {
    try {
      roles = bot.servers[SERVER].members[userID].roles;
    } catch (err) {
      return console.log("Roles_Problem", err);
    }
  }
  let p1 = new Promise((resolve) => {
    if (rank_tier) return resolve({rank_tier: rank_tier, steam32: steam32});
    let options = {
      url: `https://api.opendota.com/api/players/${steam32}`,
      // agentClass,
      // agentOptions
    };
    request(options, function (err, res, body) {
      if (err) return console.log(err);
      let k;
      try {
        k = JSON.parse(body);
      } catch (err) {
        return console.error("getRankDota ERROR: " + steam32, err.message, body);
      }
      let rank_tier = k.rank_tier;
      if (k.profile && k.profile.avatarmedium) {
        let rank = getRankTier(rank_tier);
        resolve({rank: rank, steam32: steam32, rank_tier: rank_tier, ava: k.profile.avatarmedium});
      } else if (channelID) {
        let steam64 = steam32 + 61197960265728;
        let ava = "https://i.imgur.com/F8LWO0U.png";
        if (k.profile && k.profile.avatarmedium) ava = k.profile.avatarmedium;
        bot.sendMessage({to: channelID, message: '',
          embed: {
            color: 0xe67e22,
            // timestamp: new Date,
            description: `Нет информации о Dota 2 :zap: ${rank_tier ? "Профиль скрыт: http://steamcommunity.com/profiles/765" + steam64 : "Откройте профиль или проверьте правильность регистрации: http://steamcommunity.com/profiles/765" + steam64}`,
            thumbnail: {
              url: ava
            }
          }
        });
        resolve({rank: "error"});
      } else {
        resolve({rank: "error"});
      }
      giveDotaRank(userID, rank_tier, {roles: roles});
    });
  });
  let p2 = new Promise((resolve) => {
    let options = {
      url: `https://api.opendota.com/api/players/${steam32}/recentMatches`,
      // agentClass,
      // agentOptions
    };
    request(options, function (err, res, body) {
      if (err) return console.log(err);
      let k;
      try {
        k = JSON.parse(body);
      } catch (err) {
        return console.error("getRankDota ERROR: " + steam32, err.message, body);
      }
      let i = 0, gpm = 0, gpm2 = 0, epm = 0, epm2 = 0, last_hits = 0;
      if (!Array.isArray(k)) return console.log(k);
      k.forEach(item => {
        gpm += item.gold_per_min;
        epm += item.xp_per_min;
        last_hits += item.last_hits;
        i++;
      })
      if (i > 0) {
        gpm = gpm / i;
        gpm2 = Math.round(gpm);
        gpm = Math.round(gpm/50)*50;

        epm = epm / i;
        epm2 = Math.round(epm);
        epm = Math.round(epm/50)*50;

        last_hits = Math.round(last_hits / i);
      }

      let j = 0;
      if (gpm >= gpm_names[0]) {
        let kd0, kd1 = 0;
        for (let i = 0; i < gpm_names.length; i++) {
          if (gpm >= gpm_names[i]) {
            kd0 = gpm_ids[i];
            kd1 = i;
          } else break;
        }
        for (let i = 0; i < roles.length; i++) {
          let check = gpm_ids.indexOf(roles[i]);
          if (check == kd1) j++;
          else if (check >= 0) {
            removeRole(userID, gpm_ids[check], kd0, addRole);
            console.log("GPM changed -> UserID: " + userID + ", from " + gpm_names[check] + " to " + gpm_names[kd1]);
            j++;
          }
        }
        if (j == 0) {
          addRole(userID, kd0);
          console.log("New GPM! UserID: " + userID + ", Assigned " + gpm_names[kd1]);
        }
      } else {
        for (let i = 0; i < roles.length; i++) {
          if (gpm_ids.includes(roles[i])) removeRole(userID, roles[i]);
        }
      }

      j = 0;
      if (epm >= epm_names[0]) {
        let kd0, kd1 = 0;
        for (let i = 0; i < epm_names.length; i++) {
          if (epm >= epm_names[i]) {
            kd0 = epm_ids[i];
            kd1 = i;
          } else break;
        }
        for (let i = 0; i < roles.length; i++) {
          let check = epm_ids.indexOf(roles[i]);
          if (check == kd1) j++;
          else if (check >= 0) {
            removeRole(userID, epm_ids[check], kd0, addRole);
            console.log("EPM changed -> UserID: " + userID + ", from " + epm_names[check] + " to " + epm_names[kd1]);
            j++;
          }
        }
        if (j == 0) {
          addRole(userID, kd0);
          console.log("New EPM! UserID: " + userID + ", Assigned " + epm_names[kd1]);
        }
      } else {
        for (let i = 0; i < roles.length; i++) {
          if (epm_ids.includes(roles[i])) removeRole(userID, epm_ids.includes(roles[i]));
        }
      }
      resolve({epm: epm2, gpm: gpm2, last_hits: last_hits});
    });
  });
  Promise.all([p1, p2]).then(values => {
    let sum = Object.assign(values[0], values[1]);
    if (sum.rank != "error") {
      let a = {rank_tier: sum.rank_tier, epm: sum.epm, gpm: sum.gpm, last_hits: sum.last_hits};
      pool.query('UPDATE gamers_dota2 SET ? WHERE dota = ?', [a, sum.steam32], function (error, results) {
        if (error) console.log(error);
      });
      if (!channelID) return;
      bot.sendMessage({to: channelID, message: '',
        embed: {
          color: 0x49bd1a,
          title: 'Данные за последние 20 игр:',
          description: `**Текущий ранг:** ${sum.rank_tier ? dotaEmojis[sum.rank_tier] : ""} ${sum.rank}\n${dotaEmojis.xp} ${sum.epm} :white_small_square: ${dotaEmojis.gold} ${sum.gpm} :white_small_square: ${dotaEmojis.last_hits} ${sum.last_hits} \n**Статистика:** [dotaBUFF](https://ru.dotabuff.com/players/${sum.steam32}) | [OPENdota](https://www.opendota.com/players/${sum.steam32})`,
          thumbnail: {
            url: sum.ava
          }
        }
      });
    }
  }).catch(error => {
    console.log(error);
  });
}

function banLogs(action, msgLog, note = "") {
  if (note) note = ":" + note;
  let banList = actionRoles.logs;
  if (action.includes("vip") || action.includes("premium")) banList = actionRoles.premiumlogs;
  setTimeout(() => {bot.sendMessage({to: banList, message: `:heavy_minus_sign: <@${msgLog.user_id}> убрал роль <@&${msgLog.roleID}> c пользователя <@${msgLog.target_id}>${note}`});}, 2100);
}

function addLogs(action, msgLog, note = "") {
  if (note) note = ":" + note;
  let banList = actionRoles.logs;
  if (action.includes("vip") || action.includes("premium")) banList = actionRoles.premiumlogs;
  setTimeout(() => {bot.sendMessage({to: banList, message: `:small_orange_diamond: <@${msgLog.user_id}> добавил роль <@&${msgLog.roleID}> пользователю <@${msgLog.target_id}>${note}`});}, 2100);
}

function unban(action, userID, channelID, note, byUser) {
  let roles;
  try {
    roles = bot.servers[SERVER].members[userID].roles;
  } catch (err) {
    bot.sendMessage({to: actionRoles.logs, message: ` -> Пользователь <@${userID}> покинул сервер :door: `});
    note = "silent";
    channelID = "";
    roles = [];
    if (action == "vip" || action == "premium") {
      pool.query('UPDATE IGNORE bans_dota2 SET ?? = NULL WHERE userID = ?', [action, userID], function (error) {
        if (error) return console.error(error);
      });
      return console.error("UnBan ERROR: ", err.message);
    }
  }
  if (note != "silent") banLogs(action, {user_id: byUser, target_id: userID, roleID: actionRoles[action]}, note);
  if (action === "ban") {
      if (roles.includes(actionRoles[action])) bot.removeFromRole({serverID: SERVER, roleID: actionRoles[action], userID: userID});
      if (channelID) bot.sendMessage({to: channelID, message: `:white_check_mark: Бан успешно снят с <@${userID}>. Надеемся на твою добропорядочность :upside_down: [by <@${byUser}>]`});
      pool.query('UPDATE IGNORE bans_dota2 SET ban = NULL WHERE userID = ?', userID, function (error) {
        if (error) return console.error(error);
      });
  } else if (action === "bangood") {
      if (roles.includes(actionRoles[action])) bot.removeFromRole({serverID: SERVER, roleID: actionRoles[action], userID: userID});
      if (channelID) bot.sendMessage({to: channelID, message: `Бан в **Общение Good** для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
      pool.query('UPDATE IGNORE bans_dota2 SET flood = NULL WHERE userID = ?', userID, function (error) {
        if (error) return console.error(error);
      });
  } else if (action === "banwtf") {
    if (roles.includes(actionRoles[action])) bot.removeFromRole({serverID: SERVER, roleID: actionRoles[action], userID: userID});
    if (channelID) bot.sendMessage({to: channelID, message: `Бан в **Общение WTF** для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
    pool.query('UPDATE IGNORE bans_dota2 SET voicemute = NULL WHERE userID = ?', userID, function (error) {
      if (error) return console.error(error);
    });
  } else if (action === "mute") {
    if (roles.includes(actionRoles[action])) bot.removeFromRole({serverID: SERVER, roleID: actionRoles[action], userID: userID});
    if (channelID) bot.sendMessage({to: channelID, message: `Текстовый мут для <@${userID}> успешно снят :white_check_mark: [by <@${byUser}>]`});
    pool.query('UPDATE IGNORE bans_dota2 SET chatmute = NULL WHERE userID = ?', userID, function (error) {
      if (error) return console.error(error);
    });
  } else if (action === "vip") {
    let roomNumber, voiceID;
    roles.forEach((item) => {
      let roleName = bot.servers[SERVER].roles[item].name;
      if (roleName.toUpperCase().includes("VIP")) {
        let room = roleName.match(/VIP (\d{1,3})/i);
        if (room) {
          roomNumber = room[1];
          bot.editRole({serverID: SERVER,
            roleID: item,
            name: `VIP ${roomNumber} - свободно`
          });
          voiceID = vipRooms[roomNumber];
          let ch = bot.servers[SERVER].channels[voiceID];
          let i = 0;
          for (let key in ch.permissions.user) {
            setTimeout(()=>{
              bot.deleteChannelPermission({
                channelID: voiceID,
                userID: key
              });
              console.log("Deleted permission for userID: " + key + " in VIP Room " + roomNumber);
            }, i*1100);
            i++;
          }
        }
        removeRole(userID, item);
      }
    });
    pool.query('UPDATE IGNORE bans_dota2 SET vip = NULL WHERE userID = ?', userID, function (error) {
      if (error) return console.error(error);
    });
    if (roomNumber) {
      bot.editChannelInfo({channelID: voiceID, name: `🎩VIP Room ${roomNumber}`});
      if (channelID) bot.sendMessage({to: channelID, message: `К сожалению, игрок <@${userID}> больше не является VIP пользователем :disappointed_relieved: `});
    } else {
      if (channelID) bot.sendMessage({to: channelID, message: `:warning: Пользователь <@${userID}> не является VIP пользователем.`});
    }
  } else if (action === "premium") {
    let roomNumber, voiceID;
    roles.forEach((item) => {
      let roleName = bot.servers[SERVER].roles[item].name;
      if (roleName.toUpperCase().includes("PREM")) {
        let room = roleName.match(/PREM (\d{1,3})/i);
        if (room) {
          roomNumber = room[1];
          bot.editRole({serverID: SERVER,
            roleID: item,
            name: `PREM ${roomNumber} - свободно`
          });
          voiceID = premRooms[roomNumber];
          let ch = bot.servers[SERVER].channels[voiceID];
          let i = 1;
          for (let key in ch.permissions.user) {
            setTimeout(()=>{
              bot.deleteChannelPermission({
                channelID: voiceID,
                userID: key
              });
              console.log("Deleted permission for userID: " + key + " in Prem Room " + roomNumber);
            }, i*1100);
            i++;
          }
          bot.editChannelPermissions({channelID: voiceID, roleID: SERVER, allow: [10]});
        }
        removeRole(userID, item);
      }
    });
    pool.query('UPDATE IGNORE bans_dota2 SET premium = NULL WHERE userID = ?', userID, function (error) {
      if (error) return console.error(error);
    });
    if (roomNumber) {
      bot.editChannelInfo({channelID: voiceID, name: `👑Premium ${roomNumber}`, user_limit: 4});
      if (channelID) bot.sendMessage({to: channelID, message: `Игрок <@${userID}> больше не является **Premium** пользователем :disappointed_relieved: `});
    } else {
      if (channelID) bot.sendMessage({to: channelID, message: `:warning: Пользователь <@${userID}> не является **Premium** пользователем.`});
    }
  }
}

bot.on('disconnect', function(errMsg, code) {
  console.log(errMsg, "The BOT has been DISCONNECTED :( Error code: " + code + "; Restarting...");
  bot.connect();
  setTimeout(() => {
    if(!bot.connected) bot.connect();
  }, 8000);
});

function removeRole(userID, oldRole, newRole, success, t1, t2) {
  let t0 = Math.floor(Math.random() * 9500 + 500);
  if (t1)
    t0 = t1;
  setTimeout (() => {
    bot.removeFromRole({serverID: SERVER, roleID: oldRole, userID: userID});
    if (newRole && success)
      success(userID, newRole, t2);
  }, t0);
}

function addRole(userID, newRole, t2) {
  let t0 = Math.floor(Math.random() * 4000 + 1000);
  if (t2)
    t0 = t2;
  setTimeout (() => {
    bot.addToRole({serverID: SERVER, roleID: newRole, userID: userID});
  }, t0);
}

// function getUsers () {
//   if (!bot.servers[SERVER]) return;
//   for (let ids in bot.servers[SERVER].members) {
//     // online.push(ids);
//     // let roles = bot.servers[SERVER].members[ids].roles;
//     // let bool = false;
//     // if (roles.includes(nextSeason))
//     online.push(ids);
//     // // if (bot.servers[SERVER].members[ids].status)
//     // if (bool) online.push(ids);
//   }
// }

function uploadIMG (channelID, nickName, mode, region, a1, a2, a3, a4, a5, a6, a7, a8, prem = false) {
  let template = "template.png";
  if (prem) template = "template.png";
  let p1 = Jimp.read(template);
  // let p4 = Jimp.read("ava.jpg");
  let p2 = Jimp.loadFont("t24.fnt");
  let p3 = Jimp.loadFont("t18.fnt");
  Promise.all([p1, p2, p3]).then(function(images){
    let t24 = images[1];
    let t18 = images[2];
    // images[1].resize(106,106);
    images[0].print(t24, 120 - measureText(t24, nickName), 19, nickName)
    .print(t18, 78 - measureText(t18, mode), 68, mode)
    .print(t18, 182, 69, region)
    .print(t18, 120 - measureText(t18, a1), 112, a1)
    .print(t18, 120 - measureText(t18, a2), 146, a2)
    .print(t18, 120 - measureText(t18, a3), 178, a3)
    .print(t18, 120 - measureText(t18, a4), 210, a4)
    .print(t18, 260 - measureText(t18, a5), 112, a5)
    .print(t18, 260 - measureText(t18, a6), 147, a6)
    .print(t18, 260 - measureText(t18, a7), 177, a7)
    .print(t18, 260 - measureText(t18, a8), 210, a8)
    // .composite(images[4], 38, 36)
    .write("mypubg.info.png", () => {
      bot.uploadFile({to: channelID, file: 'mypubg.info.png'}, function(err){
        if (err) return console.error(err);
        bot.sendMessage({to: channelID, message: "", embed: {
          description: `Более подробные данные можете получить перейдя по [**ссылке**](https://mypubg.info/index.php?block=stats&nickname=${nickName}).`
        }});
      });
    });
  }).catch(err => console.error(err));
}

function measureText(font, text) {
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

function kickMe(userID, channelID, message, messageID) {
  // bot.deleteMessage({channelID: channelID, messageID: event.d.id});
  let voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
  if (!voiceID) {
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `Вы не находитесь в голосовой комнате :raised_hand:`});
  }
  let a = message.match(reg.e1);
  let b = message.match(reg.e2);
  if (a) a = a[0];
  else {
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `Укажите, пожалуйста, игрока (через @). Пример: \`!kick @Angelus#5785\``});
  }
  if (b) b = "\n" + b[1]; else b = "";
  let ch = bot.servers[SERVER].channels[voiceID];
  let chMembers = Object.keys(ch.members).map(function(key) {
    return key;
  });
  if (ch.user_limit > 10 || !ch.user_limit) {
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `Данная команда работает только в Squad/Duo/Event комнатах.`});
  }
  let kickLimit = Math.round(ch.user_limit / 2);
  // let roles = bot.servers[SERVER].members[userID].roles;
  if (ch.parent_id == actionRoles.vip_parent1 || ch.parent_id == actionRoles.vip_parent2 || ch.parent_id == actionRoles.prem_parent1 || ch.parent_id == actionRoles.prem_parent2) { // delete last id
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `:warning: Нельзя использовать команду в VIP комнатах.`});
  }
  if (voiceID != bot.servers[SERVER].members[a].voice_channel_id) {
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `Пользователь <@${a}> не находится в вашей комнате :warning:`});
  }
  let j = 1, k = 0, msgID;
  for (let i = kicks.length - 1; i >= 0; i--) {
    if (userID === kicks[i].userID) {
      k++;
      if (kicks[i].banned === a) {
        if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
        return bot.sendMessage({to: userID, message: `Вы уже отправляли жалобу на <@${a}>. Попробуйте еще раз через 30 минут.`});
      }
      if (kicks[i].voiceID != voiceID) {
        if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
        return bot.sendMessage({to: userID, message: `Вы уже использовали данную команду в другой комнате <#${kicks[i].voiceID}>. Попробуйте еще раз через 30 минут.`});
      }
    }
    if (a === kicks[i].banned) {
      msgID = kicks[i].messageID;
      j++;
    }
  }
  if (k >= 3) {
    if (messageID) bot.deleteMessage({channelID: channelID, messageID: messageID});
    return bot.sendMessage({to: userID, message: `Вы достигли лимита отправки жалоб (3 за 30 минут) :hushed: Попробуйте еще раз через 30 минут.`});
  }
  if (j == 1 && j != kickLimit) {
    let text = "";
    if (chMembers.length > 2) {
      chMembers.forEach(function (item){
        if (item != userID && item != a) {
          text = text + "<@" + item + ">, ";
        }
      });
      text = text.slice(0, -2) + " вы согласны кикнуть <@" + a + "> с вашей комнаты? Если да, нажмите на значок ниже"
    }
    bot.sendMessage({to: channelID, message: text, embed: {
      color: 0x894ea2,
      description: `<@${a}> получил 1 жалобу в ${ch.name} :small_orange_diamond: by <@${userID}>${b}`
    }}, function(err, res) {
      if (err) return console.log(err);
      kicks.push({userID: userID, banned: a, voiceID: voiceID, date: new Date(), first: true, messageID: res.id});
      bot.addReaction({channelID: channelID, messageID: res.id, reaction: "⛔"}, function (err) {
        if (err) console.log(err);
      });
      setTimeout(() => {bot.removeAllReactions({channelID: channelID, messageID: msgID})}, 300000);
    });
  } else if (j < kickLimit) {
    let text = "";
    if (chMembers.length > 2) {
      chMembers.forEach(function (item){
        if (item != userID && item != a) {
          text = text + "<@" + item + ">, ";
        }
      });
      text = text.slice(0, -2) + " вы согласны кикнуть <@" + a + "> с вашей комнаты? Если да, нажмите на значок ниже"
    }
    bot.editMessage({channelID: channelID, messageID: msgID, message: text, embed: {
      color: 0x894ea2,
      description: `<@${a}> получил ${j} жалобы в ${ch.name} :small_orange_diamond: by <@${userID}>${b}`
    }});
    kicks.push({userID: userID, banned: a, voiceID: voiceID, date: new Date(), first: false, messageID: msgID});
  } else if (j >= kickLimit) {
    if (msgID) {
      bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
        if (err) return console.log(err);
        kicks.push({userID: userID, banned: a, voiceID: voiceID, date: new Date()});
        bot.moveUserTo({serverID: SERVER, userID: a, channelID: actionRoles.kick_room});
        bot.editMessage({channelID: channelID, messageID: msgID, message: "", "embed": {
          color: 0x894ea2,
          description: `:no_pedestrians: <@${a}> был кикнут с ${ch.name}. by <@${userID}>`
        }});
        setTimeout(() => {bot.removeAllReactions({channelID: channelID, messageID: msgID})}, 1050);
      });
    } else {
      bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
        if (err) return console.log(err);
        kicks.push({userID: userID, banned: a, voiceID: voiceID, date: new Date()});
        bot.moveUserTo({serverID: SERVER, userID: a, channelID: actionRoles.kick_room});
        bot.sendMessage({to: channelID, message: "", "embed": {
          color: 0x894ea2,
          description: `:no_pedestrians: <@${a}> был кикнут с ${ch.name} :small_orange_diamond: by <@${userID}>${b}`
        }});
      });
    }
  }
}

function banMe(userID, channelID, a) {
  let roles = bot.servers[SERVER].members[userID].roles;
  if (!roles.includes(actionRoles.premium))
    return bot.sendMessage({to: userID, message: `Вам необходимо иметь **Premium+** роль, чтобы пользоваться этой командой :point_up:`});
  let roomNumber, voiceID, ch;
  roles.forEach((item) => {
    let roleName = bot.servers[SERVER].roles[item].name;
    let room = roleName.match(/PREM (\d{1,3})/i);
    if (room) {
      roomNumber = parseInt(room[1]);
      voiceID = premRooms[roomNumber];
      ch = bot.servers[SERVER].channels[voiceID];
    }
  });
  if (!roomNumber) return bot.sendMessage({to: userID, message: `Вам необходимо иметь Premium комнату, чтобы пользоваться этой командой :exclamation:`});
  bot.editChannelPermissions({channelID: voiceID, userID: a, deny: [20, 21]}, (err) => {
    if (err) return console.log(err);
    if (voiceID == bot.servers[SERVER].members[a].voice_channel_id)
      bot.moveUserTo({serverID: SERVER, userID: a, channelID: actionRoles.kick_room});
    bot.sendMessage({to: userID, message: "", "embed": {
      color: 0xe74c3c,
      description: `:no_pedestrians: <@${a}> был заблокирован доступ в комнату **${ch.name}**`
    }});
  });
}

function unbanMe(userID, channelID, a) {
  let roles = bot.servers[SERVER].members[userID].roles;
  // if (!roles.includes(actionRoles.premium))
  //   return bot.sendMessage({to: userID, message: `Вам необходимо иметь **Premium+** роль, чтобы пользоваться этой командой :point_up:`});
  let roomNumber, voiceID, ch;
  roles.forEach((item) => {
    let roleName = bot.servers[SERVER].roles[item].name;
    let room = roleName.match(/PREM (\d{1,3})/i);
    if (room) {
      roomNumber = parseInt(room[1]);
      voiceID = premRooms[roomNumber];
      ch = bot.servers[SERVER].channels[voiceID];
    }
  });
  if (!roomNumber) return bot.sendMessage({to: userID, message: `Вам необходимо иметь Premium роль, чтобы пользоваться этой командой :exclamation:`});
  console.log(ch.permissions.user);
  if (ch.permissions.user[a]) {
    bot.deleteChannelPermission({channelID: voiceID, userID: a});
    bot.sendMessage({to: userID, message: '', embed: {
      color: 0x49bd1c,
      description: `<@${a}> был удалён из бан-листа вашей комнаты **${ch.name}**`
    }});
  } else {
    bot.sendMessage({to: userID, message: '', embed: {
      color: 0xe67e22,
      description: `У <@${a}> и так был доступ к комнате **${ch.name}**`
    }});
  }
}

bot.on("messageReactionAdd", function(event) {
  if (event.d.user_id === bot.id) return;
  let channelID = event.d.channel_id;
  // console.log(`chID: ${channelID} [${channelID == actionRoles.report_logi}], Emoji: ${event.d.emoji.name} [${event.d.emoji.name == "yes"}]`);
  // console.log(event.d.emoji);
  if (channelID == actionRoles.report_room && event.d.emoji.name === "⛔") {
    let messageID = event.d.message_id;
    let a = false;
    kicks.forEach(function (item){
      if (item.messageID === messageID) a = "<@" + item.banned + ">";
    });
    if (!a) return console.log("noSuchMessage");
    kickMe(event.d.user_id, actionRoles.report_room, a);
  } else if (channelID == actionRoles.report_logi && event.d.emoji.name == "yes") {
    // console.log("yes -> let's go!");
    bot.getMessage({channelID: actionRoles.report_logi, messageID: event.d.message_id}, function (err, res) {
      if (err) return console.error(err);
      let uID = res.content.match(reg.e1);
      if (uID) {
        bot.sendMessage({to: uID[0], message: '',
          embed: {
            description: 'Ув. пользователь, Ваше обращение рассмотрено к нарушителю приняты меры. Благодарим Вас за бдительность!\n\nС ув. Администрация.',
            thumbnail: { url: 'https://media.discordapp.net/attachments/457189456408084497/457612759161372672/Reports-icon1-communications.png' }
          }
        });
        bot.addReaction({channelID: actionRoles.report_logi, messageID: res.id, reaction: "✉"}, function (err) {
          if (err) console.log(err);
        });
      }
    });
  } else if (channelID == actionRoles.report_logi && event.d.emoji.name == "no") {
    bot.getMessage({channelID: actionRoles.report_logi, messageID: event.d.message_id}, function (err, res) {
      if (err) return console.error(err);
      let uID = res.content.match(reg.e1);
      if (uID) {
        bot.sendMessage({to: uID[0], message: '',
          embed: {
            description: 'Ув. пользователь. Вам отказано в рассмотрении обращения!\nP.S. Скорее всего Ваши док-ва были не убедительны.\nС ув. Администрация',
            thumbnail: { url: 'https://media.discordapp.net/attachments/457189456408084497/457612759161372672/Reports-icon1-communications.png' }
          }
        });
        bot.addReaction({channelID: actionRoles.report_logi, messageID: res.id, reaction: "📨"}, function (err) {
          if (err) console.log(err);
        });
      }
    });
  }
});

function lfg (userID, channelID, fpp = false, note = "", update = false, invite = "", prem = false, test = false, myAva, msgID) {
  let voiceID;
  try {
    if (update) voiceID = update;
    else voiceID = bot.servers[SERVER].members[userID].voice_channel_id;
  } catch (err) {
    return console.error(err);
  }
  if (voiceID) {
    if (!update) {
      let roles = bot.servers[SERVER].members[userID].roles;
      if (roles.includes(actionRoles.premium)) prem = true;
    }
    let ch = bot.servers[SERVER].channels[voiceID];
    if (ch.parent_id == actionRoles.flood_parent || ch.parent_id == actionRoles.afk_parent) return console.log("AFK or SEARCH rooms");
    let guest = 0;
    if (test) guest = 2;
    // if (ch.parent_id == actionRoles.vip_parent1 || ch.parent_id == actionRoles.prem_parent1) guest = 1;
    let chMembers = ch.members;
    chMembers = Object.keys(chMembers).map(function(key) {
      return key;
    });
    let limit = ch.user_limit;
    if (limit == 0) limit = 99;
    let c = limit - chMembers.length;
    let duo = false, tier = "";
    for (let i = 0; i < chMembers.length; i++) {
      let myID = chMembers[i];
      if (!bot.servers[SERVER].members[myID]) {
        console.log(`lfg_userError: ${myID}`);
        delete ch.members[myID];
        allUsers.get();
      }
    }
    if ((c > 0)||(c >= 0 && update)) {
      let fDate = new Date();
      if (!update) {
        for (let i = VoiceParties.length - 1; i >= 0; i--) {
          if (voiceID === VoiceParties[i].voiceID && fDate - VoiceParties[i].date < 30000) return;
          else if (voiceID === VoiceParties[i].voiceID && fDate - VoiceParties[i].date >= 30000) {
            let uu = VoiceParties[i].messageID;
            setTimeout(() => { bot.deleteMessage({channelID: channelID, messageID: uu}); }, 750);
            VoiceParties.splice(i, 1);
          }
        }
      }
      let myMessage = "", nickNames = [], stream = false;
      for (let i = 0; i < chMembers.length; i++) {
        nickNames.push(chMembers[i]);
        if (bot.users[chMembers[i]].game && !stream) {
          stream = bot.users[chMembers[i]].game.url; // check this out
        }
      }
      if (nickNames.length === 0) return console.log("Nobody here! WTF?!");
      pool.getConnection(function(err, connection) {
        if (err) return console.log(err);
        connection.query('SELECT * FROM gamers_dota2 WHERE userID in (?)', [nickNames], function (error, results) {
          connection.release();
          if (error) return console.log(error);
          let a3 = 10, cEmoji = "", oldNote = note;
          if (results.length > 0) {
            let myNames = results.map(x => x.userID);
            let a1 = 0, a2 = 0;
            let final = results.map(x => {
              let role = "", gold = "", xp = "";
              if (x.rank_tier) {
                a1 += rankToNumber({rank: x.rank_tier});
                a2++;
              }
              try {
                let roles = bot.servers[SERVER].members[x.userID].roles;
                if (roles.includes(actionRoles.carry)) role = "<@&" + actionRoles.carry + ">";
                else if (roles.includes(actionRoles.mider)) role = "<@&" + actionRoles.mider + ">";
                else if (roles.includes(actionRoles.offlaner)) role = "<@&" + actionRoles.offlaner + ">";
                else if (roles.includes(actionRoles.sup4)) role = "<@&" + actionRoles.sup4 + ">";
                else if (roles.includes(actionRoles.sup5)) role = "<@&" + actionRoles.sup5 + ">";
                else role = "<@&" + actionRoles.no_role + ">";
                if (roles.includes(king.bossRole)) tier = "boss";
              } catch (err) {
                console.log(err);
              }
              if (x.gpm) gold = dotaEmojis.gold + ` ${x.gpm} `;
              if (x.epm) xp = dotaEmojis.xp + ` ${x.epm}`;
              if (x.last_hits) xp += ` ${dotaEmojis.last_hits} ${x.last_hits}`;
              let rt = x.rank_tier || 0;
              return `${dotaEmojis[rt]}[**${x.name}**](https://www.opendota.com/players/${x.dota}) ${role} ${gold}${xp}`;
            });
            if (a2 > 0) a3 = rankToNumber({number: Math.round(a1 / a2)});
            if (nickNames.length - results.length > 0) {
              nickNames.forEach(function(item) {
                if (!myNames.includes(item)) {
                  final.push(`${dotaEmojis[0]}<@${item}> (без регистрации)`);
                }
              });
            }
            if (c > 0) {
              if (note) note = note.replace(" :white", `${countEmojis[c]} :white`);
              else cEmoji = "\n" + countEmojis[c] + " :white_small_square: ";
            }
            myMessage = final.join("\n");
          } else {
            let final = [];
            nickNames.forEach(function(item) {
              final.push(`${dotaEmojis[0]}<@${item}> - ¯\\_(ツ)_/¯`);
            });
            if (c > 0) {
              if (note) note = note.replace(" :white", `${countEmojis[c]} :white`);
              else cEmoji = "\n" + countEmojis[c] + " :white_small_square: ";
            }
            myMessage = final.join("\n");
          }
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
                  })
                }
              })
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

            if (c > 0 && tier === "boss") {
              img = `http://top-pubg.ru/img/my/+${c < 4 ? c : '+'}fppBoss${duo ? "_duo" : ""}.png`;
            } else {
              if (c == 0) img = `http://top-pubg.ru/img/dota/0.png`;
              else img = `http://top-pubg.ru/img/dota/${a3}${guest == 2 ? '' : 'a'}.png`;
            }
            c = c + " ";
            if (prem) myColor = 0xf1c40f;
            else if (guest == 2) myColor = 0xb72f19;
            else myColor = 0x6cb055;

            let sICO = " :white_check_mark:";
            if (guest === 1) sICO = " :crown:";
            let embedPart = note + `\n${cEmoji}Зайти: ` + myUrl + sICO;
            let embedTitle = "В поисках +" + c + " в " + ch.name;
            let twitch = "";
            if (c.startsWith("0")) {
              embedPart = "";
              embedTitle = "Играют в " + ch.name;
              ava = "https://i.imgur.com/uww1e1O.png";
              if (stream) {
                myColor = 0x6444a1;
                embedPart = " :white_small_square: " + stream;
                twitch = {url: "https://i.imgur.com/0mdJVQb.png"};
                ava = "https://i.imgur.com/LI43d7L.png";
              } else if (prem) {
                ava = "https://i.imgur.com/RGfhPLe.png";
                embedPart = "";
              }
            }
            let lfgEmbed = {
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
              image: twitch,
              title: '',
              url: ''
            }
            if (update) {
              bot.editMessage({channelID: channelID, messageID: userID, message: '', embed: lfgEmbed});
              for (let i = VoiceParties.length - 1; i >= 0; i--) {
                if (VoiceParties[i].voiceID === voiceID) {
                  VoiceParties[i].chMembers = chMembers;
                }
              }
              return;
            } else {
              bot.sendMessage({to: channelID, message: '', embed: lfgEmbed}, function(err, res) {
                if (err) return console.log(err);
                VoiceParties.push(new VoiceGroup(voiceID, res.id, channelID, fpp, oldNote, myUrl, prem, chMembers, test, ava));
              });
            }
          });
        });
      });
    } else {
      console.log("Количество людей? Переменная c. voiceID: " + voiceID);
      bot.sendMessage({to: userID, message: `Ваша комната заполнена (нет свободных мест).`});
    }
  } else {
    bot.sendMessage({to: userID, message: "<@" + userID + ">, чтобы воспользоваться командой `fpp` или `tpp`, для начала нужно зайти в Squad или Duo комнату."});
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
      return this.myAva;
    }
  }
};

bot.on("voiceStateUpdate", vChannel => {
  let userID = vChannel.d.user_id;
  let channelID = vChannel.d.channel_id;
  // king.new(userID, channelID);
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
    if (fDate - VoiceParties[i].date > 1200000) {
      VoiceParties.splice(i, 1);
    }
  }
});

function timeSince(date, reverse) {
  if (reverse) date = Date.now()*2 - date;
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
    return interval + " часа ago";
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
          if (n1 === "0") return Math.round(interval*10)/10 + " часов";
          return Math.round(interval*10)/10 + " часа";
        }
      }
      return Math.round(interval*10)/10 + " часов";
    } else {
      return Math.round(interval*10)/10 + " часа"
    }
  } else {
    return Math.round(interval*10)/10 + " час";
  }
}

function sklonWord (interval, word) {
  let n = interval.toString();
  let n1 = n.slice(-1);
  if (interval >= 5) {
    if (interval > 20) {
      if (n1 === "1") {
        return interval + ` ${word}`;
      } else if (n1 <= 4) {
        if (n1 === "0") return interval + ` ${word}ов`;
        return interval + ` ${word}а`;
      }
    }
    return interval + ` ${word}ов`;
  } else {
    if (interval == 1) return interval + ` ${word}`
    return interval + ` ${word}а`
  }
}

function howmuchtime(date) {
  let seconds = date / 1000;
  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " year";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    if (interval >= 5) return interval + " дней";
    return interval + " дня";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    let n = interval.toString();
    if (interval >= 5) {
      if (interval > 20) {
        if (n.slice(-1) == "1") {
          return interval + " час";
        } else if (n.slice(-1) <= 4) {
          if (n.slice(-1) === 0) return interval + " часов";
          return interval + " часа";
        }
      }
      return interval + " часов";
    }
    return interval + " часа";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    let n = interval.toString();
    if (interval >= 5) {
      if (interval > 20) {
        if (n.slice(-1) == "1") {
          return interval + " минуту";
        } else if (n.slice(-1) <= 4) {
          if (n.slice(-1) === 0) return interval + " минут";
          return interval + " минуты";
        }
      }
      return interval + " минут";

    }
    return interval + " минуты";
  }
  return Math.floor(seconds) + " секунд";
}

function bans() {
  let now = Date.now();
  if (!bot.servers[SERVER]) return;
  pool.getConnection(function(err, connection) {
    if (err) return console.error(err);
    connection.query('SELECT * FROM bans_dota2', function (error, results) {
      if (error) {
        connection.release();
        return console.error(">> auto-bans ERROR: ", error);
      }
      if (results.length > 0) {
        results.forEach(function(item) {
          let userID = item.userID;
          for (key in item) {
            if (item[key] && item[key].length < 16) item[key] = parseInt(item[key]);
          }
          if (!item.ban && !item.chatmute && !item.voicemute && !item.flood && !item.vip && !item.premium) {
            connection.query('DELETE FROM bans_dota2 WHERE `userID` = ?', [userID], function (error) {
              if (error) console.log(error);
              console.log("Deleted the whole record from bans: " + userID);
            });
          } else if (item.ban && item.ban < now) {
            unban("ban", userID, 0, "", bot.id);
            console.log("- ban: " + userID);
          } else if (item.chatmute && item.chatmute < now) {
            unban("mute", userID, 0, "", bot.id);
            console.log("- mute: " + userID);
          } else if (item.voicemute && item.voicemute < now) {
            unban("banwtf", userID, 0, "", bot.id);
            console.log("- banWTF: " + userID);
          } else if (item.flood && item.flood < now) {
            unban("bangood", userID, 0, "", bot.id);
            console.log("- banGood: " + userID);
          } else if (item.vip && item.vip < now) {
            unban("vip", userID, 0, "", bot.id);
            console.log("- vip: " + userID);
          } else if (item.premium && item.premium < now) {
            unban("premium", userID, 0, "", bot.id);
            console.log("- premium: " + userID);
          }
        });
        let arr = [], prems = [], letter;
        results.forEach(function(item) {
          let userID, name, time, action;
          action = "ban";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles[action]}>`;
            time = ` до ${formatDate(item[action], true)}`;
            arr.push({text: userID + name + time, time: item[action]});
          }
          action = "chatmute";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles.mute}>`;
            time = ` до ${formatDate(item[action], true)}`;
            arr.push({text: userID + name + time, time: item[action]});
          }
          action = "voicemute";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles.banwtf}>`;
            time = ` до ${formatDate(item[action], true)}`;
            arr.push({text: userID + name + time, time: item[action]});
          }
          action = "flood";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles.bangood}>`;
            time = ` до ${formatDate(item[action], true)}`;
            arr.push({text: userID + name + time, time: item[action]});
          }
          action = "vip";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles[action]}>`;
            time = ` до ${formatDate(item[action], true)}`;
            let diff = item[action] - now;
            if (!letter && diff < 172800000 && diff > 169200000) {
              if (!inbox.includes(item.userID)) letter = {userID: item.userID, role: "vip"};
            }
            prems.push({text: userID + name + time, time: item[action]});
          }
          action = "premium";
          if (item[action]) {
            userID = `<@${item.userID}>`;
            name = ` получил <@&${actionRoles[action]}>`;
            time = ` до ${formatDate(item[action], true)}`;
            let diff = item[action] - now;
            if (!letter && diff < 172800000 && diff > 169200000) {
              if (!inbox.includes(item.userID)) letter = {userID: item.userID, role: "premium"};
            }
            prems.push({text: userID + name + time, time: item[action]});
          }
        });

        if (arr.length > 0) {
          arr.sort((a, b) => a.time - b.time);
          let embed = {color: 0xe74c3c, title: "Список банов", description: arr.map((item)=>item.text).join("\n").slice(0, 1990)};
          bot.editMessage({channelID: actionRoles.logs, messageID: actionRoles.banTable, message: "", embed: embed});
        }
        if (prems.length > 0) {
          prems.sort((a, b) => a.time - b.time);
          let embed = {color: 0xffd700, title: "Список VIP / Premium", description: prems.map((item)=>item.text).join("\n").slice(0, 1990)};
          setTimeout(() => bot.editMessage({channelID: actionRoles.premiumlogs, messageID: actionRoles.premTable, message: "", embed: embed}), 1000);
        }
        if (letter) {
          if (letter.role === "premium") {
            bot.sendMessage({to: letter.userID, embed: {
              color: 0xf1c40f,
              description: `Ув. <@${letter.userID}>, через 2 дня у Вас заканчиваеться роль - **Premium**.\n\nС ув. Администрация`,
              thumbnail: {
                url: vars.img.prem_thumb
              }
            }});
            inbox.push(letter.userID);
          } else if (letter.role === "vip") {
            bot.sendMessage({to: letter.userID, embed: {
              color: 0xf1c40f,
              description: `Ув. <@${letter.userID}>, через 2 дня у Вас заканчиваеться роль - **VIP**.\n\nС ув. Администрация`,
              thumbnail: {
                url: vars.img.vip_thumb
              }
            }});
            inbox.push(letter.userID);
          }
        }
      }
      connection.release();
    });
  });
}

function formatDate(date, time) {
  if (!(typeof date.getMonth === 'function')) date = new Date(date);
  var monthNames = [
    "Января", "Февраля", "Марта",
    "Апреля", "Мая", "Июня", "Июля",
    "Августа", "Сентября", "Октября",
    "Ноября", "Декабря"
  ];
  let month = monthNames[date.getMonth()];
  if (time) return date.getHours() + ':' + date.getMinutes() + ' [' + date.getDate() + ' ' + month + ' ' + date.getFullYear();
  return date.getDate() + ' ' + month + ' ' + date.getFullYear();
}

let getAll = {
  date: Date.now(),
  update() {
    let now = Date.now();
    if (now - this.date > 900000) {
      this.date = now;
      bot.getAllUsers();
    }
  }
}

bot.on('presence', function(user, userID, status, game, event) {
  let streamRole = actionRoles.stream_role;
  let streamSpotlight = actionRoles.stream_live;
  let roles = event.d.roles;
  let stream = false;
  if (roles.includes(streamRole) && game) {
    stream = game.url;
    if (stream) {
      if (roles.includes(streamSpotlight)) {
        return;
      } else {
        bot.addToRole({serverID: SERVER, roleID: streamSpotlight, userID: userID});
        console.log("+ New Streamer: " + stream);
      }
    }
  }
  if (roles.includes(streamSpotlight) && !stream) {
    bot.removeFromRole({serverID: SERVER, roleID: streamSpotlight, userID: userID});
  }
});

function pm(userID, channelID, message = '', embed = '') {
  if (!message && !embed || !userID && !channelID) return console.error("PM exception");
  if (!userID) {
    return bot.sendMessage({to: channelID, message: message, embed: embed}, function(err, res) {
      if (err) return console.error(err);
      setTimeout(() => bot.deleteMessage({channelID: channelID, messageID: res.id}), 60000);
    });
  }
  bot.sendMessage({to: userID, message: message, embed: embed}, function(err) {
    if (err) {
      bot.sendMessage({to: channelID, message: message, embed: embed}, function(err, res) {
        if (err) return console.error(err);
        setTimeout(() => bot.deleteMessage({channelID: channelID, messageID: res.id}), 60000);
      });
    }
  });
}

function rankToNumber(obj = {}) {
  let {rank, number} = obj;
  if (rank) {
    rank += "";
    return 6*rank[0] + +rank[1];
  } else if (number) {
    let a = Math.floor(number/6) + "";
    let b = number % 6 + "";
    return parseInt(a+b);
  }
}

function getUsers () {
  pool.query('SELECT userID, dota FROM gamers_dota2', function (error, results) {
    if (error) return console.log(error);
    if (!results || results.length == 0) return console.log("Nobody in DataBase");
    results.forEach(item => {
      if (item.dota) onlineDota.push({userID: item.userID, dota: item.dota});
    })
    console.log("DOTA members: " + onlineDota.length);
  });
}

function botWork() {
  if (!bot.servers[SERVER]) return;
  if (onlineDota.length < 1) {
    return getUsers();
  }
  let {userID, dota} = onlineDota.pop();
  if (bot.servers[SERVER].members[userID]) {
    getRankDota(userID, 0, dota);
  } else {
    console.log("He isn't on the server: " + userID);
  }
}

setInterval(botWork, 120000);

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

pool.on('enqueue', function () {
  console.log('Waiting for available connection slot');
});

