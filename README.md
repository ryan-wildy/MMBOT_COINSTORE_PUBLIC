Run the bot with the command : 

npm run start



Logic : 
- create #(num_of_orders) orders starting at the #(base_price) and increasing by #(order_levels_percentage) percent for each subsequent order
- determine the direction of order based on the current price. if order is to be created below the current price, it will be a buy order, else a sell order
- create a large order of amount #(floor_support_usd) just below the #(base_price) to act as floor
- execute random trades of upto #(rand_trade_size_usd) USD in value every few seconds



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

