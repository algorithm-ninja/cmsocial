DEST=cmsocial/web
MAKEROOT=$(shell pwd)

WEBDIRS=$(shell find cmsocial-web -type d)
TMPDIRS=$(patsubst cmsocial-web/%,tmp/%,$(WEBDIRS))
DESTDIRS=$(patsubst cmsocial-web/%,$(DEST)/%,$(WEBDIRS))

JS=$(shell find cmsocial-web -type f -name '*.js')
LESS=$(shell find cmsocial-web -type f -name '*.less')
HTML=$(shell find cmsocial-web -type f -name '*.html')
DESTHTML=$(patsubst cmsocial-web/%,$(DEST)/%,$(HTML))
CSS=$(patsubst cmsocial-web/%.less,tmp/%.css,$(LESS))

.PHONY: all dirs other-files config-files clean distclean

all: $(DESTHTML) $(DEST)/styles/main.css $(DEST)/scripts/app.processed.js $(DEST)/bower_components other-files config-files | dirs

other-files: $(DEST)/robots.txt $(DEST)/images/loader.gif $(DEST)/__init__.py

config-files: $(DEST)/custom_images $(DEST)/favicon.ico $(DEST)/views/footer.html $(DEST)/views/homepage.html

config/%: | config/%.sample
	cp $| $@

node_modules: package.json
	npm install

dirs: $(DEST) tmp

$(DEST): cmsocial-web
	mkdir -p $(DESTDIRS)

tmp: cmsocial-web
	mkdir -p $(TMPDIRS)

$(DEST)/custom_images: config/custom_images | $(DEST)
	cp -r $^ $@

$(DEST)/favicon.ico: config/favicon.ico | $(DEST)
	cp $^ $@

$(DEST)/views/footer.html: config/footer.html | $(DEST)
	cp $^ $@

$(DEST)/views/homepage.html: config/homepage.html | $(DEST)
	cp $^ $@

$(DEST)/%.html: cmsocial-web/%.html | $(DEST)
	./instantiate.sh $< > $@

$(DEST)/styles/main.css: $(CSS)
	cat $^ > $@

tmp/%.css: cmsocial-web/%.less node_modules
	node_modules/.bin/lessc $< $@

$(DEST)/scripts/app.processed.js: $(JS)
	cat $^ > $@

$(DEST)/bower_components: $(DEST)/bower.json node_modules
	cd $(DEST) && $(MAKEROOT)/node_modules/.bin/bower install

$(DEST)/bower.json: bower.json
	cp $^ $@

$(DEST)/%: cmsocial-web/%
	cp $^ $@

clean:
	rm -rf tmp/ $(DEST)

distclean: clean
	rm -rf node_modules
