#!/bin/sh -e

[ -z "$2" ] && echo "Usage: $0 contest_id lessons.zip"

SCRIPTDIR=$(dirname $(realpath $0))
DIR=$(mktemp -d)

trap "cd / && rm -rf ${DIR}" INT TERM EXIT

cd ${DIR}
unzip $2
${SCRIPTDIR}/import_lessons.sh $1 Lezione\ *
