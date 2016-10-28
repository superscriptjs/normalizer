import fs from 'fs';
import path from 'path';
import str from 'string';
import RE2 from 're2';
import debuglog from 'debug';

const debug = debuglog('Normalizer');

const re1 = new RE2(/\+/g);
const re2 = new RE2(/\t/g);
const re3 = new RE2(/\s+/g);
const re4 = new RE2(/(’|‘)/g);
const re5 = new RE2(/(“|”)/g);
const re6 = new RE2(/(–|—)/g);
const re7 = new RE2(/[^\x00-\x7F]/g);
const re8 = new RE2(/[\+]{1}/g);
const re9 = new RE2(/<plus>/g);
const re10 = new RE2(/\d,\d/g);
const re11 = new RE2(/_/g);

// TODO, fix the paths
const tasks = [
  { key: '_sys', file: 'systemessentials.txt' },
  { key: '_extra', file: 'substitutes.txt' },
  { key: '_contractions', file: 'contractions.txt' },
  { key: '_interjections', file: 'interjections.txt' },
  { key: '_british', file: 'british.txt' },
  { key: '_spellfix', file: 'spellfix.txt' },
  { key: '_texting', file: 'texting.txt' },
];

const reSet = {};

const quotemeta = function quotemeta(string) {
  const unsafe = '\\.+*?[^]$(){}=!<>|:';
  for (let i = 0; i < unsafe.length; i++) {
    string = string.replace(new RegExp(`\\${unsafe.charAt(i)}`, 'g'), `\\${unsafe.charAt(i)}`);
  }
  return string;
};

const lineHandle = function lineHandle(task, key, replacer) {
  if (reSet[task.key] === undefined) {
    reSet[task.key] = {};
  }

  if (reSet[task.key][key] === undefined) {
    reSet[task.key][key] = [];
  }

  // Add RegEx
  let startM = false;
  let endM = false;
  let lookup = key;

  if (key[0] === '<') {
    startM = true;
    lookup = key.substring(1);
  }

  if (key.slice(-1) === '>') {
    endM = true;
    lookup = lookup.substring(0, lookup.length - 1);
  }

  const qm = quotemeta(re11.replace(lookup, ' '));

  if (startM && endM) {
    reSet[task.key][key].push({ re: new RegExp(`^${qm}$`, 'gi'), r: replacer });
  } else if (startM) {
    reSet[task.key][key].push({ re: new RegExp(`^${qm}(\\W+|$)`, 'gi'), r: `${replacer}$1` });
  } else if (endM) {
    reSet[task.key][key].push({ re: new RegExp(`(\\W+|^)${qm}$`, 'gi'), r: `$1${replacer}` });
    if (task.key === '_sys') {
      reSet[task.key][key].push({ re: new RegExp(`${qm}$`, 'gi'), r: replacer });
    } else {
      // reSet[task.key][key].push({ re: new RegExp(`(\\W+)${qm}(\\W+)`, 'gi'), r: `$1${replacer}$2` });
    }
  } else {
    reSet[task.key][key].push({ re: new RegExp(`(\\W+|^)${qm}(\\W+|$)`, 'gi'), r: `$1${replacer}$2` });
  }
};

const doTask = function doTask(task) {
  debug('Loading file: ', task);

  const dir = path.join(__dirname, '../data/');
  const data = fs.readFileSync(dir + task.file, 'utf8').split('\r\n');

  for (let i = 0; i < data.length; i++) {
    const line = data[i];
    let nline = str(line).trimLeft();

    // Let's allow comments with '#'
    const pos = nline.indexOf('#');

    if (pos === -1) {
      const parts = nline.s.split(' ');

      if (parts[1] === undefined) {
        lineHandle(task, parts[0], '');
      } else {
        lineHandle(task, parts[0], parts[1]);
      }
    } else if (pos > 0) {
      nline = nline.left(pos);
      const parts = nline.s.split(' ');
      lineHandle(task, parts[0], parts[1]);
    }
  }
};

tasks.forEach(doTask);

debug('Done loading files');

const clean = function clean(msg) {
  msg = re1.replace(msg, '<plus>');
  msg = re2.replace(msg, ' ');
  msg = re3.replace(msg, ' ');
  msg = re4.replace(msg, "'");
  msg = re5.replace(msg, '"');
  msg = re6.replace(msg, '—');
  msg = re7.replace(msg, '');

  const replacer = (regex) => {
    msg = msg.replace(regex.re, regex.r);
  };

  Object.keys(reSet).forEach((taskKey) => {
    Object.keys(reSet[taskKey]).forEach((key) => {
      const reArray = reSet[taskKey][key];
      reArray.forEach(replacer);
    });
  });

  msg = re8.replace(msg, ' ');
  msg = re9.replace(msg, '+');
  msg = re10.replace(msg, v => v.replace(',', ''));

  return msg.trim();
};

export default { clean };
