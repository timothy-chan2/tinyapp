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

const urlsForUser = (id, urlDatabase) => {
  let filteredUrlDB = {};

  for (let urlID in urlDatabase) {
    if (id === urlDatabase[urlID].userID) {
      filteredUrlDB[urlID] = urlDatabase[urlID];
    }
  }
  return filteredUrlDB;
};

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

module.exports = {
  lookupEmail,
  generateRandomString,
  urlsForUser,
  showErrorMessage
};