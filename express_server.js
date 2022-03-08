const {
  lookupEmail,
  generateRandomString,
  urlsForUser,
  isNoError,
  getDate,
  isPastUniqueVisitor
} = require('./helpers');

const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

const urlDatabase = {};
const users = {};

// Override with POST having ?_method=DELETE or ?_method=PUT
app.use(methodOverride('_method'));

// Tells Express app to use EJS as its templating engine
app.set("view engine", "ejs");

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.get("/urls/new", (req, res) => {
  // If user is not logged in (no cookie)
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

app.delete("/urls/:shortURL", (req, res) => {
  const noErrors = isNoError(req, res, urlDatabase);
  
  if (noErrors) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

// To edit a URL already in the database
app.put("/urls/:shortURL", (req, res) => {
  const noErrors = isNoError(req, res, urlDatabase);
  
  if (noErrors) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.fixURL;
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const noErrors = isNoError(req, res, urlDatabase);

  if (noErrors) {
    if (urlDatabase[req.params.shortURL].visitCount === undefined) {
      urlDatabase[req.params.shortURL].visitCount = 0;
      urlDatabase[req.params.shortURL].uniqueVisitors = [];
      urlDatabase[req.params.shortURL].visitors = [];
      urlDatabase[req.params.shortURL].visitTimes = [];
    }

    const uniqueVisitorCount = urlDatabase[req.params.shortURL].uniqueVisitors.length;

    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      visitCount: urlDatabase[req.params.shortURL].visitCount,
      uniqueVisitorCount: uniqueVisitorCount,
      visitors: urlDatabase[req.params.shortURL].visitors,
      visitTimes: urlDatabase[req.params.shortURL].visitTimes,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }
});

// To redirect to long URL by using the short URL
app.get("/u/:shortURL", (req, res) => {
  let urlMatch = false;
  
  for (let sURL in urlDatabase) {
    if (req.params.shortURL === sURL) {
      urlMatch = true;
    }
  }

  if (urlMatch === false) {
    res.status(404).send('Not Found');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    const userMatch = isPastUniqueVisitor(urlDatabase, req.params.shortURL, req.session.visitor_id);
    const date = getDate();

    if (!req.session.user_id && !req.session.visitor_id) {
      req.session.visitor_id = generateRandomString();
    } else if (req.session.user_id) {
      req.session.visitor_id = req.session.user_id;
    }
  
    res.redirect(longURL);
    urlDatabase[req.params.shortURL].visitCount++;
    
    if (userMatch === false) {
      urlDatabase[req.params.shortURL].uniqueVisitors.push(req.session.visitor_id);
    }

    urlDatabase[req.params.shortURL].visitors.push(req.session.visitor_id);
    urlDatabase[req.params.shortURL].visitTimes.push(date);
  }
});

app.get("/register", (req, res) => {
  // If user is logged in (cookie present)
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("register", templateVars);
  }
});

// To save the new user information including hashed password in the users database
app.post("/register", (req, res) => {
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
  // If user is logged in (cookie present)
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("login", templateVars);
  }
});

// To set the hashed user_id cookie if login was successful
app.post("/login", (req, res) => {
  const { match, key } = lookupEmail(users, req.body.email);
  
  if (match === false) {
    res.status(403).send('Forbidden: Account does not exist');
  } else {
    bcrypt.compare(req.body.password, users[key].password, (err, result) => {
      if (err) {
        res.send('Error messsage: ', err);
      } else if (result) {
        req.session.user_id = key;
        res.redirect('/urls');
      } else {
        res.status(403).send('Forbidden: Incorrect password');
      }
    });
  }
});

// To delete the user_id cookie upon logout
app.put("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id, urlDatabase);
  
  const templateVars = {
    urls: filteredDB,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

// To generate a short URL for newly added long URL
app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  urlDatabase[genShortURL] = {};
  urlDatabase[genShortURL].longURL = req.body.longURL;
  urlDatabase[genShortURL].userID = req.session.user_id;
  res.redirect(`/urls/${genShortURL}`);
});

app.get("/", (req, res) => {
  // If user is not logged in (no cookie)
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});