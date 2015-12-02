#!/bin/bash
IDENTIFIER="[a-zA-Z0-9_]*"
TMP=$(mktemp)
cp "$1" "$TMP"
SECTION=""
while read L; do
  if echo $L | grep \# > /dev/null
  then
    continue
  fi

  if echo $L | grep "^\\[$IDENTIFIER\\]$" > /dev/null
  then
    SECTION=$(echo $L | grep -o "$IDENTIFIER")
  fi

  if [ $SECTION = 'core' ]
  then
    if echo $L | grep "^$IDENTIFIER = .*$" > /dev/null
    then
      ESCAPED=$(echo $L | sed 's_/_\\/_g' | sed 's/ = /=/')
      KEY=$(echo $ESCAPED | cut -d = -f 1)
      VALUE=$(echo $ESCAPED | cut -d = -f 2)
      sed -i "s/\[\[$KEY\]\]/$VALUE/g" $TMP
    fi
  fi
done < config/cmsocial.ini

cat $TMP
rm $TMP
