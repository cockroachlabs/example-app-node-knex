This repo contains a simple Node.js CRUD app that uses [Knex.js](https://knexjs.org/) and the [node-postgres](https://node-postgres.com/) driver to talk to a CockroachDB cluster.

To run the code:

1. Start a [CockroachDB cluster](https://www.cockroachlabs.com/docs/stable/cockroach-start-single-node.html) from the command line: `cockroach start-single-node --insecure`

1. Create a database named `bank` from the [SQL client](https://www.cockroachlabs.com/docs/stable/cockroach-sql.html):

   ```sql
   > CREATE DATABASE bank;
   ```

1. In your terminal, from the top of this project directory:

   ```shell
   $ npm install
   $ npm run run
   ```
