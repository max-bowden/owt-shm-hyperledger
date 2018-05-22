
# OWT-SHM-HYPERLEDGER

## Introduction
A hyperledger blockchain network to fulfil basic Offshore Wind Turbine Structural Health Monitoring requirements. For more info, see full report. 

## Usage
### To compile a new BNA:
 1. update version in package.json
 2. from this folder, run:  composer archive create -t dir -n .

### To run the BNA
The **easiest way** to test the business network is by deploying it on HyperLedger Composer Playground.

The more **complicated but more thorough way** is also possible to deploy it locally by setting up HyperLedger Composer and Fabric and running composer-rest-server. There are numerous guides for this:
1. https://www.ibm.com/developerworks/cloud/library/cl-deploy-interact-extend-local-blockchain-network-with-hyperledger-composer/index.html
2. https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-single-org
3. step four onwards at https://medium.freecodecamp.org/ultimate-end-to-end-tutorial-to-create-an-application-on-blockchain-using-hyperledger-3a83a80cbc71 .
4. https://hyperledger.github.io/composer/latest/reference/rest-server
