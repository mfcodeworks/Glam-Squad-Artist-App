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
        const src = $(e.currentTarget).attr('src');
        const filename = src.split('/').pop();

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
        const vid = e.currentTarget;

        const src = $(vid).find('source').attr('src');
        const type = $(vid).find('source').attr('type');
        const filename = src.split('/').pop();

        console.log('Opening lightbox.');

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
