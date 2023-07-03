const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../modules/http-error');
const Session = require('../modules/session');
const fuzzy = require('fuzzy');
const User = require('../modules/user');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dcrcc9b4h',
  api_key: '638351652727691',
  api_secret: 'pjMWR4xBh2svNScZ_vFg5pyidH0',
});

class SessionController {



  static getSessionById = async (req, res, next) => {

    const sID = req.params.sid;
    let session;
    try {
      session = await Session.findById(sID);
    } catch (err) {
      const error = new HttpError('Could not retrieve data', 500);
      return next(error);
    }
    if (!session) {
      return next(new HttpError('Could not find a session for the provided ID.', 404));
    }
    res.json({ session: session.toObject({ getters: true }) });

  }



  // ................................................................................................//

  static getRequestedSessionByTopic = async (req, res, next) => {
    const keyword = req.params.keyword.toLowerCase();

    try {
      const sessions = await Session.find();

      // Perform fuzzy matching
      const options = { extract: session => session.topic.toLowerCase() };
      const results = fuzzy.filter(keyword, sessions, options);

      const matchedSessions = results
        .map(result => result.original)
        .filter(session => {
          //if session is being requested
          if (!session.isRequesting) {
            return false;
          }

          const sessionTopic = session.topic.toLowerCase();

          // Modify the fuzzy matching threshold here (0.4 represents 40% similarity)
          const matchThreshold = 0.3;

          // Check if all characters in the keyword are present in the session topic
          const keywordChars = Array.from(keyword);
          const hasAllChars = keywordChars.every(char => sessionTopic.includes(char));

          // Calculate the match percentage based on keyword length and session topic length
          const matchPercentage = keyword.length / sessionTopic.length;

          return hasAllChars && matchPercentage >= matchThreshold;
        });

      if (matchedSessions.length === 0) {
        return next(new HttpError('No request made for that topic', 404));
      }

      res.json(matchedSessions);
    } catch (err) {
      const error = new HttpError('Could not retrieve sessions.', 500);
      return next(error);
    }
  }

  //
  //
  static getSessionByTopic = async (req, res, next) => {
    const keyword = req.params.keyword.toLowerCase();
    try {
      const sessions = await Session.find();
      // Perform fuzzy matching
      const options = { extract: session => session.topic.toLowerCase() };
      const results = fuzzy.filter(keyword, sessions, options);

      const matchedSessions = results
        .map(result => result.original)
        .filter(session => {
          if (session.isRequesting == true) {
            return null;
          }
          const sessionTopic = session.topic.toLowerCase();
          // Modify the fuzzy matching threshold here (0.4 represents 40% similarity)
          const matchThreshold = 0.2;
          // Check if all characters in the keyword are present in the session topic
          const keywordChars = Array.from(keyword);
          const hasAllChars = keywordChars.every(char => sessionTopic.includes(char));
          // Calculate the match percentage based on keyword length and session topic length
          const matchPercentage = keyword.length / sessionTopic.length;
          return hasAllChars && matchPercentage >= matchThreshold;
        });
      if (matchedSessions.length === 0) {
        return next(new HttpError('Could not find any matching sessions for the provided keyword.', 404));
      }
      res.json(matchedSessions);
    } catch (err) {
      const error = new HttpError('Could not retrieve sessions.', 500);
      return next(error);
    }
  }

  // ...
  // ................................................................................................//


  static createSession = async (req, res, next) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return next(new HttpError('Invalid input provided.', 422));
    // }
    const { topic,  image } = req.body;
    const createdSession = new Session({
      topic,
      image,
      users: [req.userData.userID], // Place req.userID as the first element in the array
      isRequesting: true,
    });

    try {
      const data = await createdSession.save();
      res.status(201).json(data);
    } catch (err) {

      const error = new HttpError('Cannot create session', 500);
      return next(error);
    }


  }


  // ................................................................................................//

  // ...
  static updatePublicSession = async (req, res, next) => {

    const sessionID = req.params.sid;
    let session;
    try {
      session = await Session.findById(sessionID);
    } catch (err) {
      const error = new HttpError('Could not retrieve session.', 500);
      return next(error);
    }
    if (!session) {
      return next(new HttpError('No session found with the provided ID.', 404));
    }
    session.isRequesting = !session.isRequesting;
    try {
      await session.save();
    }
    catch (err) {
      const error = new HttpError('Could not update session.', 500);
      return next(error);
    }
    res.status(200).json(session);
  }

  static updateSession = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError('Invalid input provided.', 422));
    }

    const { joining, newUserId } = req.body;
    const sessionID = req.params.sid;
    let session;
    try {
      session = await Session.findById(sessionID);
    } catch (err) {
      const error = new HttpError('Could not retrieve session.', 500);
      return next(error);
    }

    if (!session) {
      return next(new HttpError('No session found with the provided ID.', 404));
    }

    if (joining && !session.users.includes(newUserId)) {
      session.users.push(newUserId); // Use newUserId variable
    } else if (!joining) {
      session.users = session.users.filter(user => user != newUserId); // Use a different parameter name in the filter function
    }

    try {
      await session.save();
    } catch (err) {
      const error = new HttpError('Could not update session.', 500);
      return next(error);
    }

    res.status(200).json(session);
  }




  // ................................................................................................//

  static deleteSession = async (req, res, next) => {

  
    const sessionID = req.params.sid;
 
    try {
      const sess = await Session.findById(sessionID);
      if (req.userData.userID != sess.users[0]){
        const error = new HttpError("No admin access" , 401);
        return next(error);
      }
      if (sess.image && sess.image.id) {
        await cloudinary.uploader.destroy(sess.image.id);
      }
    
      const session = await Session.findByIdAndDelete(sessionID);
      if (!session) {
        return next(new HttpError('Could not find a session for the provided ID.', 404));
      }
      res.status(200).json({ message: 'Session deleted successfully.' });
    } catch (err) {
      const error = new HttpError('Could not delete session.', 500);
      return next(error);
    }
  }
}

module.exports = SessionController;
