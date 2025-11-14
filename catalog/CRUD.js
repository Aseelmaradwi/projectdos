const fs = require("fs");
const csv = require("csv-parser");
const csvFilePath = "catalog.csv";
const readCSVFile = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const writeCSVFile = (data) => {
  return new Promise((resolve, reject) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => row[header]).join(",")),
    ].join("\n");

    fs.writeFile(csvFilePath, csvContent, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = {
  readCSVFile,
  writeCSVFile,
};
