// imports
import * as api from '../api';
import * as tools from '../tools';
import * as ui from '../ui';

export function authenticatedCheck() {
    return api.isAuthenticated()
    .then((res) => { (res) ? tools.load('map.html') : ui.endPageLoading(); });
}
