from __future__ import absolute_import
import datetime
import json
import logging
import os
import requests
import shutil
import subprocess

LOG = logging.getLogger("DockerHotExecutor")


class HotDockerExecutorStreamer(object):
    """
    Acts as a hook to stream the subprocess output for getting real-time process output
    Override handle_log to hook in your own stream capturer - defaults to python logging
    """

    def __init__(self, *args, **kwargs):
        # HACK: this has to be set to True for now--otherwise, the spinner doesn't show up right away
        self.state = {"last_updated": datetime.datetime.utcnow(), "running": True, "exit_code": 0, "output": []}

    def prepare_data(self, output, running=True, exit_code=0):
        now = datetime.datetime.utcnow()
        self.state["output"].append(output)
        self.state["running"] = running
        self.state["exit_code"] = exit_code
        if ((now - self.state["last_updated"]).seconds > 10 or not running or len(self.state["output"]) == 1):
            self.state["last_updated"] = now
            return True

    def log(self, *args, **kwargs):
        if self.prepare_data(*args, **kwargs):
            self.handle_log()

    def handle_log(self):
        LOG.info(json.dumps(self.state))


class HotDockerExecutor(object):
    """
    Params:
        config = {
            // Required
            "docker_image": "",
            "name": "",
            "command": ""
            // Optional
            "streamer": None,
            "hot": false,
            "escrow": "",
        }
    Usage:
    runner = HotDockerExecutor(config={...})
    runner.run()
    """

    def __init__(self, *args, **kwargs):
        self.config = kwargs["config"]
        self.docker_image = self.config["docker_image"]
        self.name = self.config["name"]
        self.command = self.config["command"]
        self.streamer = self.config.get("streamer", None)
        if not isinstance(self.streamer, HotDockerExecutorStreamer):
            self.streamer = None
        self.hot = self.config.get("hot", False)
        self.escrow = self.config.get("escrow")

        self.duration = datetime.timedelta(0)
        self.exit_code = None
        self.output = ""
        self.pid = os.getpid()
        self.mount = os.path.join(os.environ.get("TEMP_DIR", "/tmp"), self.name)
        self.workdir = os.path.join(self.mount, str(self.pid))
        if self.hot:
            # The hot envfile is outside of the worker pid directory because the ENV stays the same between executions inside the container
            self.envfile = os.path.join(self.mount, "hot_envfile")
            self.keepalivefile = os.path.join(self.mount, "hot_keepalive")
        else:
            self.envfile = os.path.join(self.workdir, "envfile")
        self.commandfile = os.path.join(self.workdir, "command")
        self.inside_workdir = os.path.join("/workdir", str(self.pid))
        self.inside_keepalivefile = "/keepalive"
        self.inside_commandfile = os.path.join(self.inside_workdir, "command")

        self.invoke = self.get_command()
        self.prepare_hot()

    def is_container_running(self):
        command = "docker inspect -f {{.State.Running}} " + self.name
        # TODO: Wish there was a better way - Should look into this
        return subprocess.check_output(command, shell=True) != 'true\n'

    def is_hot(self):
        if self.hot:
            return self.is_container_running()
        else:
            return False

    def get_command(self):
        if self.is_hot():
            command = ["docker", "exec", self.name, "bash " + self.inside_commandfile]
        else:
            command = [
                "docker", "run", "--rm", "--net=host",
                "--env-file", self.envfile,
                "--entrypoint", "/bin/sh",
                "-w", self.inside_workdir,
                "-v", self.workdir + ":" + self.inside_workdir,
                self.docker_image, self.inside_commandfile
            ]
        return command

    def prepare_hot(self):
        if self.hot and self.is_container_running() is False:
            # TODO: need to add checking of image so that hot containers can eventually be reloaded - maybe use multiprocess locking to halt executions and untill clear then bring down the hot container and reload it?
            LOG.info("[HotDockerExecutor] Preparing hot container execution.")
            self.pull_image()
            self.write_prep_files()
            command = [
                "docker", "run", "-d", "--net=host",
                "--env-file", self.envfile,
                "--entrypoint", "/bin/sh",
                "-w", self.inside_workdir,
                "-v", self.workdir + ":" + self.inside_workdir,
                "-v", self.keepalivefile + ":" + self.inside_keepalivefile,
                self.docker_image, self.inside_keepalivefile
            ]
            exit_code, output = self.execute_command(command)
            if exit_code != 0:
                LOG.error("".join(output + ["Exit Code: {0}".format(exit_code)]))

    def run(self):
        start = datetime.datetime.now()
        try:
            if self.is_hot() is False:
                self.pull_image()
            self.write_execute_files()
            self.write_files()
            self.exit_code, self.output = self.execute_command(self.invoke, capture=True)
        except Exception as e:
            if self.streamer is not None:
                self.streamer.log(str(e), running=False, exit_code=-1)
            self.handle_exception(e)
            LOG.exception(str(e))
        finally:
            end = datetime.datetime.now()
            self.duration = end - start
            self.finish()
            shutil.rmtree(self.workdir)

    def get_escrow(self, escrow_id):
        escrow_api = os.environ.get("ESCROW_API_URI")
        if escrow_api is None:
            return ""
        url = escrow_api + "/artifact/" + escrow_id + "/rendered/?style=docker"
        response = requests.get(url, auth=(os.environ["ESCROW_USERNAME"], os.environ["ESCROW_PASSWORD"]))
        if not response.ok:
            return ""
        else:
            return response.text

    def write_prep_files(self):
        if not os.path.exists(self.mount):
            os.makedirs(self.mount)
        LOG.info("[HotDockerExecutor] Writing file: {0}".format(self.keepalivefile))
        with open(self.keepalivefile, "wb") as f:
            f.write("""while true; do  sleep 100; done""")
        os.chmod(self.keepalivefile, 0777)
        if self.escrow:
            env = self.get_escrow(self.escrow)
        else:
            env = ""
        LOG.info("[HotDockerExecutor] Writing file: {0}".format(self.envfile))
        with open(self.envfile, "wb") as f:
            f.write(env)

    def write_execute_files(self):
        if os.path.exists(self.workdir):
            shutil.rmtree(self.workdir)
        os.makedirs(self.workdir)
        LOG.info("[HotDockerExecutor] Writing file: {0}".format(self.commandfile))
        with open(self.commandfile, "wb") as f:
            f.write(self.command)
        os.chmod(self.commandfile, 0777)
        if self.escrow:
            env = self.get_escrow(self.escrow)
        else:
            env = ""
        LOG.info("[HotDockerExecutor] Writing file: {0}".format(self.envfile))
        with open(self.envfile, "wb") as f:
            f.write(env)

    def pull_image(self):
        if self.streamer is not None:
            self.streamer.log("Pulling docker image: {0}\n".format(self.docker_image))
        command = ["docker", "pull", self.docker_image]
        exit_code, output = self.execute_command(command)
        if exit_code != 0:
            raise Exception("".join(output + "\nExit Code: {0}".format(exit_code)))

    def execute_command(self, command, capture=False):
        output = []
        stream_index = 0
        LOG.info("[HotDockerExecutor] Running command: {0}".format(" ".join(command)))
        process = subprocess.Popen(
            command,
            stderr=subprocess.STDOUT,
            stdout=subprocess.PIPE,
        )
        if capture and self.streamer is not None:
            self.streamer.log("Started Execution @ {0}\n".format(datetime.datetime.utcnow()))
        while process.poll() is None:
            for line in iter(process.stdout.readline, ""):
                output.append(line)
                if capture and self.streamer is not None:
                    for new_line in output[stream_index:]:
                        self.streamer.log(new_line)
                    stream_index = len(output)
        if capture and self.streamer is not None:
            for new_line in output[stream_index:]:
                self.streamer.log(new_line)
        process.communicate()
        exit_code = process.poll()
        if capture and self.streamer is not None:
            self.streamer.log("Completed Execution @ {0}".format(datetime.datetime.utcnow()), running=False, exit_code=exit_code)
        if self.streamer is not None:
            self.streamer.log("\nExit Code: {0}".format(exit_code))
        return exit_code, "".join(output)

    # These are the user implementation points in the overall run flow
    def write_files(self):
        raise NotImplementedError()

    def handle_exception(self, error):
        pass

    def finish(self):
        pass
