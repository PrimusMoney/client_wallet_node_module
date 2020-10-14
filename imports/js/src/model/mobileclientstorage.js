/**
 * 
 */
'use strict';

//import {AsyncStorage} from '@react-native-community/async-storage';

var MobileClientStorage = class {
	constructor() {
		this.AsyncStorage = require('@react-native-community/async-storage').default;
	}
	
	// standard local storage
	setItem(key, value) {
		return this.AsyncStorage.setItem(key, value);
	}
	
	getItem(key) {
		return this.AsyncStorage.getItem(key);
	}
	
	removeItem(key) {
		return this.AsyncStorage.removeItem(key);
	}
	
	key(index) {
		return this.AsyncStorage.key(index);
	}
	
	clear() {
		return this.AsyncStorage.clear();
	}
	
	// ethereum_core storage access
	loadClientSideJsonArtifact(session, jsonfile, callback) {
		console.log('MobileClientStorage.loadClientSideJsonArtifact called for: ' + jsonfile);
		
		var ERC20Controllers = require('../control/controllers.js').default;
		var erc20controllers = ERC20Controllers.getObject();
		
		var jsoncontent = erc20controllers.getArtifact(jsonfile);
		
		if (callback)
			callback(null, jsoncontent);
		
		return jsoncontent;
	}
	
	readClientSideJson(session, key, callback) {
		console.log('MobileClientStorage.readClientSideJson for key: ' + key);
		
		var jsonstringpromise = this.AsyncStorage.getItem(key);
		
		jsonstringpromise.then(function(res) {
			console.log('MobileClientStorage.readClientSideJson value for key: ' + key + ' is ' + res);
			
			if (callback) {
				if (res)
					callback(null, res);
				else
					callback('no value', null);
				
			}
		});
		
		return null;
	}
	
	saveClientSideJson(session, key, value, callback) {
		console.log('MobileClientStorage.saveClientSideJson called for key: ' + key + ' value ' + value);
		
		var savepromise = this.AsyncStorage.setItem(key, value);
		
		savepromise.then(function(res) {
			console.log('MobileClientStorage.saveClientSideJson saved value ' + value + ' for key: ' + key );
			
			if (callback)
				callback(null, value);
		});
	}
}

module.exports = MobileClientStorage;