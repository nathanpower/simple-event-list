'use strict';

exports.login = function (request, h) {

    if (!request.auth.isAuthenticated) {
        return `Authentication failed due to: ${request.auth.error.message}`;
    }

    // Perform any account lookup or registration, setup local session,
    // and redirect to the application. The third-party credentials are
    // stored in request.auth.credentials. Any query parameters from
    // the initial request are passed back via request.auth.credentials.query.

    return h.redirect('/').state('session', request.auth.credentials);
};

exports.logout = function (request, h) {

    return h.redirect('/').unstate('session');
};
