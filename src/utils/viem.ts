import { createPublicClient, http, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
});

export const getWalletClient = () => {
  if (typeof window === "undefined" || !(window as any).ethereum) return null;
  return createWalletClient({
    chain: sepolia,
    transport: custom((window as any).ethereum),
  });
};
