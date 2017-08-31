output "server_address" {
    value = "${aws_instance.estate.0.public_dns}"
}
