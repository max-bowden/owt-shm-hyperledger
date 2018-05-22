
# OWT-SHM-HYPERLEDGER

## Introduction
A hyperledger blockchain network to fulfil basic Offshore Wind Turbine Structural Health Monitoring requirements. For more info, see full report. 

## Usage
### To compile a new BNA:
 1. update version in package.json
 2. from this folder, run:  composer archive create -t dir -n .

### To run the BNA
The more **complicated but more thorough and overall better way** is to deploy it locally with a Swagger generated REST API by setting up Hyperledger Composer and Fabric and running composer-rest-server. There are numerous guides for this:
1. https://www.ibm.com/developerworks/cloud/library/cl-deploy-interact-extend-local-blockchain-network-with-hyperledger-composer/index.html
2. https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-single-org
3. step four onwards at https://medium.freecodecamp.org/ultimate-end-to-end-tutorial-to-create-an-application-on-blockchain-using-hyperledger-3a83a80cbc71 .
4. https://hyperledger.github.io/composer/latest/reference/rest-server

The **easiest way** to test the business network is by deploying it on Hyperledger Composer Playground:
1. Go to https://composer-playground.mybluemix.net/
2. Click 'Deploy New Business Network'
3. Click 'Drop here to upload or browse' - a file chooser dialogue should open
4. Locate the latest BNA file and select it
5. Click 'Deploy'
6. You can now interact with the BNA. *Note: before starting to test/demo the network, the SetupDemo transaction should be executed to add some Owt assets to the network.*
