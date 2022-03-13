#!/usr/bin/env bash

set -e

ghcr_user="algorithm-ninja"
tag="latest"

usage() {
    echo "Build and tag the docker images"
    echo "$0 [-u username] [-t tag]"
    echo "   -u username   ghcr.io username"
    echo "   -t tag        tag to use for the images"
}

while getopts "ht:u:" opt; do
    case "$opt" in
        t) tag="$OPTARG";;
        u) ghcr_user="$OPTARG";;
        *) usage
           exit 0
           ;;
    esac
done

components=(cmsocial cmsocial-web)

for comp in "${components[@]}"; do
    image="ghcr.io/$ghcr_user/$comp"
    docker push "$image:$tag"
done
