/* PAGE: PAGE ARRAY */
const pages = [
    'chat.html',
    'calendar.html',
    'map.html',
    'charts.html',
];

export default (function () {
    console.log('loading page listener');

    $(document).on('click', 'a', (e) => {
        // Store references
        const url = $(e.currentTarget).attr('href');

        // Check link is a page
        if (pages.includes(url)) {
            // Don't follow link
            e.preventDefault();

            // Hide current page
            $('[data-page]').addClass('d-n');

            // Remove active from current page
            $('a.sidebar-link').removeClass('active');

            // Hide search bar
            $('.search-box').addClass('d-n');
        } else {
            return;
        }

        console.warn(`Opening ${url}`);

        // Switch URL
        switch (url) {
            case 'chat.html':
                // Show HTML
                $('[data-page="chat"]').removeClass('d-n');

                // Set active link
                $('a.sidebar-link[href="chat.html"]').addClass('active');

                // Auto scroll down
                $('#chat-box').animate({
                    scrollTop: $('[data-role="chat-message-view"]').height(),
                }, 'fast');
                console.log('Chat scrolled');
                break;

            case 'map.html':
                // Show HTML
                $('[data-page="map"]').removeClass('d-n');

                // Set active link
                $('a.sidebar-link[href="map.html"]').addClass('active');

                // Show search bar
                $('.search-box').removeClass('d-n');
                break;

            case 'calendar.html':
                // Show HTML
                $('[data-page="booking"]').removeClass('d-n');

                // Set active link
                $('a.sidebar-link[href="calendar.html"]').addClass('active');
                break;

            case 'charts.html':
                // Show HTML
                $('[data-page="charts"]').removeClass('d-n');

                // Set active link
                $('a.sidebar-link[href="charts.html"]').addClass('active');
                break;

            default:
                navigator.notification.alert(
                    `Link is not a valid page: ${url}.`,
                    null,
                    'Page Error',
                    'Okay'
                );
                break;
        }
    });
}());
