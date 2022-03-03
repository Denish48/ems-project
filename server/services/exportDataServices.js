const Pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { Parser } = require('json2csv');
const json2xls = require('json2xls');

Handlebars.registerHelper("inc", (val) => {
    return Number(val) + 1;
});

module.exports = {

    generatePDF: async (templateName, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let { headers, details } = data;

                let templatePath = path.join(__dirname, `../templates/${templateName}`);

                readHTMLFile(templatePath, async (err, html) => {
                    if (err) {
                        return reject(err);
                    }
                    let htmlData = Handlebars.compile(html)({ headers: headers, data: details });
                    let pdfData = await getPdf(htmlData);
                    return resolve(pdfData);
                });
            } catch (error) {
                return reject(error);
            }
        });
    },
    generateCSV: async (data, csvFields = null) => {
        return new Promise(async (resolve, reject) => {
            try {
                let json2csvParser;
                if (csvFields) {
                    json2csvParser = new Parser({ csvFields });
                } else {
                    json2csvParser = new Parser();
                }
                const csvData = json2csvParser.parse(data);
                let result = Buffer.from(csvData).toString('base64');
                resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
    },
    generateXLSX: async (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                // json2xls returns xlsx file data in binary format
                const xlsxBinaryData = json2xls(data);
                // https://stackabuse.com/encoding-and-decoding-base64-strings-in-node-js/#encodingbinarydatatobase64strings
                // read Reza Rahmati's comment
                const xlsxDataBuffer = Buffer.from(xlsxBinaryData, 'binary');
                let result = xlsxDataBuffer.toString('base64');
                resolve(result);
            } catch (error) {
                return reject(error);
            }
        });
    },
}

let readHTMLFile = (fullpath, callback) => {
    fs.readFile(fullpath, { 'encoding': 'utf-8' }, (err, html) => {
        if (err) callback(err);
        else callback(null, html);
    });
};

let getPdf = (htmlData) => {
    return new Promise((resolve, reject) => {

        try {
            let options = {
                type: 'pdf', format: 'A1',
                "border": {
                    "top": "1in",
                    "right": "1in",
                    "bottom": "1in",
                    "left": "1in",
                }
            };
            // console.log(htmlData);
            Pdf.create(htmlData, options).toBuffer((err, buffer) => {
                if (err) return reject(err);
                let base64data = Buffer.from(buffer, 'binary').toString('base64');
                return resolve(base64data);
            });

        } catch (error) {
            return reject(error);
        }
    });
}