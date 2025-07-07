// app.js
let web3;
let userAccount;
let votechainContract;

const contractAddress = "0x1b4059582a82cBbB889888BDa85317e2B54558b4"; // Replace with your actual contract address
const contractABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "candidateId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "CandidateCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "candidateId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "voter",
                "type": "address"
            }
        ],
        "name": "Voted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "createCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_candidateId",
                "type": "uint256"
            }
        ],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_candidateId",
                "type": "uint256"
            }
        ],
        "name": "getCandidate",
        "outputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "voteCount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "candidatesCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            console.log("Connected account:", userAccount);

            web3 = new Web3(window.ethereum);
            votechainContract = new web3.eth.Contract(contractABI, contractAddress);
            document.getElementById("connectWalletButton").innerText = "Wallet Connected";

            // Fetch and log the network ID
            const networkId = await web3.eth.net.getId();
            console.log("Network ID:", networkId);

            // Fetch candidates on connection
            await fetchCandidates();
        } catch (error) {
            console.error("User denied account access or other error:", error);
        }
    } else {
        alert("Please install MetaMask to use this DApp!");
        console.error("MetaMask not detected");
    }
}

async function createCandidate() {
    const candidateInput = document.getElementById("candidateNameInput");
    const candidateName = candidateInput.value; 
    if (!candidateName) {
        alert("Please enter a candidate name");
        return;
    }

    try {
        await votechainContract.methods.createCandidate(candidateName).send({ from: userAccount });
        console.log("Candidate created successfully:", candidateName);
        
        // Check candidates count after creation
        const count = await votechainContract.methods.candidatesCount().call();
        console.log("Updated Candidates Count after creation:", count);

        candidateInput.value = ""; // Clear input field
        await fetchCandidates(); // Refresh the list of candidates
    } catch (error) {
        console.error("Error creating candidate:", error.message || error);
    }
}

async function fetchCandidates() {
    if (!votechainContract) {
        console.error("Contract not initialized. Please connect to the wallet first.");
        return;
    }

    try {
        const count = await votechainContract.methods.candidatesCount().call(); 
        console.log("Total Candidates Count:", count); // Log the total candidates count

        if (count <= 0) {
            console.warn("No candidates available.");
            return; // Exit early if there are no candidates
        }

        const candidatesList = document.getElementById("candidatesList");
        candidatesList.innerHTML = ""; // Clear existing candidates

        for (let i = 1; i <= count; i++) {
            try {
                const candidate = await votechainContract.methods.getCandidate(i).call();
                console.log(`Fetched candidate ${i}:`, candidate); // Log the fetched candidate details
                const listItem = document.createElement("li");
                listItem.textContent = `Candidate ${i}: ${candidate.name} - Votes: ${candidate.voteCount}`;
                candidatesList.appendChild(listItem);
            } catch (err) {
                console.error(`Error fetching candidate ${i}:`, err.message || err); // More detailed error message
            }
        }
    } catch (error) {
        console.error("Error fetching candidates:", error.message || error); // More detailed error message
    }
}

// Event listeners for buttons
document.getElementById("connectWalletButton").onclick = connectWallet;
document.getElementById("createCandidateButton").onclick = createCandidate;

// Fetch candidates on page load
window.onload = connectWallet; // Changed to connectWallet to fetch candidates immediately on load
