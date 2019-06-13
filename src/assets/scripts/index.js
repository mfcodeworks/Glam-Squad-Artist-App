/* eslint-disable no-extend-native */
/* NPM */
import 'fullcalendar';
import 'jquery.appear';
import 'long-press-event/src/long-press-event';

/* Style */
import 'fullcalendar/dist/fullcalendar.min.css';
import '../styles/index.scss';

/* Theme JS */
import './popover';
import './search';
import './sidebar';
import './skycons';
import './vectorMaps';
import './chat';
import './datatable';
import './datepicker';
import './email';
import './googleMaps';
import './utils';

/* Custom JS */
import './custom/lightbox';
import './custom/page';
import * as login from './custom/login';
import * as ui from './custom/ui';
import * as map from './custom/map';
import * as chat from './custom/chat';
import * as push from './custom/push';
import * as tools from './custom/tools';
import * as api from './custom/api';
import * as settings from './custom/settings';
import './masonry';

// Current fix for cordova inAppBrowser window.open overwrite
const open = window.open;

// Add a get last method to arrays
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
}

// Create string truncation function
String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};


/* Cordova App */
const app = {
    // Application Constructor
    initialize() {
        /* Page listener */
        document.addEventListener('pageload', this.onDeviceReady.bind(this),  false);

        /* Handle back button */
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);

        /* Listen for app resume */
        document.addEventListener('resume', this.onResume.bind(this), false);

        /* Monitor network connection */
        tools.monitorNetwork();

        /* FIX: Restores original window.open functionality */
        window.open = open;
    },

    // Page load event listener
    onDeviceReady(e) {
        switch (e.detail) {
            case 'signin':
                /* Auth Check */
                login.authenticatedCheck();

                /* Form Fill */
                ui.fillArtistRoles();

                /* Input Handlers */
                ui.loginUserHandler();
                ui.registerUserHandler();
                ui.forgotPasswordHandler();
                ui.updatePortfolioImages();
                $('body').css('overflow', 'auto');
                break;

            case 'app':
                /* Map Load */
                navigator.geolocation.getCurrentPosition(
                    map.onMapSuccess,
                    map.onMapError,
                    {
                        enableHighAccuracy: false,
                        // 2 seconds timeout
                        timeout: (2 * 1000),
                        // max age for cache use 5 seconds
                        maximumAge: (5 * 1000),
                    }
                );

                /* Auth Check */
                tools.authenticatedCheck()
                .then(() => {
                    $('body').css('overflow', 'auto');
                    settings.getBookings();
                });

                /* Chat/Notification Init */
                chat.init()
                .then(chat.tokenListener)
                .then(push.handle)
                /*  Chat UI */
                .then(ui.chatHandler)
                .then(chat.listChannels)
                .then(ui.channelListHandler)
                .then(tools.fileDownloadHandler)
                .then(chat.chatListeners)
                .then(ui.selectFirstChat)
                .finally(ui.endLoader);
                ui.prevMessages();

                /* Map Main UI */
                map.stripeAccountCheck();
                map.confirmRecentEvents();
                api.getNewEvents();

                /* Data Fill */
                tools.fillUserData();
                api.fillUserInfo();
                ui.fillNewArtistRoles();
                ui.qrPay();

                /* Analytics Fill */
                api.getReceipts()
                .then(tools.makeAnalytics)
                .then(ui.analyticsCharts);

                /* Settings UI */
                settings.profilePhotoHandler();
                settings.updateUserHandler();
                settings.changeRoleHandler();
                settings.reportClientHandler();
                settings.fillSettings();
                settings.saveSettingsHandler();
                ui.handleEventNotificationClick();
                ui.bookingClientHandler();
                ui.rateClientHandler();
                ui.portfolioLongPressHandler();
                ui.portfolioDeleteHandler();
                ui.fileInputIndicator();

                /* Create media directory */
                tools.createMediaDir();
                break;

            default:
                navigator.notification.alert(
                    'Unknown error occured, the app cannot load.',
                    null,
                    'Error',
                    'Okay'
                );
                break;
        }
    },

    // Back button handler
    onBackButton() {
        // Check if sidebar or modals are open and close top layer
        // TODO: Update with correct artist modals
        switch (true) {
            case ($('.portfolio-checkbox').hasClass('d-n') === false):
                // Hide checkboxes
                $('.portfolio-checkbox').addClass('d-n');
                // Remove any checked input
                $('.portfolio-checkbox input[type="checkbox"]:checked').each((index, el) => {
                    $(el).prop('checked', false);
                });
                break;
            case ($('.app').hasClass('is-collapsed')):
                $('div.mobile-toggle.sidebar-toggle').click();
                break;
            case ($('#chat-sidebar').hasClass('open')):
                $('#chat-sidebar-toggle').click();
                break;
            case (($('#register-dialog-modal').data('bs.modal') || {})._isShown):
                $('#btn-cancel-register').click();
                break;
            case (($('#about-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-about').click();
                break;
            case (($('#privacy-policy-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-privacy').click();
                break;
            case (($('#terms-conditions-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-terms').click();
                break;
            case (($('#rate-artists-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-rate-artists').click();
                break;
            case (($('#create-card-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-create-card').click();
                break;
            case (($('#profile-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-profile').click();
                break;
            case (($('#artist-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-artist').click();
                break;
            case (($('#settings-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-settings').click();
                break;
            case (($('#event-dialog-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-event').click();
                break;
            case (($('#event-booking-modal').data('bs.modal') || {})._isShown):
                $('#btn-close-event-booking').click();
                break;
            default:
                navigator.notification.confirm(
                    'Close NR Glam Squad?',
                    (index) => { if (index === 1) navigator.app.exitApp(); },
                    'Exit',
                    ['Exit', 'Cancel']
                );
                break;
        }
    },

    // Handle app resume
    onResume() {
        // Auth check
        tools.authenticatedCheck();
    },
};

// start app
app.initialize();
