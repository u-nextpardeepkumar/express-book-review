const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const axios = require('axios');
const public_users = express.Router();

// Check if a user with the given username already exists
const doesExist = (username) => {
  // Filter the users array for any user with the same username
  let userswithsamename = users.filter((user) => {
      return user.username === username;
  });
  // Return true if any user with the same username is found, otherwise false
  if (userswithsamename.length > 0) {
      return true;
  } else {
      return false;
  }
}

public_users.post("/register", (req,res) => {
  const username = req.body.username;
    const password = req.body.password;

    // Check if both username and password are provided
    if (username && password) {
        // Check if the user does not already exist
        if (!doesExist(username)) {
            // Add the new user to the users array
            users.push({"username": username, "password": password});
            return res.status(200).json({message: "User successfully registered. Now you can login"});
        } else {
            return res.status(404).json({message: "User already exists!"});
        }
    }
    // Return error if username or password is missing
    return res.status(404).json({message: "Unable to register user."});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  //Write your code here
  return res.status(200).json(books);
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  let book = books[isbn];
  if (typeof book !== 'undefined') {
    res.status(200).json(book);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  const mBooks = [];
  
  for (let isbn in books) {
    if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
      mBooks.push({ isbn: isbn, ...books[isbn] });
    }
  }

  if (mBooks.length > 0) {
    res.status(200).json(mBooks);
  } else {
    res.status(404).json({ message: "No books found for the specified author" });
  }
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  const mBooks = [];
  
  for (let isbn in books) {
    if (books[isbn].title.toLowerCase() === title.toLowerCase()) {
      mBooks.push({ isbn: isbn, ...books[isbn] });
    }
  }

  if (mBooks.length > 0) {
    res.status(200).json(mBooks);
  } else {
    res.status(404).json({ message: "No books found for the specified title" });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  let book = books[isbn];
  if (typeof book === 'undefined') {
    res.status(404).json({ message: "Book not found" });
  } else {
    if (Object.keys(book.reviews).length === 0) {
      res.status(200).json({ message: "There are no review yet"});
    } else {
      res.status(200).json(book.reviews);
    }
  }
});

public_users.get('/books-async',function (req, res) {
  getBooksAsync(req,res);
});

public_users.get('/books-detail/:isbn',function (req, res) {
  getBooksDetail(req,res);
});

// Get list of books using async/await
async function getBooksAsync(req, res) {
  try {
    const response = await axios.get('http://localhost:5002/');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).json({ message: "Books not found" });
  }
}

// Get list of books using async/await
async function getBooksDetail(req, res) {
  try {
    const isbn = req.params.isbn;
    const response = await axios.get('http://localhost:5002/isbn/'+isbn);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).json({ message: "Book not found" });
  }
}


const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get('http://localhost:5002/author/'+author);
    const books = response.data;
    return {books};
  } catch (error) {
    if(error.response.data.message === ""){
      throw new Error('Error fetching books: ' + error.message);
    } else {
      return { message: error.response.data.message };
    }
  }
};

public_users.get('/author-promise/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const books = await getBooksByAuthor(author);
    if(books.message === 'No books found for the specified author'){
      res.status(404).json({ message: 'No books found for this author.' });
    } else if (Object.keys(books).length !== 0) {
      res.status(200).json(books);
    } else {
      res.status(404).json({ message: 'No books found for this author.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get('http://localhost:5002/title/'+title);
    const books = response.data;
    return {books};
  } catch (error) {
    if(error.response.data.message === ""){
      throw new Error('Error fetching books: ' + error.message);
    } else {
      return { message: error.response.data.message };
    }
  }
};

public_users.get('/title-promise/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const books = await getBooksByTitle(title);
    if(books.message === 'No books found for the specified title'){
      res.status(404).json({ message: 'No books found for this title.' });
    } else if (Object.keys(books).length !== 0) {
      res.status(200).json(books);
    } else {
      res.status(404).json({ message: 'No books found for this title.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports.general = public_users;
