import 'colcade';

export default function () {
    // Update previous colcade arrangements
    $('.grid').colcade('reload');

    // Initialise colcade for new grids
    try {
        $('.grid').colcade({
            items: '.grid-item',
            columns: '.grid-col',
        });
    } catch (e) {
        console.log(e);
    }
}
