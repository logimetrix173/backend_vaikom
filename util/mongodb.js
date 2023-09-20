// db.js
console.log("moongoose connection ")
// Connection URL
const url = 'mongodb://admin:dms1234@10.10.0.60:27017';
// mongodb.js
const mongoose = require('mongoose');
// const url = "mongodb://localhost:27017/local"; // Replace with your MongoDB connection URL

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

module.exports = mongoose;

