const axios = require('axios');
const fs = require('fs');
const exec = require('child_process').exec;
const debounce = require('debounce-promise');

function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

let mapContent = '';

const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]));

function concatToMapContent(phrase) {
  console.log('CONCATENATING TO THE MAP.TXT FILE');
  mapContent += `${phrase.split(' ').join('_')}.wav\t${phrase}\n`;
}

function saveMapContentFile() {
  fs.writeFile("map.txt", mapContent, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
  });
}

function getPromiseForPhrase(phrase) {
  return () => new Promise((resolve, reject) => {
    exec('python tts.py "'.concat(phrase).concat('"'), (error, stdout, stderr) => {
      if (stdout.includes('TTS') && !stderr && !error) {
        console.log(`stdout: ${stdout}`);
        concatToMapContent(phrase);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      } else if (error !== null) {
        console.log(`exec error: ${error}`);
      }
      resolve();
    });
  });
}

function getRandomWordGeneratorPhrases() {
  axios.get('https://randomwordgenerator.com/json/sentences.json').then((res) => {
    const promises = [];
    res.data.data.forEach((phrase, index) => {
      /*
      if (phrase.sentence.length > 25) {
        phrase.sentence.split(' ').forEach(smPhrase => {
          promises.push(getPromiseForPhrase(smPhrase));
        });
      } else {
        */
        promises.push(getPromiseForPhrase(phrase.sentence));
      // }
    });
    promiseSerial(promises).then(() => {
      console.log('DONE');
      saveMapContentFile();
    })
  });
}

const isQuestion = phrase => phrase.includes('?');

function getPhrasesByOneByOne() {
  const N = 100;
  let promises = [];
  for(let i = 0; i < N; i++) {
    promises.push(() => new Promise((resolve, reject) => {
      axios.post('http://watchout4snakes.com/wo4snakes/Random/NewRandomSentence').then((res) => {
        const phrase = res.data;
        if (!isQuestion(phrase)) {
          getPromiseForPhrase(phrase)()
          .then(() => {
            saveMapContentFile();
            resolve();
          })
          .catch(reject);
        } else {
          resolve();
        }
      });
    }));
  }
  promiseSerial(promises)
  .then(() => {
    console.log('DONE');
    saveMapContentFile();
  })
  .catch(e => {
    console.log('ERROR');
    console.log(e);
  })
}

getPhrasesByOneByOne();
