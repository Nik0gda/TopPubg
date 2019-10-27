module.exports = {
    config: {
        name: 'info',
        aliases: ['инфо', 'byaj', 'штащ']
    },
    run: async (client, msg, args) => {
        msg.delete().catch(error => console.error)
        let guild = client.guilds.get("303793341529718784");
        let author = guild.members.get(msg.author.id)
        if (!author.roles.has('317322435751837697') && !author.roles.has('365485162466770956') && !author.roles.has('562581648428892160') && !author.roles.has('567060199731625997')) return;
        if(args[0] == 'help'){
            msg.channel.send(`
                \`!info help\` - **Чтоб получить помощь**
                \`!info Ник_Игрока\` - **Чтоб получить общею информацию об игроке**
                \`!info Ник_Игрока prem\` - **Чтоб получить информацию о премиум статусе игрока**
                \`!info Ник_Игрока gain_reports (0)\*\`- **Чтоб получить информацию о полученных репортах на игрока**
                \`!info Ник_Игрока sent_reports (0)\*\`- **Чтоб получить информацию о полученных репортах от игрока**
                \`!info Ник_Игрока ban_history [ban/mute/global_ban]\* (0)\*\` - **Чтоб получить информацию о полученных мутах/банах/глобал_банах**
                \`!info Ник_Игрока nick_history (0)\*\` - **Чтоб получить информацию о старых никах игрока**
                \`(0)\` - **Последняя запись в дб для выбранной категории.**
                \'[ban/mute/global_ban]\' - **Выбор записей**
            `).then(mssg => mssg.delete(1000 * 60).catch(err => console.log(err)))
        }
    }
}