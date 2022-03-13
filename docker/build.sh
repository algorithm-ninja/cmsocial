#!/usr/bin/env bash

set -e

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CONTEXT="$HERE/.."

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

cd "$CONTEXT"

components=(cmsocial cmsocial-web)

for comp in "${components[@]}"; do
    image="ghcr.io/$ghcr_user/$comp"
    echo "Building image $image"
    docker build \
        -t "$image" \
        -f "docker/$comp/Dockerfile" \
        .
    echo "Tagging $image -> $image:$tag"
    docker tag "$image" "$image:$tag"
done
