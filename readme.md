# svy

a savvy file writer for data. can write data in different files and auto-closes unused files. 

## usage

``` javascript

var svy = require("svy");

var write = svy("path/to/write", { encoding: "utf8", delimiter: "\n" });

write("file.json", JSON.stringify({ hello: 'world' }));

```