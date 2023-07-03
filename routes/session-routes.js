const express = require('express');
const router = express.Router();
const sessionController = require('../controller/session');
const { check } = require('express-validator')
const checkAuth = require('../middleware/check-auth');
const session = require('../modules/session');
router.get('/:sid', sessionController.getSessionById);
//
router.get('/topic/:keyword', sessionController.getSessionByTopic);
router.get('/topic/request/:keyword', sessionController.getRequestedSessionByTopic);

router.use(checkAuth);

// new Session

router.post('/',  sessionController.createSession);

//🤞✌️🤞✌️🤞✌️🤞✌️
router.patch('/:sid'
    , sessionController.updateSession);

router.patch('/public/:sid'
    , sessionController.updatePublicSession);

//⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
router.delete('/:sid', sessionController.deleteSession);


module.exports = router;
