const HttpError = require("../modules/http-error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    if(req.method == 'OPTIONS'){
        return next(); 
    }
    try {
        const token = req.headers.authorization.split(' ')[1];
        
        if (!token) {
            const error = new HttpError("Authentication Failure!", 401);
            return next(error);
        }

        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    
        req.userData = { userID: decodedToken.userID};
        next();
    } catch (err) {
        const error = new HttpError("Authentication Failure!", 401);
        return next(error);
    }
};
