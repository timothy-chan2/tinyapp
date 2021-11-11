const { assert } = require('chai');

const { lookupEmail } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('lookupEmail', function() {
  it("should return that a match was found & the user's random ID with a valid email", function() {
    const user = lookupEmail(testUsers, "user@example.com");
    const expectedUserID = { match: true, key: "userRandomID" };
    assert.deepEqual(user, expectedUserID);
  });

  it("should return that a match was not found & the user's random ID is null with a non-existent email", function() {
    const user = lookupEmail(testUsers, "not@example.com");
    const expectedUserID = { match: false, key: null };
    assert.deepEqual(user, expectedUserID);
  });
});
