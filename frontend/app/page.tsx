'use client';
import Layout from '@/components/Layout';
import Mint from '@/components/Mint';
import NotConnected from '@/components/NotConnected';
import { useAccount } from 'wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const content = isConnected ? <Mint /> : <NotConnected />;

  return <Layout>{content}</Layout>;
}
