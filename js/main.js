const selectElement = document.querySelector("#dataset-url");

selectElement.addEventListener("change", (event) => {
    fetch(`${event.target.value}`)
    .then((response) => response.json())
    .then((json) => json.map(({zippedStats, ...rest}) => 
            zippedStats.map(attribute => ({...rest, ...attribute}))).flat())
    .then(parsed => new Tabulator("#example-table", {
        height:311,
        groupToggleElement:"header",
        groupStartOpen:false,
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
    
            return formatDate(new Date(Number(value))) + ` - $${parseFloat(totalEarnings.toPrecision(3)).toFixed(2)}`;
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
    //Define variables for input elements
    var fieldEl = document.getElementById("filter-field");
    var typeEl = document.getElementById("filter-type");
    var valueEl = document.getElementById("filter-value");

    //Custom filter example
    function customFilter(data){
        return data.car && data.rating < 3;
    }

    //Trigger setFilter function with correct parameters
    function updateFilter(){
    var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
    var typeVal = typeEl.options[typeEl.selectedIndex].value;

    var filter = filterVal == "function" ? customFilter : filterVal;

    if(filterVal == "function" ){
        typeEl.disabled = true;
        valueEl.disabled = true;
    }else{
        typeEl.disabled = false;
        valueEl.disabled = false;
    }

    if(filterVal){
        table.setFilter(filter,typeVal, valueEl.value);
    }
    }

    //Update filters on value change
    document.getElementById("filter-field").addEventListener("change", updateFilter);
    document.getElementById("filter-type").addEventListener("change", updateFilter);
    document.getElementById("filter-value").addEventListener("keyup", updateFilter);

    //Clear filters on "Clear Filters" button click
    document.getElementById("filter-clear").addEventListener("click", function(){
    fieldEl.value = "";
    typeEl.value = "=";
    valueEl.value = "";

    table.clearFilter();
    });

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