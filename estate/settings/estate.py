from __future__ import absolute_import
import os
from . import INSTALLED_APPS

TERRAFORM_DOCKER_IMAGE = os.environ.get("TERRAFORM_DOCKER_IMAGE", "underarmourconnectedfitness/estate:master")

TERRAFORM_EXTRA_ARGS = os.environ.get("TERRAFORM_EXTRA_ARGS", "-input=false")
TERRAFORM_INIT_EXTRA_ARGS = os.environ.get("TERRAFORM_INIT_EXTRA_ARGS", "")
TERRAFORM_PLAN_EXTRA_ARGS = os.environ.get("TERRAFORM_PLAN_EXTRA_ARGS", "-detailed-exitcode -out=plan")
TERRAFORM_APPLY_EXTRA_ARGS = os.environ.get("TERRAFORM_APPLY_EXTRA_ARGS", "")


INSTALLED_APPS += [
    "estate.core",
    "estate.terraform",
    "estate.nomad",
]
