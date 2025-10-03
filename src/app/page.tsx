'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

export default function Home() {
  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('Go Commodores!');
  const [contract, setContract] = useState<any>(null);
  const [account, setAccount] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Your deployed contract (Sepolia)
  const CONTRACT_ADDRESS = '0x77D7472ee2A11827666a26a5e361b25A9AA8899e';

  // ABI must match your contract
  const ABI = [
    {
      inputs: [{ internalType: 'string', name: '_message', type: 'string' }],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'message',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_newMessage', type: 'string' }],
      name: 'updateMessage',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  // Connect wallet, ensure Sepolia, instantiate contract, and read current message
  async function connectContract() {
    try {
      if (!(window as any).ethereum) {
        alert('Please install MetaMask first!');
        return;
      }

      // Ensure chain = Sepolia (11155111 -> 0xaa36a7)
      const currentChainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      });
      if (currentChainId !== '0xaa36a7') {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Safety check（避免 BigInt 字面量，转成 number 对比）
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        throw new Error(
          `Wrong network: ${network.chainId.toString()}. Please switch to Sepolia.`,
        );
      }

      // Request accounts
      const addresses =
        (await (provider as any).send?.('eth_requestAccounts', [])) ??
        (await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        }));
      setAccount(addresses?.[0] ?? '');

      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(c);

      const msg = await c.message();
      setMessage(msg);
    } catch (err: any) {
      console.error('Failed to connect:', err);
      alert(`Connect/read failed: ${err?.shortMessage || err?.message || String(err)}`);
    }
  }

  // Write: call updateMessage and wait for confirmation
  async function updateMessage() {
    try {
      if (!contract) {
        alert('Please connect the contract first!');
        return;
      }

      // Ensure Sepolia before sending tx (string check is fine)
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      }

      setIsPending(true);
      setTxHash(null);
      setMessage('(pending...)');

      const tx = await contract.updateMessage(newMessage);
      setTxHash(tx.hash);

      await tx.wait(); // wait for 1 confirmation
      const updated = await contract.message();
      setMessage(updated);
    } catch (e: any) {
      console.error(e);
      alert(`Transaction failed: ${e?.shortMessage || e?.message || String(e)}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: '60px auto', padding: 24, fontFamily: 'ui-sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>🎯 Contract String (Sepolia)</h1>

      <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {account ? (
            <span style={{ fontSize: 14, color: '#374151' }}>
              Connected: {account.slice(0, 6)}...{account.slice(-4)}{' '}
              <span style={{ color: '#6b7280' }}>(MetaMask will auto switch to Sepolia)</span>
            </span>
          ) : (
            <button
              onClick={connectContract}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              Connect Contract
            </button>
          )}
        </div>

        <div style={{ fontSize: 18, marginBottom: 6 }}>Current value:</div>
        <div style={{ fontSize: 22 }}>{message || '(not connected)'}</div>

        <button
          onClick={connectContract}
          style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer' }}
        >
          Refresh / Reconnect
        </button>

        {isPending && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            ⏳ Transaction submitted, waiting for confirmation…
            {txHash && (
              <>
                {' '}
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  View on Etherscan
                </a>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>
          New message:
        </label>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter a new message to write on-chain"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            marginBottom: 10,
          }}
        />
        <button
          onClick={updateMessage}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', cursor: 'pointer' }}
        >
          Call updateMessage
        </button>
      </div>
    </main>
  );
}
