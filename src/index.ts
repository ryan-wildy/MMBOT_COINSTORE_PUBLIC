const ws1 = require('ws');
const http = require('https');
var crypto1 = require('crypto');
var sha256 = crypto1.createHmac('sha256', "key").update("message").digest("base64");


const API_URL = 'https://api.coinstore.com/api'



const REST_ACCOUNT = '/spot/accountList'
const REST_CANCEL_ORDER = '/trade/order/cancel'
const REST_CREATE_ORDER = '/trade/order/place'
const REST_DEPTH = '/v1/market/depth/'
const REST_NEW_ORDER = '/trade/order/active'
const REST_NEW_ORDER1 = '/trade/match/accountMatches'
const REST_ORDER_INFO = '/trade/order/orderInfo'

/* 

Logic : 
- create #(num_of_orders) orders starting at the #(base_price) and increasing by #(order_levels_percentage) percent for each subsequent order
- determine the direction of order based on the current price. if order is to be created below the current price, it will be a buy order, else a sell order
- create a large order of amount #(floor_support_usd) just below the #(base_price) to act as floor
- execute random trades of upto #(rand_trade_size_usd) USD in value every few seconds

*/


/* UPDATE TICKER NAME, decimal points, API KEY and SECRET HERE */
const TICKER = 'COINUSDT'
const APIKEY = '..'
const API_SECRET = '..'
const decimalplaces = 8

// BASE_PRICE to calculate price levels to set orders at
let base_price = 0.000098

// Size of each order in USD
let amountusd = 10

// number of price levels at which orders are placed
let num_of_orders = 100

// percentage difference between order levels
let order_levels_percentage = 1.5

// order size in USD placed right below the base price
let floor_support_usd = 500

// maximum trade size in usd for random trades (for generating volume)
let rand_trade_size_usd = 5


function parse_params_to_str(params:any){

  let url = '?'
  for (const [key, value] of Object.entries(params)) {
    url = url + (key) + '=' + (value) + '&'
  }

  url = url.slice(0,url.length-1)
  return url
  // return url[0:-1]
}
async function fetch_ticker(symbol:string){

  return new Promise ((resolve, reject)=>{
  let req = http.request('https://api.coinstore.com/api/v1/market/trade/'+TICKER,{}, (res:any) => {

  
          let data = ''
          
          res.on('data', (chunk:any) => {
              data += chunk;
          });
          
          res.on('end', () => {
              try {

                resolve(JSON.parse(data))
              } catch {

                reject('err.message')
              }
          });
            
        }).on("error", (err:any) => {
          reject('err.message')
        })
        req.end()
  })

}

async function get_depth_1(){

  return new Promise ((resolve, reject)=>{
  let req = http.request('https://api.coinstore.com/api/v1/market/depth/'+TICKER,{}, (res:any) => {

  
          let data = ''
          
          res.on('data', (chunk:any) => {
              data += chunk;
          });
          
          res.on('end', () => {
              try {

                resolve(JSON.parse(data))
              } catch {
                reject('err')
              }
          });
            
        }).on("error", (err:any) => {
          reject('err.message')
        })
        req.end()
  })

}
async function wait(t?:number) {
  console.log('--wait--')
  if(t){

    return new Promise(r => setTimeout(r, 1000*t));
  } else{

    return new Promise(r => setTimeout(r, 1000*5));
  }
}
function get_header(){

  let header = {CONTENT_TYPE : 'application/x-www-form-urlencoded'}
  return header

}
  
class Coinstore{
  apiKey:string = APIKEY
  secret:string = API_SECRET
  constructor(){

  }
  
  fetch_balance(){
  }
  
