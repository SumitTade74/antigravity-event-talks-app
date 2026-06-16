#!/bin/bash

# Target directories
IMAGES_DIR="Images"
DOCS_DIR="Documents"
VIDEOS_DIR="Videos"

# Ensure target directories exist
mkdir -p "$IMAGES_DIR" "$DOCS_DIR" "$VIDEOS_DIR"

echo "Scanning folder for files to organize..."
moved_count=0

# Move images (.jpg, .jpeg, .gif)
for file in *; do
    if [[ -f "$file" ]]; then
        ext="${file##*.}"
        ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
        
        if [[ "$ext_lower" == "jpg" || "$ext_lower" == "jpeg" || "$ext_lower" == "gif" ]]; then
            echo "Moving image: $file -> $IMAGES_DIR/"
            mv "$file" "$IMAGES_DIR/"
            ((moved_count++))
        elif [[ "$ext_lower" == "txt" ]]; then
            echo "Moving document: $file -> $DOCS_DIR/"
            mv "$file" "$DOCS_DIR/"
            ((moved_count++))
        elif [[ "$ext_lower" == "mp4" ]]; then
            echo "Moving video: $file -> $VIDEOS_DIR/"
            mv "$file" "$VIDEOS_DIR/"
            ((moved_count++))
        fi
    fi
done

if [ $moved_count -eq 0 ]; then
    echo "No matching files (.jpg, .jpeg, .gif, .txt, .mp4) found to organize."
else
    echo "Organization complete. Moved $moved_count file(s)."
fi
