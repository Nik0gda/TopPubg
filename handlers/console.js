module.exports.run = (client) =>{
    let prompt = process.openStdin()
    prompt.addListener('data', res=>{
        let x = res.toString().trim().split(/ +/g)
        client.channels.get('623224862227300372')
    })
}