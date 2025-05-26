import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface WalletConnectorProps {
  onAccountChange?: (address: string) => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onAccountChange }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, status } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (address && onAccountChange) {
      onAccountChange(address);
    }
  }, [address, onAccountChange]);

  const handleConnect = async () => {
    const connector = connectors[0];

    if (!connector.ready) {
      if (typeof window.ethereum === 'undefined') {
        alert("MetaMask not detected. Please install it.");
        return;
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (err) {
        alert("Permission denied or no wallet available.");
        return;
      }
    }

    connect({ connector });
  };

  return (
    <div className="flex flex-col items-center gap-4 my-4">
      {isConnected ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-green-400">Connected: {address}</p>
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => disconnect()}
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded"
          onClick={handleConnect}
        >
          {status === 'pending' ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default WalletConnector;
