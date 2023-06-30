const express = require('express')
const moment = require('moment')
const path = require('path')
const fs = require('fs')
const extract = require('extract-zip')

const app = express()

const appArgs = process.argv.slice(2)

const DAYLIO_BACKUP = appArgs[0]

let daylio_data


/* 
======= R E N D E R    D A T A ( ID Ordered Entries ) ======
*
* => Used by pug to render the entry elements ( static )
* => Responsible for their ids, groups and non-human-readable data
*/

function getRenderData(raw_data) {

  /* Render data format:

    [ <----- The array that holds all the entries ( newest first )

      index: { <---- Entry object

        id:..,
        mood: ...,
        date: ...,
        ...

      }

      ...

    ]


  */

  var entry_data = []
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday "]

  for (const daily_entry in raw_data.dayEntries) {

    const current_entry = raw_data.dayEntries[daily_entry]

    const time_obj = moment.unix((current_entry.datetime + current_entry.timeZoneOffset ) / 1000).utc()

    const date_formatted = time_obj.format("Do MMM YYYY")
    const time_formatted = time_obj.format("hh:mm A")

    const day = daysOfWeek[time_obj.day()]

    // Rich text editor exports notes with markdown template by default, but the mini editor doesn't
    const note_formatted = (current_entry.note).replaceAll(`\n`,"<br>")

    entry_data[daily_entry] = {
      id: current_entry.id,
      time: time_formatted,
      date: `${current_entry.day}-${current_entry.month}-${current_entry.year}`,
      date_formatted: date_formatted,
      day: day,
      journal: [current_entry.note_title, note_formatted],
      mood: current_entry.mood,
      activities: current_entry.tags
    }

  }

  return entry_data

}

/* 
======= R E A D A B L E   D A T A ======
*
* => Used by pug to get the human readable data
* => Responsible for showing activity names, groups, and mood names
*
*/
function getReadableData(raw_data) {

  /* Readable data format:

    {

      activities: { <---- Object that holds all the activities

        activity_id: { <--- Activity Object

          name: ...
          id: ...
          group: ...

        }
  
      }

      moods: { ... }  

      ...

    }

  */

  // Iteration is necessary since the exported entries come in 'array/s' rather than 'object/s'.
  // Conversion of UNORDERED ARRAY into an ID OBJECT

  var activities = {}
  var activity_groups = {} 

  for (const i in raw_data.tags) {

      activities[raw_data.tags[i].id] = {}

      activities[raw_data.tags[i].id].name = raw_data.tags[i].name
      activities[raw_data.tags[i].id].group = raw_data.tags[i].id_tag_group
      activities[raw_data.tags[i].id].icon = raw_data.tags[i].icon

  }


  for (const i in raw_data.tag_groups) {
    activity_groups[raw_data.tag_groups[i].id] = raw_data.tag_groups[i].name
  }

  var moods = {}
  var mood_groups = {}

  var ordered_mood_list = []

  for (const i in raw_data.customMoods) {

    moods[raw_data.customMoods[i].id] = raw_data.customMoods[i].custom_name
    mood_groups[raw_data.customMoods[i].id] = raw_data.customMoods[i].mood_group_id
    ordered_mood_list[i] = raw_data.customMoods[i].custom_name

  }

  let vital_data = {

    available_activities: activities,
    available_activity_groups: activity_groups,
    available_moods: moods,
    available_mood_groups: mood_groups,
    ordered_mood_list: ordered_mood_list,

    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  }

  return vital_data
}

/* 
======= S T R U C T U R E D   D A T A ======
*
* => Only used by the frontend js
* => Responsible for showing ordered date info ( entry )
*
*/ 
function getStructuredEntries() {

    /* Structured data format:

        year: {

            month: {

                day: mood
                ...
            }
            
            month: {
                ...
            }

            ...
        }

        year: {...}

    */

    var structuredData = {}


    let ENTRY_DATA = getRenderData(daylio_data)
    let VITAL_DATA = getReadableData(daylio_data)

    // Iterating through unstructured data ( Array-like )

    for (entry in ENTRY_DATA) {

        // Parsing date ( there are better ways, but this hack would work )
        entryYear = (ENTRY_DATA[entry].date).split('-')[2]
        entryMonth = (ENTRY_DATA[entry].date).split('-')[1]
        entryDay = (ENTRY_DATA[entry].date).split('-')[0]

        entryMood = VITAL_DATA.available_mood_groups[ ENTRY_DATA[entry].mood ]

        /*
        * NOTE: Daylio uses a 5 point based mood group ( regardless of its child moods )
        *
        *   => Moods in the same group have the same mood score ( 1 - 5 )
        *   => Awful being 5 and Happy being 1
        *
        * NOTE: To make more sense, the highest mood ( Awful ) should be the bottom and the lowest ( Happy ) should be the top
        * 
        *   => So, swapping the scores with a reversed array ( 1 -> 5, 5 -> 1 ... )
        */   
        reverseMoodData = [ 5, 4, 3, 2, 1 ]
        entryMood = reverseMoodData[ entryMood - 1 ]


        /*
        * NOTE:
        *
        * => 1 If year doesn't exist in the data, create a new object
        * => 2 If month doesn't exist in the year, create a new object
        *
        * => 3 If day doesn't exist in the month, set the value. If it does, average their value ( works for multiple entries )
        */ 

        // 1
        if (!structuredData[entryYear])
            structuredData[ entryYear ] = {}

        // 2
        if (!structuredData[entryYear][entryMonth])
            structuredData[ entryYear][ entryMonth] = {}

        // 3
        if (structuredData[entryYear][entryMonth][entryDay]) {

            structuredData[ entryYear ][ entryMonth ][ entryDay ] += entryMood
            structuredData[ entryYear ][ entryMonth ][ entryDay ] /= 2

        } else {
            structuredData[ entryYear ][ entryMonth ][ entryDay ] = entryMood
        }


    }

    return structuredData

}

