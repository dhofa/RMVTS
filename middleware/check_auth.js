const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try {
        const token = req.cookies.token;
        // const token = req.headers.authorization.split(" ")[1];
        if (token != undefined) {
         const decoded = jwt.verify(token, process.env.JWT_KEY);
         req.userData = decoded;
         next();
        }else{
         return res.redirect('/login');
        }

    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
};
