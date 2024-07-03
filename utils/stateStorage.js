const fs = require('fs');
const path = require('path');

const stateFilePath = path.join(__dirname, 'botCurrentState.json');

function saveState(state) {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

function loadState() {
    if (!fs.existsSync(stateFilePath)) {
        return { userLastTicketsTime: {}, userOpenTickets: {} };
    }

    const data = fs.readFileSync(stateFilePath, 'utf8');
    try {
        const parseData = JSON.parse(data);
        return {
            userLastTicketTime: parseData.userLastTicketTime || {},
            userOpenTickets: parseData.userOpenTickets || {}
        };
    } catch (error) {
        return { userLastTicketTime: {}, userOpenTickets: {} };
    }
}

module.exports = { saveState, loadState }