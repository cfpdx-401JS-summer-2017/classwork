const tokenService = require('./token-service');

// eslint-disable-next-line
module.exports = function getEnsureAuth(log=console.log) {

    return function ensureAuth(req, res, next) {
        const token = req.get('Authorization');
        if (!token) return next({ code: 401, error: 'No Authorization Found' });
            
        tokenService.verify(token)
            .then(payload => {
                req.user = payload;
                next();
            }, () => {
                next({ code: 401, error: 'Authorization Failed' });
            })
            .catch(err => {
                log('unexpected next() failure', err);
            });
    };

};