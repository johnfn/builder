# meh

how2setup:

    bower install phaser
    bower install backbone
    bower install jquery

how2run client:

    tsc -w src/*.ts --out src/main.js --target ES5

how2run server:

    tsc -w server/server.ts --target ES5 --module commonjs
    node server/server-core.js

Go to http://localhost:8000
