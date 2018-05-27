'use strict';

const Wreck = require('wreck');
const Moment = require('moment');


exports.get = async function (request, h) {

    const { CLIENT_ID } = process.env;

    if (!CLIENT_ID) {
        throw new Error('CLIENT_ID not defined');
    }

    if (!request.state.session && !request.auth.isAuthenticated) {
        return h.view('index');
    }

    let queries = request.query.q;

    if (typeof queries === 'string') {
        queries = [queries];
    }

    const now = Moment().utc().format();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&key=${CLIENT_ID}`;
    const token = request.state.session.token;
    const wreck = Wreck.defaults({
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const promise = await wreck.request('GET', url);

    try {
        const res = await promise;
        const body = await Wreck.read(res);

        var filtered = JSON.parse(body).items.filter((entry) => {

            if (!queries || !Array.isArray(queries)) {
                return true;
            }

            return entry.summary && queries.some((query) => entry.summary.includes(query));
        }).map((event) => {

            return {
                summary: event.summary,
                date: Moment(event.start.date),
                month: Moment(event.start.date).format('MMM'),
                day: Moment(event.start.date).format('D'),
                year: Moment(event.start.date).format('YYYY'),
                link: event.htmlLink
            };
        }).sort((a, b) => {

            return b.date.isBefore(a.date);
        }).reduce((memo, event) => {

            memo[event.year] = memo[event.year] || { items: [], year: event.year };
            memo[event.year].items.push(event);
            return memo;
        }, {});

    }
    catch (err) {
        console.log(err);
        return h.view('index');
    }
    const eventsByYear = Object.values(filtered);

    return h.view('events', { eventsByYear });
};
