const lookupEmail = (objDB, email) => {
  for (let userID in objDB) {
    if (objDB[userID].email === email) {
      return { match: true, key: userID };
    }
  }
  return { match: false, key: null };
};

const generateRandomString = () => {
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    // Generate a random integer number: 0, 1, or 2
    let rand = Math.floor(Math.random() * 3);
    
    if (rand === 0) {
      // Add a random number
      randomString += Math.floor(Math.random() * 9);
    } else if (rand === 1) {
      // Add a random uppercase letter
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 65));
    } else {
      // Add a random lowercase letter
      randomString += String.fromCharCode(Math.floor((Math.random() * 26) + 97));
    }
  }
  return randomString;
};

// Returns a filtered database with only the entries of the signed in user
const urlsForUser = (id, urlDatabase) => {
  let filteredUrlDB = {};

  for (let urlID in urlDatabase) {
    if (id === urlDatabase[urlID].userID) {
      filteredUrlDB[urlID] = urlDatabase[urlID];
    }
  }
  return filteredUrlDB;
};

// Uses the filtered database to determine which error message to show the user or if user is allowed to access then return true
const showErrorMessage = (req, res, urlDatabase) => {
  const filteredDB = urlsForUser(req.session.user_id, urlDatabase);
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send('Bad Request: Short URL does not exist');
  } else if (filteredDB[req.params.shortURL] === undefined) {
    res.status(403).send('Forbidden: Short URL belongs to another user or you are not signed in');
  } else {
    return true;
  }
};

const getDate = () => {
  //Get unixtimestamp
  const current_timestamp = new Date().getTime();
  
  // Convert to DateTime
  const date = new Date(current_timestamp);

  return date;
};

const isUniqueVisitor = (urlDatabase, shortURL, visitorId) => {
  let userMatch = false;

  for (const user of urlDatabase[shortURL].uniqueVisitors) {
    if (visitorId === user) {
      userMatch = true;
    }
  }
  return userMatch;
};

module.exports = {
  lookupEmail,
  generateRandomString,
  urlsForUser,
  showErrorMessage,
  getDate,
  isUniqueVisitor
};