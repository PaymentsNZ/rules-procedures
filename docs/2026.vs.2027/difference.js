const pageName = location.pathname.split("/").pop().replace(/\.html$/, "");
const response = await fetch(`results/${pageName}.json`);

if (!response.ok) {
    throw new Error(
        `Unable to load change data: ${response.status} ${response.statusText}`
    );
}

const changes = await response.json();

const detailWindow = document.getElementById("detailWindow");
const detailTitle = document.getElementById("detailTitle");
const detailTitleText = document.getElementById("detailTitleText");
const detailClose = document.getElementById("detailClose");
const detailBody = document.getElementById("detailBody");

// showDetail
function showDetail(cell) {
    const value = cell.getValue();
    if (!value) {
        return;
    }

    const row = cell.getRow().getData();
    const field = cell.getField();

    if (
        row.ElementName === "MinOccurs" ||
        row.ElementName === "MaxOccurs"
    ) {
        return;
    }

    detailTitleText.textContent =`${field} — ${row.ElementName}`;
    detailBody.textContent = value;

    if (detailWindow.style.display !== "flex") {
        detailWindow.style.display = "flex";
        detailWindow.style.left = `${(window.innerWidth - detailWindow.offsetWidth) / 2}px`;
        detailWindow.style.top = `${(window.innerHeight - detailWindow.offsetHeight) / 2}px`;
    }
}


detailClose.addEventListener("click", () => {
    detailWindow.style.display = "none";
});


let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;


detailTitle.addEventListener("pointerdown", event => {

    if (event.target === detailClose) {
        return;
    }

    dragging = true;

    const rect = detailWindow.getBoundingClientRect();

    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;

    detailTitle.setPointerCapture(event.pointerId);
});


detailTitle.addEventListener("pointermove", event => {

    if (!dragging) {
        return;
    }

    let left = event.clientX - dragOffsetX;
    let top = event.clientY - dragOffsetY;

    /*
     * Keep at least the title bar inside the viewport.
     */
    const minimumVisibleWidth = 100;
    const titleHeight = detailTitle.offsetHeight;

    left = Math.min(
        left,
        window.innerWidth - minimumVisibleWidth
    );

    left = Math.max(
        left,
        -(detailWindow.offsetWidth - minimumVisibleWidth)
    );

    top = Math.max(
        0,
        Math.min(
            top,
            window.innerHeight - titleHeight
        )
    );

    detailWindow.style.left = `${left}px`;
    detailWindow.style.top = `${top}px`;
});


detailTitle.addEventListener(
	"pointerup",
	event => {
    	dragging = false;
    	detailTitle.releasePointerCapture(event.pointerId);
	}
);


detailTitle.addEventListener(
	"pointercancel",
	() => {
    	dragging = false;
	}
);

// detailFormatter
function detailFormatter(cell) {
    const row = cell.getRow().getData();    
    const value = cell.getValue();
    const elementName = cell.getRow().getData().ElementName;

    if (elementName === "MinOccurs" || elementName === "MaxOccurs") {
        if (row.Operation === "Add" && cell.getField() === "Previous") {
            return "1";
        }
        if (row.Operation === "Remove" && cell.getField() === "Current") {
            return "1";
        }
        return value.replace(/^"|"$/g, "");
    }

    if (value == null) {
        return "";
    }

    return "<span class='detail-link'>View</span>";
}

// multiValueFilter
function multiValueFilter(selectedValues, rowValue) {

    if (!selectedValues || selectedValues.length === 0) {
        return true;
    }
    setFilterIndicator(column, active);    

    return selectedValues.includes(rowValue);
}

// operationFormatter
function operationFormatter(cell) {
    const value = cell.getValue();
    if (!value) {
        return "";
    }

    const className = `operation-${value.toLowerCase()}`;
    return `<span class="${className}">${value}</span>`;
}

