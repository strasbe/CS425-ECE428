Contributors: Kevin Strasberg and Nick Nordeen
Requires: Nodejs to be installed

## Description
Distributed Logging System

The design we chose to follow is a master-slave design. There is one master node and multiple slave nodes that report to the master. If a grep command is executed on any of the slave nodes, the grep command is run locally on the local slave machine and the grep command is sent to the master. The master then broadcasts that grep command to all of the other slaves excluding the one that made the grep request. The other slaves then run the grep command on their own machines and output the results directly to the master. The master then forwards all of the results from the other slaves to the initial slave that made the request. The master then runs grep on its own machine and sends the results to the initial slave as well. The slave that made the initial grep request then outputs all the packets it recieves onto the terminal.

If the master is the machine that has the local grep request, the process is identical to slave's process. However the master does not need to forward the received messages on to any slaves but just displays them when the master receives it. 

The implementation takes care of slave and master disconnections. If a slave disconnects the master just simply forgets the slave exists and the system works the exact same minus the failed machine. If the master fails, the slaves turn into just local machines and grep commands only work for the local machine. They do continually try to reconnect with the master, and once the master is back online the distributed system works the same as it did when it was initially set up.

## Use
Before running anything run:

	$ npm install

in order to install all the node dependancies.

To run the distributed log system run on one machine:

	$ node Master.js 

and run:

	$ node Slave.js

on any other machines you want to be a part of the distributed system. You will need to specify a filename you want the machines to grep on in the runGrep.js file.

## Testing
Set up all the machines you want to run with the test. Within the  SlaveLogTests.js file there is a parameter for the amount of machines other than the test machine.

	$ node SlaveLogTests.js
