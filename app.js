//
require('dotenv').config();

const express = require('express');
const { celebrate, Joi, errors } = require('celebrate');

const PORT = 3000;
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { createUser, login } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const NotFound = require('./errors/not-found-err');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/newsdb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
})
  .then(() => console.log('Mongo has started'))
  .catch((err) => console.log(err));

app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().required().pattern(/^([\w-]\.?)+@([\w-]+\.)+[\w-]+/),
    password: Joi.string().min(6).pattern(/\S+/),
  }),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    email: Joi.string().required().pattern(/^([\w-]\.?)+@([\w-]+\.)+[\w-]+/),
    password: Joi.string().min(6).pattern(/\S+/),
  }),
}), createUser);

app.use(auth);

app.use('/articles', require('./routes/article'));
app.use('/users/me', require('./routes/user'));

app.use(errorLogger);
app.use(errors());

app.use((err, req, res, next) => {
  if (err.statusCode === undefined) {
    res.status(500).send({ message: `На сервере произошла ошибка ${err}` });
  } else {
    res.status(err.statusCode).send({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

app.use('/', (req, res, next) => {
  res.status(404).json({ message: 'Запрашиваемый ресурс не найден' });
});
