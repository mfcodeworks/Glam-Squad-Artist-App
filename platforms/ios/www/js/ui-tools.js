// imports
import * as api from './api';
import * as tools from './tools';
import * as payment from './payment';

export function updateBookingImages() {
    return new Promise(function(resolve) {
        $("#event-photos").change(function() {
            $("#event-photos-preview").empty();
    
            var photos = $("#event-photos")[0].files;
        
            for(var i = 0; i < photos.length; i++) {
                tools.readFile(photos[i])
                    .then(function(e) {
                        $("#event-photos-preview").append(
                            "<li class='event-photo-preview-image' ><img src='" + e +"' /></li>"
                        );
                    });
            };
        });
        resolve(true);
    });
}

export function eventPackageSelector() {
    return new Promise(function(resolve) {
        $(".event-package-selection").click(function() {
            if($(this).hasClass("active")) {
                $(this).removeClass("active");
            }
            else {
                $(this).addClass("active");
            }
        });
    });
}
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

export function addSettingsCard(customer, card) {
    switch(card.brand) {
        case "American Express":
            var cardIcon = "fab fa-cc-amex";
            card.brand = "AmEx";
            break;

        case "Diners Club":
            var cardIcon = "fab fa-cc-diners-club";
            card.brand = "Diners";
            break;

        case "Discover":
            var cardIcon = "fab fa-cc-discover";
            break;

        case "JCB":
            var cardIcon = "fab fa-cc-jcb";
            break;

        case "MasterCard":
            var cardIcon = "fab fa-cc-mastercard";
            break;

        case "Visa":
            var cardIcon = "fab fa-cc-visa";
            break;

        default:
            var cardIcon = "fas fa-credit-card";
            break;
    }

    if(customer.default_source === card.id) {
        var defaultButton =
        '<button type="button" class="btn input-dark btn-md btn-make-card-default" data-card="' + card.id + '" data-role="none" disabled> \
            <i class="far fa-credit-card"></i> Default Card \
        </button>';
    }
    else {
        var defaultButton =
        '<button type="button" class="btn input-dark btn-md btn-make-card-default" data-card="' + card.id + '" data-role="none"> \
            <i class="far fa-credit-card"></i> Make Default \
        </button>';
    }

    var html = '\
        <div class="form-group list-group-item clr-dark text-center card-preview" style="font-size: 20px;"> \
            <i class="' + cardIcon + ' card-brand"> ' + card.brand + '</i> \
            <span class="card-last-four">**** **** **** ' + card.last4 + '</span> \
            <div class="card-buttons"> \
                '+ defaultButton + '\
                <button type="button" class="btn input-dark btn-md btn-delete-card" data-card="' + card.id + '"  data-role="none"> \
                    <i class="fas fa-trash-alt"></i> Delete \
                </button> \
            </div> \
        </div> \
    ';

    $("#payment-info-form-inputs").prepend(html);
}

export function fillPaymentOptions() {
    return payment.getUserCards()
        .then(function(r) {
            console.log("User cards: " + r.length);
            if(r.length < 1) {
                $("#event-card-selection").hide();
            }
            else {
                for(var i = 0; i < r.length; i++) {
                    var html = "<option data-card=\'" + r[i].id + "\'>" + r[i].brand + " - " + r[i].last4 +"</option>";
                    $("#event-card-selection").append(html);
                }
            }
        }, function(e) {
            console.log("Error: " + e);
            $("#event-card-selection").hide();
        });
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

export function addSettingsEvent(event) {
    var price = "$" + event.price.toFixed(2);

    var addressArray = event.address.split(",");
    var address = addressArray[0];
    if(addressArray[1]) address += "," + addressArray[1];

    var packages = "";
    for(var i = 0; i < event.packages.length; i++) {
        packages += '<li class="list-group-item clr-dark">' + event.packages[i].name + '</li>';
    }

    var buttons = "";
    var nowDate = new Date();
    var eventDate = new Date(event.datetime);
    if(nowDate.getTime() < eventDate.getTime()) {
        buttons += 
        '<div class="text-right clr-dark mb-1">\
            <button type="button" class="btn-delete-event btn input-dark btn-md" data-event-address="' + event.address + '" data-event-id="' + event.id + '">\
                <i class="fas fa-times"></i> Delete\
            </button>\
        </div>';
    }

    var html = 
    '<a href="#" class="list-group-item list-group-item-action flex-column align-items-start clr-dark event-package-selection" data-event="' + event.id + '">\
        <div class="d-flex w-100 justify-content-between">\
            <h5 class="mb-3">' + address + '</h5>\
            <small>' + price + '</small>\
        </div>\
        <small>' + eventDate.toLocaleString() + '</small>\
        <p class="mb-2">Packages Selected:</p>\
        <ul class="list-group list-group-flush mb-3">\
            ' + packages + '\
        </ul>\
        ' + buttons + '\
    </a>';

    $("#events-form-inputs").append(html);
}

export function startLoader(color = "black") {
    $("body").prepend("<div class='loader-" + color + "'></div>");
}
export function endLoader() {
    $("[class^='loader-']").remove();
}