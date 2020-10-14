console.log('loading mobile-client.js');


class MobileClient {
	constructor() {
		this.name = 'mobileclient';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;

		this.globalscope = window;
		
		this.execution_env = ( (typeof MobileClient.EXEC_ENV !== 'undefined') ? MobileClient.EXEC_ENV : 'prod');
		
		var MobileConfig = require('./mobile-config.js');

		if ((MobileConfig.execution_env == 'dev') || (this.execution_env == 'dev')) {
			this.execution_env = 'dev';
			// loading dev environment
			require('./mobile-config-dev.js');
		}

		this.MobileConfig = MobileConfig;

		var MobileControllers = require('./control/controllers.js').default;
		
		this.mobilecontrollers = MobileControllers.getObject();
		
		this.mobilecontrollers.module = this;
	}
	
	async init() {
		console.log('MobileClient.init called');
		console.log('module init called for ' + this.name);
		
		try {
			var _globalscope = this.globalscope;
			
			// initialize controllers object
			var mobilecontrollers_init = await this.mobilecontrollers.init()
			.catch((err) => {
				console.log('error initializing mobile controllers: ' + err);
			});
			
			console.log('mobile controllers initialized');
			
			// end of all initialization
			var Bootstrap = _globalscope.simplestore.Bootstrap;
			var ScriptLoader = _globalscope.simplestore.ScriptLoader;

			var bootstrapobject = Bootstrap.getBootstrapObject();
			var rootscriptloader = ScriptLoader.getRootScriptLoader();


			// ethereum_core is now set
			var clientglobal = _globalscope.simplestore.Global.getGlobalObject();
			
			// register this module
			clientglobal.registerModuleObject(this);

			// ethereum_core config
			var clientglobal = _globalscope.simplestore.Global.getGlobalObject();
			var CoreConfig = _globalscope.simplestore.Config;
			
			var XtraConfig = _globalscope.simplestore.Config.XtraConfig;
			
			if (!XtraConfig.instance)
				XtraConfig.instance = new XtraConfig();
			
			// mobile config
			var MobileConfig = this.MobileConfig;
			
			// put in simple store for easier access
			_globalscope.simplestore.MobileConfig = MobileConfig;

			if (this.execution_env == 'dev') {
				clientglobal.setExecutionEnvironment('dev');
				
				// we call this.mobilecontrollers._initdev to simplify debugging
				await this.mobilecontrollers._initdev();
			}

/*			// ethnode
			
			// set url in ethnode module to overload previous computation
			var web3_provider_url = MobileConfig.web3_provider_url; // OBSOLETE
			
			if (web3_provider_url) {
				CoreConfig.web3_provider_url = web3_provider_url;
				
				var ethnodemodule = clientglobal.getModuleObject('ethnode');
				
				ethnodemodule.setWeb3ProviderUrl(web3_provider_url);
			}
			
			// rest server
			var rest_server_url = MobileConfig.rest_server_url; // OBSOLETE
			var rest_server_api_path = MobileConfig.rest_server_api_path;

			if (rest_server_url) {
				//XtraConfig.instance.rest_server_url = rest_server_url;
				CoreConfig.push('rest_server_url', rest_server_url);
			}
			
			if (rest_server_api_path) {
				//XtraConfig.instance.rest_server_api_path = rest_server_api_path;
				CoreConfig.push('rest_server_api_path', rest_server_api_path);
			}

			// authkey
			var authkey_server_url = MobileConfig.authkey_server_url; // OBSOLETE
			var authkey_server_api_path = MobileConfig.authkey_server_api_path;
			
			if (authkey_server_url) {
				//XtraConfig.instance.authkey_server_url = authkey_server_url;
				CoreConfig.push('authkey_server_url', authkey_server_url);

			}
			
			if (authkey_server_api_path) {
				//XtraConfig.instance.authkey_server_api_path = authkey_server_api_path;
				CoreConfig.push('authkey_server_api_path', authkey_server_api_path);
			}
			
			// oauth2
			var oauth2_auth_server_url = MobileConfig.oauth2_auth_server_url; // OBSOLETE
			var oauth2_auth_server_api_path = MobileConfig.oauth2_auth_server_api_path;
			
			if (oauth2_auth_server_url) {
				CoreConfig.push('oauth2_auth_server_url', oauth2_auth_server_url);
			}
			
			if (oauth2_auth_server_api_path) {
				CoreConfig.push('oauth2_auth_server_url', oauth2_auth_server_url);
			}
*/			
			
			
			var xtraconfigmodule = clientglobal.getModuleObject('xtraconfig');
			
			// activate/deactivate xtraconfig module
			if (typeof MobileConfig.xtraconfigmodule_activate !== 'undefined') {
				xtraconfigmodule.activation(MobileConfig.xtraconfigmodule_activate);

				// activate/deactivate overload of access
				if (typeof MobileConfig.xtraconfigmodule_ethnode_activate !== 'undefined')
				xtraconfigmodule.overloadEthereumNodeAccess(MobileConfig.xtraconfigmodule_ethnode_activate);
				if (typeof MobileConfig.xtraconfigmodule_storage_activate !== 'undefined')
				xtraconfigmodule.overloadStorageAccess(MobileConfig.xtraconfigmodule_storage_activate);
				
			}
			
			// authkey
			var authkeymodule = clientglobal.getModuleObject('authkey');
		
			// activate/deactivate authkey module
			if (typeof MobileConfig.authkeymodule_activate !== 'undefined')
			authkeymodule.activation(MobileConfig.authkeymodule_activate);

			// oauth2
			var oauth2module = clientglobal.getModuleObject('oauth2');
		
			// activate/deactivate oauth2 module
			if (typeof MobileConfig.oauth2module_activate !== 'undefined')
			oauth2module.activation(MobileConfig.oauth2module_activate);


			
			// if execution env is dev, we setup a testing environment
			if (this.execution_env == 'dev') {
				await this.initdev();
			}
			
			//signal end of mobile load
			rootscriptloader.signalEvent('on_mobile_load_end');
			
			this.isready = true;

			return true;
		}
		catch(e) {
			console.log('exception in MobileClient.init: ' + e);
		}	
	}
	
	
	async initprod(bForce) {
		console.log('MobileClient.initprod called');
		
		try {
			var MobileConfig = this.MobileConfig;
			
			console.log('MobileClient.initprod starting for ' + this.execution_env + 'execution environment');

			// var mobilecontrollers = this.mobilecontrollers;
			 var clientapicontrollers = this.getClientAPI();
			
			// get session object
			var session = clientapicontrollers.getCurrentSessionObject();
			
			//
			// create built-in schemes
			//
			console.log('MobileClient.initprod creating schemes');
			
			if (MobileConfig.builtin_local_networks) {
				console.log('MobileClient.initprod starting creating local schemes');
				for (var i = 0; i < MobileConfig.builtin_local_networks.length; i++) {
					var prodnetwork = MobileConfig.builtin_local_networks[i];
					var scheme = await clientapicontrollers.createScheme(session, prodnetwork);
				}
			}
			
			// we do not create a remote network for the moment (2020.04.08)
			/*if (MobileConfig.builtin_remote_networks) {
				console.log('MobileClient.initprod starting creating remote schemes');
				for (var i = 0; i < MobileConfig.builtin_remote_networks.length; i++) {
					var prodnetwork = MobileConfig.builtin_remote_networks[i];
					var scheme = await clientapicontrollers.createScheme(session, prodnetwork);
				}
			}*/
			
			
			if (MobileConfig.builtin_scheme_list_servers) {
				console.log('MobileClient.initprod starting calling scheme list servers');
				for (var i = 0; i < MobileConfig.builtin_scheme_list_servers.length; i++) {
					var scheme_server = MobileConfig.builtin_scheme_list_servers[i];
					
					console.log('MobileClient.initprod calling scheme list server: ' + scheme_server.name);
					var jsonarray = await clientapicontrollers.http_get_json(session, scheme_server.url)
					.catch(err => { jsonarray = null;});
					
					console.log('MobileClient.initprod starting calling scheme list servers');
					var network_list = (jsonarray && jsonarray.data ? jsonarray.data : null);
					for (var j = 0; j < (network_list ? network_list.length : 0); j++) {
						var prodnetwork = network_list[j];
						var scheme = await clientapicontrollers.createScheme(session, prodnetwork);
					}
				}

			}

		}
		catch(e) {
			console.log('exception in MobileClient.initprod: ' + e);
		}
	}
	
