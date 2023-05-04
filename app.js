const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const { map } = require('bluebird');

const filePath = 'list.txt';
let totalChecked = 0;
let totalValid = 0;
let totalInvalid = 0;
let totalError = 0;

function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
}

function handleFileWrite(filename, content) {
  fs.appendFileSync(filename, content, { encoding: 'utf8' });
}

async function makeRequest(number) {
    const url = `https://graph.facebook.com/${number}/picture?type=normal`;
    try {
        const response = await axios.get(url);
        const responseData = response.data;
       // if (!responseData.includes('Photoshop') || response.request.res.responseUrl.includes('//static')) {
        if (response.request.res.responseUrl.includes('//static')) {
            handleFileWrite('Invalid.txt', `${number}\n`);
            totalInvalid++;
        } else {
            handleFileWrite('Valid.txt', `${number}\n`);
            totalValid++;
        }
    } catch (error) {
        // Handle request errors
        if(error.response && error.response.status === 400){
            handleFileWrite('Invalid.txt', `${number}\n`);
            totalInvalid++;    
        }
        else {
            totalError++;
        }
    } finally {
        totalChecked++;
        const validColor = chalk.white.bgGreen.bold(` SUCCESS : ${totalValid} `);
        const invalidColor = chalk.white.bgRed.bold(` DIE : ${totalInvalid} `);
        const errorColor = chalk.white.bgYellow.bold(` ERROR : ${totalError} `);
        const totalColor = chalk.white.bgBlue.bold(` TOTAL : ${totalChecked} `);
        const outputMessage = chalk.white(`[${getTimestamp()}] ${totalColor}${validColor}${invalidColor}${errorColor}`);
        process.stdout.write(`\r${outputMessage}`);
    }
}

if (fs.existsSync(filePath)) {
  const nums = new Set();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r\n|\n/);
  lines.forEach(line => {
    const num = line.trim();
    if (/^[0-9]+$/.test(num)) {
      nums.add(num);
    }
  });
  const numbers = Array.from(nums);
  console.log(chalk.white(`[${getTimestamp()}]`), chalk.yellow(`->> Imported Numbers : ${numbers.length}`));
    const batchSize = 1000;
    const batches = [];
    for (let i = 0; i < numbers.length; i += batchSize) {
        batches.push(numbers.slice(i, i + batchSize));
    }

    (async () => {
        for (let j = 0; j < batches.length; j++) {
            await map(batches[j], makeRequest, {
                concurrency: 100
            });
        }
    })();
} else {
    console.log(chalk.white(`[${getTimestamp()}] `) + chalk.red('->> ' + filePath + ' Not Found.'));
}