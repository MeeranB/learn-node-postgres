# Learn Postgres with Node

This workshop covers how to connect your Node server to a Postgres database using the [`node-postgres`](https://node-postgres.com/) library.

## Setup

Before you begin make sure you have [installed Postgres](https://github.com/macintoshhelper/learn-sql/blob/master/postgresql/setup.md).

1. Clone this repo
1. Run `npm install`
1. Run `npm run dev` to start the server

The server inside `workshop/server.js` should start on http://localhost:3000. Load this in your browser to make sure everything is working—you should see "hello world".

## Creating your database

First we need to create a database. We can do this in our terminal:

```sh
createdb learn_node_postgres
```

(you can name it anything you like). We can connect to this to check it worked. Run `psql` to enter the Postgres CLI, then run:

```sh
\connect learn_node_postgres
```

Unfortunately there's nothing inside our database yet. We need to write some SQL that creates our tables and populates them with example data for us to use. We're going to create two tables: `users` and `blog_posts`. Each blog post will have a `user_id` relation pointing to whichever user wrote the post.

### Schemas

#### `users`

| column   | type         | constraints |
| -------- | ------------ | ----------- |
| id       | SERIAL       | PRIMARY KEY |
| username | VARCHAR(255) | NOT NULL    |
| age      | INTEGER      |             |
| location | VARCHAR(255) |             |

#### `blog_posts`

| column       | type    | constraints          |
| ------------ | ------- | -------------------- |
| id           | SERIAL  | PRIMARY KEY          |
| user_id      | INTEGER | REFERENCES users(id) |
| text_content | TEXT    |                      |

## Initialising your database

First we create a "transaction". This is a block of SQL that will run in order, saving the result only if everything was successful. This avoids ending up with partially updated (broken) data if the commands fail halfway through. We start a transaction with `BEGIN;` and end it with `COMMIT;`.

```sql
BEGIN;
-- our commands go in between
COMMIT;
```

This file is going to be used to set up the database from scratch whenever we run it, which means we need to delete any existing tables before we try to create them.

**Important**: this is very dangerous. If you run this on your production database you will delete all of your users' data.

```sql
BEGIN;

DROP TABLE IF EXISTS users, blog_posts CASCADE;

COMMIT;
```

Now we can create our tables from scratch using `CREATE TABLE`. We need to specify all the type information from the schema above:

```sql
BEGIN;

DROP TABLE IF EXISTS users, blog_posts CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  age INTEGER,
  location VARCHAR(255)
);

CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  text_content TEXT
);

COMMIT;
```

Finally we need to put some example data into the tables so we can experiment with the database. In a production database you probably wouldn't do this. We can use `INSERT INTO` to add data to a table:

```sql
BEGIN;

DROP TABLE IF EXISTS users, blog_posts CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  age INTEGER,
  location VARCHAR(255)
);

CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  text_content TEXT
);

INSERT INTO users (username, age, location) VALUES
  ('Sery1976', 28, 'Middlehill, UK'),
  ('Notne1991', 36, 'Sunipol, UK'),
  ('Moull1990', 41, 'Wanlip, UK'),
  ('Spont1935', 72, 'Saxilby, UK'),
  ('Precand', 19, 'Stanton, UK')
;

INSERT INTO blog_posts (text_content, user_id) VALUES
  ('Announcing of invitation principles in.', 1),
  ('Peculiar trifling absolute and wandered yet.', 2),
  ('Far stairs now coming bed oppose hunted become his.', 3),
  ('Curabitur arcu quam, imperdiet ac orci ac.', 4),
  ('Aenean blandit risus sed pellentesque.', 5)
;

COMMIT;
```

To test that this works you can run `psql` to start the Postgres CLI, then run the `init.sql` file:

```sh
\include workshop/database/init.sql
```

Your database tables should be created and populated. You can verify this by running:

```sh
\dt
```

to view the tables.

## Connecting to your database

We need to tell our Node server how to connect to our database. We'll be using [`node-postgres`](https://node-postgres.com/), which is a library for connecting to and querying a PostgreSQL database. We'll also be using `dotenv`, a library for accessing environment variables in Node.

Install both dependencies:

```sh
npm install pg dotenv
```

Create a new file `workshop/database/connect.js`. We'll put all the code related to database connection in here. That way we don't have to repeat it every time we want to send a query.

First import both libraries we just installed:

```js
const pg = require("pg");
const dotenv = require("dotenv");
```

Then load all environment variables using `dotenv`'s `config` method:

```js
const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config();
```

By default `dotenv` looks for a file named `.env` at the root of your project. Create this now. We need to set some environment variables that tell `node-postgres` how to connect to our database. It will use the Postgres defaults for most things, but we'll need to at least tell it the name of the database:

```sh
PGDATABASE=blog_workshop
```

If you created a user/password for your database or changed the port it runs on you'll need to set extra environment variables for them here. You can see [all the options](https://node-postgres.com/features/connecting#Environment%20variables) (including defaults) in the docs.

### Connections pools

We're going to create a "pool" of connections for our server to use. This is better for performance than continually connecting and disconnecting from the database. The server will reuse connections from the pool as it receives requests.

```js
const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const db = new pg.Pool();

module.exports = db;
```

We also export the pool object so we can reuse it in other files.

That's it for connecting—we can now query our database to make sure it works.

## Querying the database

We can use the `query` method of our pool object to send SQL commands to the database. It takes a SQL string as the first argument and returns a promise. This promise resolves when the query result is ready.

Open `workshop/handlers.js` and add a query to the `home` function:

```js
const db = require("./database/connection");

function home(request, response) {
  db.query("SELECT * FROM users").then(result => {
    console.log(result);
  });
  response.writeHead(200, { "content-type": "text/html" });
  response.end("<h1>Hello world</h1>");
}
```

Refresh the page and you should see a big object logged in your terminal. This is the entire result of our database query. The bit we're actually interested in is the "rows" property. This is an array of each row in the table we're selecting from. Each row is represented as an object, with a key/value entry for each column.

So if everything is working correctly you should see an array of user objects, where each object looks like this:

```js
{
  id: 1,
  username: 'Sery1976',
  age: 28,
  location: 'Middlehill, UK'
}
```

Now that we have access to the database in our server handlers we can start sending responses based on the data. Let's send back a list of all users' first names:

```js
const db = require("./database/connection");

function home(request, response) {
  db.query("SELECT * FROM users").then(result => {
    const users = result.rows;
    // create a list item for each user in the array
    const userList = users.map(user => `<li>${user.username}</li>`);
    response.writeHead(200, { "content-type": "text/html" });
    // use .join to turn the array into a string
    response.end(`<ul>${userList.join("")}</ul>`);
  });
}
```

Refresh the page and you should see an unordered list containing each user's first name.

## Updating the database

Navigate to http://localhost:3000/new-user. You should see a form with fields for each column in our user database table. It currently submits to the `/create-user` endpoint, which just logs whatever data was submitted. Try it now to see it working.

We want to use the `INSERT INTO` SQL command to create a new user inside the `createUser` handler.

### SQL injection

`node-postgres` uses something called "parameterized queries" to safely include user data in a SQL query. This allows it to protect us from "injection". This is when a malicious user enters SQL code into an input, hoping that it will get run on the server. This is one of the most common causes of major hacks, so it's important to prevent it.

You should **never** directly interpolate user input into a SQL string:

```js
// NEVER DO THIS!
db.query(`INSERT INTO users(username) VALUES(${username})`);
// someone could type `; DROP TABLE users;` into the form!
```

because that `username` value could be anything. It could be a command to delete your entire database (or worse, return confidential information to the page).

Instead we use parameterized queries: we leave placeholders in our SQL string and pass the user input separately so `node-postgres` can make sure it doesn't contain any dangerous stuff.

```js
db.query("INSERT INTO users(username) VALUES($1)", [username]);
```

We use `$1`, `$2` etc as placeholders, then pass our values in an array as the second argument to `query`. `node-postgres` will insert each value from the array into its corresponding place in the SQL command (after ensuring it doesn't contain any SQL).

Edit the `createUser` handler function to use a parameterized query to save the submitted user data in the database. Don't forget to add a `.catch` to your query promise in case something goes wrong.

## Stretch: relational data

So far we've only touched the `users` table. Create a new endpoint on your server for `/all-posts`. This route should display a list of all the posts in your database, **and the username of each post's author**.

**Hint**: You'll need to `INNER JOIN` the two tables together to get data from both tables in one query.
