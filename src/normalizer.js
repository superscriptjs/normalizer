import fs from 'fs';
import path from 'path';
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

const quotemeta = function quotemeta(string) {
  const unsafe = '\\.+*?[^]$(){}=!<>|:';
  let cleanString = string;
  for (let i = 0; i < unsafe.length; i++) {
    cleanString = cleanString.replace(new RegExp(`\\${unsafe.charAt(i)}`, 'g'), `\\${unsafe.charAt(i)}`);
  }
  return cleanString;
};

const replacements = {};
const systemReplacements = [];

const lineHandle = function lineHandle(task, phrase, replacement = '') {
  let start = false;
  let end = false;

  if (phrase[0] === '<') {
    start = true;
    phrase = phrase.substring(1);
  }

  if (phrase.slice(-1) === '>') {
    end = true;
    phrase = phrase.substring(0, phrase.length - 1);
  }

  phrase = re11.replace(phrase, ' ');
  const cleanPhrase = quotemeta(phrase);

  phrase.split(' ').forEach((word) => {
    word = word.toLowerCase();

    if (replacements[word] === undefined) {
      replacements[word] = [];
    }

    let phraseRegex;
    let replacementRegex;

    if (start && end) {
      phraseRegex = new RegExp(`^${cleanPhrase}$`, 'gi');
      replacementRegex = replacement;
    } else if (start) {
      phraseRegex = new RegExp(`^${cleanPhrase}(\\W+|$)`, 'gi');
      replacementRegex = `${replacement}$1`;
    } else if (end) {
      phraseRegex = new RegExp(`(\\W+|^)${cleanPhrase}$`, 'gi');
      replacementRegex = `$1${replacement}`;
      if (task.key === '_sys') {
        phraseRegex = new RegExp(`${cleanPhrase}$`, 'i');
        replacementRegex = replacement;
      }
    } else {
      phraseRegex = new RegExp(`(\\W+|^)${cleanPhrase}(\\W+|$)`, 'gi');
      replacementRegex = `$1${replacement}$2`;
    }

    if (task.key === '_sys') {
      systemReplacements.push({ phraseRegex, replacementRegex });
    } else {
      replacements[word].push({ phrase, replacement, phraseRegex, replacementRegex });
      replacements[word].sort((a, b) => (b.phrase.split(' ').length - a.phrase.split(' ').length));
    }
  });
};

const doTask = function doTask(task) {
  debug('Loading file: ', task);

  const dir = path.join(__dirname, '../data/');
  const data = fs.readFileSync(dir + task.file, 'utf8').split('\r\n');

  for (let i = 0; i < data.length; i++) {
    const line = data[i];
    let nline = line.trimLeft();

    // Let's allow comments with '#'
    const pos = nline.indexOf('#');

    if (pos === -1) {
      const parts = nline.split(' ');

      if (parts[1] === undefined) {
        lineHandle(task, parts[0], '');
      } else {
        lineHandle(task, parts[0], parts[1]);
      }
    } else if (pos > 0) {
      nline = nline.substr(0, pos);
      const parts = nline.split(' ');
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

  systemReplacements.forEach((replacement) => {
    msg = msg.replace(replacement.phraseRegex, replacement.replacementRegex);
  });

  let splitMsg = msg.toLowerCase();
  splitMsg = splitMsg.split(' ');

  splitMsg.forEach((word) => {

    if (replacements[word]) {
      replacements[word].forEach((phrase) => {
        // console.log(`Replacing "${phrase.phrase}" with "${phrase.replacement}"`);
        msg = msg.replace(phrase.phraseRegex, phrase.replacementRegex);
      });
    }
  });

  msg = re8.replace(msg, ' ');
  msg = re9.replace(msg, '+');
  msg = re10.replace(msg, v => v.replace(',', ''));

  return msg.trim();
};

export default { clean };
