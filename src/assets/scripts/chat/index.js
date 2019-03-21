import * as $ from 'jquery';

export default (function () {
    $('#chat-sidebar-toggle').on('click', e => {
        $('#chat-sidebar').toggleClass('open');
        e.preventDefault();
    });

    /**
     * On app click if sidebar is open but click not on sidebar
     * close the sidebar
     */
    $('.app').click((e) => {
        if ($('#chat-sidebar').hasClass('open') && e.pageX > 250) {
            $('#chat-sidebar-toggle').click();
        }
    });
}());