  get_sign(params:any, method:string){
  let expires = Date.now()
  let expires_key1 = ''+(Math.floor(expires / 30000))
  let expires_key = Buffer.from(expires_key1, 'utf-8').toString();
  let secret_key = Buffer.from(this.secret, 'utf-8').toString();
  let key1 = crypto1.createHmac('sha256', secret_key).update(expires_key).digest("hex");
  let key = Buffer.from(key1, 'utf-8').toString();
  if (method == 'GET'){

    params = parse_params_to_str(params)
    params = params.slice(1,params.length)
  } else {
    params = JSON.stringify(params)
  }
  let payload = Buffer.from(params, 'utf-8').toString();
  let signature = crypto1.createHmac('sha256', key).update(payload).digest("hex");
  let header = {
      "X-CS-APIKEY": this.apiKey,
      "X-CS-EXPIRES": ''+expires,
      "X-CS-SIGN": signature,
      'Content-Type': 'application/json',
  }
  

  return [expires, signature, header]
  }

  async _request_with_params(method:any, request_path:any, params:any){

    return this._request(method, request_path, params)
  }
  async _request(method:string, request_path:string, params:any, sign_flag=true) {

    return new Promise ((resolve, reject)=>{
    let header = get_header()
    if (sign_flag){

      let timestamp = Date.now()
      let sig = this.get_sign(params,method)
      let expires = sig[0]
      let sign = sig[1]
      header = sig[2]
    }
  
    if (method == 'GET'){

      request_path = request_path + parse_params_to_str(params)
    }
    let url = API_URL + request_path
    // console.log(url)
    let body = {}
    if(method == 'POST'){
      body = params
    }

    // console.log(method)
  
    if(method == 'GET'){
      let options = {headers:header,method:method}
      // console.log(options)
      let req = http.request(url,options, (res:any) => {

  // console.log('statusCode:', res.statusCode);
  // console.log('headers:', res.headers);

        let data = ''
        
        res.on('data', (chunk:any) => {
            data += chunk;
        });
        
        // Ending the response 
        res.on('end', () => {
          // console.log(data)
            // console.log('Body:', JSON.parse(data))
            try {

              resolve(JSON.parse(data))
            } catch {

              reject('err')
            }
            // return(JSON.parse(data))
        });
          
      }).on("error", (err:any) => {
        reject(err.message)
        console.log("Error: ", err)
      })
      req.end()

    } else if(method == 'POST'){

      let response = http.request(url,{headers:header,method:method},(res:any) => {
        let data = ''
        
        res.on('data', (chunk:any) => {
            data += chunk;
        });
        
        // Ending the response 
        res.on('end', () => {
          try {

            resolve(JSON.parse(data))
          } catch {
            reject('err')
          }
        });
          
      }).on("error", (err:any) => {
        console.log("Error: ", err)
        reject(err.message)
      })
      response.write(JSON.stringify(body))
      response.end()
    }

  });
    // console.log(response.status_code)
    // return response.json()
  }

 async fetch_orders(symbol:string, pagesize=200, page=0, sort=0){

  let params = {symbol:symbol,size:20}
  let rsp = await this._request_with_params('GET', REST_NEW_ORDER, params)
  return rsp
 }
 async cancel_order(order_id:string, symbol:string){

  let endpoint = REST_CANCEL_ORDER
  let params:any = {}
  params['ordId'] = order_id
  params['symbol'] = symbol
  return await this._request_with_params('POST', endpoint, params)
 }

 async create_order(symbol:string, side:string, volume:number, price:number){

  let params:any = {}
  params['side'] = side
  params['ordType'] = 'LIMIT'
  params['ordQty'] = volume
  params['symbol'] = symbol
  params['timestamp'] = Date.now()
  params['ordPrice'] = price
 
  return await this._request_with_params('POST', REST_CREATE_ORDER, params)
 }

}


let orders_to_do:any[]=[]

let c1 = new Coinstore()

