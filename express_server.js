const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

const generateRandomString = () => {
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    // Random number: 0, 1, or 2
    let rand = Math.floor(Math.random() * 3);
    
    if (rand === 0) {
      randomString += Math.floor(Math.random() * 9);
    } else if (rand === 1) {
      // Uppercase letters
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 65));
    } else {
      // Lowercase letters
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 97));
    }
  }

  return randomString;
};

// Tells Express app to use EJS as its templating engine
app.set("view engine", "ejs");

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.fixURL;
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  userRandomID = generateRandomString();
  
  users[userRandomID] = {
    id: userRandomID,
    email: req.body.email,
    password: req.body.password
  };

  res.cookie("user_id", userRandomID);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  //Set a cookie to username entered by user
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  //Clears the userID cookie
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  console.log(req.body);  // Log the POST request body to the console
  urlDatabase[genShortURL] = req.body.longURL;
  res.redirect(`/urls/${genShortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
