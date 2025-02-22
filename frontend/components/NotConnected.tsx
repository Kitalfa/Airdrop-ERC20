'use client';

import { Alert } from '@chakra-ui/react';

const NotConnected = () => {
  return (
    <Alert status='error' title='Not Connected'>
      Please connect your wallet to continue
    </Alert>
  );
};

export default NotConnected;