	async initdev(bForce) {
		console.log('MobileClient.initdev called');
		
		try {
			var MobileConfig = this.MobileConfig;
			
			if ((MobileConfig.initdev !== true) && (bForce !== true))
				return;

			//var mobilecontrollers = this.mobilecontrollers;
			var clientapicontrollers = this.getClientAPI();

			console.log('MobileClient.initdev starting for ' + this.execution_env + ' execution environment');

			// content of AsyncStorage
			const storagecontent = await this._getAsyncStorageContent();
			console.log('AsyncStorage content is: ' + JSON.stringify(storagecontent) );
			
			const error = this._clearAsyncStorage();
			console.log('AsyncStorage' + (error ? ' cleared successfully' : ' NOT cleared because of error: ' + error));
			
			// get session object
			var session = clientapicontrollers.getCurrentSessionObject();
			
			//
			// import schemes from remote server
			// 
			console.log('MobileClient.initdev importing schemes');
			if (MobileConfig.remoteschemes) {
				console.log('MobileClient.initdev starting importing schemes');
				for (var i = 0; i < MobileConfig.remoteschemes.length; i++) {
					var importurl = MobileConfig.remoteschemes[i].importurl;
					
					var imported = await clientapicontrollers.importScheme(session, importurl);
				}
			}
			
			//
			// create schemes
			//
			console.log('MobileClient.initdev creating schemes');
			if (MobileConfig.testnetworks) {
				console.log('MobileClient.initdev starting creating schemes');
				for (var i = 0; i < MobileConfig.testnetworks.length; i++) {
					var testnetwork = MobileConfig.testnetworks[i];
					var scheme = await clientapicontrollers.createScheme(session, testnetwork);
				}
			}
			
			//
			// create contacts
			//
			console.log('MobileClient.initdev creating contacts');
			var accountarray = MobileConfig.testaccounts;
			
			if (accountarray) {
				for (var i = 0; i < accountarray.length; i++) {
					var accnt = accountarray[i];
					var address = accnt.address;
					var name = accnt.description;
					var label = accnt.description;
					var contactinfo = {label: label};
					
					var contact = await clientapicontrollers.createContact(session, name, address, contactinfo);
				}
			}
			
			//
			// create local vaults and wallets
			//
			var creations = [];
			if (MobileConfig.testvaults && (MobileConfig.testvaults.length > 0)) {
				console.log('MobileClient.initdev creating vaults');
				
				// create all the local test vaults
				for (var i = 0; i < MobileConfig.testvaults.length; i++) {
					var vaultname = MobileConfig.testvaults[i].name;
					var passphrase = MobileConfig.testvaults[i].passphrase;
					
					var creation = await clientapicontrollers.createVault(session, vaultname, passphrase);
					
					creations[i] = creation;
				}	
				
				// go back to first vault
				creation = creations[0];
				
				if (creation) {
					console.log('MobileClient.initdev creating environment for first vault');
					var vaultname = MobileConfig.testvaults[0].name;
					var passphrase = MobileConfig.testvaults[0].passphrase;
					
					// local storage on the client
					console.log('MobileClient.initdev creating client tokens & accounts for first vault');
					
					// create a local session and
					// impersonate as a vault to save tokens and accounts under 'shared'
					var vaultsession = clientapicontrollers.createBlankSessionObject();
					var vaultnetworkconfig = clientapicontrollers.getDefaultSchemeConfig(0);
					
					//vaultnetworkconfig.ethnodeserver.web3_provider_url = (MobileConfig.testnetworks[0] ? MobileConfig.testnetworks[0].ethnodeserver.web3_provider_url : null);
					
					await clientapicontrollers.setSessionNetworkConfig(vaultsession, vaultnetworkconfig);
					
					var vault = await clientapicontrollers.openVault(vaultsession, vaultname, passphrase);
					if (vault) {
						clientapicontrollers.impersonateVault(vaultsession, vault);
						
						// create tokens
						console.log('MobileClient.initdev storing local client tokens for first vault');
						var tokenarray = MobileConfig.testtokens;
						
						if (tokenarray) {
							for (var i = 0; i < tokenarray.length; i++) {
								var tkn = tokenarray[i];
								var tokenaddress = tkn.address;
								
								var web3providerurl = tkn.web3providerurl;
								var description = tkn.description;
								var tokenuuid = tkn.uuid;
								
								var token = clientapicontrollers.importERC20Token(vaultsession, tokenaddress);
								
								if (web3providerurl) token.setWeb3ProviderUrl(web3providerurl);
								if (description) token.setLocalDescription(description);
								if (tokenuuid) token.uuid = tokenuuid;
								
								// we save this token
								await clientapicontrollers.saveERC20Token(vaultsession, token);
							}	
						}
						
						// create accounts
						console.log('MobileClient.initdev storing local accounts for first vault');
						var accountarray = MobileConfig.testaccounts;
						
						if (accountarray) {
							for (var i = 0; i < accountarray.length; i++) {
								var accnt = accountarray[i];
								var address = accnt.address;
								var privatekey = accnt.private_key;
								var description = accnt.description;
								
								var account = clientapicontrollers.createAccountObject(vaultsession, address, privatekey);
								
								account.setDescription(description);
								
								session.addAccountObject(account);
								
								// we save this account
								await clientapicontrollers.saveAccountObject(vaultsession, account);
							}
						}
						
						clientapicontrollers.disconnectVault(vaultsession, vault);
					}
					
					// store remote user credentials
					var userarray = MobileConfig.testusers;
					
					if (userarray) {
						var key = 'credentials';
						var value = userarray;
						
						await clientapicontrollers.putInVault(session, vaultname, key, value)
						.catch((err) => {
							console.log('error storing credentials in vault ' + vaultname);
						});
					}
				}
				
			} // if (MobileConfig.testvaults
		
			
			//
			// create local wallets
			//
			if (MobileConfig.localwallets && (MobileConfig.localwallets.length > 0)) {
				console.log('MobileClient.initdev creating wallets');
				// reset creations
				creations = [];
				
				//
				// create all the local test wallets
				// (which will have a vault name based on their uuid)
				for (var i = 0; i < MobileConfig.localwallets.length; i++) {
					var walletname = MobileConfig.localwallets[i].name;
					var passphrase = MobileConfig.localwallets[i].passphrase;
					
					var creation = await clientapicontrollers.createWallet(session, walletname, passphrase);
					
					creations[i] = creation;
				}
				
				// go back to first wallet
				creation = creations[0];
				
				if (creation) {
					console.log('MobileClient.initdev creating environment for first wallet');
					var walletname = MobileConfig.localwallets[0].name;
					var passphrase = MobileConfig.localwallets[0].passphrase;
					

					// wallet
					var wallet = await clientapicontrollers.openWallet(session, walletname, passphrase);
					
					if (wallet) {
						// get wallet's local session and
						// save tokens and accounts under 'shared'
						var walletsession = wallet._getSession();
						
						
						// tokens and account stored on the client
						// for client cards
						console.log('MobileClient.initdev creating client tokens & accounts for first wallet');
						

						// create tokens
						console.log('MobileClient.initdev storing local client tokens for first wallet');
						var tokenarray = MobileConfig.testtokens;
						
						if (tokenarray) {
							for (var i = 0; i < tokenarray.length; i++) {
								var tkn = tokenarray[i];
								var tokenaddress = tkn.address;
								
								var web3providerurl = tkn.web3providerurl;
								var description = tkn.description;
								var tokenuuid = tkn.uuid;
								
								var token = clientapicontrollers.importERC20Token(walletsession, tokenaddress);
								
								if (web3providerurl) token.setWeb3ProviderUrl(web3providerurl);
								if (description) token.setLocalDescription(description);
								if (tokenuuid) token.uuid = tokenuuid;
								
								// we save this token
								await clientapicontrollers.saveERC20Token(walletsession, token);
							}	
						}
						
						// create accounts
						console.log('MobileClient.initdev storing local accounts for first wallet');
						var accountarray = MobileConfig.testaccounts;
						
						if (accountarray) {
							for (var i = 0; i < accountarray.length; i++) {
								var accnt = accountarray[i];
								var address = accnt.address;
								var privatekey = accnt.private_key;
								var description = accnt.description;
								
								var account = clientapicontrollers.createAccountObject(walletsession, address, privatekey);
								
								account.setDescription(description);
								
								walletsession.addAccountObject(account);
								walletsession.user.addAccountObject(account);
								
								// we save this account
								await clientapicontrollers.saveAccountObject(walletsession, account);
							}
						}

						//
						// local cards
						//
						if (MobileConfig.testnetworks && MobileConfig.localtestaccounts) {
							console.log('MobileClient.initdev creating local cards');

							// create a card in the wallet for each test account
							// for each local test scheme
							for (var i = 0; i < MobileConfig.testnetworks.length; i++) {
								var scheme = await clientapicontrollers.getSchemeFromUUID(session, MobileConfig.testnetworks[i].uuid);
								
								if ((scheme) && (!scheme.activate_auth_server)) {
									for (var j = 0; j < MobileConfig.localtestaccounts.length; j++) {
										var testaccount = MobileConfig.localtestaccounts[j];
										var _cardname = testaccount.description;
										var _cardlabel = testaccount.description + '-on-' + scheme.getName();
										var _address = testaccount.address;
									
										var card = await wallet.createCard(scheme, _cardname, null, _address)
										.catch((err) => {
											console.log('error while creating local card ' + _name + ': ' + err);
										});
										
										if (card) {
											card.setLabel(_cardlabel);
											await card.save();
											
											// create local tokens
											for (var k = 0; k < MobileConfig.localtesttokens; k++) {
												var tkn = MobileConfig.localtesttokens[k];
												
												var token = card.getTokenObject(tkn.address);
												
												var tokenaccount = await card.createTokenAccount(tkn);
												await tokenaccount.init();
												
												tokenaccount.setDescription(tkn.description);
												
												await tokenaccount.save();
												
											}
										}
									}
								}
									
							} // for (var i = 0; i < MobileConfig.testnetworks.length; i++) 

						} // if (MobileConfig.testnetworks && MobileConfig.localtestaccounts)
						
						//
						// remote cards
						//
						
						// remote user credentials
						var userarray = MobileConfig.remotetestusers;
						
						if (userarray) {

							// create a card in the wallet for each test user
							// for each remote test scheme
							if (MobileConfig.testnetworks && MobileConfig.testaccounts && MobileConfig.testaccounts[0] && MobileConfig.testaccounts[0].address) {
								console.log('MobileClient.initdev creating remote cards');
								var default_address = MobileConfig.testaccounts[0].address; // default address to use

								for (var i = 0; i < MobileConfig.testnetworks.length; i++) {
									var scheme = await clientapicontrollers.getSchemeFromUUID(session, MobileConfig.testnetworks[i].uuid);
									
									if (scheme) {
										if (scheme.activate_auth_server) {
											var networkconfig = scheme.getNetworkConfig();
											
											for (var j = 0; j < userarray.length; j++) {
												var usercredentials = userarray[j];
												
												// create card if we can authenticate
												var blanksession = await clientapicontrollers.createNetworkSession(networkconfig);
												
												var canauthenticate = await clientapicontrollers.authenticate(blanksession, usercredentials.username, usercredentials.password);
												
												if (canauthenticate) {
													var sessionaccounts = await clientapicontrollers.getSessionAccountObjects(blanksession, true);
													var _address = default_address;
													
													if (sessionaccounts) {
														// we create one card for each personal account
														for (var k = 0; k < sessionaccounts.length; k++) {
															var _cardlabel = usercredentials.username + '-on-' + scheme.getName()
															_address = sessionaccounts[k].getAddress();
														
															var card = await wallet.createCard(scheme, usercredentials.username, usercredentials.password, _address)
															.catch((err) => {
																console.log('error while creating remote card ' + usercredentials.username + ': ' + err);
															});
															
															if (card) {
																card.setLabel(_cardlabel);
																
																await card.save();
															}
														}
														
													} //if (sessionaccounts)
														
												} //if (canauthenticate)
											} // for (var j = 0; j < userarray.length
										}
										/*else {
											// local client card
											if (accountarray) {
												for (var i = 0; i < accountarray.length; i++) {
													var accnt = accountarray[i];
													var description = accnt.description;
													var _address = accnt.address;
													
													var card = await wallet.createCard(scheme, description, null, _address)
													.catch((err) => {
														console.log('error while creating card ' + description + ': ' + err);
													});
												}
											}
										}*/
									}
									else {
										console.log('error: could not find scheme with uuid ' + MobileConfig.testnetworks[i].uuid);
									}
								} //for (var i = 0; i < MobileConfig.testnetworks.length; i++)
							} // if (MobileConfig.testnetworks && MobileConfig.testaccounts && MobileConfig.testaccounts[0] && MobileConfig.testaccounts[0].address)
						} // if (userarray)
						
						
						
						// create token accounts
						// and store them
						console.log('MobileClient.initdev creating token accounts for cards of first wallet');
						var cards = await wallet.getCardList(true);
						
						// put in every card
						for (var i = 0; i < cards.length; i++) {
							var card = cards[i];
							
							if (card.isLocked()) {
								await card.unlock();
							}
							
							var tokenarray = await card.getTokenList(true);
							
							if (tokenarray) {
								for (var j = 0; j < tokenarray.length; j++) {
									var tkn = tokenarray[j];
									var tokenaddress = tkn.getAddress();
									var description = tkn.getAddress();
									
									var tokenaccount = await card.createTokenAccount(tkn);
									
									//tokenaccount.setLabel(description);
								}	
							}
						}

						

						
						// close wallet
						clientapicontrollers.closeWallet(session, wallet);
					} // if (wallet)
					
				} //if (creation[0)
			
			
				//
				// import remote wallets from remote server
				// 
				console.log('MobileClient.initdev importing remote wallets');
				if (MobileConfig.remotewallets) {
					for (var i = 0; i < MobileConfig.remotewallets.length; i++) {
						var username = MobileConfig.remotewallets[i].username;
						var password = MobileConfig.remotewallets[i].password;
						var importurl = MobileConfig.remotewallets[i].importurl;
						
						var imported = await clientapicontrollers.importWallet(session, importurl, username, password);
					}
				}



			}

			console.log('MobileClient.initdev successfully finished intialization of dev environment');
		}
		catch(e) {
			console.log('exception in MobileClient.initdev: ' + e);
			console.log(e.stack);
		}
		
		console.log('MobileClient.initdev end');
	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);
		
		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;

