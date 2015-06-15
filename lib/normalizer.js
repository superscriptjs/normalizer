var fs        = require('fs');
var path      = require("path");
var readline  = require('readline');
var stream    = require('stream');
var str       = require("string");
var async     = require("async");
var RE2       = require("re2");
var debug     = require('debug')("Normalizer");

var re1 = new RE2(/\+/g);
var re2 = new RE2(/\t/g);
var re3 = new RE2(/\s+/g);
var re4 = new RE2(/(’|‘)/g);
var re5 = new RE2(/(“|”)/g);
var re6 = new RE2(/(–|—)/g);
var re7 = new RE2(/[^\x00-\x7F]/g);
var re8 = new RE2(/[\+]{1}/g);
var re9 = new RE2(/<plus>/g);
var re10 = new RE2(/\d,\d/g);
var re11 = new RE2(/_/g);

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

  var p = path.join(__dirname, "../data/", file);
  var data = fs.readFileSync(p,'utf8').split("\r\n");

  for (var i = 0; i < data.length; i++) {
    var line = data[i];
    var nline = str(line).trimLeft();

    // Lets allow comments with '#'
    var pos = nline.indexOf('#');
    
    if (pos === -1) {
      var parts = nline.s.split(" ");

      if (parts[1] === undefined) {
        lineHandle(parts[0], "");
      } else {

        lineHandle(parts[0], parts[1]);
      }
      
    } else if (pos > 0) {
      nline = nline.left(pos);
      var parts = nline.s.split(" ");
      lineHandle(parts[0], parts[1]);
    }
  }

  closeHandle();
};

exports.loadData = function(cb){

  var fc = 0;
  var itor = function(item, cb2) {
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

      var qm = quotemeta(re11.replace(lookup, " "));

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
    };
    
    readSubstitutes(item.file, lineHandle, function() {
      fc++;
      if (tasks.length == fc) {
        debug("Done Reading Subs");
        cb2('done');
      }
    });
  };

  async.map(tasks, itor, function(){
    debug("Done Loading files");
    cb();
  });
};

exports.clean = function(msg){

  msg = re1.replace(msg, "<plus>");
  msg = re2.replace(msg, " ");
  msg = re3.replace(msg, " ");
  msg = re4.replace(msg, "'");
  msg = re5.replace(msg, '"');
  msg = re6.replace(msg, "—");
  msg = re7.replace(msg, "");

  var fileItor = function(item1, next1) {
    var itemItor = function(item2, next2) {
      var reArray = reSet[item1][item2];
      var reItor = function(item3, next3) {
        // msg = item3.re.replace(msg, item3.r);
        msg = msg.replace(item3.re, item3.r);
        next3(null);
      };

      async.map(reArray, reItor, function(){
        next2(null);
      });
    };

    async.each(Object.keys(reSet[item1]), itemItor, function(){
      next1(null);
    });
  };

  async.mapSeries(Object.keys(reSet), fileItor, function() {
    msg = re8.replace(msg, " ");
    msg = re9.replace(msg, "+");
    msg = re10.replace(msg, function(v) { return v.replace(",",""); });
  });

  return msg.trim();
};

var quotemeta = function (string) {
  var unsafe = "\\.+*?[^]$(){}=!<>|:";
  for (var i = 0; i < unsafe.length; i++) {
    string = string.replace(new RegExp("\\" + unsafe.charAt(i), "g"), "\\" + unsafe.charAt(i));
  }
  return string;
};
