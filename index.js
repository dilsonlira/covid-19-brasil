const { downloadFile, makeCSVfromXLSX } = require('./covid-19-brasil');

(async () => {
    // Download XLSX file
    const filePath = await downloadFile();

    if (filePath) {
        // Convert downloaded file to CSV
        makeCSVfromXLSX(filePath);
    }
    
    return process.exit(1);
})();