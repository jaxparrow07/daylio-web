
// ====== D A T A ======

// Mood names, activity names, ids
let VITAL_DATA
// Entries
let ENTRY_DATA
// Date structured entries
let STRUCTURED_DATA

const moodMaterialIcon = [ "sentiment_very_satisfied", "sentiment_satisfied", "sentiment_neutral", "mood_bad", "sentiment_very_dissatisfied"  ]


// ====== S E A R C H ======

function isThere(object, segment) {
    return object.toUpperCase().indexOf(segment) > -1
}

function filterEntries() {
    var input, filter, list_item, list_view, i
    input = document.getElementById("entry-search")
    filter = input.value.toUpperCase()

    // Main list item holder
    list_view = document.getElementById("entry-list-view")

    // Child elements by class name used
    list_item = list_view.getElementsByClassName("entry-list-item")
    
    for (i = 0; i < list_item.length; i++) {

        entryId = list_item[i].dataset.entryId

        // Data to check
        entry_date = ENTRY_DATA[entryId].date_formatted
        journal_entry = ENTRY_DATA[entryId].journal[1]
        journal_title = ENTRY_DATA[entryId].journal[0]
        mood_name = VITAL_DATA.available_moods[ ENTRY_DATA[entryId].mood ]

        if ( isThere(entry_date, filter) || isThere(journal_entry, filter) || isThere(journal_title, filter) || isThere(mood_name, filter) ) {
            list_item[i].classList.remove("visually-hidden")
        } else {
            list_item[i].classList.add("visually-hidden")
        }

    }
}

// ====== E N T R Y ======
function loadEntry(element) {

    // Setting other buttons to default state and the current one to active for visual feedback ( list items ) 
    document.querySelectorAll('.entry-list-item').forEach(occurence => {
      occurence.classList.remove('active')

    })

    // pass null to reset the active state of all buttons
    if (!element)
        return

    element.classList.add('active')

    // Toggling visibility
    document.getElementById("dashboard-holder").classList.add("visually-hidden")
    document.getElementById("entryview-holder").classList.remove("visually-hidden")


    let entryId = element.dataset.entryId

    // Resetting the activity dots to default
    document.querySelectorAll('.ac-item').forEach(occurence => {
      occurence.classList.remove('activity-dot-active')

    })

    // For each activity this entry has, toggle the respective activity dot 
    let activities = ENTRY_DATA[entryId].activities
    if (activities.length > 1) {
        activities.forEach(item => {
            document.getElementById(`ac-item-${item}`).classList.add('activity-dot-active')
        })

    }

    // Setting data

    let entryNote = ENTRY_DATA[entryId].journal[1]


    document.getElementById('entry-title').innerHTML = ENTRY_DATA[entryId].journal[0] || ENTRY_DATA[entryId].date_formatted
    document.getElementById('entry-time').innerHTML =  ENTRY_DATA[entryId].time
    document.getElementById('entry-activity-count').innerHTML =  Object(ENTRY_DATA[entryId].activities).length + " activities"
    document.getElementById('entry-mood-text').innerHTML = VITAL_DATA.available_moods[ ENTRY_DATA[entryId].mood ]

    document.getElementById('entry-mood-icon').innerHTML = moodMaterialIcon[ VITAL_DATA.available_mood_groups[ [ENTRY_DATA[entryId].mood ] ] - 1]

    document.getElementById('entry-day').innerHTML = ENTRY_DATA[entryId].day

    document.getElementById('entry-note-viewer').classList.remove("visually-hidden")
    document.getElementById('entry-note-body').innerHTML = entryNote
    if (!entryNote)
        document.getElementById('entry-note-viewer').classList.add("visually-hidden")


}

// ======================= L I S T E N E R    F U N C T I O N S =======================

const SearchInputHandler = function() {
  filterEntries()
}


const toggleTheme = function() {

    // Bootstrap attribute ->

    if (document.querySelectorAll('body')[0].dataset.bsTheme === "dark") {
        document.getElementById("change-theme").innerHTML = "dark_mode"
        document.querySelectorAll('body')[0].dataset.bsTheme = "light"
    } else {
        document.getElementById("change-theme").innerHTML = "light_mode"
        document.querySelectorAll('body')[0].dataset.bsTheme = "dark"
    }

    localStorage.setItem("theme", document.querySelectorAll('body')[0].dataset.bsTheme );

        
}

// Activity group collapse/show
const collapseToggle = function(groupId) {

    const collapseButton = document.getElementById(`ac-group-${groupId}-collapse`)
    const collapseView = document.getElementById(`ac-group-${groupId}-items`)

    if (collapseButton.classList.contains('collapsed')) {
        collapseButton.classList.remove("collapsed")
        collapseView.classList.remove("visually-hidden")
    } else {
        collapseButton.classList.add("collapsed")
        collapseView.classList.add("visually-hidden")
    }

}

const closeEntry = function() {
    document.getElementById("dashboard-holder").classList.remove("visually-hidden")
    document.getElementById("entryview-holder").classList.add("visually-hidden")
    loadEntry(null)

}

