'use strict';

// Load modules

const Bell = require('bell');
const Hapi = require('hapi');
const Vision = require('vision');
const Events = require('./lib/events');
const Auth = require('./lib/auth');


// Declare internals

const internals = {};


process.on('unhandledRejection', (error) => {

    console.log('unhandledRejection', error.message);
});

internals.start = async function () {

    const { CLIENT_ID, CLIENT_SECRET, COOKIE_PASSWORD } = process.env;

    if (!CLIENT_ID || !CLIENT_SECRET || !COOKIE_PASSWORD) {
        throw new Error('One or more of CLIENT_ID, CLIENT_SECRET and COOKIE_PASSWORD are not defined');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const port = process.env.PORT || 8000;
    const server = Hapi.server({
        port,
        debug: {
            request: 'error'
        }
    });

    // Set cookie definition

    server.state('session', {
        ttl: 24 * 60 * 60 * 1000,     // One day
        isSecure: isProduction ? true : false,
        path: '/',
        encoding: 'iron',
        password: COOKIE_PASSWORD,
        isSameSite: 'Lax'
    });

    // Register bell and vision with the server

    await server.register([Bell, Vision]);

    // Declare an authentication strategy using the bell scheme
    // with the name of the provider, cookie encryption password,
    // and the OAuth client credentials.

    server.auth.strategy('google', 'bell', {
        provider: 'google',
        password: COOKIE_PASSWORD,
        clientId: `${CLIENT_ID}v3.apps.googleusercontent.com`,
        clientSecret: CLIENT_SECRET,
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        isSecure: isProduction ? true : false,
        forceHttps: isProduction ? true : false
    });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: './templates',
        layout: true,
        layoutPath: './templates/layout'
    });

    server.route({
        method: ['GET', 'POST'],    // Must handle both GET and POST
        path: '/login',             // The callback endpoint registered with the provider
        options: {
            auth: 'google',
            handler: Auth.login
        }
    });

    server.route({
        method: ['GET'],
        path: '/logout',
        options: {
            handler: Auth.logout
        }
    });

    server.route({
        method: ['GET'],
        path: '/',
        options: {
            handler: Events.get
        }
    });

    console.log(`Server listening on port ${port}...`);
    await server.start();
};

internals.start();
