const fetch = require('node-fetch')
const link = 'https://api.pubg.com/shards/steam'
async function seasons() {
    const params = {
        "Accept": "application/vnd.api+json",
        "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzZTFiMDQ5MC1kMTRjLTAxMzctOWU4OS0wNWYzMGFiNDJlNDIiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTcxMTI0OTEwLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImthYnJrYWJyLWdtYWlsIn0.gobgBXy7OKOPIHQMs-TxxNsMByYuKG2TLmHRFMmScMs`
    }
    let response = await fetch(`${link}/seasons`, {
        headers: params
    })
    return response

}
const Bottleneck = require("bottleneck")
const limiter = new Bottleneck({
    reservoir: 10, // initial value
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
    highWater: 20, // max length of queue 
    strategy: Bottleneck.strategy.OVERFLOW, // stragedy of not queuing new requests
    // also use maxConcurrent and/or minTime for safety
    maxConcurrent: 1,
    minTime: 333 // pick a value that makes sense for your use case
});
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  const counts = limiter.counts();

let message = async () =>{
    let res = await limiter.schedule(() => seasons())
    if(!res.ok){
        console.log(`${i} err ${new Date()} `,counts)
    }
    console.log(`${i} ok ${new Date()} `,counts)
}
for(i=0;i<= 30;i++){
    message()
}
