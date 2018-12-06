// imports
import * as api from './api';

// Login screen forms
export function registerUserHandler() {
    return new Promise(function(resolve) {
        $("#btn-confirm-register").click(function() {
            api.registerUser();
        });
        resolve(true);
    });
}

export function loginUserHandler() {
    return new Promise(function(resolve) {
        $("#login-form-container").submit(function(e) {
            e.preventDefault();
            
            api.authenticateUser();
        });
        resolve(true);
    });
}

// Splash screen functions
export function showSplash() {
    $("#splash-screen").show();
}
export function removeSplash() {
    $("#splash-screen").hide();
}

export function formToggle() {
    return new Promise(function(resolve) {
        $('[data-role="toggleFormInput"]').click(function() {
            var id = $(this).data("target");
            $("#"+id).slideToggle();
        });
        resolve(true);
    });
}

export function notificationEvent(event) {
    var date = new Date(event.datetime);
    var html = '\
    <li class="list-group-item clr-primary event-notification-item pt-1">\
        <a class="text-white p" href="#">\
            ' + event.address + '\
            <br><br>\
            ' + date.toLocaleString() + '\
        </a>\
    </li>';
    $(".notification-menu-display").append(html);
}

export function startLoader(color = "black") {
    $("body").prepend("<div class='loader-" + color + "'></div>");
}
export function endLoader() {
    $("[class^='loader-']").remove();
}