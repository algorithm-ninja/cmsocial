#!/bin/sh -e

#######################################################
##                                                   ##
##   Automatically add lessons with the associated   ##
##   tasks to the database.                          ##
##                                                   ##
#######################################################

[ -z "$2" ] && echo "Usage: $0 contest_id lesson_folder [lesson_folder [ ... ] ]"
[ -z "$2" ] && exit 1

CONTEST=$1

shift

TMP=$(mktemp)

trap "rm $TMP" EXIT TERM INT

echo BEGIN\; > $TMP

for lez in "$@"
do
    pushd "$lez"
    cat >> $TMP << EOF

    INSERT INTO lessons (title, access_level, contest_id)
        SELECT DISTINCT('${lez}'), 0, ${CONTEST} FROM lessons
        WHERE NOT EXISTS (
            SELECT 1 FROM lessons WHERE title = '${lez}' AND contest_id = ${CONTEST}
        );
    DELETE FROM lesson_tasks WHERE
        lesson_id IN (
            SELECT id
            FROM lessons
            WHERE lessons.title = '${lez}' AND lessons.contest_id = ${CONTEST}
        );
EOF
    for es in *
    do
        tname="Lez${lez#Lezione }${es}c${CONTEST}"
        ttitle=$(grep title\{ $es/testo.tex | sed 's/.*{\(.*\)}/\1/' | sed s/\\$//g)
        mkdir $tname
        mkdir $tname/{input,output,testo,att}
        count=0
        for cnt in $es/input*
        do
            cp $cnt $tname/input/input$count.txt
            cp $(echo $cnt | sed s/input/output/g) $tname/output/output$count.txt
            let count=$count+1
        done
        cp $es/testo.pdf $tname/testo/
        pushd $es
        zip ../$tname/att/TestSet.zip input* output*
        popd
        n_input=$(ls $es/input* | wc -l)
        cat > $tname/task.yaml << EOF
infile: ''
outfile: ''
memory_limit: 256
time_limit: 1
name: ${tname}
title: ${ttitle}
n_input: ${n_input}
token_mode: disabled
EOF
        pushd $tname
        cmsImportTask -u -c ${CONTEST} .
        popd
        rm -rf $tname
        cat >> $TMP << EOF
WITH lesson AS (
    SELECT *
    FROM lessons
    WHERE lessons.title = '${lez}' AND lessons.contest_id = ${CONTEST}
), 
count AS (
    SELECT COUNT(*)+1 AS c
    FROM lesson_tasks
    INNER JOIN lesson ON lesson_id = lesson.id
),
task AS (
    SELECT *
    FROM tasks
    WHERE tasks.name = '${tname}'
)
INSERT INTO lesson_tasks (lesson_id, num, task_id)
    SELECT lesson.id AS lesson_id, count.c AS num, task.id AS task_id
        FROM lesson INNER JOIN count ON 1=1 INNER JOIN task ON 1=1;

EOF
    done
    popd > /dev/null
done

echo COMMIT\; >> $TMP

cat $TMP

python2 << EOF
from cms.db import engine
from sqlalchemy import text
import logging
cmd = text(open("$TMP").read())
engine.execute(cmd)
EOF