// ======= M E T A D A T A ======
function getMetadata(raw_data) {
  metadata = {

    longestDaysInRow: raw_data.daysInRowLongestChain,
    numberOfEntries: raw_data.metadata.number_of_entries
  }

  return metadata
}


async function extractDaylioBackup() {

  try {
    await extract(__dirname + '/' + DAYLIO_BACKUP, { dir: __dirname + '/data/' })
  } catch (err) {
    console.log(err)
  }

}

// Only copies the icons that have been used in the tags
function prepareIcons() {

  // If needed, change these values
  const PUBLIC_ICONS = '/public/assets/activity_icons'
  const LOCAL_ICONS = '/activity_icons'

  availableActivities = getReadableData(daylio_data).available_activities

  console.log(`info: loading ${Object.keys(availableActivities).length} icons`)

  if (fs.existsSync(__dirname + PUBLIC_ICONS)) {
    fs.rmSync(__dirname + PUBLIC_ICONS,  { recursive: true, force: true })
  }

  fs.mkdirSync(__dirname + PUBLIC_ICONS)

  for (const i in availableActivities) {

    let iconId = availableActivities[i].icon

    if (fs.existsSync(__dirname + `${LOCAL_ICONS}/ic_${iconId}.png`)) {
      fs.copyFileSync(__dirname + `${LOCAL_ICONS}/ic_${iconId}.png`, __dirname + `${PUBLIC_ICONS}/ic_${iconId}.png` )
    } else {
      console.log(`error: no icon found - ${iconId}`)
    }

  }

}

function prepareServer() {

  console.log('info: decoding data')

  // Decodes and loads the base64-encoded data
  // NOTE: Having this file decoded PREVENTS 'accidental' data disclosure
  let rawData = fs.readFileSync(__dirname + "/data/backup.daylio").toString()
  let bufferData = new Buffer.from(rawData, 'base64')
  daylio_data = JSON.parse(bufferData.toString('utf-8'))

  prepareIcons()

}

function loadServer() {

  let ENTRY_DATA = getRenderData(daylio_data)
  let VITAL_DATA = getReadableData(daylio_data)
  let META_DATA = getMetadata(daylio_data)

  app.get('/', (req, res) => {
    res.render('index', {
      title: "Daylio",
      entry_data: ENTRY_DATA,
      vital_data: VITAL_DATA,
      metadata: META_DATA
    })
  })

  /*
  * FOR CLIENT SIDE
  */
  app.get('/vital', (req, res) => {
      res.json( VITAL_DATA )
  })

  app.get('/entries', (req, res) => {
      res.json( ENTRY_DATA )
  })

  app.get('/structured_data', (req, res) => {
      res.json( getStructuredEntries() )
  })


  app.set('view engine', 'pug')

  app.use(express.static(__dirname + '/public'))

  const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`info: running → http://localhost:${server.address().port}/`)
  })

}

async function main() {

  console.log('info: starting server')

  if (!fs.existsSync(__dirname + '/data/')) {
    fs.mkdirSync(__dirname + '/data/')
  }

  if (DAYLIO_BACKUP) {

    console.log(`info: loading backup - ${DAYLIO_BACKUP}`)
    await extractDaylioBackup()

  } else {

    if (!fs.existsSync(__dirname + '/data/backup.daylio')) {
      console.log(`error: no previous backups found - pass the '.daylio' file as an argument`)
      return
    } else {
      console.log('info: found backup')
    }

  }
  prepareServer()
  loadServer()

}

main()