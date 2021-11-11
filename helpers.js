const lookupEmail = (objDB, email) => {
  for (let userID in objDB) {
    if (objDB[userID].email === email) {
      return { match: true, key: userID };
    }
  }
  return { match: false, key: null };
};

module.exports = { lookupEmail }