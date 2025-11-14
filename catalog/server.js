const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const { readCSVFile, writeCSVFile } = require("./CRUD");
const app = express();
const port = 3001;

app.get("/search/:topic", (req, res) => {
  const topic = req.params.topic;
  let results = [];

  fs.createReadStream("catalog.csv")
    .pipe(csv())
    .on("data", (data) => {
      if (data.topic === topic) {
        results.push(data);
      }
    })
    .on("end", () => {
      res.json(results);
    });
});

app.get("/info/:item_number", (req, res) => {
  const itemNumber = req.params.item_number;
  let found = false;

  fs.createReadStream("catalog.csv")
    .pipe(csv())
    .on("data", (data) => {
      if (data.item_number === itemNumber) {
        res.json(data);
        found = true;
      }
    })
    .on("end", () => {
      if (!found) {
        res
          .status(404)
          .json({ message: `Book with item number ${itemNumber} not found` });
      }
    });
});

app.post("/update-quantity/:item_number", (req, res) => {
  const itemNumber = req.params.item_number;

  readCSVFile()
    .then((books) => {
      const bookToUpdate = books.find((b) => b.item_number === itemNumber);

      if (!bookToUpdate) {
        return res.status(404).json({ message: "Book not found in CSV" });
      }

      if (parseInt(bookToUpdate.quantity) > 0) {
        bookToUpdate.quantity = parseInt(bookToUpdate.quantity) - 1;
        return writeCSVFile(books).then(() => {
          res.json({ message: `Successfully purchased ${bookToUpdate.title}` });
        });
      } else {
        res.status(400).json({ message: "Out of stock" });
      }
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Error updating the CSV file", error: error.message });
    });
});

app.listen(port, () => {
  console.log(`Catalog service is running on http://catalog-service:${port}`);
});
