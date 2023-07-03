const { v4: uuid } = require('uuid');
const HttpError = require('../modules/http-error');
const { validationResult } = require('express-validator')
const User = require('../modules/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserController {



  static getUsers = async (req, res, next) => {
    let users;
    try {
      users = await User.find({}, '-password');
    } catch (err) {
      const error = new HttpError('Fetching failed, please try again later', 500);
      return next(error);
    }
    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
  }

  static getUsersById = async (req, res, next) => {
    const uID = req.params.uid;

    let existingUser;
    try {
      existingUser = await User.findById(uID);
    } catch (err) {
      const error = new HttpError('Fetching user failed, please try again later', 500);
      return next(error);
    }

    if (!existingUser) {
      const error = new HttpError('No such user exists', 422);
      return next(error);
    }
    res.json({ message: "Logged in", user: existingUser.toObject({ getters: true }) });

  };

  //🖋️🖋️🖋️🖋️🖋️🖋️🖋️🖋️
  //🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

  static signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Requirement not met", 422));
    }
    const { name, email, password, DOB } = req.body;
    let existingUser;
    try {
      existingUser = await User.findOne({ email: email })
    } catch (err) {
      const error = new HttpError('Signing up failed , please try again letter', 500)
      return next(error);
    }
    if (existingUser) {
      const error = new HttpError('User Already Exists ', 422);
      return next(error);
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      return next(new HttpError('Can not create User please trya again', 500));
    }
    const createdUser = new User({
      name, email,
      image: 'https://bracketfights.com/images/templates/2019/18399/random-male-anime-character-badass-husbando--18399/74cc22e844154ee6af22bed92034b524jpg.png'
      , password: hashedPassword
      , DOB
    })
    try {
      await createdUser.save()
    } catch (err) {
      const error = new HttpError('Try again later', 500);
      return next(error);
    }
    let token;
    try {
      token = jwt.sign({
        userID: createdUser.id,
        email: createdUser.email
      }, process.env.JWT_KEY, {
        expiresIn: '24h'
      });
    }
    catch (err) {
      const error = new HttpError('Try again later', 500);
      return next(error);
    }
    req.session.userID = createdUser._id.toString();
    res.json({
      message: 'Logged in',
      user: {...createdUser.toObject({ getters: true }), password: undefined },
      token: token
    });
  }

  //🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
  //🤖🤖🤖🤖🤖🤖🤖🤖🤖
  static login = async (req, res, next) => {
    const { email, password } = req.body;
    let existingUser;
    try {
      existingUser = await User.findOne({ email: email });
    } catch (err) {
      const error = new HttpError('Logging in failed, please try again later', 500);
      return next(error);
    }

    if (!existingUser) {
      const error = new HttpError('Invalid Credentials', 401);
      return next(error);
    }

    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
      const err = new HttpError('Please try again', 500);
      return next(err);
    }
    if (!isValidPassword) {
      const error = new HttpError('Invalid Credentials', 401);
      return next(error);
    }
    let token;
    try {
      token = jwt.sign({
        userID: existingUser.id,
        email: existingUser.email
      }, process.env.JWT_KEY, {
        expiresIn: '24h'
      });
    }
    catch (err) {
      const error = new HttpError('Try again later', 500);
      return next(error);
    }
    req.session.userID = existingUser._id.toString();
    res.json({
      message: 'Logged in',
      user: { ...existingUser.toObject({ getters: true }), password: undefined },
      token: token
    });
  };
}
module.exports = UserController;