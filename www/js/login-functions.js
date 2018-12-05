// imports
import * as api from './api';
import * as tools from './tools';
import * as ui from './ui-tools';

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(res) {
            if(res) tools.load("map.html");
            else ui.removeSplash();
        });
}