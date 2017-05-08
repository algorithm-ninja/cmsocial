DEST=cmsocial-web-build
MAKEROOT=$(shell pwd)
SHELL := /bin/bash

PROD ?= 0
ONLINE ?= $(PROD)

ifeq ($(ONLINE), 1)
CDNFLAGS=
else
CDNFLAGS=--use-local
endif

ifeq ($(PROD), 1)
STRIPDEBUG=sed '/<!-- *start  *debug *-->/,/<!-- *end  *debug *-->/d'
UGLIFY=node_modules/.bin/uglifyjs
BABEL=node_modules/.bin/babel --
else
STRIPDEBUG=cat
UGLIFY=cat
BABEL=node_modules/.bin/babel --
endif

WEBDIRS=$(shell find cmsocial-web -type d)
TMPDIRS=$(patsubst cmsocial-web%,tmp%,$(WEBDIRS))
DESTDIRS=$(patsubst cmsocial-web%,$(DEST)%,$(WEBDIRS))

JS=$(shell echo cmsocial-web/scripts/app.js; find cmsocial-web -type f -name '*.js' -and -not -name 'app.js' | sort)
LESS=$(shell find cmsocial-web -type f -name '*.less')
HTML=$(shell find cmsocial-web -type f -name '*.html')
DESTHTML=$(patsubst cmsocial-web/%,$(DEST)/%,$(HTML))
CSS=$(patsubst cmsocial-web/%.less,tmp/%.css,$(LESS))
TMPJS=$(patsubst cmsocial-web/%.js,tmp/%.js,$(JS))

COMMITID=$(shell git rev-parse HEAD)

.PHONY: all dirs other-files config-files js-deps clean distclean jshint bsync

all: $(DESTHTML) $(DEST)/styles/main.css $(DEST)/scripts/app.$(COMMITID).js js-deps other-files config-files | dirs

other-files: $(DEST)/robots.txt $(DEST)/images/loader.gif $(DEST)/__init__.py

config-files: $(DEST)/custom_images $(DEST)/favicon.ico $(DEST)/views/footer.html $(DEST)/views/homepage.html

ifeq ($(ONLINE), 1)
js-deps:
else
js-deps: $(DEST)/node_modules
endif

config/%: | config/%.sample
	cp $| $@

node_modules: package.json
	npm install
	touch node_modules

dirs: $(DEST) tmp $(DEST)/__init__.py

$(DEST): cmsocial-web
	mkdir -p $(DESTDIRS)
	touch $(DEST)

$(DEST)/__init__.py: cmsocial-web/__init__.py
	cp cmsocial-web/__init__.py $@

tmp: cmsocial-web
	mkdir -p $(TMPDIRS)
	cp cmsocial-web/.babelrc tmp
	touch tmp

$(DEST)/custom_images: config/custom_images | $(DEST)
	cp -r $^ $@

$(DEST)/favicon.ico: config/favicon.ico | $(DEST)
	cp $^ $@

$(DEST)/views/footer.html: config/footer.html | $(DEST)
	cp $< $@

$(DEST)/views/homepage.html: config/homepage.html | $(DEST)
	cp $< $@

$(DEST)/index.html: cmsocial-web/index.html node_modules | $(DEST)
	node_modules/.bin/cdnify $(CDNFLAGS) $< | $(STRIPDEBUG) > $@
	sed "s/COMMIT_ID_HERE/$(COMMITID)/" -i $@

$(DEST)/%.html: cmsocial-web/%.html | $(DEST)
	cat $< | $(STRIPDEBUG) > $@

$(DEST)/styles/main.css: $(CSS)
	cat $^ > $@

tmp/%.css: cmsocial-web/%.less node_modules | tmp
	node_modules/.bin/lessc $< $@

$(DEST)/scripts/app.$(COMMITID).js: $(TMPJS) | node_modules
	${BABEL} $^ | ${UGLIFY} > $@

tmp/%.js: cmsocial-web/%.js | tmp
	cat $< | $(STRIPDEBUG) > $@

$(DEST)/node_modules: node_modules
	ln -s ../node_modules $(DEST)/node_modules
	touch $(DEST)/node_modules

$(DEST)/%: cmsocial-web/%
	cp $^ $@

clean:
	rm -rf tmp/ $(DEST) build/ cmsocial.egg-info/ dist/

distclean: clean
	rm -rf node_modules

jshint:
	./node_modules/.bin/jshint --reporter=node_modules/jshint-stylish $(JS)
