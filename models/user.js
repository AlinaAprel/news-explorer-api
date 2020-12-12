const mongoose = require('mongoose');
const validator = require('validator');

const User = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: {
      validator(link) {
        return validator.isEmail(link);
      },
      message: 'Некорректный email',
    },
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
});

module.exports = mongoose.model('user', User);
