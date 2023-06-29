# daylio-web

An unofficial daylio client ( read-only now ), to view your entries, notes, and moods in your browser locally using your **Daylio Backup**.

Written in node.js

## Demo
#### Dashboard

![demo](https://github.com/jaxparrow07/daylio-web/assets/36300128/cd9ca01e-b599-4b32-bdc5-5104283c52f9)

#### Screenshots
| ![dark_activities](https://github.com/jaxparrow07/daylio-web/assets/36300128/3394db27-b736-40e9-95c5-5851ff491562) |![light_note](https://github.com/jaxparrow07/daylio-web/assets/36300128/03895b72-3f18-4888-acbd-51a54fb8054f) |
|---|---|

## Running

**If you haven't already, install [node.js](https://nodejs.org/en)**

* Clone or download this repo
* [Export](#exporting-your-daylio-entries--backup-) your **Daylio** backup ( **.daylio file** ) and copy it to the repo directory
* Then, execute the following commands
```sh
  npm i
  node server.js <daylio backup file>
```
   _NOTE : The `node` and `npm` would differ depending on the platform you're using._

* Open the url displayed in the terminal )

```sh
node server.js backup_2023_06_26.daylio
  
info: starting server
info: loading backup - backup_2023_06_26.daylio
info: decoding data
info: loading 55 icons
info: running → http://localhost:5000/
```

**You'll only have to pass the daylio backup once, it'd be extracted ( encoded format ) in the `data` folder.**

To update your local entry backup, re-run the server while passing your new daylio backup.

## Features

- Light/dark mode
- Monthly mood graph
- Activities ( with icons )
- Moods
- Notes
- Search
- Adding Entries [ TO-DO ]
- Goals [ TO-DO ]

#### Code Snippet
* Chartist line animation: [Pen](https://codepen.io/sdras/pen/oxNmRM)
## Help

### Exporting your daylio entries ( backup )
* Goto `More > Backup & Restore > Advanced Options`
* Hit `Export` and save the file

## Uses
#### CSS
 - [Bootstrap](https://getbootstrap.com/)
 - [Chartist](https://gionkunz.github.io/chartist-js/)
 - [Material Icons](https://fonts.google.com/icons)
 
#### Packages
 - [Express.js](https://expressjs.com/) ( web server )
 - [Pug.js](https://pugjs.org/) ( HTML pre-processor )
 - [Moment.js](https://momentjs.com/)
 - Other
    * path
    * fs 
    * extract-zip

#### Icon assets
I pulled the activity icons from the Daylio app using apktool.
**I DON'T OWN THEM**