// imports
import * as ui from './ui-tools';
import * as api from './api';
import * as tools from './tools';
import * as payment from './payment';
import * as session from './session';
import * as push from './push';

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(res) {
            if(!res) tools.load("login.html");
        });
}

export function updateUserHandler() {
    return new Promise(function(resolve) {
        $("#user-info-form").submit(function(e) {
            e.preventDefault();
    
            api.updateUser();
        });
        resolve(true);
    });
}

export function fillUserInfo() {
    return api.fillUserInfo();
}

export function handlePayment() {
    return new Promise(function(resolve) {
        var stripe = Stripe('pk_test_q4I6d4V8onnBC31PJOdKjY8i');
        var elements = stripe.elements();
    
        $(document).ready(function() {
            // Custom styling can be passed to options when creating an Element.
            var style = {
                base: {
                    // Add your base input styles here. For example:
                    fontSize: '16px',
                    color: '#fff',
                    iconColor: '#fff',
                    
                }
            };
    
            // Create an instance of the card Element.
            var card = elements.create('card', {style: style});
    
            // Add an instance of the card Element into the `card-element` <div>.
            card.mount('#card-element');
    
            // Handle card errors
            card.addEventListener('change', function(e) {
                var displayError = document.getElementById('card-errors');
                if (e.error) {
                    displayError.textContent = e.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
    
            $("#payment-info-form-container").submit(function(e) {
                e.preventDefault();
                ui.startLoader();
        
                stripe.createToken(card)
                    .then(function(r) {
                        if (r.error) {
                            // Inform the customer that there was an error.
                            var errorElement = document.getElementById('card-errors');
                            errorElement.textContent = r.error.message;
                            ui.endLoader();
                        } else {
                            var token = r.token;
                            console.log(token);
    
                            // Get user data
                            session.get("login")
                                .then(function(r) {
                                    // Create customer info object
                                    var customerData = {
                                        formContext: "save-client-payment-info",
                                        type: token.card.brand,
                                        lastFour: parseInt(token.card.last4),
                                        token: token.card.id,
                                        userID: parseInt(JSON.parse(r).userId),
                                        stripeId: null
                                    }
                
                                    payment.getCustomerId(token.id)
                                        .then(function(r) {
                                            customerData.stripeId = r;
                
                                            console.log(customerData);
    
                                            api.saveClientPaymentInfo(customerData);
                                            getCards()
                                                .then(function() {
                                                    ui.endLoader();
                                                })
                                        });
                                });
                        }
                    });
            });
        });
        resolve(true);
    });
}

export function getCards() {
    return new Promise(function(resolve) {
        var cards = payment.getUserCards();
        var customer = payment.getCustomerInfo();
        Promise.all([cards,customer])
            .then(function(r) {
                console.log(r);
                $(".card-preview").remove();

                cards = r[0];
                customer = r[1];
    
                for(var i = 0; i < cards.length; i++) {
                    ui.addSettingsCard(customer,cards[i]);
                }
            }, function(e) {
                console.log(e);
            })
            .then(function() {
                deleteCardHandler();
                defaultCardHandler();
                resolve(true);
            });
    });
}

export function deleteCardHandler() {
    return new Promise(function(resolve) {
        $(".btn-delete-card").click(function() {
            ui.startLoader();
            var card = $(this).data("card");
            payment.deleteCard(card)
                .then(function() {
                    api.deleteCard(card)
                        .then(function() {
                            getCards()
                                .then(function() {
                                    ui.endLoader();
                                });
                        });
                });
        });
        resolve(true);
    });
}

export function defaultCardHandler() {
    return new Promise(function(resolve) {
        $(".btn-make-card-default").click(function() {
            ui.startLoader();
            var card = $(this).data("card");
            payment.updateDefaultUserCard(card)
                .then(function() {
                    getCards()
                        .then(function() {
                            ui.endLoader();
                        });
                });
        });
        resolve(true);
    });
}

export function getCustomerInfo() {
    return payment.getCustomerInfo()
        .then(function(r) {
            console.log(r);
        });
}

export function getUserEvents() {
    return api.getEvents()
        .then(function(d) {
            var events = d.data;

            console.log(events);

            if(events) {
                $("#events-form-inputs").empty();

                for(var i=0; i<events.length; i++) {
                    ui.addSettingsEvent(events[i]);
                }
                
                deleteEventHandler();
            }
        });
}

export function deleteEventHandler() {
    return new Promise(function(resolve) {
        $(".btn-delete-event").click(function() {
            ui.startLoader();
            console.log("Deleting event");

            var event = $(this).data("event-id");
            var address = $(this).data("event-address");
            api.deleteEvent(event)
                .then(function(d) {
                    console.log(d);
                    getUserEvents();
                    push.notification(
                        event,
                        "event-"+event+"-client",
                        "Cancelled Booking",
                        "Cancelled booking for "+address
                    );
                })
                .then(function() {
                    ui.endLoader();
                });
        })
        resolve(true);
    });
}