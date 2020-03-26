cp index.js build/extend-me.js

# BUILD MINIFIED FILE w/uglify

if ! [ -a /usr/local/bin/uglifyjs ]; then
npm install -g uglify-js
fi

uglifyjs index.js -cmo build/extend-me.min.js

ls -lahL build/extend-me.*
