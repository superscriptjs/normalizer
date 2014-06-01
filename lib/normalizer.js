var fs 				= require('fs');
var path 			= require("path");
var readline 	= require('readline');
var stream 		= require('stream');
var str				= require("string");
var async 		= require("async");
var debug 		= require('debug')("Normalizer");

// TODO, fix the paths
var tasks = [
	{'key':'_sys','file':'systemessentials.txt'}, 
	{'key':'_extra','file':'substitutes.txt'}, 
	{'key':'_contractions','file':'contractions.txt'},
	{'key':'_interjections','file':'interjections.txt'},
	{'key':'_britsh','file':'british.txt'},
	{'key':'_spellfix','file':'spellfix.txt'},
	{'key':'_texting','file':'texting.txt'}
];

var reSet = {};

var readSubstitutes = function(file, lineHandle, closeHandle) {
	var p = path.join(__dirname, "../data/", file)
	var instream = fs.createReadStream(p);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	rl.on('line', function(line){
		var nline = str(line).trimLeft();

		// Lets allow comments with '#'
		var pos = nline.indexOf('#');
		
		if (pos == -1) {
			var parts = nline.s.split(" ");
			if (parts[1] == undefined) {
				lineHandle(parts[0], "");	
			} else {
				lineHandle(parts[0], parts[1]);
			}
			
		} else if (pos > 0) {			
			nline = nline.left(pos);
			var parts = nline.s.split(" ");
			lineHandle(parts[0], parts[1]);
		}
	});

	rl.on('close', closeHandle);
}

exports.loadData = function(cb){

	var itor = function(item, cb) {
		debug("Loaded File", item);

		var lineHandle = function(key, replacer) {

			if (reSet[item.key] === undefined) {
				reSet[item.key] = {};
			}
			
			if (reSet[item.key][key] === undefined) {
				reSet[item.key][key] = [];
			}
			
			// Add RegEx
			var startM, endM, lookup = key;
			if (key[0] == '<') {
				startM = true;
				lookup = key.substring(1);
			}

			if (key.slice(-1) == '>') {
				endM = true;
				lookup = lookup.substring(0, lookup.length - 1);				
			}

			lookup = lookup.replace(/_/g," ");
			var qm = quotemeta(lookup);

			if (startM && endM) {
				reSet[item.key][key].push({re: new RegExp("^" + qm + "$", "gi"), r: replacer });
			} else if (startM) {
				reSet[item.key][key].push({re: new RegExp("^" + qm + "$", "gi"), r: replacer });
				reSet[item.key][key].push({re: new RegExp("^" + qm + "(\\W+)", "gi"), r: replacer + "$1"});
			} else if (endM) {

				reSet[item.key][key].push({re: new RegExp("(\\W+)" + qm + "$", "gi"), r: "$1" + replacer });
				if (item.key == "_sys") {
					reSet[item.key][key].push({re: new RegExp(qm + "$", "gi"), r: replacer });
				} else {
					// reSet[item.key][key].push({re: new RegExp("(\\W+)" + qm + "(\\W+)", "gi"), r: "$1" + replacer + "$2" });					
				}
			} else {
				reSet[item.key][key].push({re: new RegExp("^" + qm + "$", "gi"), r: replacer });
				reSet[item.key][key].push({re: new RegExp("^" + qm + "(\\W+)", "gi"), r: replacer + "$1" });
				reSet[item.key][key].push({re: new RegExp("(\\W+)" + qm + "(\\W+)", "gi"), r: "$1" + replacer + "$2" });
				reSet[item.key][key].push({re: new RegExp("(\\W+)" + qm + "$", "gi"), r: "$1" + replacer });
			}
		}
		
		readSubstitutes(item.file, lineHandle, function() {
			cb(null);
		});
	}

	async.map(tasks, itor, function(){
		debug("Done Loading files");
		cb();
	});
};

exports.clean = function(msg){

	msg = msg.replace(/\+/g, "<plus>");
	msg = msg.replace(new RegExp("\t", "g"), " ");
	msg = msg.replace(/\s+/g, " ");

	var fileItor = function(item1, next1) {

		var itemItor = function(item2, next2) {
			var reArray = reSet[item1][item2];
			var reItor = function(item3, next3) {
				var pm = msg;
				msg = msg.replace(item3.re, item3.r);
				next3(null);
			};

			async.map(reArray, reItor, function(){
				next2(null);
			});
		}

		async.each(Object.keys(reSet[item1]), itemItor, function(){
			next1(null)
		});
	}

	async.mapSeries(Object.keys(reSet), fileItor, function() {
		msg = msg.replace(new RegExp("[\+]{1}", "g"), " ");
		msg = msg.replace(new RegExp("<plus>", "g"), "+");
		msg = msg.replace(/\d,\d/g, function(v) { return v.replace(",",""); });
	});

	return msg.trim();	
}

var quotemeta = function (string) {
	var unsafe = "\\.+*?[^]$(){}=!<>|:";
	for (var i = 0; i < unsafe.length; i++) {
		string = string.replace(new RegExp("\\" + unsafe.charAt(i), "g"), "\\" + unsafe.charAt(i));
	}
	return string;
};