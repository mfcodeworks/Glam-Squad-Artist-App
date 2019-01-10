import * as storage from './storage';
import * as api from './api';

export function getEvent(event) {
    // Try load from storage
    try {
        return storage.get(`event-${event}`)
            .then(JSON.parse)
            .then(function(e) {
                // If event found return
                if(e) return e;

                // If not cached then get from server
                return apiGetEvent(event);
            })
    }
    // Storage failed, get from server
    catch(e) {
        return apiGetEvent(event);
    }
}

function apiGetEvent(event) {
    return api.getEvent(event)
        .then(function(d) {
            storage.save(`event-${event}`, JSON.stringify(d.data));
            return d.data;
        });
}