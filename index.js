/**
 * 
 */
'use strict';


console.log('@primusmoney/client_wallet module');

if ( typeof window !== 'undefined' && window ) {
	// browser or react-native
	console.log('creating window.simplestore in @primusmoney/client_wallet index.js');

	window.simplestore = {};
	
	window.simplestore.nocreation = true;
	
} else if ((typeof global !== 'undefined') && (typeof global.simplestore === 'undefined')) {
	// nodejs
	console.log('creating global.simplestore in @primusmoney/client_wallet index.js');
	global.simplestore = {};
}

const Client_Wallet = require('./client_wallet.js');


module.exports = Client_Wallet;