FROM rust:1.57 as builder

RUN USER=root cargo new --bin graph_search
WORKDIR ./graph_search
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml
RUN cargo build --release \
    && rm src/*.rs target/release/deps/graph_search*

ADD . ./

RUN cargo build --release


FROM debian:bullseye-slim

RUN apt-get update \
    && apt-get upgrade \
    && rm -rf /var/lib/apt/lists/*


ARG APP=/usr/src/app
ENV APP_USER=appuser

RUN groupadd $APP_USER \
    && useradd -g $APP_USER $APP_USER \
    && mkdir -p ${APP}


COPY --from=builder /graph_search/target/release/graph_search ${APP}/graph_search

RUN chown -R $APP_USER:$APP_USER ${APP}

USER $APP_USER
WORKDIR ${APP}

CMD ["./graph_search"]
