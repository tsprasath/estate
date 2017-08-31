FROM amazonlinux:2017.03

WORKDIR /usr/local/service

ENV DJANGO_SETTINGS_MODULE=estate.settings \
    PYTHONPATH=/usr/local/service \
    PATH=/usr/local/service/node_modules/.bin/:$PATH

RUN yum update -y && \
    yum install -y ca-certificates gcc libffi-devel libyaml-devel libmemcached-devel zlib-devel postgresql94-devel python27-devel python27-pip unzip docker git && \
    mkdir -p /usr/local/service

COPY ./TERRAFORM_URL.txt /usr/local/service/TERRAFORM_URL.txt
RUN curl -L --silent $(cat /usr/local/service/TERRAFORM_URL.txt) > /terraform.zip && \
    unzip /terraform.zip -d /bin/ && \
    rm /terraform.zip

ENV NODE_VERSION 6.10.2
RUN curl -sLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" && \
    tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 && \
    rm "node-v$NODE_VERSION-linux-x64.tar.xz"

RUN pip install coreapi==2.3.0 \
                boto3==1.4.4 \
                dj-database-url==0.4.1 \
                Django==1.10.7 \
                django-braces==1.11.0 \
                django-crispy-forms==1.6.1 \
                django-cors-headers==2.0.2 \
                django-elasticache==1.0.3 \
                django-extensions==1.7.8 \
                django-filter==1.0.2 \
                django-permanent==1.1.6 \
                django-rest-swagger==2.1.2 \
                django-simple-history==1.9.0 \
                django-storages==1.5.2 \
                django-webpack-loader==0.4.1 \
                djangorestframework==3.6.3 \
                gevent==1.2.1 \
                gunicorn==19.7.1 \
                hvac==0.2.17 \
                Jinja2==2.9.6 \
                markdown==2.6.8 \
                psycopg2==2.7.1 \
                pyhcl==0.3.5 \
                python-consul==0.7.0 \
                python-memcached==1.58 \
                raven==6.1.0 \
                semantic_version==2.6.0 \
                structlog==17.1.0 \
                whitenoise==3.3.0 && \
    pip install --global-option="--with-libyaml" pyyaml==3.12

COPY ./package.json /usr/local/service/package.json
RUN npm install

COPY ./.babelrc /usr/local/service/.babelrc
COPY ./webpack /usr/local/service/webpack
COPY ./estate /usr/local/service/estate

RUN webpack --bail --config webpack/webpack.prod.config.js && django-admin collectstatic --noinput

CMD [ "gunicorn", "--config", "python:estate.gunicorn", "estate.wsgi"]
