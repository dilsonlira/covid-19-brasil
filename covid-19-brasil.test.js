const { downloadFile } = require('./covid-19-brasil');
const fs = require('fs');

jest.setTimeout(30000);

const successParameters = {
    empty_string: '',
    dot: '.',
    dot_slash: './',
    folder: 'folder',
    slash_folder: '/folder',
    folder_slash: 'folder/',
    folder_subfolder_subfolder: 'folder/subfolder/subsubfolder',
};

const successKeys = Object.keys(successParameters);

const failParameters = {
    null: null,
    int: 4,
    float: 3.14,
    array: ['2'],
    object: { a: 1 },
    double_slash: '//folder',
    double_dot: '../folder',
};

const failKeys = Object.keys(failParameters);

describe('Download file', () => {

    it('No parameter', async () => {
        const filePath = await downloadFile();
        const fileExists = fs.existsSync(filePath);
        expect(fileExists).toBeTruthy();

        // File removal
        fs.unlinkSync(filePath);
    });

    successKeys.map((key) => {
        it(key, async () => {
            const parameter = successParameters[key];
            const filePath = await downloadFile(parameter);
            const fileExists = fs.existsSync(filePath);
            expect(fileExists).toBeTruthy();

            // File and folder removal
            
            fs.unlinkSync(filePath);

            var folderLevels = filePath.split('/');
            folderLevels.pop();

            if (folderLevels[0] !== '.' || folderLevels > 1) {
                while (folderLevels.length > 0) {
                    var folder = folderLevels.join('/');
                    fs.rmdirSync(folder);
                    folderLevels.pop();
                }
            }
        });
    });

    failKeys.map((key) => {
        it(key, async () => {
            const parameter = failParameters[key];
            const filePath = await downloadFile(parameter);
            expect(typeof filePath).not.toBe('string');
        })
    })
})