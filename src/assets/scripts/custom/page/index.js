/* PAGE: PAGE ARRAY */
const pages = [
    'chat.html',
    'calendar.html',
    'map.html',
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
            $('[data-page]').addClass('d-none');

            // Remove active from current page
            $('a.sidebar-link').removeClass('active');

            // Hide search bar
            $('.search-box').addClass('d-none');
        } else {
            return;
        }

        console.warn(`Opening ${url}`);

        // Switch URL
        switch (url) {
            case 'chat.html':
                // Show HTML
                $('[data-page="chat"]').removeClass('d-none');

                // Set active link
                $('a.sidebar-link[href="chat.html"]').addClass('active');
                break;

            case 'map.html':
                // Show HTML
                $('[data-page="map"]').removeClass('d-none');

                // Set active link
                $('a.sidebar-link[href="map.html"]').addClass('active');

                // Show search bar
                $('.search-box').removeClass('d-none');
                break;

            case 'calendar.html':
                // Show HTML
                $('[data-page="booking"]').removeClass('d-none');

                // Set active link
                $('a.sidebar-link[href="calendar.html"]').addClass('active');
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
