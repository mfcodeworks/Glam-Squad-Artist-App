import * as storage from '../storage';
import * as api from '../api';

function apiGetEvent(id) {
    return api.getEvent(id)
    .then((event) => {
        storage.save(`event-${event.id}`, JSON.stringify(event));
        return event;
    });
}

export function getEvent(event) {
    // Try load from storage
    try {
        return storage.get(`event-${event}`)
        .then(JSON.parse)
        .then((e) => {
            // If event found return
            if (e) return e;
            // If not cached then get from server
            return apiGetEvent(event);
        });
        // Storage failed, get from server
    } catch (e) {
        return apiGetEvent(event);
    }
}
