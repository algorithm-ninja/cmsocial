FROM node:current-bullseye-slim AS build

RUN apt update && \
    apt install -yy \
    make \
    git

COPY . /build
WORKDIR /build
RUN make ONLINE=1

FROM nginx:stable
LABEL org.opencontainers.image.source https://github.com/algorithm-ninja/cmsocial
LABEL maintainer="Edoardo Morassutto <edoardo.morassutto@gmail.com>"

COPY --from=build /build/cmsocial-web-build/ /usr/share/nginx/html/
