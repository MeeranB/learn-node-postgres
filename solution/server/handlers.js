const db = require("./database/connection");

function home(request, response) {
  db.query(`SELECT * FROM users;`).then(res => {
    const users = res.rows;
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`
    <h1>Users</h1>
    <ul>
      ${users
        .map(
          user => `
        <li>
          ${user.first_name} ${user.last_name}, ${user.location}
        </li>
      `
        )
        .join("")}
    </ul>
    `);
    db.end();
  });
}

module.exports = { home };
