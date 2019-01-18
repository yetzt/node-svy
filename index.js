#!/usr/bin/env node

var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");

module.exports = function svy(filepath, opts){
	if (!(this instanceof svy)) return new svy(filepath, opts);
	var self = this;
	
	// keep opts
	self.opts = {};
	self.opts.path = path.resolve(process.cwd(), filepath);
	self.opts.encoding = (!!opts.encoding) ? opts.encoding : null;
	self.opts.delimiter = (typeof opts.delimiter !== 'undefined') ? Buffer.from(opts.delimiter) : Buffer.alloc(0);
	
	// has path been ensured
	self.pathchecked = 0;
	
	// object with file streams
	self.filestreams = {};

	// regularly check for filestreams to be closed
	setInterval(function(){
		Object.keys(self.filestreams).forEach(function(file){
			// check if stream wasn't used for 60 seconds
			if ((Date.now()-self.filestreams[file].last) > 10000) {
				// close file stream and remove from list
				self.filestreams[file].stream.end(function(){
					console.error("file stream '%s' closed after %d writes", file, self.filestreams[file].writes)
					delete self.filestreams[file];
				});
			}
		});
	},10000).unref();

	// return write function
	return function write(file, data, fn){
		if (typeof fn !== 'function') var fn = function(err){ if (err) console.error(err); };
		
		(function(done){
			if (self.pathchecked) return done();
			mkdirp(self.opts.path, function(err){
				if (err) return fn(err);
				done();
			});
		})(function(){
			
			// check if file stream is present
			(function(done){
				if (!!self.filestreams[file]) return done();
				
				// create file stream
				self.filestreams[file] = {
					stream: fs.createWriteStream(path.resolve(self.opts.path, file), {
						encoding: self.opts.encoding,
						flags: 'a',
					}),
					last: Date.now(),
					writes: 0,
				};
				
				done();
			})(function(){
				self.filestreams[file].stream.write(Buffer.concat([Buffer.from(data, self.opts.encoding), self.opts.delimiter]), function(err){
					if (err) return fn(err);
					self.filestreams[file].last = Date.now();
					self.filestreams[file].writes++;
					return fn();
				});
			});
			
		});
		
	};
};

