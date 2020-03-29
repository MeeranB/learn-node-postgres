function home(request, response) {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`<h1>Hello world</h1>`);
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
    console.log(data); // e.g. { username: "oli", ... }
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`<h1>Thanks for submitting</h1>`);
  });
}

module.exports = { home, newUser, createUser };