		var modulescriptloader = parentscriptloader.getChildLoader('mobileclientmoduleloader');

		modulescriptloader.load_scripts(function() { 
			//self.init(); // init is called by index.js
			if (callback) callback(null, self); 
		});

		return modulescriptloader;	
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional  module functions
	registerHooks() {
		console.log('module registerHooks called for ' + this.name);
		
		var global = this.global;
		
		global.registerHook('cleanSessionContext_hook', this.name, this.cleanSessionContext_hook);
		
		global.registerHook('getDefaultSchemeConfig_hook', this.name, this.getDefaultSchemeConfig_hook);
	}
	
	postRegisterModule() {
		console.log('postRegisterModule called for ' + this.name);
		if (!this.isloading) {
			var global = this.global;
			var self = this;
			var rootscriptloader = global.getRootScriptLoader();
			
			this.loadModule(rootscriptloader, () => {
				if (this.registerHooks)
				this.registerHooks();
			});
		}
	}
	
	getDefaultSchemeConfig_hook(result, params) {
		console.log('getDefaultSchemeConfig_hook called for ' + this.name);
		
		var global = this.global;
		
		var schemeconfig = params[0];
		var flag = params[1];
		
		switch(flag) {
			case 1:
				var MobileConfig = this.MobileConfig;
				
				var default_config = MobileConfig.default_remote_network_config;
				
				if (default_config) {
					if (!schemeconfig.restserver) default_config.restserver = {};
					
					if (default_config.restserver) {
						schemeconfig.restserver.activate = default_config.restserver.activate;
						schemeconfig.restserver.rest_server_url = default_config.restserver.rest_server_url;
						schemeconfig.restserver.rest_server_api_path = default_config.restserver.rest_server_api_path;
					}
					
					if (!schemeconfig.authserver) schemeconfig.restserver = {};
					
					if (default_config.authserver) {
						schemeconfig.authserver.activate = default_config.authserver.activate;
						schemeconfig.authserver.rest_server_url = default_config.authserver.rest_server_url;
						schemeconfig.authserver.rest_server_api_path = default_config.authserver.rest_server_api_path;
					}
					
					if (!schemeconfig.keyserver) schemeconfig.restserver = {};
					
					if (default_config.keyserver) {
						schemeconfig.keyserver.activate = default_config.keyserver.activate;
						schemeconfig.keyserver.rest_server_url = default_config.keyserver.rest_server_url;
						schemeconfig.keyserver.rest_server_api_path = default_config.keyserver.rest_server_api_path;
					}
				}
				


				break;
				
			default:
				break;

		}
		
		result.push({module: this.name, handled: true});
		
		return true;
	}

