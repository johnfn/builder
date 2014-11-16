# meh

how2setup:

    bower install phaser
    bower install backbone
    bower install jquery

how2run client:

    python -m SimpleHTTPServer
    tsc -w src/*.ts --out src/main.js --target ES5

how2run server:

    tsc -w server/server.ts --target ES5 --module commonjs
