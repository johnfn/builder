# meh

how2setup:

    bower install phaser
    bower install backbone
    bower install jquery
    npm install -g nodemon

how2run:

    tsc -w src/*.ts server/*.ts shared/*.ts --target ES5
    nodemon server/server-core.js

Go to http://localhost:8000
