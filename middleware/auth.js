const jwt = require('jsonwebtoken');

//model is optional

const isAuth = (req,res,next)=>{
    const token = req.cookies.token ||
    req.header('Authorization').replace('Bearer ','') || 
    
    req.body.token;
    if(!token){
        return res.status(403).send('Token is misssing')
    }

    try {
        const decode = jwt.verify(token,process.env.SECRET_KEY)
    } catch (error) {
        return res.status(401).send('Invalid token')
    }
    return next();
}

module.exports = isAuth;