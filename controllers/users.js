const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { NODE_ENV, JWT_SECRET } = process.env;

const BadRequestError = require('../errors/bad-request-err');
const NotFoundError = require('../errors/not-found-err');
const UnauthorizedError = require('../errors/unauthorized-err');
const ConflictError = require('../errors/conflict-err');

const User = require('../models/user');

module.exports.getUser = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(new Error('NotFound', 'CastError'))
    .then((user) => {
      res.send({ data: user });
    })
    .catch((err) => {
      if (err.message === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные');
      }
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
      }
    })
    .catch((err) => next(err));
};

module.exports.createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;

  if (password === undefined) {
    throw new BadRequestError('Введите пароль!');
  }
  const userpassword = password.replace(/\s/g, '');
  if (userpassword.length < 6) {
    throw new BadRequestError('Пароль меньше 6 символов');
  }

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    }))
    .then(() => {
      res.send({
        data: {
          name, email,
        },
      });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Переданы некорректные данные');
      }
      next(err);
      if (err.name === 'MongoError' && err.code === 11000) {
        throw new ConflictError('Пользователь уже зарегистрирован');
      }
      next(err);
    })
    .catch((err) => next(err));
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError('Неправильные почта или пароль');
      }
      return bcrypt.compare(password, user.password)
        .then((match) => {
          if (!match) {
            throw new UnauthorizedError('Неправильные пароль или почта');
          }
          const token = jwt.sign(
            { _id: user._id },
            NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' },
          );
          return res.send({ token });
        });
    })
    .catch((err) => next(err));
};