	cleanSessionContext_hook(result, params) {
		console.log('cleanSessionContext_hook called for ' + this.name);
		
		var global = this.global;
		
		var session = params[0];
		
		// we clean the child sessions
		var clientapicontrollers = this.getClientAPI();
		clientapicontrollers.cleanChildSessionObjects(session);
		
		result.push({module: this.name, handled: true});
		
		return true;
	}


	// mobile functions
	getMobileControllers() {
		return this.mobilecontrollers;
	}
	
	getClientControllers() {
		return this.mobilecontrollers;
	}

	getClientAPI() {
		var mobilecontrollers = this.mobilecontrollers;
		var apiclientcontrollers = mobilecontrollers.getClientControllers();

		return apiclientcontrollers;
	}

		
	getClientConfig() {
		return this.MobileConfig;
	}

	// mobile storage
	async _getAsyncStorageContent() {
		var AsyncStorage = require('@react-native-community/async-storage').default;

		const keyArray = await AsyncStorage.getAllKeys();
		
		const keyValArray = await AsyncStorage.multiGet(keyArray);
		
		return keyValArray;
	}
	
	async _clearAsyncStorage() {
		
		if (this.execution_env != 'dev') {
			return Promise.reject('can not clear AsyncStorage in an execution environment other than dev!');
		}

		var AsyncStorage = require('@react-native-community/async-storage').default;
		
		return AsyncStorage.clear();
	}
	
