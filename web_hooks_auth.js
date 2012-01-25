var crypto = require('crypto');

exports.getAuthMiddleware = function (app_key, secret) {
  return function (req, res, next) {
    req.web_hook_authorized = false;

    var app_key_header = req.headers['x-pusher-key'];
    var app_digest_header = req.headers['x-pusher-signature'];
    if (app_key_header !== undefined) {
      var body = '';
      // handle reading the body
      req.on('data', function (data) {
        console.log('parsing body');
        body += data;
      });
      // authorize when the body is read completely
      req.on('end', function () {
        var digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (app_key_header === app_key && app_digest_header === digest) {
          req.web_hook_authorized = true;
        }
      });
    }
    next();
  }
}
