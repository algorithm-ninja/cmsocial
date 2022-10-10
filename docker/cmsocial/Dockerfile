FROM ghcr.io/linuxserver/baseimage-ubuntu:focal as initial

# Install build dependencies
RUN apt update
RUN apt install -yy \
    build-essential \
    postgresql-client \
    python3-dev \
    cgroup-lite \
    libcap-dev \
    zip \
    libpq-dev \
    libcups2-dev \
    libyaml-dev \
    libffi-dev \
    python3-pip \
    git

# Install python dependencies
COPY requirements.txt /cmsocial/
WORKDIR /cmsocial
RUN pip3 install --no-cache-dir -U pip && \
    pip3 install --no-cache-dir -r requirements.txt && \
    pip3 install --no-cache-dir -r src/cms/requirements.txt

# Copy source files
COPY . /cmsocial

# Install cmsocial
RUN python3 setup.py install
# Required for running cms
RUN useradd cmsuser --system --shell /bin/false -U
RUN mkdir -p -m 777 /var/local/cache/cms

# Cleanup
RUN rm -rf \
    /var/lib/apt/lists/* \
    /tmp \
    /root/.cache

# Copy base configuration files
COPY docker/cmsocial/root /

# Multi-stage build merging all the layers from the previous step
FROM ghcr.io/linuxserver/baseimage-ubuntu:focal
LABEL org.opencontainers.image.source https://github.com/algorithm-ninja/cmsocial
LABEL maintainer="Edoardo Morassutto <edoardo.morassutto@gmail.com>"

COPY --from=initial / /
WORKDIR /cmsocial

ENV CMS_CONFIG=/config/cms.conf
ENV CMSOCIAL_CONFIG=/config/cmsocial.ini
VOLUME ["/config"]
ENTRYPOINT ["/init"]
EXPOSE 18888
