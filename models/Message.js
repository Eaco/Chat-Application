var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  User: String, 
  content: String
})

var Message = mongoose.model('Message', MessageSchema);
