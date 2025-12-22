const axios = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const cache = {};

// Replica arrays and round-robin indexes
const catalogReplicas = [
  "http://catalog-service-1:3001",
  "http://catalog-service-2:3001"
];

const orderReplicas = [
  "http://order-service-1:3003",
  "http://order-service-2:3003"
];

let catalogReplicaIndex = 0;
let orderReplicaIndex = 0;

function getNextCatalogReplica() {
  catalogReplicaIndex = (catalogReplicaIndex + 1) % catalogReplicas.length;
  console.log(`Using catalog replica: ${catalogReplicas[catalogReplicaIndex]}`);
  return catalogReplicas[catalogReplicaIndex];
}

function getNextOrderReplica() {
  orderReplicaIndex = (orderReplicaIndex + 1) % orderReplicas.length;
  console.log(`Using order replica: ${orderReplicas[orderReplicaIndex]}`);
  return orderReplicas[orderReplicaIndex];
}

function getFromCache(key) {
  const entry = cache[key];
  if (entry) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data };
}

function invalidateCache(key) {
  if (cache[key]) {
    delete cache[key];
    console.log(`Cache invalidated for ${key}`);
  }
}

function showMenu() {
  console.log("\nSelect an option:");
  console.log("1. Search Books by Topic");
  console.log("2. Get Book Info by Item Number");
  console.log("3. Purchase Book by Item Number");
  console.log("4. Exit");

  rl.question("Enter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        rl.question("Enter topic: ", (topic) => {
          searchBooks(topic);
        });
        break;
      case "2":
        rl.question("Enter item number: ", (itemNumber) => {
          getBookInfo(itemNumber);
        });
        break;
      case "3":
        rl.question("Enter item number to purchase: ", (itemNumber) => {
          purchaseBook(itemNumber);
        });
        break;
      case "4":
        console.log("Exiting...");
        rl.close();
        break;
      default:
        console.log("Invalid choice. Try again.");
        showMenu();
        break;
    }
  });
}

function searchBooks(topic) {
  const cacheKey = `search:${topic}`;
  const cachedData = getFromCache(cacheKey);

  if (cachedData) {
    console.log("Books found (from cache):");
    console.table(cachedData);
    showMenu();
    return;
  }

  const catalogServer = getNextCatalogReplica();

  axios
    .get(`${catalogServer}/search/${topic}`)
    .then((response) => {
      console.log("cache miss...");
      console.log("Books found:");
      console.table(response.data);
      setCache(cacheKey, response.data);
      showMenu();
    })
    .catch((err) => {
      console.log("Error:", err.response ? err.response.data : err.message);
      showMenu();
    });
}

function getBookInfo(itemNumber) {
  const cacheKey = `info:${itemNumber}`;
  const cachedData = getFromCache(cacheKey);

  if (cachedData) {
    console.log("Book info (from cache):");
    console.table([cachedData]);
    showMenu();
    return;
  }

  const catalogServer = getNextCatalogReplica();

  axios
    .get(`${catalogServer}/info/${itemNumber}`)
    .then((response) => {
      console.log("Book info:");
      console.table([response.data]);
      setCache(cacheKey, response.data);
      showMenu();
    })
    .catch((err) => {
      console.log("Error:", err.response ? err.response.data : err.message);
      showMenu();
    });
}

function purchaseBook(itemNumber) {
  const catalogServer = getNextCatalogReplica();

  axios
    .get(`${catalogServer}/info/${itemNumber}`)
    .then((response) => {
      const bookInfo = response.data;
      if (bookInfo) {
        if (bookInfo.quantity > 0) {
          const orderServer = getNextOrderReplica();
          return axios.post(`${orderServer}/purchase/${itemNumber}`);
        } else {
          console.log("The item is out of stock.");
          return Promise.reject({ response: { data: "The item is out of stock." } });
        }
      } else {
        console.log("Item not found.");
        return Promise.reject({ response: { status: 400, data: "Item not found." } });
      }
    })
    .then((response) => {
      console.log(response.data.message);

      const infoCacheKey = `info:${itemNumber}`;
      invalidateCache(infoCacheKey);

      const catalogServer = getNextCatalogReplica();
      axios.get(`${catalogServer}/info/${itemNumber}`).then((res) => {
        const bookTopic = res.data.topic;
        const searchCacheKey = `search:${bookTopic}`;
        invalidateCache(searchCacheKey);
        showMenu();
      });
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