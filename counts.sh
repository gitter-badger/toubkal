#!/bin/sh
wc \
  lib/*js \
  lib/server/*js \
  test/*coffee test/*html test/http.js test/ec2.js \
  *sh package.json README.md todo.txt \
| sort -n