async function botstart(){
  try{

  let f1:any = await fetch_ticker(TICKER).catch((err:any)=>{throw new Error('error getting price ')})
  if(!f1.data){
    throw new Error('Could not fetch price')
  }

  let price = parseFloat(f1.data[0].price)

  console.log(price)
  for(let o of orders_to_do){
    o.orderid = ''
    o.side = 'unknown'
    if(price > o.price){
      o.side = 'BUY'
    } else if(price < o.price){
      o.side = 'SELL'
    }
  }
  let currentorders:any = await c1.fetch_orders(TICKER,500).catch((err:any)=>{throw new Error('error getting old orders ')})
  let currentorders1 = currentorders.data

  let extraorders:any[] = []
  for(let c1 of currentorders1){
    let found = 0
    for(let o of orders_to_do){

      if(c1.ordPrice == o.price && o.orderid == ''){
        if(c1.side == o.side) {
          o.orderid = c1.ordId
          found = 1
        } else if(o.side == 'unknown'){
          o.side = c1.side
          o.orderid = c1.ordId
          found = 1
        }
        break
      }
    }
    if(found == 0){
      extraorders.push({price:c1.ordPrice,orderid:c1.ordId})
    }
  }


  for(let e1 of extraorders){
    console.log(await c1.cancel_order(e1.orderid,TICKER))
  }

  for(let o1 of orders_to_do){
    if(o1.orderid == '' && o1.side != 'unknown'){
      console.log(o1)
      console.log(await c1.create_order(TICKER,o1.side,o1.amountwldy,o1.price).catch((err:any)=>{console.log(err.message)}))
      await wait(2)
    }
  }


  let depth:any = await get_depth_1().catch((err:any)=>{console.log(err.message)})
  let depth_a = parseFloat(depth.data.a[0][0])
  let depth_b = parseFloat(depth.data.b[0][0])
  let diff = depth_a-depth_b

  if(diff >= 2/(10**decimalplaces)){
    let x = depth_b+(1/(10**decimalplaces))
    x += Math.random()*(diff-(1/(10**decimalplaces)))
    x = Math.floor(x*(10**decimalplaces))/10**decimalplaces
    console.log('random trade price - '+x)
    let random_volume = Math.floor(Math.random()*Math.floor(rand_trade_size_usd/x))
    console.log('coin volume - '+random_volume)

    if(Math.random() < 0.8){

      console.log(await c1.create_order(TICKER,'SELL',random_volume,x).catch((err:any)=>{console.log(err.message)}))
      console.log(await c1.create_order(TICKER,'BUY',random_volume,x).catch((err:any)=>{console.log(err.message)}))
    } else{

      console.log(await c1.create_order(TICKER,'BUY',random_volume,x).catch((err:any)=>{console.log(err.message)}))
      console.log(await c1.create_order(TICKER,'SELL',random_volume,x).catch((err:any)=>{console.log(err.message)}))
    }
  }


  } catch(e:any){
    console.log(e.message)
  }

}

let n = 0
let sum_wldy = 0



let price1 = base_price*(1 - (order_levels_percentage/100))
console.log(price1)
price1 = Math.floor(price1*(10**decimalplaces))
console.log(price1)
price1 = price1/(10**decimalplaces)
console.log(price1)
orders_to_do.push({price:price1,amountusd:floor_support_usd,amountwldy:Math.floor(floor_support_usd/(Math.floor(base_price*(1 - (order_levels_percentage/100))*10**decimalplaces)/10**decimalplaces)),side:'BUY',orderid:''})
while(n < num_of_orders){
  price1 = base_price
  price1 = Math.floor(price1*(10**decimalplaces))
  price1 = price1/(10**decimalplaces)
  let o1 = {price:price1,amountusd:amountusd,amountwldy:Math.floor(amountusd/price1),side:'unknown',orderid:''}
  orders_to_do.push(o1)
  sum_wldy += o1.amountwldy
  base_price *= (1 + (order_levels_percentage/100))
  n+=1
}

console.log(orders_to_do[0])
console.log(orders_to_do[1])
console.log(orders_to_do[2])


async function botloop(){

  while(true){
    await botstart();
    await wait(15)
  }
}


botloop()


