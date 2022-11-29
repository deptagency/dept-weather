#!/bin/bash
GEONAME_DATA_PATH=".dev/geoname-data/"
for f in $GEONAME_DATA_PATH*.txt
do
  filename=$(basename -- "$f")
  extension="${filename##*.}"
  echo "Writing hash for: $filename"
  filename="${filename%.*}"
  md5 -q "$f" > "$GEONAME_DATA_PATH$filename.md5"
done



