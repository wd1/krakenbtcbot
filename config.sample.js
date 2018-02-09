var config = {};

//------------------------------UserParams

//------------------------------EnableRealTrading
config.tradingEnabled = false;
//------------------------------EnableRealTrading

//------------------------------exchangeSettings
config.exchangeSettings = {
	exchange: '',
	// Options: (bitstamp, kraken, btce)
	currencyPair: {pair: '', asset: '', currency: ''},
	// For Bitstamp just use {pair: 'XBTUSD', asset: 'XBT', currency: 'USD'}
	// For Kraken look up the currency pairs in their API: https://api.kraken.com/0/public/AssetPairs
	// Kraken Example: {pair: 'XXBTZEUR', asset: 'XXBT', currency: 'ZEUR'}
	// For BTC-E look up the currency pairs in their API: https://btc-e.com/api/3/info
	// BTC-E Example: {pair: 'BTC_USD', asset: 'BTC', currency: 'USD'}
	tradingReserveAsset: 0,
	// Enter an amount of "asset" you would like to freeze (not trade).
	tradingReserveCurrency: 0,
	// Enter an amount of "currency" you would like to freeze (not trade).
	slippagePercentage: 0.1
	// Percentage to sell below and buy above the market.
};
//------------------------------exchangeSettings

//------------------------------APISettings
config.apiSettings = {
	bitstamp: {clientId: 0, apiKey: '', secret: ''},
	kraken: {apiKey: '', secret: ''},
	btce: {apiKey: '', secret: ''}
};
//------------------------------APISettings

//------------------------------dbSettings
config.mongoConnectionString = 'localhost/bitbot';
// The connection string for your MongoDB Installation.
// Example: config.mongoConnectionString = 'username:password@example.com/mydb';
//------------------------------dbSettings

//------------------------------downloaderSettings
config.downloaderRefreshSeconds = 10;
// Best to keep this default setting unless you know what you are doing.
//------------------------------downloaderSettings

//------------------------------IndicatorSettings
config.indicatorSettings = {
	indicator: 'MACD',
	// Choices: Any indicator from the indicators folder.
	options: {neededPeriods: 26, shortPeriods: 12, longPeriods: 26, emaPeriods: 9, buyThreshold: 0, sellThreshold: 0},
	// Options needed for your indicator (Look them up in the indicator's file).
	candleStickSizeMinutes: 5
};
//------------------------------IndicatorSettings

//------------------------------orderSettings
config.orderKeepAliveMinutes = config.indicatorSettings.candleStickSizeMinutes / 10;
//------------------------------orderSettings

//------------------------------PushOver
config.pushOver = {
	enabled: false,
	pushUserId: '',
	pushAppToken: ''
};
// Push notifications via pushover (https://pushover.net/).
//------------------------------PushOver

//------------------------------BackTesting
config.backTesterSettings = {
	initialAssetBalance: 0,
	initialCurrencyBalance: 10000
};
//------------------------------BackTesting

//------------------------------Debug
config.debug = true;
//------------------------------Debug

//------------------------------UserParams

module.exports = config;
