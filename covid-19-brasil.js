const puppeteer = require('puppeteer');
const moment = require('moment');
const ora = require('ora');
const fs = require('fs');
const XLSX = require('xlsx');

async function downloadFile(desiredFolder = '.') {

    const url = 'https://covid.saude.gov.br';
    const interval = 2000;
    const downloadButtonClassIdentifier = '.btn-white';

    // Parameter validation
    
    if (typeof desiredFolder !== 'string') {
        console.log('Error: the parameter must be a string.');
        return;
    }

    if (desiredFolder.includes('//')) {
        console.log('Error: enter a valid path.');
        return;
    }

    if (desiredFolder.startsWith('..')) {
        console.log('Error: enter a valid path.');
        return;
    }

    // Parameter adjustments

    if (desiredFolder === '') {
        desiredFolder = '.';
    }

    if (!desiredFolder.endsWith('/')) {
        desiredFolder += '/';
    }

    if (desiredFolder.startsWith('/')) {
        desiredFolder = desiredFolder.slice(1);
    }

    // Scraping

    const tempFolder = desiredFolder + 'tmp-covid-19-brasil/';

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        var spinner = ora('Download requested.').start();

        await page.goto(url, { waitUntil: 'networkidle2' });
    
        await page.waitFor(interval);
        const [downloadButton] = await page.$$(downloadButtonClassIdentifier);
        
        if (!downloadButton) {
            console.log('Error: page structure was changed.');
            return;
        }

        await downloadButton.click();
    
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow', 
            downloadPath: tempFolder,
        });
            
        await page.waitFor(interval);
        await page.close();

    } catch (error) {
        console.log('Error: unable to download the file.');
        return;
    }

    // File checks

    try {
        var files = fs.readdirSync(tempFolder);
    } catch (error) {
        console.log('Error: unable to read temp folder.');
        spinner.stop();
        return;
    }
    
    if (files.length != 1) {
        console.log('Error: wrong quantity of downloaded files.');
        return;
    }
    
    const [filename] = files;
    
    const isXlsx = /.+\.xlsx$/.test(filename);
    
    if (!isXlsx) {
        console.log('Error: the downloaded file is not XLSX.');
    }
    
    try {
        const tempPath = tempFolder + filename;
        var desiredPath = desiredFolder + filename;

        var stats = fs.statSync(tempPath);

        fs.renameSync(tempPath, desiredPath);
        fs.rmdirSync(tempFolder);
    } catch {
        console.log('Error: file cannot be placed in desiredFolder.');
        spinner.close();
        return;
    }
    
    const now = moment().format('YYYY/MM/DD HH:mm:ss');
    console.log(`\n${now}: ${desiredFolder+filename} (${stats.size} bytes) was successfully downloaded.`);
    spinner.stop();

    return desiredPath;
}

function makeCSVfromXLSX(xlsxFilePath) {

    // Parameter validation
    
    if (typeof xlsxFilePath !== 'string') {
        console.log('Error: the parameter must be a string.');
        return;
    }
    
    const isXlsx = /.+\.xlsx$/.test(xlsxFilePath);
    
    if (!isXlsx) {
        console.log('Error: the pointed file must be XLSX.');
    }
    
    if(!fs.existsSync(xlsxFilePath)) {
        console.log('Error: the pointed file does not exist.');
        return;
    }

    var spinner = ora('Conversion requested.').start();
    
    const csvFilePath = xlsxFilePath.slice(0, -'xlsx'.length) + 'csv';

    const workBook = XLSX.readFile(xlsxFilePath);
    const workSheet = workBook.Sheets[workBook.SheetNames[0]];

    const csvData = XLSX.utils.sheet_to_csv(workSheet, { FS: ';' });

    try {
        fs.writeFileSync(csvFilePath, csvData);
        console.log(csvFilePath);
    } catch (error) {
        console.log('Error: unable to write CSV file.')
    }

    spinner.stop();
}

module.exports = {
    downloadFile,
    makeCSVfromXLSX
};