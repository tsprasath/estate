resource "aws_vpc" "estate" {
    cidr_block = "10.0.0.0/16"

    tags {
        Name = "${var.tagName}-VPC"
    }
}

resource "aws_subnet" "estate" {
    vpc_id = "${aws_vpc.estate.id}"
    cidr_block = "10.0.0.0/24"
    availability_zone = "${var.region}a"

    tags {
        Name = "${var.tagName}-SUBNET"
    }
}

resource "aws_security_group" "estate" {
    name = "estate_sg"
    description = "Estate"
    vpc_id = "${aws_vpc.estate.id}"

    tags {
        Name = "${var.tagName}-SG"
    }
}

resource "aws_security_group_rule" "estate_self" {
    type = "ingress"
    from_port = 0
    to_port = 0
    protocol = "-1"
    self = true
    security_group_id = "${aws_security_group.estate.id}"
}

resource "aws_security_group_rule" "estate_ssh" {
    type = "ingress"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    security_group_id = "${aws_security_group.estate.id}"
}

resource "aws_security_group_rule" "estate_outbound" {
    type = "egress"
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    security_group_id = "${aws_security_group.estate.id}"
}

resource "aws_db_subnet_group" "estate" {
  name = "estate_rds_sng"
  subnet_ids = ["${aws_subnet.estate.id}"]

  tags {
    Name = "${var.tagName}-RDS"
  }
}

resource "aws_db_instance" "estate" {
    identifier = "estate_db"
    allocated_storage = "10"
    storage_type = "gp2"
    engine = "postgres"
    engine_version = "9.5.4"
    instance_class = "db.m3.medium"
    name = "estate"
    username = "${db_user}"
    password = "${db_password}"
    vpc_security_group_ids = ["${aws_security_group.estate.name}"]
    db_subnet_group_name = ${aws_db_subnet_group.estate.id}
    skip_final_snapshot = "true"
    backup_retention_period = 0
    copy_tags_to_snapshot = "true"
    multi_az = "true"
    apply_immediately = "true"
    maintenance_window = "wed:04:30-wed:05:30"
    tags {
        Name = "${var.tagName}-RDS"
    }
}

resource "aws_elasticache_parameter_group" "estate" {
    name = "estate_parameter_group"
    family = "memcached1.4"

}

resource "aws_elasticache_subnet_group" "estate" {
    name = "estate_elasticache_sng"
    description = "Estate"
    subnet_ids = ["${aws_subnet.estate.id}"]
}

resource "aws_elasticache_cluster" "estate" {
    cluster_id = "estate"
    engine = "memcached1.4"
    node_type = "cache.m3.medium"
    num_cache_nodes = 2
    port = 11211
    subnet_group_name = "${aws_elasticache_subnet_group}.estate.name"
    security_group_ids = ["${aws_security_group.estate.name}"]
    parameter_group_name = "${aws_elasticache_parameter_group.estate.name}"
    az_mode = "cross-az"
    maintenance_window = "wed:04:30-wed:05:30"
    tags {
        Name = "${var.tagName}-RDS"
    }
}

data "user_data" "estate" {
  template = "${file("${path.module}/../shared/scripts/bootstrap.sh")}"

  vars {
    db_url = "postgres://${var.db_user}:${var.db_password}@${aws_db_instance.estate.endpoint}/estate"
    cache_url = ""
  }
}

resource "aws_instance" "estate" {
    count = "${var.servers}"
    ami = "${lookup(var.ami, "${var.region}")}"
    instance_type = "${var.instance_type}"
    key_name = "${var.key_name}"
    security_groups = ["${aws_security_group.estate.name}"]
    subnet_id = ["${aws_subnet.estate.id}"]

    ebs_optimized = true
    disable_api_termination = true
    root_block_device {
        volume_type = gp2
        volume_size =  "20"
        delete_on_termination = true
    }

    connection {
        user = "${var.user}"
        private_key = "${file("${var.key_path}")}"
    }

    user_data = "${data.user_data.estate.rendered}"

    tags {
        Name = "${var.tagName}-${count.index}"
    }
}
