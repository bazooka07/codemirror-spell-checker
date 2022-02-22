// Use strict mode (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
"use strict";


// Requires
var Typo = require("typo-js");


// Create function
function CodeMirrorSpellChecker(options) {
	// Initialize
	options = options || {};


	// Verify
	if(typeof options.codeMirrorInstance !== "function" || typeof options.codeMirrorInstance.defineMode !== "function") {
		console.log("CodeMirror Spell Checker: You must provide an instance of CodeMirror via the option `codeMirrorInstance`");
		return;
	}


	// Because some browsers don't support this functionality yet
	if(!String.prototype.includes) {
		String.prototype.includes = function() {
			"use strict";
			return String.prototype.indexOf.apply(this, arguments) !== -1;
		};
	}


	// Define the new mode
	options.codeMirrorInstance.defineMode("spell-checker", function(config) {
		// Load AFF/DIC data
		var urlBase = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/';
		var langs = {
			de: 'German_de_DE',
			de_CH: 'German_de_CH',
			en: 'English%20(American)',
			en_AU: 'English%20(Australian)',
			en_CA: 'English%20(Canadian).aff',
			en_GB: 'English%20(British)',
			en_ZA: 'English%20(South African)',
			es: 'Spanish',
			fr: 'French',
		};
		var lg = 'en';
		if(typeof options.language == 'string') {
			if (options.language in langs) {
				lg = options.language;
			} else {
				var parts = options.language.split('_');
				if (parts.length == 2 && parts[0] in langs) {
					lg = parts[0];
				}
			}
		}

		if(!CodeMirrorSpellChecker.aff_loading) {
			CodeMirrorSpellChecker.aff_loading = true;
			var affUrl = urlBase + langs[lg] + '.aff';
			var xhr_aff = new XMLHttpRequest();
			xhr_aff.open('GET', affUrl, true);
			xhr_aff.onload = function() {
				if(xhr_aff.readyState === 4 && xhr_aff.status === 200) {
					CodeMirrorSpellChecker.aff_data = xhr_aff.responseText;
					CodeMirrorSpellChecker.num_loaded++;

					if(CodeMirrorSpellChecker.num_loaded == 2) {
						CodeMirrorSpellChecker.typo = new Typo("en_US", CodeMirrorSpellChecker.aff_data, CodeMirrorSpellChecker.dic_data, {
							platform: "any"
						});
					}
				}
			};
			xhr_aff.send(null);
		}

		if(!CodeMirrorSpellChecker.dic_loading) {
			CodeMirrorSpellChecker.dic_loading = true;
			var dicUrl = urlBase + langs[lg] + '.dic';
			var xhr_dic = new XMLHttpRequest();
			xhr_dic.open('GET', dicUrl, true);
			xhr_dic.onload = function() {
				if(xhr_dic.readyState === 4 && xhr_dic.status === 200) {
					CodeMirrorSpellChecker.dic_data = xhr_dic.responseText;
					CodeMirrorSpellChecker.num_loaded++;

					if(CodeMirrorSpellChecker.num_loaded == 2) {
						CodeMirrorSpellChecker.typo = new Typo("en_US", CodeMirrorSpellChecker.aff_data, CodeMirrorSpellChecker.dic_data, {
							platform: "any"
						});
					}
				}
			};
			xhr_dic.send(null);
		}


		// Define what separates a word
		var rx_word = "!\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ ";


		// Create the overlay and such
		var overlay = {
			token: function(stream) {
				var ch = stream.peek();
				var word = "";

				if(rx_word.includes(ch)) {
					stream.next();
					return null;
				}

				while((ch = stream.peek()) != null && !rx_word.includes(ch)) {
					word += ch;
					stream.next();
				}

				if(CodeMirrorSpellChecker.typo && !CodeMirrorSpellChecker.typo.check(word))
					return "spell-error"; // CSS class: cm-spell-error

				return null;
			}
		};

		var mode = options.codeMirrorInstance.getMode(
			config, config.backdrop || "text/plain"
		);

		return options.codeMirrorInstance.overlayMode(mode, overlay, true);
	});
}


// Initialize data globally to reduce memory consumption
CodeMirrorSpellChecker.num_loaded = 0;
CodeMirrorSpellChecker.aff_loading = false;
CodeMirrorSpellChecker.dic_loading = false;
CodeMirrorSpellChecker.aff_data = "";
CodeMirrorSpellChecker.dic_data = "";
CodeMirrorSpellChecker.typo;


// Export
module.exports = CodeMirrorSpellChecker;
