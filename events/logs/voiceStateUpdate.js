module.exports = async (client, oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel
    let channel = client.channels.find(x => x.id === '565765408578207744')
    let guild = client.guilds.get("303793341529718784");
    let user = guild.members.find(user => user.id === newMember.id)

        // For todays date;
        Date.prototype.today = function () { 
            return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
        }

        // For the time now
        Date.prototype.timeNow = function () {
            return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
        }


    var dateTime = new Date().today() + " " + new Date().timeNow();

    if (oldUserChannel !== undefined && newUserChannel !== undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalJump = {
                jump :  ' :left_right_arrow: Участник ' + newMember + ' переместился из канала ' + '`' + oldUserChannel.name + '` в канал `' + newUserChannel.name + '` [`'+dateTime + '`]'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalJump.jump
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalJump.jump)
            }
        }
    } else if (oldUserChannel === undefined && newUserChannel !== undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalEnter = {
                enter: ':mans_shoe: Участник' + newMember + ' вошёл в канал ' + '`' + newUserChannel.name + '` [`'+dateTime + '`]'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalEnter.enter
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalEnter.enter)
            }
        }
    } else if (newUserChannel === undefined) {
        if (oldUserChannel == newUserChannel) {} else {
            let typicalLeave = {
                leave:':runner: Участник' + newMember + ' вышел из канал ' + '`' + oldUserChannel.name + '` [`'+dateTime + '`]'
            }
            let notTypical = {
                jump: {
                    embed: {
                        description: typicalLeave.leave
                    }
                }
            }
            if (user.roles.find(r => r.id === "365485162466770956") || user.roles.find(r => r.id === "317322435751837697")) {
                channel.send(notTypical.jump)
            } else {
                channel.send(typicalLeave.leave)
            }
        }
    }
}