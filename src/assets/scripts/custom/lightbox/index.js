// Close lightbox when no longer needed
function lightboxObserver() {
    $('#lightbox-display').click(() => {
        console.log('Closing lightbox.');
        $('#lightbox-display').remove();
    });
}

// Display image lightbox
function imgObserver() {
    $(document).on('click', '.lightbox-img', (e) => {
        console.log('Portfolio Click');

        const src = $(e.currentTarget).attr('src');
        let filename = src.split('/').pop();

        if (!filename.includes('.')) {
            const date = new Date();
            filename = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}.${src.split(';')[0].split('/')[1]}`;
        }

        $('body').prepend(
            `<div id='lightbox-display'>
                <img id='lightbox-content' src='${src}'>
                <a href="${src}" class="fsz-md r-15 b-50 pos-a c-grey-100 bgc-grey-900 p-5 bdrs-4" download="${filename}" target="_blank">
                    Download Media&nbsp;<i class="fas fa-file-download"></i>
                </a>
            </div>`
        );

        $('#lightbox-display').show();
        lightboxObserver();
  });
}

// Video lightbox
function vidObserver() {
    $(document).on('click', '.lightbox-vid', (e) => {
        const vid = e.currentTarget,
            src = $(vid).find('source').attr('src'),
            type = $(vid).find('source').attr('type');
        let filename = src.split('/').pop();

        if (!filename.includes('.')) {
            const date = new Date();
            filename = `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}.${src.split(';')[0].split('/')[1]}`;
        }

        console.log('Opening lightbox.');

        // Pause all other videos
        $('video').each((index, el) => {
            el.pause();
        });

        $('body').prepend(
            `<div id='lightbox-display'>
                <video id='lightbox-content' autoplay webkit-playsinline loop>
                    <source src='${src}' type='${type}'>
                    This device doesn't support video format
                </video>
                <a href="${src}" class="fsz-md r-15 b-50 pos-a c-grey-100 bgc-grey-900 p-5 bdrs-4" download="${filename}" target="_blank">
                    Download Media&nbsp;<i class="fas fa-file-download"></i>
                </a>
            </div>`
        );

        $('#lightbox-display').show();
        lightboxObserver();
    });
}

export default (function () {
    $(document).ready(() => {
        imgObserver();
        vidObserver();
    });
}());
