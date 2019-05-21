import Chart from 'chart.js';
import { COLORS } from '../../constants/colors';

export default (function () {
    // ------------------------------------------------------
    // @Bar Charts
    // ------------------------------------------------------

    const barChartBox = document.getElementById('bar-chart');

    if (barChartBox) {
        const barCtx = barChartBox.getContext('2d');

        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'Deember'],
                datasets: [{
                    label           : 'Bookings (2019)',
                    backgroundColor : COLORS['green-500'],
                    borderColor     : COLORS['green-800'],
                    borderWidth     : 1,
                    data            : [6, 4, 6, 5, 7],
                }, {
                    label           : 'Bookings (2018)',
                    backgroundColor : COLORS['red-500'],
                    borderColor     : COLORS['red-800'],
                    borderWidth     : 1,
                    data            : [0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 8, 4],
                }],
            },

            options: {
                responsive: true,
                legend: {
                    position: 'bottom',
                },
            },
        });
    }

    // ------------------------------------------------------
    // @Scatter Charts
    // ------------------------------------------------------

    const scatterChartBox = document.getElementById('scatter-chart');

    if (scatterChartBox) {
        const scatterCtx = scatterChartBox.getContext('2d');

        Chart.Scatter(scatterCtx, {
            data: {
                datasets: [{
                    label           : 'This Month (May)',
                    borderColor     : COLORS['green-500'],
                    backgroundColor : COLORS['green-500'],
                    data: [
                        { x: 1, y: 150 },
                        { x: 2, y: 300 },
                        { x: 3, y: 470 },
                        { x: 4, y: 630 },
                        { x: 5, y: 700 },
                        { x: 6, y: 850 },
                        { x: 7, y: 1030 },
                    ],
                }, {
                    label           : 'Last Month (April)',
                    borderColor     : COLORS['red-500'],
                    backgroundColor : COLORS['red-500'],
                    data: [
                        { x: 1, y: 150 },
                        { x: 2, y: 300 },
                        { x: 3, y: 450 },
                        { x: 4, y: 600 },
                        { x: 5, y: 750 },
                    ],
                }],
            },
        });
    }
}());
