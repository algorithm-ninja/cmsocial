# CMSocial
A web application that builds a social coding platform upon [CMS](https://github.com/cms-dev/cms).

**This repository aims to be the successor of [oii-web](https://github.com/veluca93/oii-web), by cleaning up the codebase and by using a saner dependency model. Since right now this is in alpha stage, you may want to refer to the old repository in the meantime.**

## Installing cmsocial
Run `make` to build the web application (`make ONLINE=1` if you don't need local copies of the used libraries). Then run `python ./setup.py install`.

Create a configuration file `config/cmsocial.ini` (you can find an example in `config/cmsocial.ini.sample`) and install it by running  `cp config/cmsocial.ini /usr/local/etc/cmsocial.ini` as root.

Add service `PracticeWebServer` to `/usr/local/etc/cms.conf` in the `core_services` section.

## Database creation instructions
Here are the needed steps (after installing both cms and cmsocial).
You'll need an empty DB. If you initialized it when installing cms, clear it with `cmsDropDB` (obviously, you will loose all the data by doing so).

    python -c "import cmsocial.db; from cms.db import metadata; metadata.create_all()"
    psql cmsdb -U cmsuser < sql_scripts/create_triggers.sql

## Update for multicontest
Run the following:

    python -c "import cmsocial.db; from cms.db import metadata; metadata.create_all()"
    psql cmsdb -U cmsuser < sql_updaters/multicontest_update.sql

An analog procedure works for other updates.
Note: update scripts consist of a transaction ending with ROLLBACK - to actually run the script, you should change that to COMMIT.

Also note that if you installed cmsocial fom scratch, you don't need to run the updates.
