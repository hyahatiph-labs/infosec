import React, { ReactElement, useEffect } from 'react';

const TransactionsComponent: React.FC = (): ReactElement => {
  // const [type, setType] = useState('');

  let loaded = false;
  const loadTransactions = async (): Promise<void> => {
    console.log('test');
    loaded = true;
  };

  useEffect(() => {
    if (!loaded) { loadTransactions(); }
  });

  return (
    <div>
      Transactions go here
    </div>
  );
};

export default TransactionsComponent;
