// imports
import * as api from './api';
import * as tools from './tools';

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(res) {
            if(!res) tools.load('login.html');
        });
}

export function updateUserHandler() {
    return new Promise(function(resolve) {
        $('#user-info-form').submit(function(e) {
            e.preventDefault();
    
            api.updateUser();
        });
        resolve(true);
    });
}

export function fillUserInfo() {
    return api.fillUserInfo();
}