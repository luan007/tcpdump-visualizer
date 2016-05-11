#!/bin/bash
iw event | while read -r line ; do
    q=$(echo $line | grep "del" | awk '{print $4}')
    if [ "$q" = "" ]; then
        continue
    fi
    ndsctl deauth $q
done
