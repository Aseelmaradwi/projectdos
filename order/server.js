const express = require("express");
const axios = require("axios");

const app = express();
const port = 3002;

app.post("/purchase/:item_number", (req, res) => {
  const itemNumber = req.params.item_number;

  axios
    .post(`http://catalog-service:3001/update-quantity/${itemNumber}`)
    .then((response) => {
      res.json({
        message: `Purchase request processed for book ${itemNumber}`,
      });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Error processing purchase", error: error.message });
    });
});

app.listen(port, () => {
  console.log(`Order service is running on http://order-service:${port}`);
});