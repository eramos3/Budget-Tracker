let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_transaction');

    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    // access the new_transaction object store
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    // clear all items in your store
                    transactionObjectStore.clear();

                    alert('All saved transaction has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}
// listen for app coming back online
window.addEventListener('online', uploadTransaction);