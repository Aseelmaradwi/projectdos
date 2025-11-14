const axios = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
console.log("***************************************************************\n");
console.log("***************************************************************\n");
console.log("=>   Services menu:");

function showMenu() {
  console.log("1.   Search by topic");
  console.log("2.   Get info about a specific book");
  console.log("3.   Purchase a book");
  console.log("4.   Exit");
  rl.question("Write a number to choose an option: ", handleUserInput);
}

function handleUserInput(option) {
  switch (option) {
    case "1":
      rl.question(
        "Enter the needed topic: ",
        searchBooks
      );
      break;
    case "2":
      rl.question("Enter book number: ", getBookInfo);
      break;
    case "3":
      rl.question(
        "Enter book number:",
        purchaseBook
      );
      break;
    case "4":
      console.log("You've existed.");
      rl.close();
      break;
    default:
      console.log("Invalid. Try again.");
      showMenu();
  }
}

function searchBooks(topic) {
  axios
    .get(`http://catalog-service:3001/search/${topic}`)
    .then((response) => {
      console.log("Books found:");
      console.table(response.data);
      showMenu();
    })
    .catch((err) => {
      console.log("Error:", err.response ? err.response.data : err.message);
      showMenu();
    });
}

function getBookInfo(itemNumber) {
  axios
    .get(`http://catalog-service:3001/info/${itemNumber}`)
    .then((response) => {
      console.log("Book info:");
      console.table([response.data]);
      showMenu();
    })
    .catch((err) => {
      console.log("Error:", err.response ? err.response.data : err.message);
      showMenu();
    });
}

function purchaseBook(itemNumber) {
  axios
    .get(`http://catalog-service:3001/info/${itemNumber}`)
    .then((response) => {
      const bookInfo = response.data;
      if (bookInfo) {
        if (bookInfo.quantity > 0) {
          return axios.post(`http://order-service:3002/purchase/${itemNumber}`);
        } else {
          console.log("The item is out of stock.");
          return Promise.reject({ response: {  data: "The item is out of stock." } });
        }
      } else {
        console.log("Item not found.");
        return Promise.reject({ response: { status: 400, data: "Item not found." } });
      }
    })
    .then((response) => {
      console.log(response.data.message);
      showMenu();
    })
    .catch((err) => {
      if (err.response && err.response.data) {
        console.log("Error:", err.response.data);
      } else {
        console.log("Error:", err.message);
      }
      showMenu();
    });
}


showMenu();