// makeCheckboxFilter
function makeCheckboxFilter(field) {
    const selected = new Set();

    return function(e, column) {

        const table = column.getTable();

        const values = [
            ...new Set(
                table.getData()
                    .map(row => row[field])
                    .filter(value => value !== null && value !== undefined)
            )
        ].sort();

        /*
        * First open = everything selected.
        */
        if (selected.size === 0) {
            values.forEach(value => selected.add(value));
        }

        const popup = document.createElement("div");
        popup.className = "checkbox-filter";

        const controls = document.createElement("div");
        controls.className = "checkbox-filter-controls";

        const selectAll = document.createElement("button");
        selectAll.textContent = "Select All";

        const clearAll = document.createElement("button");
        clearAll.textContent = "Clear";

        controls.append(selectAll, clearAll);
        popup.appendChild(controls);

        const items = document.createElement("div");
        items.className = "checkbox-filter-items";

        function applyFilter() {

            /*
            * Remove any previous filter created for this field.
            */
            table.removeFilter(filterFunction);

            /*
            * All selected = effectively no filter.
            */
            const active = selected.size !== values.length;

            if (active) {
                table.addFilter(filterFunction);
            }

            column.getElement().classList.toggle("filter-active",active);
        }

        function filterFunction(row) {
            return selected.has(row[field]);
        }

        function refreshCheckboxes() {
            items
                .querySelectorAll("input[type=checkbox]")
                .forEach(input => {
                    input.checked = selected.has(input.value);
                });
        }

        for (const value of values) {

            const label = document.createElement("label");
            label.className = "checkbox-filter-item";

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.checked = selected.has(value);

            checkbox.addEventListener("change", () => {

                if (checkbox.checked) {
                    selected.add(value);
                } else {
                    selected.delete(value);
                }

                applyFilter();
            });

            const text = document.createElement("span");
            text.textContent = value;

            label.append(checkbox, text);
            items.appendChild(label);
        }

        selectAll.addEventListener("click", () => {
            values.forEach(value => selected.add(value));
            refreshCheckboxes();
            applyFilter();
        });

        clearAll.addEventListener("click", () => {
            selected.clear();
            refreshCheckboxes();
            applyFilter();
        });

        popup.appendChild(items);

        return popup;
    };
}

// setFilterIndicator
function setFilterIndicator(column, active) {
    const header = column.getElement();
    header.classList.toggle("filter-active", active);
}

// Tabulator
const table = new Tabulator(
	"#table",
	{
		data: changes,

		//height: "100vh",
		layout: "fitColumns",
		movableColumns: true,

		columns: [
			{
				title: "Parent Path",
				field: "ParentPath",
				headerFilter: "input",
				minWidth: 300
			},
			{
				title: "Element",
				field: "ElementName",
				width: 150,

				//headerFilter: "list",
				headerFilterParams: {
					valuesLookup: true,
					multiselect: true,
					clearable: true
				},
				headerFilterFunc: multiValueFilter,
				headerFilterEmptyCheck: value => (!value || value.length === 0),
				headerPopup: makeCheckboxFilter("ElementName"),
                headerPopupIcon: `
                <span class="filter-icon" title="Filter">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"/>
                    </svg>
                </span>
                `
			},
			{
				title: "Operation",
				field: "Operation",
				width: 100,

				formatter: operationFormatter,

				//headerFilter: "list",
				headerFilterParams: {
					valuesLookup: true,
					multiselect: true,
					clearable: true
				},
				headerFilterFunc: multiValueFilter,
				headerFilterEmptyCheck: value => (!value || value.length === 0),
				headerPopup: makeCheckboxFilter("Operation")            
			},
			{
				title: "Descendants",
				field: "DescendantElementCount",
				sorter: "number",
				hozAlign: "center",
				width: 120
			},
			{
				title: "Depth",
				field: "DescendantElementDepth",
				sorter: "number",
				hozAlign: "center",
				width: 90
			},
			{
				title: "Previous",
				field: "Previous",

				formatter: detailFormatter,

				cellClick: (event, cell) => {
					showDetail(cell);
				},

				width: 100,
				hozAlign: "center"
			},
			{
				title: "Current",
				field: "Current",

				formatter: detailFormatter,

				cellClick: (event, cell) => {
					showDetail(cell);
				},

				width: 100,
				hozAlign: "center"
			}
		]
	}
);