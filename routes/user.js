const routerUser = require('express').Router();
const { getUser } = require('../controllers/users');

routerUser.get('/', getUser);

module.exports = routerUser;
