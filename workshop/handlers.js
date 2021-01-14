const db = require("./database/connection");

function home(request, response) {
  db.query("SELECT username FROM users").then(result => {
    const resultArr = result.rows;
    const users = resultArr.map(row => `<li>${row.username}</li>`);
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`<ul>${users.join("")}</ul>`);
  });
}

function newUser(request, response) {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`
    <form action="create-user" method="POST">
      <label for="username">Username</label>
      <input id="username" name="username">
      <label for="age">Age</label>
      <input id="age" name="age" type="number">
      <label for="location">Location</label>
      <input id="location" name="location">
      <button type="submit">Create user</button>
    </form>
  `);
}

function createUser(request, response) {
  let body = "";
  request.on("data", chunk => (body += chunk));
  request.on("end", () => {
    const searchParams = new URLSearchParams(body);
    const data = Object.fromEntries(searchParams);
    const values = [data.username, data.age, data.location];
    db.query(
      "INSERT INTO users(username, age, location) VALUES($1, $2, $3)",
      values
    )
      .then(() => {
        response.writeHead(302, { location: "/" });
        response.end();
      })
      .catch(error => {
        console.log(error);
        response.writeHead(500, { "content-type": "text/html" });
        response.end(`<h1>Something went wrong saving your data</h1>`);
      });
  });
}

module.exports = { home, newUser, createUser };
