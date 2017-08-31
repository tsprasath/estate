import hcl
import json
import logging
import yaml
from jinja2 import Environment, Undefined
from collections import OrderedDict

LOG = logging.getLogger(__name__)


class NullUndefined(Undefined):

    def __int__(self):
        return 0

    def __float__(self):
        return 0.0


def constructor(loader, node):
    omap = loader.construct_yaml_omap(node)
    return OrderedDict(*omap)


yaml.add_constructor(u'tag:yaml.org,2002:omap', constructor)

jinja_environment = Environment(undefined=NullUndefined)
jinja_environment.filters["load_yaml"] = yaml.load
jinja_environment.filters["dump_json"] = json.dumps


def apply_jinja(value, inputs=None):
    inputs = inputs or {}
    template = jinja_environment.from_string(value)
    output = template.render(**inputs)
    return output


def is_yaml(value):
    try:
        data = yaml.safe_load(value)
        return True, data, None
    except Exception as e:
        return False, None, e


def is_hcl(value):
    try:
        data = hcl.loads(value)
        return True, data, None
    except Exception as e:
        return False, None, e


def is_json(value):
    try:
        data = json.loads(value)
        return True, data, None
    except Exception as e:
        return False, None, e


def get_style(value):
    template = apply_jinja(value)
    type_is_hcl, data, hcl_exception = is_hcl(template)
    if type_is_hcl:
        return "hcl"
    type_is_json, data, json_exception = is_json(template)
    if type_is_json:
        return "json"
    type_is_yaml, data, yaml_exception = is_yaml(template)
    if type_is_yaml:
        if type(data) in [type(None), type({})]:
            return "yaml"


def is_valid_template(value):
    template = apply_jinja(value)
    type_is_hcl, data, hcl_exception = is_hcl(template)
    if type_is_hcl:
        return data
    type_is_json, data, json_exception = is_json(template)
    if type_is_json:
        return data
    type_is_yaml, data, yaml_exception = is_yaml(template)
    if type_is_yaml:
        if type(data) not in [type(None), type({})]:
            raise Exception("Unable to parse as YAML into a valid object\n")
        return data

    if type_is_hcl is False:
        raise Exception("Unable to parse as hcl\n" + str(hcl_exception))

    if type_is_json is False:
        raise Exception("Unable to parse as json\n" + str(json_exception))

    if type_is_yaml is False:
        raise Exception("Unable to parse as yaml\n" + str(yaml_exception))


def render_template(template_str, inputs, overrides, disable=False):
    if disable is True:
        return {"resource": None}
    template = apply_jinja(template_str, inputs)
    data = is_valid_template(template)
    overrides = yaml.safe_load(overrides) or {}
    return do_overrides(data, overrides)


def do_overrides(data, overrides):
    """
    Form is: {
        "foo.bar.0.star": "value",
        "top_level_item": "value2",
        "foo.bar.append": "value3",
        }

    >>> do_overrides({}, {"foo": "bar"})
    {"foo": "bar"}
    >>> do_overrides({"foo": {"bar": []}}, {"foo.bar.append": 5})
    {"foo": {"bar": [5]}}
    >>> do_overrides({"foo": {"bar": [1, 3]}}, {"foo.bar.1": 4})
    {"foo": {"bar": [1, 4]}}

    Super naive path selector rules
        separate path keys with periods
        if we are setting/selecting into a list attempt to coerce key to an integer
        if we are on the last path key and the key is "append" and the location is a list then append
    Mutates passed in dictionary
    """
    for path, value in overrides.items():

        parts = path.split(".")
        last_part = parts[-1]
        first_parts = parts[:-1]

        item = data
        for part in first_parts:
            if isinstance(item, list):
                part = int(part)
            try:
                item = item[part]
            except KeyError:
                raise ValueError("Invalid key: {0} in {1}".format(part, path))

        # If the resulting "thing" is a list and the last part is the keyword "append"
        # then we append to the list and continue, otherwise try to set it
        if isinstance(item, list):
            if last_part == "append":
                item.append(value)
                continue
            else:
                last_part = int(last_part)
        item[last_part] = value

    return data
