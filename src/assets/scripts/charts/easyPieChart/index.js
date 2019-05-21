import 'easy-pie-chart/dist/jquery.easypiechart.min.js';

export default (function () {
    if ($('.easy-pie-chart').length > 0) {
        $('.easy-pie-chart').easyPieChart();
    }
}());
