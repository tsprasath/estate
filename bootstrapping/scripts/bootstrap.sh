#!/usr/bin/env bash
set -e

function s_enable() {
    service "$@" start && chkconfig --add "$@" && chkconfig "$@" on
}

AWSURL=http://169.254.169.254/latest/meta-data
awsget() {
    curl -s "$AWSURL/$1"
}

sudo yum update -y
sudo yum install -y python27 python27-pip docker jq
pip install supervisor

export

cat << EOF >> /etc/sysctl.conf
vm.max_map_count = 262144
fs.file-max = 65536
EOF
sysctl -p

cat << EOF > /usr/local/estate.conf
SECRET_KEY=$(awsget ../dynamic/instance-identity/document | jq -r '.accountId')
DATABASE_URL=${db_url}
TERRAFORM_ELASTICACHE_URL=${cache_url}
EOF

cat << EOF > /etc/supervisord2.conf
[supervisord]
logfile=/var/log/supervisor.log
loglevel=info
pidfile=/var/run/supervisord.pid

[unix_http_server]
file=/var/tmp/supervisor.sock
chmod=0700

[supervisorctl]
serverurl=unix:///var/tmp/supervisor.sock

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[program:estate]
command=docker run --privileged --net="host" --env-file "/usr/local/estate.conf" -v /var/run/docker.sock:/var/run/docker.sock underarmourconnectedfitness/estate:master
stopsignal=TERM
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/estate.log
stdout_logfile_maxbytes=50MB

EOF


cat << 'EOF' > /etc/init.d/supervisor
. /etc/rc.d/init.d/functions

# Source system settings
if [ -f /etc/sysconfig/supervisord ]; then
    . /etc/sysconfig/supervisord
fi

# Path to the supervisorctl script, server binary,
# and short-form for messages.
supervisorctl=/usr/local/bin/supervisorctl
supervisord=/usr/local/bin/supervisord
prog=supervisord
pidfile=/var/run/supervisord.pid
lockfile=/var/lock/subsys/supervisord
STOP_TIMEOUT=60
OPTIONS="-c /etc/supervisord.conf"
RETVAL=0

start() {
    echo -n $"Starting $prog: "
    daemon --pidfile=$pidfile $supervisord $OPTIONS
    RETVAL=$?
    echo
    if [ $RETVAL -eq 0 ]; then
        touch $lockfile
        $supervisorctl $OPTIONS status
    fi
    return $RETVAL
}

stop() {
    echo -n $"Stopping $prog: "
    killproc -p $pidfile -d $STOP_TIMEOUT $supervisord
    RETVAL=$?
    echo
    [ $RETVAL -eq 0 ] && rm -rf $lockfile $pidfile
}

reload() {
    echo -n $"Reloading $prog: "
    LSB=1 killproc -p $pidfile $supervisord -HUP
    RETVAL=$?
    echo
    if [ $RETVAL -eq 7 ]; then
        failure $"$prog reload"
    else
        $supervisorctl $OPTIONS status
    fi
}

restart() {
    stop
    start
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status -p $pidfile $supervisord
        RETVAL=$?
        [ $RETVAL -eq 0 ] && $supervisorctl $OPTIONS status
        ;;
    restart)
        restart
        ;;
    condrestart|try-restart)
        if status -p $pidfile $supervisord >&/dev/null; then
          stop
          start
        fi
        ;;
    force-reload|reload)
        reload
        ;;
    *)
        echo $"Usage: $prog {start|stop|restart|condrestart|try-restart|force-reload|reload}"
        RETVAL=2
esac

exit $RETVAL
EOF
chmod 755 /etc/init.d/supervisor

s_enable atd
s_enable cgconfig
s_enable docker
s_enable supervisor
