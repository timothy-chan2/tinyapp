const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  let shortURL = "";

  for (let i = 0; i < 6; i++) {
    // Random number: 0, 1, or 2
    let rand = Math.floor(Math.random() * 3);
    
    if (rand === 0) {
      shortURL += Math.floor(Math.random() * 9);
    } else if (rand === 1) {
      // Uppercase letters
      shortURL += String.fromCharCode(Math.floor((Math.random() * 26) + 65));
    } else {
      // Lowercase letters
      shortURL += String.fromCharCode(Math.floor((Math.random() * 26) + 97));
    }  
  }

  return shortURL;
};

// Tells Express app to use EJS as its templating engine
app.set("view engine", "ejs");

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  console.log(req.body);  // Log the POST request body to the console
  urlDatabase[genShortURL] = req.body.longURL;
  res.redirect(`/urls/${genShortURL}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
