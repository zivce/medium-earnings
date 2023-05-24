const selectElement = document.querySelector("#dataset-url");

selectElement.addEventListener("change", (event) => {
    fetch(`${event.target.value}`)
    .then((response) => response.json())
    .then((json) => json.map(({zippedStats, ...rest}) => 
            zippedStats.map(attribute => ({...rest, ...attribute}))).flat())
    .then(parsed => new Tabulator("#example-table", {
        height:311,
        initialFilter : [
            {field:"amount", type:">", value:"0"}
        ],
        layout:"fitColumns",
        groupBy: "periodStartedAt",
        initialSort:[
            {column:"periodStartedAt", dir:"desc"}, //sort by this first
        ],
        groupHeader: function (value, count, data, group) {
            let totalEarnings = 0;
            data.forEach((item) => {
                if (item.amount > 0) {
                    totalEarnings += item.amount;
                }
            });
    
            return formatDate(new Date(Number(value))) + `- $${parseFloat(totalEarnings.toPrecision(3)).toFixed(2)}`;
        },
        columns: [
            {title:"Date", field:"periodStartedAt", hozAlign:"center", sorter:"number", formatter: function (cell, formatterParams, onRendered) {
                if (cell.getValue()) {
                    let convertedDate = formatDate(new Date(Number(cell.getValue())));
                    return convertedDate;
                }}
            },
            {title:"Title", field:"title", editor:"input", headerFilter:true},
            {title:"Name", field:"name"},
            {title:"Link", field:"link"},
            {title:"Views", field:"views", topCalc: "sum"},
            {title: "Internal views", field:"internalReferrerViews", topCalc: "sum"},
            {title: "Member time reading (s)", field:"memberTtr",
                topCalc: function (values, data, calcParams) {
                    let calc = 0;
                    values.forEach(function (value) {
                        calc += value;
                    });
                    
                    totalTime = luxon.Duration.fromMillis(calc * 1000).shiftTo('days', 'hours', 'minutes', 'seconds');
        
                    if (totalTime.days === 0) return totalTime.toFormat('hh:mm:ss');
                    else return totalTime.days + 'd ' + totalTime.toFormat('d hh:mm:ss').substr(2);
                },
                formatter: formatHumanSecondsDuration,},
            {title: "Amount", field:"amount", topCalc: "sum", topCalcParams: { precision: 2 },
                topCalcFormatter: "money",
                editor:"input", headerFilter:true,
                topCalcFormatterParams: {
                    decimal: ".",
                    thousand: ",",
                    symbol: "$",
                    precision: 2,
                },
                formatter: "money",
                formatterParams: {
                    decimal: ".",
                    thousand: ",",
                    symbol: "$",
                    precision: 2,
                }},

            
        ],
        data: parsed
    }))

});

function formatDate(date) {
    return date.getFullYear() + "-" +
        ('0' + (date.getMonth() + 1)).slice(-2) + "-" +
        ('0' + date.getDate()).slice(-2);
}


const formatHumanSecondsDuration = function (cell) {
    duration = luxon.Duration.fromMillis(cell.getValue() * 1000).shiftTo('days', 'hours', 'minutes', 'seconds');

    if (duration.days === 0) {
        return duration.toFormat('hh:mm:ss');
    } else return duration.days + 'd ' + duration.toFormat('d hh:mm:ss').substr(2);
}