Contributors: Kevin Strasberg and Nick Nordeen

Requires: Nodejs to be installed

## Description
Distributed Group Membership

The algorithm we used for gossip is that we have one designated contact node with a known IP address and any number of other nodes that initially connect to the contact node. The contact node then tells the new node it's most up to date membership table so that the other nodes can gossip with eachother. We set an interval of 10ms to randomly choose a node that is available to contact excluding itself and send it's table. If there are no available nodes to contact the node just waits to recieve something so it can then gossip with other nodes. To detect a voluntary leave, the node will first update its table saying that it has left, send the updated table to another alive node, and then shut down. this way the nodes know that the machine voluntarily left instead of crashed. To detect a crashed machine we set up a timer of 50ms that restarts everytime a node receives a table from a different machine. Due to the nature of every node randomly choosing a different node other than itself to transmit at a much smaller time than the timeout this will insure that every node is up to date within the 5second restriction. The tables the nodes send contain key values of the ip address of the machine and the time in ms of when the machine was started. The value of the tables are the status of the machines and the local time of the machines for when it reported the update so it easier to see the 5second restriction is accurate. MP1 was useful for debugging because it was easy to make sure the correct amount of messages are the same for each machine since you know how many machines are up and what the status of the machines are supposed to be.


## Use
Before running anything run:

To run the distributed Group Membership system run on all of the machines:

    $ node gossipNode.js [Machine's IP address]

The IP address for the contact is set as a constant in gossipNode.js in a var called contactNodeIP

To voluntarily leave at any machine type "exit" into the prompt of the machine. To rejoin just run

    $ node gossipNode.js [Machine's IP address]

again.
