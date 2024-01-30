#!/bin/bash

SSM_KEY=$1
SSM_REGION=$2
INSTANCE_PASSWORD=$(aws ssm get-parameter --name "$SSM_KEY" --region "$SSM_REGION" --with-decryption --query "Parameter.Value" --output text)

yum update -y
amazon-linux-extras install mate-desktop1.x
echo 'PREFERRED=/usr/bin/mate-session' > /etc/sysconfig/desktop
yum -y install tigervnc-server
yum -y install expect
yum -y install https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
systemctl start amazon-ssm-agent

mkdir -p /home/ec2-user/.vnc
echo $INSTANCE_PASSWORD | vncpasswd -f > /home/ec2-user/.vnc/passwd
chown -R ec2-user:ec2-user /home/ec2-user/.vnc
chmod 0600 /home/ec2-user/.vnc/passwd

mkdir -p /etc/tigervnc
echo '' > /etc/tigervnc/vncserver-config-mandatory

cp /lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@.service
sed -i 's/<USER>/ec2-user/' /etc/systemd/system/vncserver@.service

systemctl daemon-reload
systemctl enable vncserver@:1
systemctl start vncserver@:1