	getExecutionEnvironment() {
		if (this.execution_env)
			return this.execution_env;
		else
			return 'prod';
	}
	
	echo(string) {
		console.log('ECHO: ' + string);
	}

	
	async echotest() {
		console.log('MobileClient.echotest called');
		
		try {
			
			// we could do some testing for validating prod initialization
			if (this.getExecutionEnvironment() != 'dev')
				return; 
			
			var MobileConfig = this.MobileConfig;

			if (MobileConfig.echotestdev !== true)
				return;

			// content of AsyncStorage
			const storagecontent = await this._getAsyncStorageContent();
			console.log('AsyncStorage content is: ' + JSON.stringify(storagecontent) );
			
			console.log('Executing MobileClient.echotest for dev execution environment');

			//var mobilecontrollers = this.mobilecontrollers;
			var clientapicontrollers = this.getClientAPI();
			
			var topsession = clientapicontrollers.getCurrentSessionObject();

			this.echo('top session uuid is ' + topsession.getSessionUUID());

			var localsession = clientapicontrollers.createChildSessionObject(topsession);
			var remotesession = clientapicontrollers.createChildSessionObject(topsession);

			if (MobileConfig.builtin_local_networks  && MobileConfig.builtin_local_networks[0]) {
				// set default local configuration
				var network = MobileConfig.builtin_local_networks[0];
				await clientapicontrollers.setSessionNetworkConfig(localsession, network);
			}
			else {
				this.echo('WARNING - no built-in local network configuration, some tests may fail!!!');
			}
			
			// client controllers
			//var clientcontrollers = clientapicontrollers.getClientControllers();
			
			
			// list of schemes
			var schemes = await clientapicontrollers.getSchemeList(localsession, true);
			
			this.echo('list of schemes contains ' + (schemes && schemes.length ? schemes.length : 0) + ' element(s)');
			
			
			// list of contacts
			var contacts = await clientapicontrollers.getContactList(localsession, true);
			
			this.echo('list of contacts contains ' + (contacts && contacts.length ? contacts.length : 0) + ' element(s)');
			
			
			// list of transactions
			// var transactions = await clientapicontrollers.getTransactionList(remotesession, true);
			//
 			// this.echo('list of transactions contains ' + (transactions && transactions.length ? transactions.length : 0) + ' element(s)');
			
			//
			// local authentication
			//
			
			// test we can open vault
			if (MobileConfig.testvaults && MobileConfig.testvaults[0]) {
				var vaultname = MobileConfig.testvaults[0].name;
				var passphrase = MobileConfig.testvaults[0].passphrase;

				const vault = await clientapicontrollers.openVault(localsession, vaultname, passphrase)				
				.catch((err) => {
					this.echo('error opening vault ' + vaultname + ': ' + err);
				});	

				
				if (vault) {
					this.echo('Opened vault: ' + vaultname);
					
					// impersonate
					clientapicontrollers.impersonateVault(localsession, vault);
					
					// get list of credentials
					var key = 'credentials';
					const userarray = await clientapicontrollers.getFromVault(localsession, vaultname, key);
					
					this.echo('list of credentials contains ' + (userarray && userarray.length ? userarray.length : 0) + ' element(s)');
					
				
					//
					// child sessions (with remote authentication)
					//
					if (MobileConfig.authkeymodule_activate !== false) {
						if (userarray && userarray[0]) {
							// retrieve from vault's credentials
							var usercredential = userarray[0];
							
							var username = usercredential.username;
							var password = usercredential.password;
							
							var network = usercredential.network;
							
							const childsession = await clientapicontrollers.openChildSession(localsession, username, password, network)
							.catch((err) => {
								this.echo('error opening child session: ' + err);
							});
							
							this.echo('child session is ' + (childsession ? (childsession.isAnonymous() ? 'anonymous' : 'authenticated') : 'not created'));
						}				
					}
				}
				else {
					this.echo('Could not open vault: ' + vaultname);
				}
			}
			
			// get list of vaults
			const vaultnames = await clientapicontrollers.getVaultNames(localsession);
			
			this.echo('list of vaults contains ' + vaultnames);


			
			//
			// session check for local/remote
			//
			if (MobileConfig.authkeymodule_activate !== false) {
				// we switch to a session authenticated on remote server
				
				if (MobileConfig.testusers &&  MobileConfig.testusers[0]) {
					var username = MobileConfig.testusers[0].username;
					var password = MobileConfig.testusers[0].password;
					var network = MobileConfig.testusers[0].network;
					
					await clientapicontrollers.setSessionNetworkConfig(remotesession, network);
					
					await clientapicontrollers.authenticate(remotesession, username, password)
					.catch((err) => {
						this.echo('error during authentication: ' + err);
					});
					
					this.echo('switch to authenticated remote session ' + (remotesession ? (remotesession.isAnonymous() ? 'NOT successful' : 'successful') : 'not created'));
				}
				else {
					this.echo('WARNING - no test user to authenticate to a remote server, some tests may fail!!!');
				}

			}

			//
			// ERC20
			//

			// get list of tokens
			const tokenarray = await clientapicontrollers.getERC20TokenList(remotesession, true);
			
			this.echo('list of tokens contains ' + (tokenarray && tokenarray.length ? tokenarray.length : 0) + ' element(s)');
	
			
			
			//
			// ethnode
			//
			
			// web3 node info
			//clientapicontrollers.getNodeInfo(localsession, (err, nodeinfo)  => {
			//	this.echo('is listening: ' + nodeinfo.islistening);
			//});
			
			// current block number
			const blocknumber = await clientapicontrollers.readCurrentBlockNumber(remotesession)
			.catch((err) => {
				this.echo('error: ' + err);
			});
			
			this.echo('current block number is: ' + blocknumber);

			
			// transaction
			if (MobileConfig.testtransactions && MobileConfig.testtransactions[0]) {
				// using ethchainreader
				var txhash = MobileConfig.testtransactions[0].hash;
				
				const tx = await clientapicontrollers.readTransaction(remotesession, txhash)
				.catch((err) => {
					this.echo('error: ' + err);
				});
				
				this.echo('transaction data is: ' + (tx && tx.input_decoded_utf8 ? tx.input_decoded_utf8 : null));
				
				if (tx) {
					var data = await tx.getTransactionReceiptData()
					.catch((err) => {
						this.echo('error: ' + err);
					});
					
					var data2 = (data ? {blockNumber: data.blockNumber} : null);
					var datastring = (data2 ? JSON.stringify(data2) : null);
					this.echo('transaction receipt data is: ' + datastring);
				}
				
				//using ethnode
				const tx2 = await clientapicontrollers.getTransaction(remotesession, txhash)
				.catch((err) => {
					this.echo('error: ' + err);
				});	
				
				this.echo('transaction data is: ' + (tx2 ? tx2.data_decoded_utf8 : null));
			}
			
			
			// test accounts
			if (MobileConfig.testaccounts && MobileConfig.testaccounts[0] && MobileConfig.testaccounts[1]) {
				var address = MobileConfig.testaccounts[0].address;

				// web 3 account balance
				const balance = await clientapicontrollers.getEthAddressBalance(remotesession, address)
				.catch((err) => {
					this.echo('error: ' + err);
				});
				
				this.echo(address + ' balance is: ' + balance);
			
				
				// creating transaction with data
				
/* 				var fromaccount = remotesession.createBlankAccountObject();;
				var fromprivatekey = MobileConfig.testaccounts[0].private_key;
				
				var data = JSON.stringify({text: 'the fox jumps over the lazy dog'});
				
				fromaccount.setPrivateKey(fromprivatekey);
				
				var transaction = clientapicontrollers.createTransaction(remotesession, fromaccount);
				
				var fee = clientapicontrollers.createFee();
				
				transaction.setToAddress(address);
				transaction.setValue(0);
				transaction.setGas(fee.gaslimit);
				transaction.setGasPrice(fee.gasPrice);
				
				transaction.setData(data);
				
				const txwithdata = await clientapicontrollers.sendTransaction(remotesession, transaction)
				.catch((err) => {
					this.echo('error: ' + err);
				});
				
				if (!txwithdata)
					this.echo('error in sendTransaction');
				else
					this.echo('sendTransaction returned: ' + txwithdata);
 */				 
			}
			
			
			
			//
			// wallet module
			//
			
			const wallets = await clientapicontrollers.getWalletList(topsession, true);
			
			this.echo('list of wallets contains ' + (wallets ? wallets.length : 0) + ' element(s)');

			
			if (MobileConfig.testusers && MobileConfig.testusers[0]
			&& MobileConfig.testnetworks && MobileConfig.testnetworks[0] && MobileConfig.testnetworks[1]
			&& MobileConfig.testtokens && MobileConfig.testtokens[0] && MobileConfig.testtokens[1]
			&& MobileConfig.testaccounts && MobileConfig.testaccounts[0] && MobileConfig.testaccounts[1] ) {
				
				var walletsession = clientapicontrollers.createBlankSessionObject();
				
				var walletname = MobileConfig.testvaults[0].name;
				var password = MobileConfig.testvaults[0].passphrase;
				
				var wallet = await clientapicontrollers.getWallet(walletsession, walletname)				
				.catch((err) => {
					this.echo('error opening wallet: ' + err);
				});

				var walletunlock = false;
				if (wallet) {
					walletunlock = await wallet.unlock(password)
					.catch((err) => {
						this.echo('error unlocking wallet: ' + err);
					});
					
				}

				if (walletunlock) {
					this.echo('unlocked wallet ' + walletname);
					
					var scheme;
					
					var cardauthname;
					var cardpass;
					var address;
					var card;
					
					var tokenaddress;
					var token;
					
					var tokenaccount;

					// on rinkeby
					scheme = await clientapicontrollers.getSchemeFromUUID(walletsession, MobileConfig.testnetworks[0].uuid);
					
					cardauthname = MobileConfig.testusers[0].username;
					cardpass = MobileConfig.testusers[0].password;
					address = MobileConfig.testaccounts[0].address;
					
					// retrieve card to access ethnode server
					card = await wallet.getCardFromAuthName(scheme, cardauthname);
					
					this.echo('card ' + cardauthname + ' for scheme "' + scheme.getLabel() + '"' + (card ? ' has been found ' : ' not found'));
					
					if (card) {
						if (card.isLocked()) {
							await card.unlock(cardpass);
						}
						
						this.echo('card ' + cardauthname + (card.isLocked() ? ' is locked ' : ' is unlocked '));
					}
					
					const rinkebycredits = await card.getTransactionCredits()
					.catch((err) => {
						this.echo('error: ' + err);
					});
					
					this.echo('card ' + address + ' transaction credits on Rinkeby is: ' + rinkebycredits);
					
					tokenaddress = MobileConfig.testtokens[0].address;
					token = await scheme.getTokenObject(tokenaddress);
					
					tokenaccount = await card.createTokenAccount(token);
					
					const rinkebyposition = await tokenaccount.getPosition()
					.catch((err) => {
						this.echo('error: ' + err);
					});
					
					this.echo('card ' + address + ' token ' + tokenaddress + ' balance on Rinkeby is: ' + rinkebyposition);


					// on ropsten
					scheme = await clientapicontrollers.getSchemeFromUUID(walletsession, MobileConfig.testnetworks[1].uuid);
					
					// retrieve card to access ethnode server
					card = await wallet.getCardFromAuthName(scheme, cardauthname);
					
					this.echo('card ' + cardauthname + ' for scheme "' + scheme.getLabel() + '"' + (card ? ' has been found ' : ' not found'));
					
					if (card) {
						if (card.isLocked()) {
							await card.unlock(cardpass);
						}
						
						this.echo('card ' + cardauthname + (card.isLocked() ? ' is locked ' : ' is unlocked '));
					}
					
					const ropstencredits = await card.getTransactionCredits()
					.catch((err) => {
						this.echo('error: ' + err);
					});
					
					this.echo('card ' + address + ' transaction credits on Ropsten is: ' + ropstencredits);
					

					tokenaddress = MobileConfig.testtokens[1].address;
					token = await scheme.getTokenObject(tokenaddress);
					
					tokenaccount = await card.createTokenAccount(token);
					
					const ropstenposition = await tokenaccount.getPosition()
					.catch((err) => {
						this.echo('error: ' + err);
					});
					
					this.echo('card ' + address + ' token ' + tokenaddress + ' balance on Ropsten is: ' + ropstenposition);

					
				}
				else {
					this.echo('error unlocking wallet: ' + username);
				}
			}
			
			
			//
			// MyTokens module
			//
			var publicschemelist = await clientapicontrollers.getPublicSchemeList(remotesession, true)
			.catch((err) => {
				this.echo('error retrieving list of public schemes: ' + err);
			});
			
			this.echo('list of public schemes contains: ' + (publicschemelist ? publicschemelist.length : 0) + ' element(s)');
			
			//
			// crypto
			//
			
			// generate private key
			var senderprivatekey = clientapicontrollers.generatePrivateKey(topsession);
			var senderpublickeys = clientapicontrollers.getPublicKeys(topsession, senderprivatekey)
			
			this.echo('generated private key for sender: ' + senderprivatekey);
			
			var recipientprivatekey = clientapicontrollers.generatePrivateKey(topsession);
			var recipientpublickeys = clientapicontrollers.getPublicKeys(topsession, recipientprivatekey)
			
			this.echo('generated private key for recipient: ' + recipientprivatekey);
			
			// symmetric encryption
			
			// aes encrypt text
			var plaintext = 'the fox jumps over the lazy dog';
			var cyphertext;
			
			cyphertext = clientapicontrollers.aesEncryptString(topsession, senderprivatekey, plaintext);
			
			// aes decrypt text
			var resulttext = clientapicontrollers.aesDecryptString(topsession, senderprivatekey, cyphertext);
			
			if (resulttext == plaintext)
				this.echo('aes decrypted cyphertext matches plaintext');
			else
				this.echo('aes decrypted cyphertext DOES NOT match plaintext');
			
			// asymmetric encryption

			// rsa encrypt text
			var senderaccount;
			var recipientaccount;
			
			senderaccount = topsession.createBlankAccountObject();
			recipientaccount = topsession.createBlankAccountObject();

			senderaccount.setPrivateKey(senderprivatekey);
			recipientaccount.setRsaPublicKey(recipientpublickeys['rsa_public_key']);
			
			cyphertext = clientapicontrollers.rsaEncryptString(senderaccount, recipientaccount, plaintext);

			// rsa decrypt text
			senderaccount = topsession.createBlankAccountObject();
			recipientaccount = topsession.createBlankAccountObject();

			senderaccount.setRsaPublicKey(senderpublickeys['rsa_public_key']);
			recipientaccount.setPrivateKey(recipientprivatekey);
			
			resulttext = clientapicontrollers.rsaDecryptString(recipientaccount, senderaccount, cyphertext);
			
			if (resulttext == plaintext)
				this.echo('rsa decrypted cyphertext matches plaintext');
			else
				this.echo('rsa decrypted cyphertext DOES NOT match plaintext');
			
			//
			// storage
			//
			
			var keys = ['mobile', 'data'];
			var input = {hello: 'world'};
			var value;
			
			const savelocaljson = await clientapicontrollers.saveLocalJson(topsession, keys, input)
			.catch((err) => {
				this.echo('error: ' + err);
			});
			
			this.echo('MobileClient.saveLocalJson returned')
			
			// without refresh
			const jsonleaf = await clientapicontrollers.getLocalJsonLeaf(topsession, keys, false);
			
			this.echo('MobileClient.getLocalJsonLeaf callback without refresh returned: ' + JSON.stringify(jsonleaf));
			
			// with refresh
			const refreshedjsonleaf =  await clientapicontrollers.getLocalJsonLeaf(topsession, keys, true)
			.catch((err) => {
				this.echo('error: ' + err);
			});
			
			this.echo('MobileClient.getLocalJsonLeaf with refresh returned: ' + JSON.stringify(refreshedjsonleaf));
	
			this.echo('MobileClient.echotest ended!');

		}
		catch(e) {
			this.echo('exception in MobileClient.echotest: ' + e);
			console.log(e.stack);
		}	


		
	}
	
	static getObject() {
		if (MobileClient.mobileclient)
			return MobileClient.mobileclient;
		
		MobileClient.mobileclient = new MobileClient();

		return MobileClient.mobileclient;
	}
}

module.exports = MobileClient;
