#!/bin/sh
while [ 1 ]
do
SOCKET=$(lsof -i TCP:12345 | grep node | wc -l)
#echo "ACTIVE SOCKET CONNECTION $SOCKET"
#if socket connection is 0 then restart socket
if [ $SOCKET -lt 1 ]
then
echo "socket is down"
pkill -f server.js; cd /home/elevate/eems/socket; npm start > /dev/null 2>&1 &
cd /home/elevate/;
echo "SOCKET RESTARTED";
sleep 5
else
#echo "SOCKET IS RUNNING"
sleep 2
fi
done
