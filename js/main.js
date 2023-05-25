const selectElement = document.querySelector("#dataset-url-submit");

selectElement.addEventListener("click", (event) => {
    const datasetUrlInput = document.querySelector("#dataset-url");

    fetch(`${datasetUrlInput.value}`)
    .then((response) => response.json())
    .then((json) => json.map(({zippedStats, ...rest}) => 
            zippedStats.map(attribute => ({...rest, ...attribute}))).flat())
    .then(parsed => new Tabulator("#example-table", {
        height:"1000",
        layout:"fitDataTable",
        groupToggleElement:"header",
        groupStartOpen:true,
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
            {title:"Date", width:200, field:"periodStartedAt", hozAlign:"center", sorter:"number", formatter: function (cell, formatterParams, onRendered) {
                if (cell.getValue()) {
                    let convertedDate = formatDate(new Date(Number(cell.getValue())));
                    return convertedDate;
                }},
                headerFilter:dateFilterEditor, headerFilterFunc:dateFilterFunction
            },
        
            {title:"Title", field:"title", editor:"input", headerFilter:true},
            {title:"Link", field:"link",  formatter: function (cell, formatterParams, onRendered) {
                return `<a class="tableLink" href="${ cell.getValue()}" target="_blank" rel="noopener noreferrer" title="Medium stats page">Go to stats</a>`;
            },},
            {title:"Views", field:"views", topCalc: "sum"},
            { title:"External views", sorter:"number", field:"external_views",topCalc: "sum", align: "right", mutator:function(value, data) {
                    return data.views - data.internalReferrerViews;
                } 
            },
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
    })).then(table => {
        //Define variables for input elements
        var fieldEl = document.getElementById("filter-field");
        var typeEl = document.getElementById("filter-type");
        var valueEl = document.getElementById("filter-value");


        //Trigger setFilter function with correct parameters
        function updateFilter() {
            var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
            var typeVal = typeEl.options[typeEl.selectedIndex].value;

            table.setFilter(filterVal, typeVal, valueEl.value);
        }

        //Update filters on value change
        document.getElementById("filter-field").addEventListener("change", updateFilter);
        document.getElementById("filter-type").addEventListener("change", updateFilter);
        document.getElementById("filter-value").addEventListener("keyup", updateFilter);

        //Clear filters on "Clear Filters" button click
        document.getElementById("filter-clear").addEventListener("click", function() {
            fieldEl.value = "";
            typeEl.value = ">";
            valueEl.value = "";

            table.clearFilter();
        });

    })
   
});

//custom header filter
var dateFilterEditor = function(cell, onRendered, success, cancel, editorParams){

	var container = document.createElement("span")
	//create and style input
	var domString = "<input type='date' placeholder='Start'/>&nbsp;<input type='date' placeholder='End'/>";
    container.innerHTML = domString;

	var inputs = container.getElementsByTagName("input");


	Array.from(inputs).forEach(elem => {
        elem.setAttribute("style", "padding:4px; width:50%;box-sizing:border-box")
    });
    
    inputs[0].addEventListener('change', function(e){
        success(buildDateString(e.target.value, inputs[1].value));
    });
    inputs[0].addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
            success(buildDateString(e.target.value, inputs[1].value));
        }

        if(e.key == "Escape"){
            cancel();
        }        
    });
	inputs[1].addEventListener('change', function(e){
        success(buildDateString(inputs[0].value, e.target.value,));
    });
    inputs[1].addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
            success(buildDateString(inputs[0].value, e.target.value));
        }

        if(e.key == "Escape"){
            cancel();
        }        
    });

	return container;
}

//custom filter function
function dateFilterFunction(headerValue, rowValue, rowData, filterParams){
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property

   	var format = filterParams.format || "y-LL-dd";
   
 
    var start = luxon.DateTime.fromFormat(headerValue.start, format);
   	var end = luxon.DateTime.fromFormat(headerValue.end, format);
   	if(rowValue){
   		if(start.isValid){
   			if(end.isValid){
   				return rowValue >= start && rowValue <= end;
   			} else {
   				return rowValue >= start;
   			}
   		} else {
   			if(end.isValid){
   				return rowValue <= end;
   			}
   		}
   	}

    return false; //must return a boolean, true if it passes the filter.
}


function buildDateString(start, end){
    return {
        start,
        end,
    };
}

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