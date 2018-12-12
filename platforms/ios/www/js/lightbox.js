// Display image lightbox
function imgObserver() {
    $(document).on('click', '.lightbox-img', function() {

        $('body').prepend(
            `<div id='lightbox-display'>
                <img id='lightbox-content' src='${$(this).attr("src")}'>
            </div>`
        );

        $("#lightbox-display").show();
        lightboxObserver();
  });
}

// Video lightbox
function vidObserver() {
    $(document).on('click', '.lightbox-vid', function() {

        var src = $(this).find("source").attr("src");
        var type = $(this).find("source").attr("type");

        console.log("Opening lightbox.");

        $('body').prepend(
            `<div id='lightbox-display'>
                <video id='lightbox-content' autoplay webkit-playsinline loop>
                    <source src="${src}" type="${type}">
                    This browser doesn't support video format
                </video>
            </div>`
        );

        $("#lightbox-display").show();
        lightboxObserver();
    });
}

// Close lightbox when no longer needed
function lightboxObserver() 
{
    $("#lightbox-display").click(function() {
        console.log("Closing lightbox.");
        $("#lightbox-display").remove();
    });
}

export function start() {
    $(document).ready(function() {
        imgObserver();
        vidObserver();
    });
}