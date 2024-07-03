const { saveState, loadState } = require('./utils/stateStorage');

const loadedState = loadState();

const userLastTicketTime = new Map(Object.entries(loadedState.userLastTicketTime || {}));
const userOpenTickets = new Map(Object.entries(loadedState.userOpenTickets || {}));

function updateState() {
    saveState({
        userLastTicketTime: Object.fromEntries(userLastTicketTime),
        userOpenTickets: Object.fromEntries(userOpenTickets),
    });
}

module.exports = {
    userLastTicketTime,
    userOpenTickets,
    updateState,
};