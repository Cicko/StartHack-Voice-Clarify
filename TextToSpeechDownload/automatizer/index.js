const axios = require('axios');
const fs = require('fs');
const exec = require('child_process').exec;
const debounce = require('debounce');

function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

let mapContent = '';

function getPromiseForPhrase(phrase) {
  new Promise((resolve, reject) => {
    debounce(exec('python tts.py "'.concat(phrase).concat('"'), (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      resolve();
      if (error !== null) {
        reject(error);
          console.log(`exec error: ${error}`);
      }
    }), 500);
  })
}

axios.get(`https://randomwordgenerator.com/json/sentences.json?cucu=${Math.random()}`).then((res) => {
  const promises = [];
  res.data.data.forEach(phrase => {
    /*
    if (phrase.sentence.length > 25) {
      phrase.sentence.split(' ').forEach(smPhrase => {
        promises.push(getPromiseForPhrase(smPhrase));
      });
    } else {
      */
    mapContent += `${phrase.sentence.split(' ').join('_')}.wav ${phrase.sentence}\n`;
    promises.push(getPromiseForPhrase(phrase.sentence));
    // }
  });
  Promise.all(promises).then(() => {
    console.log('DONE');
    console.log(mapContent.length);
    fs.writeFile("map.txt", mapContent, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("The file was saved!");
    });
  })
});
