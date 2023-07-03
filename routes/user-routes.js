const express = require('express');
const router = express.Router();
const userController = require('../controller/user');
const {check}= require('express-validator');
const Session = require('../modules/session');
const session = require('../modules/session');


router.get('/',userController.getUsers);
router.get('/:uid',userController.getUsersById);

router.post('/signup',
[
check('name').not().isEmpty(),
check('email').normalizeEmail().isEmail(),
check('password').matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,32})/)
]
,userController.signup)
router.post('/login',userController.login)

router.post('/xyz/abc/',async (req,res) => {
    try {
        //topic here is SessionID
        const { topic } = req.body;
        
        
        if (!topic)
            throw new Error("TOPIC REQUIRED");
      
        const allsessions = await Session.findById(topic).populate([
            {
                path: 'users',
                select: 'name'
            }
        ]);
         res.json({ status:true, allsessions });

    } catch (error) {

        return res.json({ status: false, message: error.message });

    }

});
module.exports = router;
