const hideCh = {
  parents: ['380063115871649793', '422508966308872202', '380032703757549568', '380037470743429132', '380735267721576448', '380037760062324737', '380041085138763777', '380736349818585088', '427219412781760512', '426932198583828500', '427217131017469972'],
  channels: {},
  getChannels(bot) {
    bot.logger.info('Getting all voiceChannels');
    this.channels = {};
    let arr = [];
    for (let item of bot.guilds.values()) {
      for (let ch of item.channels.values()) {
        if (this.parents.includes(ch.parentID))
          arr.push({ name: ch.name, position: ch.position, parentID: ch.parentID, channelID: ch.id });
      }
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
  check(bot, guildID) {
    if (Object.keys(this.channels).length === 0) return this.getChannels(bot);
    for (let arr of Object.values(this.channels)) {
      let i = 0, j = 0, free = arr.length > 7 ? 2 : 1;
      arr.forEach(item => {
        let ch = bot.getChannel(item);
        if (!ch) return console.error(`NoChannel: ${item}`);
        if (ch.voiceMembers.size === 0) {
          let bool = 0;
          let perm = ch.permissionOverwrites.get(guildID) || {};
          if ((perm.deny & 1024) && !(perm.allow & 1024)) bool = 1;
          if (i < free) {
            if (bool) {
              ch.editPermission(guildID, perm.allow, perm.deny-1024, "role").catch(e => bot.logger.warn(e));
            }
            i++;
          } else if (!bool) {
            if (perm.allow & 1024) perm.allow = perm.allow - 1024;
            ch.editPermission(guildID, perm.allow, perm.deny|1024, "role").catch(e => bot.logger.warn(e));
          }
        }
      })
    }
  },
}

module.exports = hideCh;

/*
  permissionOverwrites:
   Collection [Map] {
     '380044534903734272' => PermissionOverwrite { allow: 1024, id: '380044534903734272', type: 'role' },
     '380044873476079617' => PermissionOverwrite { allow: 1024, id: '380044873476079617', type: 'role' },
     '380041844974944258' => PermissionOverwrite { allow: 1024, id: '380041844974944258', type: 'role' },
     '381495606679699456' => PermissionOverwrite { allow: 1024, id: '381495606679699456', type: 'role' },
     '380572693717843969' => PermissionOverwrite { deny: 2099264, id: '380572693717843969', type: 'role' },
     '294879878224805898' => PermissionOverwrite { allow: 1024, id: '294879878224805898', type: 'role' },
     '471993964308987906' => PermissionOverwrite { allow: 1, id: '471993964308987906', type: 'role' },
     '294871453994713106' => PermissionOverwrite { allow: 66560, id: '294871453994713106', type: 'role' },
     '437781063188742154' => PermissionOverwrite { deny: 2048, id: '437781063188742154', type: 'role' },
     '381546576071491584' => PermissionOverwrite { allow: 1024, id: '381546576071491584', type: 'role' },
*/