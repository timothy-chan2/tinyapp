const { lookupEmail, generateRandomString, urlsForUser, showErrorMessage } = require('./helpers');

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

// To add new entry for URL
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

// To delete entries using the Delete button
app.delete("/urls/:shortURL", (req, res) => {
  const noErrors = showErrorMessage(req, res, urlDatabase);
  
  if (noErrors) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

// To edit a URL using the Edit button
app.put("/urls/:shortURL", (req, res) => {
  const noErrors = showErrorMessage(req, res, urlDatabase);
  
  if (noErrors) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.fixURL;
    res.redirect("/urls");
  }
});

// To display the page where a user can view & edit their previously created URL
app.get("/urls/:shortURL", (req, res) => {
  const noErrors = showErrorMessage(req, res, urlDatabase);
  let uniqueVisitorCount;

  if (noErrors) {
    if (urlDatabase[req.params.shortURL].visitCount === undefined) {
      urlDatabase[req.params.shortURL].visitCount = 0;
      urlDatabase[req.params.shortURL].visitors = [];
    }

    uniqueVisitorCount = urlDatabase[req.params.shortURL].visitors.length;

    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      visitCount: urlDatabase[req.params.shortURL].visitCount,
      uniqueVisitorCount: uniqueVisitorCount,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }
});

// To redirect to long URL by using the short URL
app.get("/u/:shortURL", (req, res) => {
  let urlMatch = false;
  let userMatch = false;
  
  for (let sURL in urlDatabase) {
    if (req.params.shortURL === sURL) {
      urlMatch = true;
    }
  }

  if (urlMatch === false) {
    res.status(404).send('Not Found');
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    
    if (!req.session.user_id && !req.session.visitor_id) {
      req.session.visitor_id = generateRandomString();
    } else if (req.session.user_id) {
      req.session.visitor_id = req.session.user_id;
    }
  
    res.redirect(longURL);
    urlDatabase[req.params.shortURL].visitCount++;
    
    const updateVisitorLog = () => {
      for (const user of urlDatabase[req.params.shortURL].visitors) {
        if (req.session.visitor_id === user) {
          userMatch = true;
        }
      }
    
      if (userMatch === false) {
        urlDatabase[req.params.shortURL].visitors.push(req.session.visitor_id);
      }
    }

    updateVisitorLog();
  }
});

// To display the account registration page
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

// To save the new user information including hashed password in the users object then redirect to main page
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

// To display the account login page
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
        //Set a cookie to generated userID
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
  //Clears the user_id cookie
  req.session = null;
  res.redirect('/urls');
});

// To display the main page with all the user's created short URLs
app.get("/urls", (req, res) => {
  const filteredDB = urlsForUser(req.session.user_id, urlDatabase);
  
  const templateVars = {
    urls: filteredDB,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

// To generate a short URL for newly added long URL and associate it with the user_id
app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();

  urlDatabase[genShortURL] = {};
  urlDatabase[genShortURL].longURL = req.body.longURL;
  urlDatabase[genShortURL].userID = req.session.user_id;
  res.redirect(`/urls/${genShortURL}`);
});

// The root endpoint redirects to the login page if not signed in and the main page if signed in
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
