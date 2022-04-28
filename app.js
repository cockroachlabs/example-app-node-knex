import Knex from "knex";

const config = {
  client: "cockroachdb",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "migration/migrations",
  },
  seeds: {
    directory: "migration/seeds",
  },
}

// Connect to database
const client = Knex(config);

let accountValues;

function logRows(rows) {
  if (rows.length > 0) {
    console.log("New account balances:");
    rows.forEach((row) => {
      console.log(row);
    });
  }
}

// Wrapper for a transaction.  This automatically re-calls the operation with
// the client as an argument as long as the database server asks for
// the transaction to be retried.
async function retryTxn(n, max, client, operation) {
  const transactionProvider = client.transactionProvider();
  const transaction = await transactionProvider();
  while (true) {
    n++;
    if (n === max) {
      throw new Error("Max retry count reached.");
    }
    try {
      await operation(client, transaction);
      await transaction.commit();
      return;
    } catch (err) {
      if (err.code !== "40001") {
        console.error(err.message);
        throw err;
      } else {
        console.log("Transaction failed. Retrying transaction.");
        console.log(err.message);
        await transaction.rollback();
        await new Promise((r) => setTimeout(r, 2 ** n * 1000));
      }
    }
  }
}

// This function is called within the first transaction. It inserts some initial values into the "accounts" table.
async function initTable(client) {
  await client.migrate.latest();
  await client.seed.run();

  const insertedValues = await client("accounts")
    .select(["id", "balance"])
    .orderBy("balance", "desc");
  logRows(insertedValues);

  accountValues = insertedValues;
}

// This function updates the values of two rows, simulating a "transfer" of funds.
async function transferFunds(client, transaction) {
  const from = accountValues[0].id;
  const to = accountValues[1].id;
  const amount = 100;

  const rows = await client("accounts")
    .transacting(transaction)
    .select("balance")
    .where({
      id: from,
    });

  const acctBal = rows[0].balance;
  if (acctBal < amount) {
    console.error(`insufficient funds for account ${from}`);
  }

  await client("accounts")
    .transacting(transaction)
    .update({
      balance: client.raw(`balance - ${amount}`),
    })
    .where({
      id: from,
    });

  await client("accounts")
    .transacting(transaction)
    .update({
      balance: client.raw(`balance + ${amount}`),
    })
    .where({
      id: to,
    });

  const insertedValues = await client("accounts")
    .transacting(transaction)
    .select(["id", "balance"])
    .orderBy("balance", "desc");
  logRows(insertedValues);

  accountValues = insertedValues;
}

// This function deletes the third row in the accounts table.
async function deleteAccounts(client, transaction) {
  await client("accounts").transacting(transaction).delete().where({
    id: accountValues[1].id,
  });

  const insertedValues = await client("accounts")
    .transacting(transaction)
    .select(["id", "balance"])
    .orderBy("balance", "desc");
  logRows(insertedValues);

  accountValues = insertedValues;
}

// Run the transactions in the connection pool
(async () => {
  // Initialize table in transaction retry wrapper
  console.log("Initializing accounts table...");
  await initTable(client);

  // Transfer funds in transaction retry wrapper
  console.log("Transferring funds...");
  await retryTxn(0, 15, client, transferFunds);

  // Delete a row in transaction retry wrapper
  console.log("Deleting a row...");
  await retryTxn(0, 15, client, deleteAccounts);

  // Exit program
  process.exit();
})().catch((err) => console.log(err.stack));
