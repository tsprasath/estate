variable "user" {
  default = "ec2-user"
}

variables "db_user" {
  default = "estate"
}

variables "db_password" {
  default = "toomanysecrets"
}

variable "ami" {
  description = "AWS AMI Id, if you change, make sure it is compatible with instance type, not all AMIs allow all instance types "

  default = {
    us-east-1      = "ami-fce3c696"
    us-east-2      = "ami-ea87a78f"
    us-west-1      = "ami-3a674d5a"
    us-west-2      = "ami-aa5ebdd2"
    ca-central-1   = "ami-5ac17f3e"
    eu-west-1      = "ami-ebd02392"
    eu-west-1      = "ami-489f8e2c"
    eu-central-1   = "ami-657bd20a"
  }
}

variable "key_name" {
  description = "SSH key name in your AWS account for AWS instances."
}

variable "key_path" {
  description = "Path to the private key specified by key_name."
}

variable "region" {
  default     = "us-east-1"
  description = "The region of AWS, for AMI lookups."
}

variable "servers" {
  default     = "3"
  description = "The number of Estate servers to launch."
}

variable "instance_type" {
  default     = "m3.medium"
  description = "AWS Instance type, if you change, make sure it is compatible with AMI, not all AMIs allow all instance types "
}

variable "tagName" {
  default     = "estate"
  description = "Name tag for the servers"
}
