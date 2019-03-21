/* Styles */
import '../styles/index.scss';
/* Theme JS */
import './masonry';
import './charts';
import './popover';
import './scrollbar';
import './search';
import './sidebar';
import './skycons';
import './vectorMaps';
import './chat';
import './datatable';
import './datepicker';
import './email';
import './fullcalendar';
import './googleMaps';
import './utils';
/* Custom JS */
import * as login from './custom/login';
import * as tools from './custom/tools';
import * as ui from './custom/ui';

/* Cordova App */
const app = {
    // Application Constructor
    initialize() {
        // document.addEventListener('deviceready', this.onDeviceReady, false);

        // Page listener
        document.addEventListener('pageload', this.onDeviceReady.bind(this),  false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady(e) {
        // Handle back button
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);

        switch (e.detail) {
            case 'signin':
                // Check for network connection
                tools.monitorNetwork()
                .then(() => {
                    // Register form handlers
                    ui.loginUserHandler();
                    ui.registerUserHandler();
                    ui.forgotPasswordHandler();
                    ui.updatePortfolioImages();
                    ui.fillArtistRoles();

                    // Auth check
                    login.authenticatedCheck();

                    // Network error alert
                }, (err) => {
                    navigator.notification.alert(
                        'Please conect to the internet before opening NR Glam Squad.',
                        () => {
                            navigator.app.exitApp();
                        },
                        err,
                        'Okay'
                    );
                });
                break;
            default:
                navigator.notification.alert(
                    'Unknown error occured, the app cannot load.',
                    () => { navigator.app.exitApp(); },
                    'Error',
                    'Okay'
                );
                break;
        }
    },

    // Back button handler
    onBackButton() {
        if (($('#register-dialog-modal').data('bs.modal') || {})._isShown) {
            $('#btn-cancel-register').click();
        } else {
            navigator.notification.confirm(
                'Close NR Glam Squad?',
                (index) => { if (index === 1) navigator.app.exitApp(); },
                'Exit',
                ['Exit', 'Cancel']
            );
        }
    },
};

// start app
app.initialize();
