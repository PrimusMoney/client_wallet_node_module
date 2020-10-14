console.log('mobile-load.js loader');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();

var globalscriptloader = ScriptLoader.findScriptLoader('globalloader')

var xtrascriptloader = globalscriptloader.getChildLoader('mobileconfig');

// client modules
rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/module.js')
import '../../../includes/modules/module.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/control/controllers.js')
import '../../../includes/modules/control/controllers.js';


// synchronized storage module
rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/synchronized-storage/module.js')
import '../../../includes/modules/synchronized-storage/module.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/synchronized-storage/model/localstorage.js')
import '../../../includes/modules/synchronized-storage/model/localstorage.js';


// wallet module
rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/module.js')
import '../../../includes/modules/wallet/module.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/card.js')
import '../../../includes/modules/wallet/model/card.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/contact.js')
import '../../../includes/modules/wallet/model/contact.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/scheme.js')
import '../../../includes/modules/wallet/model/scheme.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/token-account.js')
import '../../../includes/modules/wallet/model/token-account.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/transaction.js')
import '../../../includes/modules/wallet/model/transaction.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/token.js')
import '../../../includes/modules/wallet/model/token.js';

rootscriptloader.push_import(xtrascriptloader,'../../../includes/modules/wallet/model/wallet.js')
import '../../../includes/modules/wallet/model/wallet.js';

xtrascriptloader.load_scripts();