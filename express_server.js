const { lookupEmail } = require('./helpers');

const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

const urlDatabase = {};
const users = {};

const generateRandomString = () => {
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    // Generate a random integer number: 0, 1, or 2
    let rand = Math.floor(Math.random() * 3);
    
    if (rand === 0) {
      randomString += Math.floor(Math.random() * 9);
    } else if (rand === 1) {
      // Add a random uppercase letters
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 65));
    } else {
      // Add a random lowercase letters
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 97));
    }
  }
  return randomString;
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

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.get("/urls/new", (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(401);
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL/delete", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    res.send('Please use the Delete button at /urls to delete the short URL');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id);
  
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
  const filteredDB = urlsForUser(req.session.user_id);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    res.send('Please use the Edit button at /urls to go to the edit page');
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id);
  
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
  const filteredDB = urlsForUser(req.session.user_id);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: filteredDB[req.params.shortURL].longURL,
      user: users[req.session.user_id]
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
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  // Registration errors
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send('Bad Request: Missing email or password');
  } else if (lookupEmail(users, req.body.email).match === true) {
    res.status(400).send('Bad Request: Account already exists');
  } else {
    const userRandomID = generateRandomString();
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        res.send('Error messsage: ', err);
      } else {
        users[userRandomID] = {
          id: userRandomID,
          email: req.body.email,
          password: hash
        };

        req.session.user_id = userRandomID;
        res.redirect('/urls');
      }
    });
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { match, key } = lookupEmail(users, req.body.email);
  
  if (match === false) {
    res.status(403).send('Forbidden: Account does not exist');
  } else {
    bcrypt.compare(req.body.password, users[key].password, (err, result) => {
      if (err) {
        res.send('Error messsage: ', err);
      } else if (result) {
        //Set a cookie to generated userID
        req.session.user_id = key;
        res.redirect('/urls');
      } else {
        res.status(403).send('Forbidden: Incorrect password');
      }
    });
  }
});

app.post("/logout", (req, res) => {
  //Clears the user_id cookie
  req.session = null;
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id);
  
  const templateVars = {
    urls: filteredDB,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  urlDatabase[genShortURL] = {};
  urlDatabase[genShortURL].longURL = req.body.longURL;
  urlDatabase[genShortURL].userID = req.session.user_id;
  res.redirect(`/urls/${genShortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