// Collapse/show all activity groups
const toggleAllActitivites = function() {
    document.querySelectorAll('.ac-group-header').forEach(occurence => {
        collapseToggle(occurence.dataset.groupId)

    })
}

// When a year has been selected in the dropdown selector, update the month dropdown ( to the top enabled one ), and the graph
const updateMoodGraphMonths = function() {

    year = document.getElementById("mood-graph-year").value
    month = document.getElementById("mood-graph-month")

    var isSelected = false

    // Only enable the available months
    month.querySelectorAll('option').forEach(occurence => {

        occurence.selected = false

        occurence.disabled = false

        if (!STRUCTURED_DATA[year][String(occurence.value)]) {
            occurence.disabled = true

        } else {

            if (!isSelected) {
                occurence.selected  = true
                isSelected = true
            }

        }
    })

    loadMoodChart(getMonthMoodArray( year, month.value ))

}

// When a month has been selected in the dropdown selector, update the graph
const updateMoodGraph = function() {

    year = document.getElementById("mood-graph-year").value
    month = document.getElementById("mood-graph-month").value

    loadMoodChart(getMonthMoodArray(year, month))

}


function initListeners() {

    entry_search = document.getElementById("entry-search")
    entry_search.addEventListener('input', SearchInputHandler)
    entry_search.addEventListener('propertychange', SearchInputHandler)

    document.getElementById("change-theme").addEventListener('click', toggleTheme)
    document.getElementById("close-entry").addEventListener('click', closeEntry)
    document.getElementById("ac-toggle-all").addEventListener('click', toggleAllActitivites)

    document.getElementById("mood-graph-year").addEventListener('change', updateMoodGraphMonths)
    document.getElementById("mood-graph-month").addEventListener('change', updateMoodGraph)

    document.querySelectorAll('.entry-list-item').forEach(occurence => {

      occurence.addEventListener('click', function() {
        loadEntry(occurence)
      })

    })

    document.querySelectorAll('.ac-group-header').forEach(occurence => {

      occurence.addEventListener('click', function() {
        collapseToggle(occurence.dataset.groupId)
      })

    })

}

// ======================= D A T A    F U N C T I O N S =======================
/*
    NOTE: Some of these might not be the efficient/best way of getting things done

*/

// Returns one mood per mood group ( only 5 moods )
function getMinimalMoodList() {

    minimalMoodList = []

    for (allMood in VITAL_DATA.available_moods) {
        if (!minimalMoodList[ VITAL_DATA.available_mood_groups[allMood] ]) 
            minimalMoodList[ VITAL_DATA.available_mood_groups[allMood] ] = VITAL_DATA.available_moods[allMood]
    }

    return minimalMoodList.reverse()

}


// Returns an array ( data series )
function getMonthMoodArray(year, month) {

    mStructuredData = STRUCTURED_DATA

    monthData = mStructuredData[year][month]

    moodDataArray = []

    for (let i = 0; i < 32; i++) {
        moodDataArray[i - 1] = monthData[i] || null
    }

    return moodDataArray

}

// ======================= V I S U A L =======================

function loadMoodChart(dataSeries) {

    var data = {
      labels: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31' ],
      series: [ dataSeries ]
    }
    var options = {
      axisY: {
        onlyInteger: false,
        labelInterpolationFnc: function(value, index) {
          return getMinimalMoodList()[index -1]
        },
        stretch: true,
        offset: 50
      },
      axisX: {
        offset: 20
      },
      high: getMinimalMoodList().length + 2,
      low: 0,
      showArea: true,
      showLine: true,
      showPoint: false,
      fullWidth: true,
      chartPadding: {
        top: 0,
        right: 20,
        left: 20

      }
    }
    let mChartist = new Chartist.Line('.ct-chart', data, options)

}

// YEAR and MONTH selection ( dropdowns )
function loadDateDropDowns() {

    let yearHolder = document.getElementById("mood-graph-year")
    let monthHolder = document.getElementById("mood-graph-month")

    let yearArray = Object.keys(STRUCTURED_DATA).reverse()

    for ( yearItem in yearArray ) {
        let option = document.createElement("option")
        option.value = yearArray[yearItem]
        option.text = yearArray[yearItem]
        yearHolder.add(option)
    }

    updateMoodGraphMonths()

    loadMoodChart(getMonthMoodArray( yearArray[0]  , monthHolder.value ))

}

function loadMain() {
    document.getElementById("loader-div").classList.add("visually-hidden")
    document.getElementById("main-div").classList.remove("visually-hidden")
}

// ======================= E N T R Y =======================

async function main() {

    if(document.querySelectorAll('body')[0].dataset.bsTheme != localStorage.getItem("theme"))
        toggleTheme()


    initListeners()

    /*
    * FROM SERVER SIDE
    */
    await fetch('/vital')
    .then((response) => response.json())
    .then((json) => {
        VITAL_DATA = json
    })

    await fetch('/entries')
    .then((response) => response.json())
    .then((json) => {
        ENTRY_DATA = json
    })

    await fetch('/structured_data')
    .then((response) => response.json())
    .then((json) => {
        STRUCTURED_DATA = json
    })


    loadDateDropDowns()
    loadMain()

}

main()