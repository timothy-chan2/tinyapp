const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {};
  /*"b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }*/


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

const lookupEmail = (objDB, email) => {
  for (let userID in objDB) {
    if (objDB[userID].email === email) {
      return { match: true, key: userID };
    }
  }
  return { match: false, key: null };
};

const urlsForUser = (id) => {
  let filteredUrlDB = {};

  for (let urlID in urlDatabase) {
    if (id === urlDatabase[urlID].userID) {
      filteredUrlDB[urlID] = urlDatabase[urlID];
    }
  }
  return filteredUrlDB;
};

// Tells Express app to use EJS as its templating engine
app.set("view engine", "ejs");

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/urls/new", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.status(401);
    res.redirect("/login");
  } else{
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL/delete", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"]);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    res.send('Please use the Delete button at /urls to delete the short URL');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"]);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL/edit", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"]);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    res.send('Please use the Edit button at /urls to go to the edit page');
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"]);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    const shortURL = req.params.shortURL;
    filteredDB[shortURL].longURL = req.body.fixURL;
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"])
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: filteredDB[req.params.shortURL].longURL,
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let match = false;
  
  for (let sURL in urlDatabase) {
    if (req.params.shortURL === sURL) {
      match = true;
    }
  }

  if (match === false) {
    res.status(404).send('Not Found');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
  
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  // Registration error if unfilled field or email already exists in DB
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('Bad Request: Missing email or password');
  } else if (lookupEmail(users, req.body.email).match === true) {
    res.status(400).send('Bad Request: Account already exists');
  } else {
    const userRandomID = generateRandomString();
    
    users[userRandomID] = {
      id: userRandomID,
      email: req.body.email,
      password: req.body.password
    };

    res.cookie("user_id", userRandomID);
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { match, key } = lookupEmail(users, req.body.email);
  
  if (match === false) {
    res.status(403).send('Forbidden: Account does not exist');
  } else if (users[key].password !== req.body.password) {
    res.status(403).send('Forbidden: Incorrect password');
  } else {
    //Set a cookie to generated userID
    res.cookie("user_id", key);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  //Clears the userID cookie
  res.clearCookie("user_id");
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const filteredDB = urlsForUser(req.cookies["user_id"])
  
  const templateVars = {
    urls: filteredDB,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  console.log(req.body);  // Log the POST request body to the console
  urlDatabase[genShortURL] = {};
  urlDatabase[genShortURL].longURL = req.body.longURL;
  urlDatabase[genShortURL].userID = req.cookies["user_id"];
  console.log(urlDatabase); // Just to see what it looks like
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
